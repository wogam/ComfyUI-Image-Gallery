# server_api.py
import os
import json
import shutil
import subprocess
import folder_paths
from server import PromptServer
from aiohttp import web
from concurrent.futures import ThreadPoolExecutor
import asyncio
from PIL import Image
import io
from urllib.parse import quote, unquote, urlparse, parse_qs
import math  # For pagination calculation
from tqdm import tqdm  # For progress bar - install via pip if not present
import threading  # For thread-safe flag

# Global flag and lock to track processing
is_processing_lock = threading.Lock()
is_processing_thumbnails = False

# Create a ThreadPoolExecutor for I/O-bound operations
executor = ThreadPoolExecutor(max_workers=os.cpu_count() or 4)

# --- Helper: Parse View URL ---
def parse_view_url(view_url):
    """Parses a /view URL to extract filename, type, and subfolder."""
    try:
        parsed_url = urlparse(view_url)
        query_params = parse_qs(parsed_url.query)

        filename = query_params.get('filename', [None])[0]
        dir_type = query_params.get('type', ['output'])[0]
        subfolder = query_params.get('subfolder', [''])[0]

        filename = unquote(filename) if filename is not None else None
        dir_type = unquote(dir_type) if dir_type is not None else 'output'
        subfolder = unquote(subfolder) if subfolder is not None else ''
        subfolder = subfolder.replace('\\', '/')

        return {
            'filename': filename,
            'type': dir_type,
            'subfolder': subfolder
        }
    except Exception as e:
        print(f"Error parsing view URL in backend: {view_url} - {e}")
        raise ValueError(f"Failed to parse view URL: {view_url}") from e


# --- Helper: Create View URL ---
def create_view_url(filename, dir_type, subfolder):
    """Creates the URL for the /view endpoint."""
    subfolder = subfolder.replace('\\', '/') if subfolder else ''
    subfolder_param = quote(subfolder) if subfolder else ''
    return f"/view?filename={quote(filename)}&type={quote(dir_type)}&subfolder={subfolder_param}"

# Add this function below get_items_from_directory in server_api.py
def get_media_metadata_from_directory(directory, base_output_dir):
    """
    Scans a directory and returns minimal metadata for media items only.
    This is optimized for getting the full list data quickly.
    """
    items = []
    image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    video_extensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
    dedicated_thumb_ext = '.thumb.jpeg'

    if not os.path.isdir(directory):
        print(f"Warning: Directory not found or not accessible for metadata scan: {directory}")
        return []

    try:
        entries = list(os.scandir(directory))
    except Exception as e:
        print(f"Error scanning directory for metadata {directory}: {e}")
        return []

    for entry in entries:
        entry_name = entry.name
        entry_path = entry.path

        # Skip subdirectories and dedicated thumbnails during this scan
        if entry.is_dir() or entry_name.endswith(dedicated_thumb_ext):
            continue

        name, ext = os.path.splitext(entry_name)
        ext = ext.lower()

        is_media = False
        item_type = None
        if ext in image_extensions:
            is_media = True
            item_type = "image"
        elif ext in video_extensions:
            is_media = True
            item_type = "video"

        if not is_media:
            continue

        # Build relative path for URL
        relative_path_full = os.path.relpath(entry_path, base_output_dir)
        relative_subfolder = os.path.dirname(relative_path_full).replace('\\', '/')
        if relative_subfolder == '.': relative_subfolder = ''

        if relative_subfolder.startswith('..'):
             print(f"Warning: Skipped entry potentially outside base directory structure: {entry_path}")
             continue

        item_data = {
            "type": item_type,
            "filename": entry_name,
            "subfolder": relative_subfolder,
            "url": create_view_url(entry_name, 'output', relative_subfolder),
            "thumbnail_url": None
        }

        # Find the associated thumbnail URL
        thumb_name_dedicated1 = f"{name}{dedicated_thumb_ext}"
        thumb_name_dedicated2 = f"{entry_name}{dedicated_thumb_ext}"
        thumb_path_dedicated1 = os.path.join(directory, thumb_name_dedicated1)
        thumb_path_dedicated2 = os.path.join(directory, thumb_name_dedicated2)

        if os.path.exists(thumb_path_dedicated1):
             item_data["thumbnail_url"] = create_view_url(thumb_name_dedicated1, 'output', relative_subfolder)
        elif os.path.exists(thumb_path_dedicated2):
             item_data["thumbnail_url"] = create_view_url(thumb_name_dedicated2, 'output', relative_subfolder)
        elif item_type == "image":
             item_data["thumbnail_url"] = item_data["url"]
        else:
             # Video without dedicated thumbnail
             found_img_thumb = False
             for img_ext in image_extensions:
                 img_name = f"{name}{img_ext}"
                 if os.path.exists(os.path.join(directory, img_name)):
                     item_data["thumbnail_url"] = create_view_url(img_name, 'output', relative_subfolder)
                     found_img_thumb = True
                     break
             if not found_img_thumb:
                 item_data["thumbnail_url"] = None

        items.append(item_data)

    # Sort media items by modification time descending (latest first)
    try:
        mod_times = {}
        for item in items:
            try:
                full_path = os.path.join(base_output_dir, item['subfolder'], item['filename'])
                mod_times[item['url']] = os.path.getmtime(full_path)
            except Exception:
                mod_times[item['url']] = 0

        items.sort(key=lambda x: -mod_times.get(x['url'], 0))
    except Exception as sort_error:
        print(f"Error sorting media metadata: {sort_error}")

    return items

