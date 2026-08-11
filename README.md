# 🖼️ ComfyUI Image Gallery & Carousel

Welcome! **ComfyUI Image Gallery** is a friendly, full-featured extension for [ComfyUI](https://github.com/comfyanonymous/ComfyUI). It gives you an interactive gallery and full-screen image viewer right inside your browser so you can easily view, organize, and reload workflows from all your AI-generated images and videos.

---

## ✨ Features You'll Love

### 🔍 Full-Screen Carousel & Lightbox
* **Zoom & Pan**: Smoothly zoom in to check fine details and pan around your generations.
* **Video Playback**: Play and pause video generations with a tap of your spacebar.
* **Workflow Loader**: Instantly reload the original workflow from any image's metadata directly into ComfyUI!
* **Quick Actions**: Tag images, download favorites, reset zoom, or delete unwanted generations on the fly.

### 📁 Smart Gallery Grid
* **Folder Navigation**: Browse through output folders and subfolders with easy-to-use breadcrumbs.
* **Resizable Thumbnails**: Adjust thumbnail sizes using a simple slider.
* **Lazy Loading**: Smooth performance even when browsing through thousands of images.
* **Batch Operations**: Select multiple items to move, organize into subfolders, or clean up with a single click.

---

## 📸 Screenshots

| 🖼️ Full-Screen Image View | 📂 Gallery Grid View |
|:-------------------------:|:--------------------:|
| ![Image View](https://github.com/user-attachments/assets/ef65ee7a-c7a3-4486-8057-d947eddeea7a) | ![Gallery View](https://github.com/user-attachments/assets/11f51ee9-b930-4026-95dc-f136436bfe21) |

---

## 🚀 Installation

### Option 1: Via ComfyUI Manager (Recommended)
1. Search for **ComfyUI-Image-Gallery** in [ComfyUI Manager](https://github.com/ltdrdata/ComfyUI-Manager).
2. Click **Install**.
3. Restart ComfyUI and refresh your browser page!

### Option 2: Manual Install
1. Open a terminal in your `ComfyUI/custom_nodes/` directory.
2. Run the following command:
   ```bash
   git clone https://github.com/palant/image-gallery-comfyui.git
   ```
3. Install dependencies (if needed):
   ```bash
   pip install -r image-gallery-comfyui/requirements.txt
   ```
4. Restart your ComfyUI server and refresh your browser.

---

## 💡 How to Use

* **Double-click any Preview/Save Image Node**: Opens the image directly in full-screen Carousel mode.
* **Click the Gallery Icon**: Located in the top menu bar of ComfyUI to open the full folder view of all your generations.

---

## ⌨️ Handy Keyboard Shortcuts

### 🔍 Full-Screen Viewer Mode
| Key | Action |
|:---|:---|
| `Left` / `Right` | Move to previous / next image |
| `Space` | Play or pause video playback |
| `O` | Load original ComfyUI workflow from image metadata |
| `S` | Download current image |
| `T` | Toggle favorite tag indicator |
| `D` | Reset zoom and pan |
| `G` | Switch to Gallery grid view |
| `Del` / `Backspace` | Delete current image |
| `Esc` | Close full-screen view |

### 📂 Gallery Grid Mode
| Key | Action |
|:---|:---|
| `S` | Toggle multi-selection mode |
| `Ctrl + A` | Select all items |
| `M` | Move selected items to a folder |
| `N` | Create a new subfolder |
| `R` | Refresh gallery grid |
| `Del` / `Backspace` | Delete selected items |
| `Home` / `End` | Scroll to top / bottom of gallery |
| `PageUp` / `PageDown` | Scroll up / down |
| `Esc` | Cancel selection or close gallery |

---

## 📦 Requirements

* **Python Dependencies**:
  * `aiohttp`
  * `Pillow`
  * `opencv-python-headless` *(for video thumbnail extraction)*
  * `tqdm`

---

## 💬 Feedback & Contributing

Found a bug or have a feature idea? Feel free to open an issue or submit a Pull Request on GitHub. Happy generating! 🎨