# Add this endpoint function below the others in server_api.py
@PromptServer.instance.routes.get('/gallery/items_metadata')
async def get_gallery_items_metadata(request):
    """Handles GET requests for minimal gallery item metadata."""
    output_dir = folder_paths.get_output_directory()
    subfolder = request.query.get('subfolder', '').replace('\\', '/')

    current_dir = os.path.normpath(os.path.join(output_dir, subfolder))

    if not os.path.commonpath([output_dir, current_dir]) == output_dir:
         print(f"Security check failed accessing metadata path: {current_dir}")
         return web.json_response({'error': 'Access denied: Subfolder path is invalid.'}, status=403)
    if not os.path.isdir(current_dir):
        print(f"Metadata directory not found: {current_dir}")
        return web.json_response({'items': [], 'current_folder': subfolder, 'total_items': 0})


    all_media_items = await asyncio.get_event_loop().run_in_executor(
        executor, get_media_metadata_from_directory, current_dir, output_dir
    )

    response_data = {
        'items': all_media_items, # This list contains ONLY media items
        'current_folder': subfolder,
        'total_items': len(all_media_items),
    }
    return web.json_response(response_data)


# --- Endpoint: View Image/Video (/view) ---
@PromptServer.instance.routes.get('/view')
async def view_image(request):
    """Handles GET requests to view a specific file (image or video)."""
    dir_type = request.query.get('type', 'output')
    subfolder = request.query.get('subfolder', '')
    filename = request.query.get('filename')

    try:
        filename = unquote(filename) if filename is not None else None
        subfolder = unquote(subfolder) if subfolder is not None else ''
        subfolder = subfolder.replace('\\', '/')
    except Exception as e:
        print(f"Error decoding URL parameters: {e}")


    base_dir = folder_paths.get_directory_by_type(dir_type)
    if base_dir is None:
        print(f"Invalid directory type requested: {dir_type}")
        return web.Response(status=400, text="Invalid directory type")

    if filename is None:
        print("Filename parameter is missing.")
        return web.Response(status=400, text="Filename parameter is missing.")

    file_path = os.path.normpath(os.path.join(base_dir, subfolder, filename))

    if not os.path.commonpath([base_dir, file_path]) == base_dir:
        print(f"Security check failed: Path {file_path} is outside of base {base_dir}")
        return web.Response(status=403, text="Forbidden: Access denied.")

    if not os.path.isfile(file_path):
        print(f"File not found at path: {file_path}")
        return web.Response(status=404, text=f"File not found: {filename}")

    content_type = 'application/octet-stream'
    file_ext = os.path.splitext(filename)[1].lower()

    if file_ext == '.mp4':
        content_type = 'video/mp4'
    elif file_ext == '.mov':
        content_type = 'video/quicktime'
    elif file_ext == '.webm':
        content_type = 'video/webm'
    elif file_ext == '.gif':
        content_type = 'image/gif'
    elif file_ext == '.png':
        content_type = 'image/png'
    elif file_ext in ('.jpg', '.jpeg'):
        content_type = 'image/jpeg'
    elif file_ext == '.webp':
        content_type = 'image/webp'

    try:
        loop = asyncio.get_event_loop()
        def read_file_sync():
            with open(file_path, 'rb') as f:
                return f.read()
        file_body = await loop.run_in_executor(executor, read_file_sync)

        response = web.Response(body=file_body, content_type=content_type)
        response.headers['Content-Disposition'] = f'inline; filename="{quote(os.path.basename(file_path))}"'
        return response

    except FileNotFoundError:
        print(f"File disappeared before reading?: {file_path}")
        return web.Response(status=404, text=f"File not found: {filename}")
    except PermissionError:
         print(f"Permission denied reading file: {file_path}")
         return web.Response(status=403, text="Forbidden: Cannot read file.")
    except Exception as e:
        print(f"Error reading or sending file '{filename}': {str(e)}")
        return web.Response(status=500, text="Internal server error processing file view request")


# --- Endpoint: Remove Folder (/gallery/folder/remove) ---
@PromptServer.instance.routes.post('/gallery/folder/remove')
async def remove_folder(request):
    """Handles POST requests to remove a folder."""
    try:
        data = await request.post()
        dir_type = data.get('type', 'output')
        base_dir = folder_paths.get_directory_by_type(dir_type)
        subfolder = data.get('subfolder', '').replace('\\', '/')
        foldername = data.get('foldername')

        print(f"Received folder delete request: type='{dir_type}', subfolder='{subfolder}', foldername='{foldername}'")

        if base_dir is None:
            return web.json_response({'error': 'Invalid directory type'}, status=400)
        if not foldername:
            return web.json_response({'error': 'Foldername is missing'}, status=400)

        folder_path = os.path.normpath(os.path.join(base_dir, subfolder, foldername))

        if not os.path.commonpath([base_dir, folder_path]) == base_dir:
            print(f"Security check failed deleting folder: {folder_path}")
            return web.json_response({'error': 'Security check failed'}, status=403)

        if not os.path.isdir(folder_path):
            print(f"Folder not found for deletion: {folder_path}")
            return web.json_response({'error': f"Folder not found: {foldername}"}, status=404)

        await asyncio.get_event_loop().run_in_executor(executor, shutil.rmtree, folder_path)

        print(f"Folder deleted successfully: {folder_path}")
        return web.Response(status=204)

    except FileNotFoundError:
         print(f"Folder deletion failed, likely already gone: {foldername}")
         return web.json_response({'error': f"Folder not found: {foldername}"}, status=404)
    except PermissionError:
         print(f"Permission error deleting folder: {foldername}")
         return web.json_response({'error': 'Permission denied deleting folder.'}, status=403)
    except OSError as e:
         print(f"OS error deleting folder {foldername}: {str(e)}")
         return web.json_response({'error': f"Error deleting folder: {str(e)}"}, status=500)
    except Exception as e:
        print(f"Unexpected error deleting folder {foldername}: {str(e)}")
        return web.json_response({'error': f"Unexpected server error: {str(e)}"}, status=500)


# --- Endpoint: Remove Image/Video (/gallery/image/remove) ---
@PromptServer.instance.routes.post('/gallery/image/remove')
async def remove_image(request):
    """Handles POST requests to remove an image or video file and its associated thumbnail."""
    try:
        data = await request.post()
        dir_type = data.get('type', 'output')
        base_dir = folder_paths.get_directory_by_type(dir_type)
        subfolder = data.get('subfolder', '').replace('\\', '/')
        filename = data.get('filename')

        print(f"Received item delete request: type='{dir_type}', subfolder='{subfolder}', filename='{filename}'")

        if base_dir is None:
            return web.json_response({'error': 'Invalid directory type'}, status=400)
        if not filename:
            return web.json_response({'error': 'Filename is missing'}, status=400)

        file_path = os.path.normpath(os.path.join(base_dir, subfolder, filename))

        if not os.path.commonpath([base_dir, file_path]) == base_dir:
            print(f"Security check failed deleting file: {file_path}")
            return web.json_response({'error': 'Security check failed'}, status=403)

        if not os.path.isfile(file_path):
             print(f"File not found for deletion: {file_path}")
             return web.Response(status=204)


        await asyncio.get_event_loop().run_in_executor(executor, os.unlink, file_path)
        print(f"Deleted file: {file_path}")

        name, ext = os.path.splitext(filename)
        thumbnail_ext = '.thumb.jpeg'
        thumb_path = os.path.join(base_dir, subfolder, f"{name}{thumbnail_ext}")

        if os.path.exists(thumb_path):
            try:
                await asyncio.get_event_loop().run_in_executor(executor, os.unlink, thumb_path)
                print(f"Deleted associated thumbnail: {thumb_path}")
            except Exception as e_thumb:
                print(f"Error deleting associated thumbnail {thumb_path}: {str(e_thumb)}")

        return web.Response(status=204)

    except FileNotFoundError:
         print(f"File deletion failed, likely already gone: {filename}")
         return web.Response(status=204)
    except PermissionError:
         print(f"Permission error deleting file: {filename}")
         return web.json_response({'error': 'Permission denied deleting file.'}, status=403)
    except OSError as e:
         print(f"OS error deleting file {filename}: {str(e)}")
         return web.json_response({'error': f"Error deleting file: {str(e)}"}, status=500)
    except Exception as e:
        print(f"Unexpected error deleting file {filename}: {str(e)}")
        return web.json_response({'error': f"Unexpected server error: {str(e)}"}, status=500)


# --- Logic: Get Items from Directory (for Gallery) ---
def get_items_from_directory(directory, base_output_dir):
    """
    Scans a directory and returns a sorted list of folders and media items.
    Items are structured dictionaries for the frontend.
    Sorting: Folders first (alphanumerically), then files (by modification time descending).
    """
    items = []
    image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    video_extensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
    dedicated_thumb_ext = '.thumb.jpeg'

    if not os.path.isdir(directory):
        print(f"Warning: Directory not found or not accessible: {directory}")
        return []

    try:
        entries = list(os.scandir(directory))
    except Exception as e:
        print(f"Error scanning directory {directory}: {e}")
        return []

    for entry in entries:
        entry_name = entry.name
        entry_path = entry.path

        relative_path_full = os.path.relpath(entry_path, base_output_dir)
        relative_subfolder = os.path.dirname(relative_path_full).replace('\\', '/')
        if relative_subfolder == '.': relative_subfolder = ''

        if relative_subfolder.startswith('..'):
             print(f"Warning: Skipped entry potentially outside base directory structure: {entry_path}")
             continue

        if entry.is_dir():
            items.append({
                "type": "folder",
                "name": entry_name,
                "subfolder": relative_subfolder,
                "modification_time": entry.stat().st_mtime
            })
            continue

        if entry_name.endswith(dedicated_thumb_ext):
            continue

        name, ext = os.path.splitext(entry_name)
        ext = ext.lower()

        if ext not in image_extensions and ext not in video_extensions:
            continue

        item_data = {
            "type": None,
            "filename": entry_name,
            "subfolder": relative_subfolder,
            "modification_time": entry.stat().st_mtime,
            "url": create_view_url(entry_name, 'output', relative_subfolder),
            "thumbnail_url": None
        }

        thumb_name_dedicated1 = f"{name}{dedicated_thumb_ext}"
        thumb_name_dedicated2 = f"{entry_name}{dedicated_thumb_ext}"
        thumb_path_dedicated1 = os.path.join(directory, thumb_name_dedicated1)
        thumb_path_dedicated2 = os.path.join(directory, thumb_name_dedicated2)

        has_dedicated_thumb = False
        if os.path.exists(thumb_path_dedicated1):
             item_data["thumbnail_url"] = create_view_url(thumb_name_dedicated1, 'output', relative_subfolder)
             has_dedicated_thumb = True
        elif os.path.exists(thumb_path_dedicated2):
             item_data["thumbnail_url"] = create_view_url(thumb_name_dedicated2, 'output', relative_subfolder)
             has_dedicated_thumb = True

        if ext in video_extensions:
            item_data["type"] = "video"
            if not has_dedicated_thumb:
                for img_ext in image_extensions:
                    img_thumb_name = f"{name}{img_ext}"
                    img_thumb_path = os.path.join(directory, img_thumb_name)
                    if os.path.exists(img_thumb_path):
                         item_data["thumbnail_url"] = create_view_url(img_thumb_name, 'output', relative_subfolder)
                         break
            items.append(item_data)

        elif ext in image_extensions:
             item_data["type"] = "image"
             if not has_dedicated_thumb:
                 item_data["thumbnail_url"] = item_data["url"]
             items.append(item_data)


    # --- Sorting ---
    # Sort folders first by name, then files by modification time descending
    items.sort(key=lambda x: (
        0 if x.get('type') == 'folder' else 1,
        x.get('name', '').lower() if x.get('type') == 'folder' else '',
        -x.get('modification_time', 0) if x.get('type') != 'folder' else 0
    ))

    # --- DEBUG PRINT ---
    print(f"Finished scanning {directory}. Found {len(items)} relevant items.")
    # --- END DEBUG PRINT ---

    return items


# --- Endpoint: Get Gallery Items (/gallery/images) ---
@PromptServer.instance.routes.get('/gallery/images')
async def get_gallery_images(request):
    """Handles GET requests for gallery items with pagination."""
    output_dir = folder_paths.get_output_directory()
    subfolder = request.query.get('subfolder', '').replace('\\', '/')
    try:
        page = int(request.query.get('page', '1'))
        per_page = int(request.query.get('per_page', '100'))
    except ValueError:
        print("Invalid page or per_page parameter received.")
        return web.json_response({'error': 'Invalid page or per_page parameter'}, status=400)

    if page < 1: page = 1
    if per_page < 0: per_page = 100
    per_page = min(per_page, 10000)


    current_dir = os.path.normpath(os.path.join(output_dir, subfolder))

    if not os.path.commonpath([output_dir, current_dir]) == output_dir:
         print(f"Security check failed accessing gallery path: {current_dir}")
         return web.json_response({'error': 'Access denied: Subfolder path is invalid.'}, status=403)
    if not os.path.isdir(current_dir):
        print(f"Gallery directory not found: {current_dir}")
        response_data = {
            'items': [],
            'current_folder': subfolder,
            'total_items': 0,
            'total_pages': 0,
            'page': page,
            'per_page': per_page,
        }
        return web.json_response(response_data)


    all_items = await asyncio.get_event_loop().run_in_executor(
        executor, get_items_from_directory, current_dir, output_dir
    )

    folders = [item for item in all_items if item.get('type') == 'folder']
    media_items_only = [item for item in all_items if item.get('type') in ('image', 'video')]

    total_media_items = len(media_items_only)
    total_pages = math.ceil(total_media_items / per_page) if per_page > 0 else 1

    paged_items = []
    if per_page > 0:
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        paged_media_items = media_items_only[start_index:end_index]

        if page == 1:
             paged_items = folders + paged_media_items
        else:
             paged_items = paged_media_items
    else:
         paged_items = folders


    response_data = {
        'items': paged_items,
        'current_folder': subfolder,
        'total_items': len(all_items),
        'total_pages': total_pages,
        'page': page,
        'per_page': per_page,
    }
    return web.json_response(response_data)


# --- Endpoint: Move Items (/gallery/items/move) ---
@PromptServer.instance.routes.post('/gallery/items/move')
async def move_items(request):
    """Handles POST requests to move multiple items (files/folders) to a destination."""
    try:
        data = await request.post()
        dir_type = data.get('type', 'output')
        base_dir = folder_paths.get_directory_by_type(dir_type)
        destination_subfolder = data.get('destination', '').replace('\\', '/')
        items_json = data.get('items', '[]')

        print(f"Received move request: type='{dir_type}', destination='{destination_subfolder}', items='{items_json[:100]}...'")

        if base_dir is None:
            return web.json_response({'error': 'Invalid directory type'}, status=400)

        try:
            items_to_move = json.loads(items_json)
        except json.JSONDecodeError:
            print("Invalid JSON received for items to move.")
            return web.json_response({'error': 'Invalid JSON in items data'}, status=400)

        if not items_to_move:
            return web.json_response({'error': 'No items specified to move'}, status=400)

        dest_dir_full = os.path.normpath(os.path.join(base_dir, destination_subfolder))
        if not os.path.commonpath([base_dir, dest_dir_full]) == base_dir:
            print(f"Security check failed for move destination: {dest_dir_full}")
            return web.json_response({'error': 'Security check failed: Invalid destination path'}, status=403)

        try:
            await asyncio.get_event_loop().run_in_executor(executor, lambda: os.makedirs(dest_dir_full, exist_ok=True))
        except Exception as e_mkdir:
             print(f"Error creating destination directory {dest_dir_full}: {e_mkdir}")
             return web.json_response({'error': f"Could not create destination directory: {str(e_mkdir)}"}, status=500)


        errors = []
        success_count = 0

        for item in items_to_move:
            item_type = item.get('type')
            source_subfolder = item.get('subfolder', '')
            name = item.get('name')

            if item_type not in ['folder', 'image', 'video'] or not name:
                errors.append(f"Invalid item data skipped: {item}")
                continue

            source_path = os.path.normpath(os.path.join(base_dir, source_subfolder, name))
            dest_path = os.path.normpath(os.path.join(dest_dir_full, name))

            if not os.path.commonpath([base_dir, source_path]) == base_dir:
                errors.append(f"Security check failed for source item {name}, skipped.")
                continue
            if item_type == 'folder' and source_path == dest_path:
                 errors.append(f"Cannot move folder '{name}' onto itself, skipped.")
                 continue
            if item_type == 'folder' and dest_path.startswith(source_path + os.sep):
                 errors.append(f"Cannot move folder '{name}' into its own subfolder, skipped.")
                 continue


            if (item_type == 'folder' and not os.path.isdir(source_path)) or \
               ((item_type == 'image' or item_type == 'video') and not os.path.isfile(source_path)):
                 errors.append(f"Source {item_type} '{name}' not found at {source_path}, skipped.")
                 continue

            if os.path.exists(dest_path):
                 errors.append(f"Destination '{name}' already exists in '{destination_subfolder}', skipped.")
                 continue

            try:
                await asyncio.get_event_loop().run_in_executor(executor, shutil.move, source_path, dest_path)
                success_count += 1
                print(f"Moved '{source_path}' -> '{dest_path}'")

                if item_type in ['image', 'video']:
                     name_only, ext = os.path.splitext(name)
                     thumbnail_ext = '.thumb.jpeg'
                     source_thumb_path = os.path.normpath(os.path.join(base_dir, source_subfolder, f"{name_only}{thumbnail_ext}"))
                     dest_thumb_path = os.path.normpath(os.path.join(dest_dir_full, f"{name_only}{thumbnail_ext}"))

                     if os.path.exists(source_thumb_path):
                         try:
                             if os.path.exists(dest_thumb_path):
                                 await asyncio.get_event_loop().run_in_executor(executor, os.unlink, dest_thumb_path)
                             await asyncio.get_event_loop().run_in_executor(executor, shutil.move, source_thumb_path, dest_thumb_path)
                             print(f"Moved associated thumbnail '{os.path.basename(source_thumb_path)}' -> '{os.path.basename(dest_thumb_path)}'")
                         except Exception as e_thumb_move:
                             print(f"Error moving associated thumbnail for '{name}': {str(e_thumb_move)}")


            except Exception as e_move:
                error_msg = f"Error moving {item_type} '{name}': {str(e_move)}"
                print(error_msg)
                errors.append(error_msg)

        if not errors and success_count > 0:
            return web.Response(status=204)
        elif success_count > 0 and errors:
             error_summary = "; ".join(errors)
             print(f"Partial success moving items. Errors: {error_summary}")
             return web.json_response({'error': f"Completed with errors: {error_summary}"}, status=500)
        else:
             error_summary = "; ".join(errors)
             print(f"Failed to move any items. Errors: {error_summary}")
             return web.json_response({'error': f"Failed to move items: {error_summary}"}, status=500)

    except Exception as e:
        print(f"Unexpected error during move operation: {str(e)}")
        return web.json_response({'error': f"Server error during move operation: {str(e)}"}, status=500)


# --- Endpoint: Create Folder (/gallery/folder/create) ---
@PromptServer.instance.routes.post('/gallery/folder/create')
async def create_folder(request):
    """Handles POST requests to create a new folder."""
    try:
        data = await request.post()
        dir_type = data.get('type', 'output')
        base_dir = folder_paths.get_directory_by_type(dir_type)
        subfolder = data.get('subfolder', '').replace('\\', '/')
        foldername = data.get('foldername')

        print(f"Received folder create request: type='{dir_type}', subfolder='{subfolder}', foldername='{foldername}'")

        if base_dir is None:
            return web.json_response({'error': 'Invalid directory type'}, status=400)
        if not foldername:
            return web.json_response({'error': 'Foldername is missing'}, status=400)
        foldername = foldername.strip().replace('..', '').replace('/', '').replace('\\', '')
        if not foldername:
             return web.json_response({'error': 'Invalid foldername after sanitization.'}, status=400)


        new_folder_path = os.path.normpath(os.path.join(base_dir, subfolder, foldername))

        if not os.path.commonpath([base_dir, new_folder_path]) == base_dir:
            print(f"Security check failed creating folder: {new_folder_path}")
            return web.json_response({'error': 'Security check failed'}, status=403)

        await asyncio.get_event_loop().run_in_executor(executor, lambda: os.makedirs(new_folder_path, exist_ok=True))

        print(f"Folder created successfully (or already existed): {new_folder_path}")
        return web.Response(status=201)

    except FileExistsError:
        print(f"Folder already exists: {foldername}")
        return web.json_response({'error': f"Folder '{foldername}' already exists."}, status=409)
    except PermissionError:
         print(f"Permission error creating folder: {foldername}")
         return web.json_response({'error': 'Permission denied creating folder.'}, status=403)
    except OSError as e:
        print(f"OS error creating folder {foldername}: {str(e)}")
        return web.json_response({'error': f"Error creating folder: {str(e)}"}, status=500)
    except Exception as e:
        print(f"Unexpected error creating folder {foldername}: {str(e)}")
        return web.json_response({'error': f"Unexpected server error: {str(e)}"}, status=500)


# --- Thumbnail Optimization Logic ---

def _extract_frame_cv2(video_path):
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

        target_frame = int(fps * 0.5)
        if frame_count > 1 and target_frame >= frame_count:
            target_frame = max(0, frame_count // 2)

        frame = None
        ret = False

        if target_frame > 0:
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            ret, frame = cap.read()

        if not ret or frame is None:
            cap.release()
            cap = cv2.VideoCapture(video_path)
            ret, frame = cap.read()

        cap.release()

        if ret and frame is not None:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return Image.fromarray(rgb_frame)
    except Exception as e:
        print(f"OpenCV frame extraction failed for {os.path.basename(video_path)}: {e}")
    return None

def _extract_frame_ffmpeg(video_path):
    try:
        ffmpeg_cmd = shutil.which("ffmpeg")
        if not ffmpeg_cmd:
            return None

        for ss in ["0.5", "0"]:
            cmd = [
                ffmpeg_cmd,
                "-loglevel", "error",
                "-ss", ss,
                "-i", video_path,
                "-vframes", "1",
                "-f", "image2pipe",
                "-vcodec", "mjpeg",
                "-"
            ]
            process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
            if process.returncode == 0 and process.stdout:
                try:
                    img = Image.open(io.BytesIO(process.stdout))
                    img.load()
                    return img
                except Exception:
                    pass
    except Exception as e:
        print(f"FFmpeg frame extraction failed for {os.path.basename(video_path)}: {e}")
    return None

def _extract_frame_imageio(video_path):
    try:
        import imageio
        try:
            reader = imageio.get_reader(video_path)
            frame = reader.get_data(0)
            reader.close()
            if frame is not None:
                return Image.fromarray(frame)
        except Exception:
            pass
    except Exception as e:
        print(f"imageio frame extraction failed for {os.path.basename(video_path)}: {e}")
    return None

def _extract_frame_pyav(video_path):
    try:
        import av
        container = av.open(video_path)
        for frame in container.decode(video=0):
            img = frame.to_image()
            container.close()
            return img
        container.close()
    except Exception as e:
        print(f"PyAV frame extraction failed for {os.path.basename(video_path)}: {e}")
    return None

def extract_video_frame(video_path):
    """Extracts a representative PIL Image frame from a video file using available backends."""
    img = _extract_frame_cv2(video_path)
    if img:
        return img

    img = _extract_frame_ffmpeg(video_path)
    if img:
        return img

    img = _extract_frame_imageio(video_path)
    if img:
        return img

    img = _extract_frame_pyav(video_path)
    if img:
        return img

    print(f"Warning: All frame extraction methods (OpenCV, FFmpeg, ImageIO, PyAV) failed for video: {os.path.basename(video_path)}. Consider running 'pip install opencv-python-headless' or installing ffmpeg.")
    return None

def optimize_thumbnail(img_input, output_path, max_size=384, quality=85):
    """Optimizes an image (from path or Image object) to be used as a thumbnail."""
    try:
        if isinstance(img_input, str):
            # If input is a path, open the image file
            img = Image.open(img_input)
        else:
            # If input is already a PIL Image object, use it directly
            img = img_input

        # Keep the rest of the optimization logic as is:
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
             alpha = img.convert('RGBA').split()[-1]
             bg = Image.new("RGB", img.size, (255, 255, 255))
             bg.paste(img, mask=alpha)
             img = bg
        elif img.mode != 'RGB':
             img = img.convert('RGB')

        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        img.save(output_path, 'JPEG', quality=quality, optimize=True, subsampling=0)
        return True
    except FileNotFoundError:
        print(f"Error optimizing thumbnail: Input file not found {img_input}")
        return False
    except Exception as e:
        # Use original input for error message clarity
        input_desc = img_input if isinstance(img_input, str) else "PIL Image object"
        print(f"Error optimizing thumbnail from {input_desc} -> {output_path}: {str(e)}")
        return False

def process_thumbnails_in_dir(current_dir, base_dir):
    """Recursively processes thumbnails for a directory, with logging and progress bar."""
    global is_processing_thumbnails

    thumb_size = (384, 384)
    image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    video_extensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
    dedicated_thumb_ext = '.thumb.jpeg'

    print(f"Processing thumbnails in: {current_dir}")

    if not os.path.isdir(current_dir):
        print(f"Skipping non-directory: {current_dir}")
        is_processing_thumbnails = False
        return

    try:
        files_to_process = []
        def collect_files(dir_path):
            try:
                entries = list(os.scandir(dir_path))
            except Exception as e:
                print(f"Warning: Could not scan directory {dir_path}: {e}")
                return

            for entry in entries:
                try:
                    if entry.is_dir():
                        collect_files(entry.path)
                    elif entry.is_file() and not entry.name.endswith(dedicated_thumb_ext):
                        name, ext = os.path.splitext(entry.name)
                        ext = ext.lower()
                        if ext in image_extensions or ext in video_extensions:
                            files_to_process.append(entry.path)
                except Exception as entry_e:
                    print(f"Warning: Error processing entry {entry.name} in {dir_path}: {entry_e}")

        collect_files(current_dir)
        total_items = len(files_to_process)
        print(f"Total items to process: {total_items}")

        if total_items == 0:
            print("No items found to process.")
            is_processing_thumbnails = False
            return

        success_count = 0
        skipped_count = 0
        failed_count = 0

        for file_path in tqdm(files_to_process, desc="Processing thumbnails", unit="item", ncols=80):
            name, ext = os.path.splitext(os.path.basename(file_path))
            ext = ext.lower()
            thumb_path_dedicated = os.path.join(os.path.dirname(file_path), f"{name}{dedicated_thumb_ext}")

            if os.path.exists(thumb_path_dedicated):
                skipped_count += 1
                continue

            if ext in image_extensions:
                if ext == '.gif':
                    try:
                        with Image.open(file_path) as img:
                            if optimize_thumbnail(img, thumb_path_dedicated, max_size=thumb_size[0]):
                                success_count += 1
                            else:
                                failed_count += 1
                    except Exception as e:
                        print(f"Error processing GIF thumbnail for {os.path.basename(file_path)}: {str(e)}")
                        failed_count += 1
                else:
                    if optimize_thumbnail(file_path, thumb_path_dedicated, max_size=thumb_size[0]):
                        success_count += 1
                    else:
                        failed_count += 1

            elif ext in video_extensions:
                frame_img = extract_video_frame(file_path)
                if frame_img:
                    if optimize_thumbnail(frame_img, thumb_path_dedicated, max_size=thumb_size[0]):
                        success_count += 1
                    else:
                        failed_count += 1
                else:
                    found_original_thumb_path = None
                    for thumb_ext_check in image_extensions:
                        if thumb_ext_check == '.gif': continue
                        potential_thumb_path = os.path.join(os.path.dirname(file_path), f"{name}{thumb_ext_check}")
                        if os.path.exists(potential_thumb_path):
                            found_original_thumb_path = potential_thumb_path
                            break
                    if found_original_thumb_path:
                        if optimize_thumbnail(found_original_thumb_path, thumb_path_dedicated, max_size=thumb_size[0]):
                            success_count += 1
                        else:
                            failed_count += 1
                    else:
                        print(f"Failed to generate thumbnail for video: {os.path.basename(file_path)}")
                        failed_count += 1

        print(f"Thumbnail processing completed: {success_count} generated, {skipped_count} skipped (already exist), {failed_count} failed.")
    except Exception as e:
        print(f"Error during thumbnail processing: {str(e)}")
    finally:
        is_processing_thumbnails = False  # Reset flag regardless of success


# --- Endpoint: Get Item Position (/gallery/item_position) ---
@PromptServer.instance.routes.get('/gallery/item_position')
async def get_item_position(request):
    """Get the index of an item in its directory."""
    url = request.query.get('url')
    if not url:
         print("Error: Missing 'url' parameter for item_position.")
         return web.json_response({'error': 'Missing URL parameter'}, status=400)

    try:
        parsed = parse_view_url(url)
        filename = parsed.get('filename')
        subfolder = parsed.get('subfolder', '')
        dir_type = parsed.get('type', 'output')

        if not filename:
             print(f"Error: Could not extract filename from URL: {url}")
             return web.json_response({'error': 'Invalid URL format'}, status=400)

        base_dir = folder_paths.get_directory_by_type(dir_type)
        if base_dir is None:
             print(f"Error: Invalid directory type '{dir_type}' from URL: {url}")
             return web.json_response({'error': 'Invalid directory type'}, status=400)

        current_dir = os.path.normpath(os.path.join(base_dir, subfolder))

        if not os.path.commonpath([base_dir, current_dir]) == base_dir:
             print(f"Security check failed for item_position path: {current_dir}")
             return web.json_response({'error': 'Access denied: Invalid subfolder path'}, status=403)

        if not os.path.isdir(current_dir):
             print(f"Directory not found for item_position: {current_dir}")
             return web.json_response({'index': -1, 'total_items': 0})


        all_items = await asyncio.get_event_loop().run_in_executor(
            executor, get_items_from_directory, current_dir, base_dir
        )

        media_items = [item for item in all_items if item.get('type') in ('image', 'video')]
        index = next((i for i, item in enumerate(media_items)
                     if item.get('url') == url), -1)

        print(f"Found item '{filename}' at index {index} in {subfolder}. Total media items: {len(media_items)}")

        return web.json_response({
            'index': index,
            'total_items': len(media_items)
        })

    except ValueError as ve:
         print(f"URL parsing error in item_position: {ve}")
         return web.json_response({'error': f'URL parsing failed: {ve}'}, status=400)
    except Exception as e:
        print(f"Unexpected error in item_position endpoint for URL {url}: {str(e)}")
        return web.json_response({'error': 'Internal server error'}, status=500)


# --- Endpoint: Process Thumbnails (/gallery/process_thumbnails) ---
@PromptServer.instance.routes.post('/gallery/process_thumbnails')
async def process_thumbnails_endpoint(request):
    """Endpoint to trigger thumbnail processing for a folder (and subfolders)."""
    global is_processing_thumbnails
    try:
        data = await request.post()
        dir_type = data.get('type', 'output')
        subfolder = data.get('subfolder', '')
        base_dir = folder_paths.get_directory_by_type(dir_type)

        if base_dir is None:
            print("Error: Invalid directory type.")
            return web.json_response({'error': 'Invalid directory type'}, status=400)

        target_dir = os.path.normpath(os.path.join(base_dir, subfolder))

        if not os.path.commonpath([base_dir, target_dir]) == base_dir:
            print(f"Security check failed for thumbnail processing path: {target_dir}")
            return web.json_response({'error': 'Access denied: Invalid subfolder path.'}, status=403)
        if not os.path.isdir(target_dir):
            return web.json_response({'error': f"Target directory not found: {subfolder}"}, status=404)

        # Check if processing is already running
        with is_processing_lock:
            if is_processing_thumbnails:
                print("Thumbnail processing is already in progress. Skipping new request.")
                return web.json_response({'error': 'Thumbnail processing is already running.'}, status=409)
            is_processing_thumbnails = True  # Set the flag

        print(f"Starting thumbnail processing for: {target_dir}...")  # Output when button is pressed

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, process_thumbnails_in_dir, target_dir, base_dir)

        return web.Response(status=202, text="Thumbnail processing started in the background.")

    except Exception as e:
        print(f"Error initiating thumbnail processing: {str(e)}")
        with is_processing_lock:  # Ensure flag is reset on error
            is_processing_thumbnails = False
        return web.json_response({'error': f"Server error initiating thumbnail processing: {str(e)}"}, status=500)
    finally:
        # Reset flag after the process (though it's handled in the function itself)
        with is_processing_lock:
            is_processing_thumbnails = False

# --- Register all routes ---
# Note: The decorator syntax @PromptServer.instance.routes.METHOD('/path')
# is already registering the routes as the functions are defined.
# No need for a separate add_routes call at the end when using this pattern.

print("Image Gallery API endpoints registered.")