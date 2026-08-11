// imagegallery.js

import { app } from "/scripts/app.js";

// Modern ComfyUI API compatibility / Standalone fallback without deprecated /scripts/ui.js
export const ComfyDialog =
  window.comfyAPI?.dialog?.ComfyDialog ||
  app.ui?.dialog?.ComfyDialog ||
  class ComfyDialog {
    constructor() {
      this.element = $el("div.comfy-modal", {
        parent: document.body,
        style: {
          display: "none",
        },
      });
    }

    show(html) {
      if (typeof html === "string") {
        this.element.innerHTML = html;
      } else if (html) {
        this.element.replaceChildren(html);
      }
      this.element.style.display = "block";
    }

    close() {
      this.element.style.display = "none";
    }
  };

export function $el(tagSelector, propsOrChildren, children) {
  let tag = tagSelector;
  let classes = [];
  let id = null;

  if (typeof tagSelector === "string") {
    const parts = tagSelector.split(/(?=[.#])/);
    tag = parts[0] || "div";
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith(".")) {
        classes.push(part.slice(1));
      } else if (part.startsWith("#")) {
        id = part.slice(1);
      }
    }
  }

  const el = document.createElement(tag);
  if (id) el.id = id;
  if (classes.length > 0) el.classList.add(...classes);

  let actualProps = propsOrChildren;
  let actualChildren = children;

  if (
    Array.isArray(propsOrChildren) ||
    typeof propsOrChildren === "string" ||
    propsOrChildren instanceof Element ||
    propsOrChildren instanceof Node
  ) {
    actualChildren = propsOrChildren;
    actualProps = null;
  }

  if (actualProps && typeof actualProps === "object") {
    for (const [key, val] of Object.entries(actualProps)) {
      if (val === undefined || val === null) continue;
      if (key === "style" && typeof val === "object") {
        Object.assign(el.style, val);
      } else if (key === "dataset" && typeof val === "object") {
        Object.assign(el.dataset, val);
      } else if (key === "parent" && val instanceof Element) {
        val.appendChild(el);
      } else if (key.startsWith("on") && typeof val === "function") {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
      } else if (key in el && key !== "list") {
        try {
          el[key] = val;
        } catch (_) {
          el.setAttribute(key, val);
        }
      } else {
        el.setAttribute(key, val);
      }
    }
  }

  const appendChild = (child) => {
    if (child === null || child === undefined) return;
    if (typeof child === "string" || typeof child === "number") {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  };

  if (actualChildren !== undefined && actualChildren !== null) {
    if (Array.isArray(actualChildren)) {
      for (const child of actualChildren) {
        appendChild(child);
      }
    } else {
      appendChild(actualChildren);
    }
  }

  return el;
}


// --- CSS Styles ---
const styles = `

:root {
  --breadcrumb-top: 25px;
  --comfy-carousel-z-index: 99999999;
  --image-size: 160px;
  
  /* High-performance Color Tokens */
  --cg-bg-overlay: rgba(10, 12, 16, 0.98);
  --cg-surface-dark: rgba(18, 22, 30, 0.98);
  --cg-surface-card: rgba(24, 28, 38, 0.9);
  --cg-surface-glass: rgba(255, 255, 255, 0.06);
  --cg-surface-glass-hover: rgba(255, 255, 255, 0.14);
  --cg-border-glass: rgba(255, 255, 255, 0.09);
  --cg-border-glass-hover: rgba(255, 255, 255, 0.22);
  
  /* Accents */
  --cg-accent-primary: #6366f1;
  --cg-accent-primary-hover: #4f46e5;
  --cg-accent-glow: rgba(99, 102, 241, 0.35);
  --cg-accent-cyan: #06b6d4;
  --cg-accent-danger: #ef4444;
  --cg-accent-danger-glow: rgba(239, 68, 68, 0.35);
  
  /* Text */
  --cg-text-main: #f3f4f6;
  --cg-text-muted: #9ca3af;
  
  /* Radius & Shadows */
  --cg-radius-sm: 6px;
  --cg-radius-md: 10px;
  --cg-radius-lg: 16px;
  --cg-radius-pill: 9999px;
  --cg-shadow-elevation: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
  --cg-shadow-card: 0 4px 14px rgba(0, 0, 0, 0.35);
}

* {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
}

/* === Core Carousel Styles === */
.comfy-carousel {
  position: fixed;
  inset: 0;
  z-index: var(--comfy-carousel-z-index);
  display: none;
  justify-content: center;
  align-items: center;
  background: var(--cg-bg-overlay);
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.comfy-carousel.show {
  display: flex;
  opacity: 1;
  transform: scale(1);
}

.comfy-carousel.hide {
  opacity: 0;
}

/* === Carousel Box (Large View) === */
.comfy-carousel-box {
  width: 92vw;
  height: 92vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-bottom: 10px;
  box-sizing: border-box;
  position: relative;
}

.comfy-carousel-box .slides {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  overflow: hidden;
  position: relative;
  cursor: grab;
}

.comfy-carousel-box .slides:active {
  cursor: grabbing;
}

.comfy-carousel-box .slides > .slide-container {
  display: none;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.comfy-carousel-box .slides > .slide-container.shown {
  display: flex;
}

.comfy-carousel-box .slides img,
.comfy-carousel-box .slides video {
  display: block;
  max-height: 82vh;
  max-width: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center center;
  margin: auto;
  border-radius: var(--cg-radius-md);
  box-shadow: var(--cg-shadow-elevation);
  will-change: transform;
}

/* === Floating Toolbars === */
.comfy-carousel .button-container,
.comfy-carousel-box .button-container {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(18, 22, 30, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  padding: 4px 8px;
  box-shadow: var(--cg-shadow-elevation);
  z-index: calc(var(--comfy-carousel-z-index) + 5);
  opacity: 0.65;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

.comfy-carousel-box .button-container:hover {
  opacity: 1;
  background: rgba(18, 22, 30, 0.92);
}

.comfy-carousel-box .button-container {
  top: 16px;
  right: 16px;
  height: fit-content;
}

.comfy-carousel-box .image-counter {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(18, 22, 30, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  padding: 6px 14px;
  color: var(--cg-text-main);
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--cg-shadow-elevation);
  z-index: calc(var(--comfy-carousel-z-index) + 5);
  opacity: 0.75;
  transition: opacity 0.2s ease;
  user-select: none;
  pointer-events: none;
}

.comfy-carousel .gallery-button-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: calc(var(--comfy-carousel-z-index) + 10);
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--cg-surface-dark);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  padding: 6px 12px;
  box-shadow: var(--cg-shadow-elevation);
}

/* === Buttons === */
.comfy-carousel-box .remove,
.comfy-carousel-box .close,
.comfy-carousel-box .gallery,
.comfy-carousel-box .reset-zoom,
.comfy-carousel-box .download,
.comfy-carousel-box .load,
.comfy-carousel .scroll-to-top,
.comfy-carousel .reload-gallery,
.comfy-carousel .select-images,
.comfy-carousel .move,
.comfy-carousel .new-folder,
.gallery-button-container .remove {
  background: var(--cg-surface-glass);
  color: var(--cg-text-main);
  border: 1px solid transparent;
  width: 34px;
  height: 34px;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease;
  border-radius: var(--cg-radius-pill);
  padding: 0;
  box-sizing: border-box;
  will-change: transform;
}

.comfy-carousel-box .remove:hover,
.comfy-carousel-box .close:hover,
.comfy-carousel-box .gallery:hover,
.comfy-carousel-box .reset-zoom:hover,
.comfy-carousel-box .load:hover,
.comfy-carousel-box .download:hover,
.comfy-carousel .scroll-to-top:hover,
.comfy-carousel .reload-gallery:hover,
.comfy-carousel .select-images:hover,
.comfy-carousel .move:hover,
.comfy-carousel .new-folder:hover,
.gallery-button-container .remove:hover {
  background: var(--cg-surface-glass-hover);
  border-color: var(--cg-border-glass-hover);
  color: #ffffff;
  transform: translateY(-2px);
}

.comfy-carousel button:not(:disabled):active,
.comfy-carousel-box button:not(:disabled):active {
  transform: scale(0.94);
}

.comfy-carousel-box .remove:hover,
.gallery-button-container .remove:hover {
  background: var(--cg-accent-danger-glow);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ff9999;
}
.comfy-carousel-box .load:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: rgba(10, 185, 129, 0.5);
  color: #a7f3d0;
}
.comfy-carousel-box .download:hover {
  background: rgba(6, 182, 212, 0.25);
  border-color: rgba(6, 182, 212, 0.5);
  color: #a5f3fc;
}
.comfy-carousel-box .gallery:hover,
.comfy-carousel .reload-gallery:hover,
.comfy-carousel .select-images:hover {
  background: var(--cg-accent-glow);
  border-color: rgba(99, 102, 241, 0.5);
  color: #c7d2fe;
}

.comfy-carousel-box .remove[style*="width: auto"] {
  width: auto !important;
  padding: 0 16px;
  border-radius: var(--cg-radius-pill);
  font-size: 13px;
  font-weight: 600;
}

/* Navigation Chevrons */
.comfy-carousel-box .prev,
.comfy-carousel-box .next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: var(--cg-surface-dark);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  color: var(--cg-text-main);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
  z-index: calc(var(--comfy-carousel-z-index) + 4);
  box-shadow: var(--cg-shadow-elevation);
  will-change: transform;
}

.comfy-carousel-box .prev { left: 24px; right: auto; }
.comfy-carousel-box .next { right: 24px; left: auto; }

.comfy-carousel-box .prev:hover,
.comfy-carousel-box .next:hover {
  background: var(--cg-accent-primary);
  border-color: var(--cg-accent-primary-hover);
  color: #ffffff;
  transform: translateY(-50%) scale(1.08);
}

.comfy-carousel-box .reset-zoom { right: 270px; }
.comfy-carousel-box .download { right: 220px; }
.comfy-carousel-box .load { right: 170px; }
.comfy-carousel-box .remove { right: 120px; }
.comfy-carousel-box .gallery { right: 70px; }
.comfy-carousel-box .close { right: 20px; }

/* === Filmstrip Thumbnail Carousel === */
.comfy-carousel-box .dots {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  height: 76px;
  align-items: center;
  background: var(--cg-surface-dark);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-lg);
  padding: 8px 14px;
  gap: 8px;
  margin: 0 auto;
  max-width: 80%;
  box-shadow: var(--cg-shadow-card);
}

.comfy-carousel-box .dots::-webkit-scrollbar { height: 6px; }
.comfy-carousel-box .dots::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 3px; }
.comfy-carousel-box .dots::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
.comfy-carousel-box .dots::-webkit-scrollbar-thumb:hover { background: var(--cg-accent-primary); }

.dot-thumbnail-container {
  scroll-snap-align: center;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: visible;
}

.comfy-carousel-box .dots img {
  height: 48px;
  width: 48px;
  object-fit: cover;
  opacity: 0.65;
  transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--cg-radius-sm);
  flex-shrink: 0;
  box-sizing: border-box;
  will-change: transform;
}

.comfy-carousel-box .dots img:hover {
  opacity: 0.95;
  transform: scale(1.06);
}

.comfy-carousel-box .dots img.active {
  opacity: 1;
  border-color: var(--cg-accent-primary);
  transform: scale(1.04);
}

.comfy-carousel-box .dots img.tagged {
  border-color: var(--cg-accent-cyan);
  opacity: 1;
}

.comfy-carousel-box .dots img.active.tagged {
  border-color: #38bdf8;
}

/* === Stylized Centered Empty Folder State === */
.comfy-carousel .gallery-container .no-images,
.no-images {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 320px;
  width: 100%;
  text-align: center;
  color: var(--cg-text-muted);
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  padding: 40px 20px;
  user-select: none;
  margin: auto;
}

.no-images-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--cg-surface-glass);
  border: 1px solid var(--cg-border-glass);
  margin-bottom: 16px;
  box-shadow: var(--cg-shadow-card);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.no-images-icon:hover {
  transform: scale(1.05);
  border-color: var(--cg-border-glass-hover);
}

.no-images-text {
  color: var(--cg-text-main);
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.85;
}

/* === Gallery View Container (Ultra-High Performance Scroll) === */
.comfy-carousel .gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--image-size, 160px), 1fr));
  grid-auto-rows: var(--image-size, 160px);
  gap: 14px;
  padding: 20px 24px;
  top: 76px;
  height: calc(100vh - 146px);
  width: 90vw;
  overflow-y: auto;
  background: var(--cg-surface-dark);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-lg);
  box-shadow: var(--cg-shadow-elevation);
  transition: opacity 0.25s ease, transform 0.25s ease;
  opacity: 0;
  align-content: start;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateZ(0);
  contain: layout style;
  will-change: scroll-position;
}

.comfy-carousel .gallery-container::-webkit-scrollbar { width: 8px; }
.comfy-carousel .gallery-container::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
.comfy-carousel .gallery-container::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 4px; }
.comfy-carousel .gallery-container::-webkit-scrollbar-thumb:hover { background-color: var(--cg-accent-primary); }

.comfy-carousel .gallery-container.show {
  opacity: 1;
  transform: translateX(-50%) translateZ(0);
}

/* Gallery Loading Indicator Spinner */
.comfy-carousel .gallery-loading-indicator {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  width: 100%;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  visibility: hidden;
}

.comfy-carousel .gallery-loading-indicator.visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.comfy-carousel .gallery-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--cg-accent-primary, #6366f1);
  border-radius: 50%;
  animation: gallery-spinner-rotate 0.75s linear infinite;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);
}

@keyframes gallery-spinner-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Gallery Item Container (Hardware-Accelerated Cards) */
.gallery-item-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--cg-surface-card);
  border-radius: var(--cg-radius-md);
  border: 1px solid var(--cg-border-glass);
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
  box-shadow: var(--cg-shadow-card);
  contain: layout paint;
  will-change: transform;
  transform: translateZ(0);
}

.gallery-item-container img,
.gallery-item-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  -webkit-user-drag: none;
  display: block;
  will-change: transform;
}

.gallery-item-container:hover {
  transform: translateY(-3px) translateZ(0);
  border-color: var(--cg-border-glass-hover);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}

.gallery-item-container:hover img,
.gallery-item-container:hover video {
  transform: scale(1.05);
}

.gallery-item-container.selected,
.folder-button.selected {
  border: 2px solid var(--cg-accent-primary) !important;
  box-shadow: 0 0 12px var(--cg-accent-glow);
  transform: translateY(-2px) translateZ(0);
  position: relative;
}

.gallery-item-container.selected::after,
.folder-button.selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--cg-accent-primary);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  z-index: 2;
}

.gallery-item-container.greyed-out img,
.gallery-item-container.greyed-out video,
.folder-button.greyed-out {
  opacity: 0.4;
}

.gallery-item-container.selected img,
.gallery-item-container.selected video,
.folder-button.selected {
  opacity: 1 !important;
}

/* === Close Gallery Button === */
.comfy-carousel .close-gallery {
  background: var(--cg-surface-glass);
  color: var(--cg-text-main);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  width: 38px;
  height: 38px;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
  will-change: transform;
}

.comfy-carousel .close-gallery:hover {
  background: var(--cg-accent-danger-glow);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ff9999;
  transform: scale(1.05);
}

/* === Gallery Size Slider === */
.gallery-size-slider {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 42px;
  background: var(--cg-surface-dark);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  padding: 0 16px;
  appearance: none;
  outline: none;
  opacity: 0.9;
  transition: opacity 0.15s ease, border-color 0.15s ease;
  z-index: calc(var(--comfy-carousel-z-index) + 15);
  box-sizing: border-box;
  cursor: pointer;
  box-shadow: var(--cg-shadow-elevation);
}

.gallery-size-slider:hover {
  opacity: 1;
  border-color: var(--cg-border-glass-hover);
}

.gallery-size-slider::-webkit-slider-runnable-track,
.gallery-size-slider::-moz-range-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin: auto 0;
}

.gallery-size-slider::-webkit-slider-thumb,
.gallery-size-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--cg-accent-primary);
  cursor: pointer;
  border-radius: 50%;
  margin-top: -5px;
  transition: transform 0.15s ease;
}

.gallery-size-slider:hover::-webkit-slider-thumb {
  transform: scale(1.2);
  background: var(--cg-accent-cyan);
}

/* === Gallery Header & Breadcrumb Bar === */
.comfy-carousel .gallery-header-wrapper {
  position: fixed;
  top: 14px;
  left: 0;
  right: 0;
  z-index: calc(var(--comfy-carousel-z-index) + 15);
  box-sizing: border-box;
}

.comfy-carousel .gallery-header {
  width: 90vw;
  height: 50px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  box-sizing: border-box;
  background: var(--cg-surface-dark);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-pill);
  box-shadow: var(--cg-shadow-elevation);
}

.comfy-carousel .breadcrumb-container {
  display: flex;
  align-items: center;
  background: transparent;
  padding: 0;
  border-radius: var(--cg-radius-pill);
  overflow: hidden;
  z-index: calc(var(--comfy-carousel-z-index) + 1);
  flex-grow: 1;
  min-width: 0;
  margin-right: 10px;
}

.comfy-carousel .breadcrumb-navigation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comfy-carousel .breadcrumb-navigation button {
  background: var(--cg-surface-glass);
  color: var(--cg-text-main);
  border: 1px solid var(--cg-border-glass);
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  height: 32px;
  border-radius: var(--cg-radius-pill);
  will-change: transform;
}

.comfy-carousel .breadcrumb-navigation button:hover {
  background: var(--cg-accent-primary);
  border-color: var(--cg-accent-primary-hover);
  color: #ffffff;
  transform: translateY(-1px);
}

.comfy-carousel .image-count,
.comfy-carousel .breadcrumb-container .jump-to-today {
  margin-left: 8px;
  background: var(--cg-surface-glass);
  border: 1px solid var(--cg-border-glass);
  color: var(--cg-text-muted);
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-radius: var(--cg-radius-pill);
  flex-shrink: 0;
  height: 32px;
}

.comfy-carousel .breadcrumb-container .jump-to-today:hover {
  background: var(--cg-accent-cyan);
  color: #ffffff;
  border-color: rgba(6, 182, 212, 0.5);
}

/* === Folder Button === */
.folder-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--cg-surface-card);
  color: var(--cg-text-main);
  border: 1px solid var(--cg-border-glass);
  box-shadow: var(--cg-shadow-card);
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease;
  border-radius: var(--cg-radius-md);
  overflow: hidden;
  box-sizing: border-box;
  padding: 12px;
  contain: layout paint;
  will-change: transform;
  transform: translateZ(0);
}

.folder-button svg {
  width: 44%;
  height: 44%;
  max-width: 52px;
  max-height: 52px;
  fill: #818cf8;
  margin-bottom: 6px;
  transition: transform 0.15s ease;
  will-change: transform;
}

.folder-button:hover {
  background: rgba(32, 38, 50, 0.95);
  border-color: var(--cg-border-glass-hover);
  transform: translateY(-3px) translateZ(0);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}

.folder-button:hover svg {
  transform: scale(1.08);
  fill: #a5b4fc;
}

.folder-text {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  color: var(--cg-text-main);
}

/* === Modals === */
.move-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(10, 12, 16, 0.85);
  z-index: calc(var(--comfy-carousel-z-index) + 20);
  display: flex;
  justify-content: center;
  align-items: center;
}

.move-popup {
  width: clamp(340px, 45vw, 620px);
  max-height: 82vh;
  overflow-y: auto;
  background: var(--cg-surface-dark);
  box-shadow: var(--cg-shadow-elevation);
  color: var(--cg-text-main);
  padding: 24px;
  border-radius: var(--cg-radius-lg);
  border: 1px solid var(--cg-border-glass);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.move-popup h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--cg-text-main);
}

.move-popup input[type="text"] {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 16px;
  background: rgba(15, 18, 24, 0.9);
  border: 1px solid var(--cg-border-glass);
  border-radius: var(--cg-radius-md);
  color: var(--cg-text-main);
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.move-popup input[type="text"]:focus {
  outline: none;
  border-color: var(--cg-accent-primary);
}

.popup-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.popup-buttons button {
  background: var(--cg-surface-glass);
  color: var(--cg-text-main);
  border: 1px solid var(--cg-border-glass);
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
  border-radius: var(--cg-radius-pill);
  will-change: transform;
}

.popup-buttons button:hover {
  background: var(--cg-surface-glass-hover);
  border-color: var(--cg-border-glass-hover);
}

.popup-buttons .ok-button,
.popup-buttons .move-button,
.popup-buttons .move-open-button {
  background-color: var(--cg-accent-primary);
  border-color: var(--cg-accent-primary-hover);
  color: #ffffff;
}

.popup-buttons .ok-button:hover,
.popup-buttons .move-button:hover,
.popup-buttons .move-open-button:hover {
  background-color: var(--cg-accent-primary-hover);
  transform: translateY(-1px);
}

/* === Video Badge Overlay === */
.video-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(15, 18, 24, 0.9);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: var(--cg-radius-pill);
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--cg-border-glass);
  contain: layout paint;
}

.video-overlay::before {
  content: '▶';
  font-size: 10px;
}

.comfy-carousel-box .dots .dot-video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 22px;
  height: 22px;
  background: rgba(15, 18, 24, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  pointer-events: none;
  contain: layout paint;
}

.comfy-carousel-box .dots .dot-video-overlay::before {
  content: '▶';
  position: relative;
  left: 1px;
}

.comfy-carousel .large-view-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(15px);
}

.comfy-carousel .show {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
}
`;

// --- Append Styles ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
// --- SVGs ---
const deleteButtonSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6"/></svg>`; // Now using the original load icon for delete
const moveButtonSVG = `<svg width="20" height="20" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" stroke-width="15.36">
  <path d="M114.063 276v1368.756H0V276h114.063Zm739.106 73.765 80.642 80.642-473.02 473.02H1920v113.948H460.792l473.02 473.02-80.643 80.642-610.694-610.693 610.694-610.58Z" fill-rule="evenodd"></path>
</svg>`;
const resetZoomSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
const downloadSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`;
const loadSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="13" x2="12" y2="19"></line><polyline points="15 16 12 19 9 16"></polyline></svg>`; // New icon for load
const gallerySVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10l-4 4-4-4-4 4"/></svg>`; // Grid/Gallery icon
const newFolderSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2zM12 10v6M9 13h6"/></svg>`;
const reloadSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
const scrollToTopSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
const selectSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`; // Checkmark
const selectExitSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`; // Minus/Dash
// --- EXIF & Metadata Extraction Functions ---

function parseExifData(exifData) {
  if (!exifData || exifData.byteLength < 8) return null;

  // Skip "Exif\0\0" header if present (6 bytes)
  if (
    exifData[0] === 0x45 && // 'E'
    exifData[1] === 0x78 && // 'x'
    exifData[2] === 0x69 && // 'i'
    exifData[3] === 0x66 && // 'f'
    exifData[4] === 0x00 &&
    exifData[5] === 0x00
  ) {
    exifData = exifData.subarray(6);
  }

  if (exifData.byteLength < 8) return null;

  const dataView = new DataView(exifData.buffer, exifData.byteOffset, exifData.byteLength);

  // Check byte order mark (0x4949 for little-endian 'II', 0x4D4D for big-endian 'MM')
  const byteOrder = dataView.getUint16(0, false);
  let isLittleEndian;
  if (byteOrder === 0x4949) {
    isLittleEndian = true;
  } else if (byteOrder === 0x4D4D) {
    isLittleEndian = false;
  } else {
    return null;
  }

  // Check TIFF magic number (42)
  if (dataView.getUint16(2, isLittleEndian) !== 42) {
    return null;
  }

  const ifd0Offset = dataView.getUint32(4, isLittleEndian);

  function getTypeSize(type) {
    switch (type) {
      case 1: return 1; // BYTE
      case 2: return 1; // ASCII
      case 3: return 2; // SHORT
      case 4: return 4; // LONG
      case 5: return 8; // RATIONAL
      case 7: return 1; // UNDEFINED
      case 9: return 4; // SLONG
      case 10: return 8; // SRATIONAL
      default: return 1;
    }
  }

  function parseIFD(offset) {
    if (offset <= 0 || offset + 2 > exifData.byteLength) return {};
    const numEntries = dataView.getUint16(offset, isLittleEndian);
    const result = {};

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = offset + 2 + i * 12;
      if (entryOffset + 12 > exifData.byteLength) break;

      const tag = dataView.getUint16(entryOffset, isLittleEndian);
      const type = dataView.getUint16(entryOffset + 2, isLittleEndian);
      const count = dataView.getUint32(entryOffset + 4, isLittleEndian);
      const valueOffset = dataView.getUint32(entryOffset + 8, isLittleEndian);

      const typeSize = getTypeSize(type);
      const byteLen = count * typeSize;
      const dataOffset = byteLen <= 4 ? entryOffset + 8 : valueOffset;

      if (dataOffset + byteLen <= exifData.byteLength) {
        result[tag] = { tag, type, count, byteLen, dataOffset };
      }
    }
    return result;
  }

  const ifd0 = parseIFD(ifd0Offset);

  // Check Exif SubIFD (tag 0x8769)
  let exifIfd = {};
  if (ifd0[0x8769]) {
    const subIfdOffset = dataView.getUint32(ifd0[0x8769].dataOffset, isLittleEndian);
    exifIfd = parseIFD(subIfdOffset);
  }

  // Look for UserComment (tag 0x9286 / 37510) in Exif SubIFD or IFD0, or ImageDescription (0x010e)
  const userCommentEntry = exifIfd[0x9286] || ifd0[0x9286] || ifd0[0x010e];
  if (!userCommentEntry) return null;

  const rawBytes = exifData.subarray(
    userCommentEntry.dataOffset,
    userCommentEntry.dataOffset + userCommentEntry.byteLen
  );

  return parseUserCommentBytes(rawBytes);
}

function parseUserCommentBytes(bytes) {
  if (!bytes || bytes.length === 0) return null;

  let offset = 0;
  // Check for 8-byte header: "ASCII\0\0\0", "UNICODE\0", "\0\0\0\0\0\0\0\0", etc.
  if (bytes.length >= 8) {
    const header = String.fromCharCode(...bytes.subarray(0, 8));
    if (header.startsWith("ASCII") || header === "\0\0\0\0\0\0\0\0" || header.startsWith("JIS")) {
      offset = 8;
    } else if (header.startsWith("UNICODE")) {
      // Decode UTF-16
      const utf16Bytes = bytes.subarray(8);
      const decoder = new TextDecoder("utf-16");
      const text = decoder.decode(utf16Bytes);
      return parseJsonText(text);
    }
  }

  const payload = bytes.subarray(offset);
  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(payload);
  return parseJsonText(text);
}

function parseJsonText(text) {
  if (!text) return null;
  text = text.replace(/\0+$/, "").trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      resolve(new DataView(event.target.result));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseViewURL(viewUrl) {
  try {
    const url = new URL(viewUrl, window.location.origin);
    const filename = decodeURIComponent(url.searchParams.get('filename') || '');
    const type = url.searchParams.get('type') || 'output';
    const subfolder = decodeURIComponent(url.searchParams.get('subfolder') || '');

    return {
      filename: filename.split('/').pop(),
      type,
      subfolder: filename.includes('/') ?
        filename.split('/').slice(0, -1).join('/') :
        subfolder
    };
  } catch (e) {
    console.error("Error parsing view URL:", viewUrl, e);
    return {};
  }
}

function createViewUrl(filename, type = 'output', subfolder = '') {
  const encodedFilename = encodeURIComponent(
    subfolder ? `${subfolder}/${filename}` : filename
  );
  return `/view?filename=${encodedFilename}&type=${encodeURIComponent(type)}`;
}

async function getWebpMetadata(file) {
  try {
    const dataView = await readFile(file);
    if (dataView.byteLength < 12) return null;

    if (dataView.getUint32(0) !== 0x52494646 || dataView.getUint32(8) !== 0x57454250) {
      return null;
    }

    let offset = 12;
    while (offset + 8 <= dataView.byteLength) {
      const chunkType = dataView.getUint32(offset);
      const chunkLength = dataView.getUint32(offset + 4, true);

      if (chunkType === 0x45584946) { // "EXIF"
        const exifBytes = new Uint8Array(dataView.buffer, dataView.byteOffset + offset + 8, chunkLength);
        const data = parseExifData(exifBytes);
        if (data) return data;
      }
      offset += 8 + chunkLength + (chunkLength % 2);
    }
  } catch (e) {
    console.error("Error reading WEBP metadata:", e);
  }
  return null;
}

async function getJpegMetadata(file) {
  try {
    const dataView = await readFile(file);
    if (dataView.byteLength < 4) return null;

    if (dataView.getUint16(0) !== 0xFFD8) return null;

    let offset = 2;
    while (offset + 4 <= dataView.byteLength) {
      const segmentType = dataView.getUint16(offset);
      if (segmentType === 0xFFD9 || (segmentType & 0xFF00) !== 0xFF00) {
        break;
      }

      if (segmentType === 0xFFD8) {
        offset += 2;
        continue;
      }

      const segmentLength = dataView.getUint16(offset + 2);
      if (segmentLength < 2) break;

      if (segmentType === 0xFFE1 && segmentLength > 2) { // APP1 segment
        const exifBytes = new Uint8Array(dataView.buffer, dataView.byteOffset + offset + 4, segmentLength - 2);
        const data = parseExifData(exifBytes);
        if (data) return data;
      }
      offset += 2 + segmentLength;
    }
  } catch (e) {
    console.error("Error reading JPEG metadata:", e);
  }
  return null;
}

function isWebp(file) {
  return file?.type === "image/webp" || (file?.name && file.name.toLowerCase().endsWith(".webp"));
}

function isJpeg(file) {
  return file?.type === "image/jpeg" || file?.type === "image/jpg" ||
         (file?.name && (file.name.toLowerCase().endsWith(".jpeg") || file.name.toLowerCase().endsWith(".jpg")));
}

async function getMetadata(file) {
  if (!file) return null;
  if (isWebp(file)) return getWebpMetadata(file);
  if (isJpeg(file)) return getJpegMetadata(file);
  return null;
}

async function handleFile(origHandleFile, file, ...args) {
  if (file && (isWebp(file) || isJpeg(file))) {
    try {
      const metadata = await getMetadata(file);
      if (metadata) {
        if (metadata.workflow) {
          const graphData = typeof metadata.workflow === 'string' ? JSON.parse(metadata.workflow) : metadata.workflow;
          app.loadGraphData(graphData);
          console.log("Loaded graph from image metadata.");
          return true;
        } else if (metadata.prompt) {
          const promptData = typeof metadata.prompt === 'string' ? JSON.parse(metadata.prompt) : metadata.prompt;
          app.loadApiJson(promptData);
          console.log("Loaded API prompt from image metadata.");
          return true;
        }
      }
    } catch (e) {
      console.error("Error loading image workflow in handleFile:", e);
    }
  }

  if (origHandleFile) {
    return await origHandleFile.call(app, file, ...args);
  }
}
// === ComfyCarousel Class ===
class ComfyCarousel extends ComfyDialog {
  constructor(isGalleryCarousel = false) {
    super();
    this.isGalleryCarousel = isGalleryCarousel; // True for main gallery, false for node preview
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.currentGallerySubfolder = ''; // Subfolder being viewed in gallery mode
    this.currentGalleryPage = 1;
    this.totalGalleryPages = 1;
    this.totalGalleryItems = 0;
    this.itemsPerGalleryPage = 100; // Default, updated from backend
    this.isLoadingMoreGalleryItems = false; // Flag for infinite scroll
    this.galleryScrollListener = null; // To remove listener later
    this.currentLargeViewFolder = ''; // Folder context for the items currently in large view
    this.currentLargeViewItems = []; // All items (data objects) for the current large view folder
    this.currentLargeViewIndex = 0; // Index within the large view items array
    this.onKeydown = this.onKeydown.bind(this); // Bind keydown handler
    this.element.classList.replace("comfy-modal", "comfy-carousel");
    // Close on background click
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });
    this.isSelectionMode = false;
    this.handleDelete = null; // For gallery multi-delete confirmation
    this.lastSelectedIndex = -1; // For gallery shift-click range selection
    this.removeCallback = null; // For node preview removal update
    this.taggedImages = null; // To store tagged items (maybe use indices or URLs) - simplified for now
    // Add these new properties for delete confirmation state
    this.deleteConfirmActive = false; // State: Is the delete confirmation prompt currently showing?
    this.deleteConfirmTimeout = null; // Timeout ID for auto-cancel
    this.clickHandler = null; // Reference to the click-away handler
    this._clickListenerAdded = false; // Flag to track if the click listener is added
    this._popupKeyListenerAdded = false; // Flag to track if popup key listener is active
    this.boundEscHandlerPopup = null; // Initialize bound handler
    this.allLargeViewItemsData = []; // Stores metadata for *all* media items in the folder
    this.dotWindowStartIndex = 0; // Start index of the current window of rendered dots
    this.dotWindowSize = 100; // Number of dots to render at once (adjust based on testing)
    this.dotRenderBuffer = 50; // Additional items to render outside viewport for smoother scrolling
    this.dotItemWidth = 60; // Approximate width of a dot + gap (dot size 48 + gap 10 + border 2*2)
    this.dotContainer = null; // Reference to the dots DOM container
    this.slideContainer = null; // Reference to the slides DOM container
    this._dotsScrollListener = null; // Store bound listener
    // --- End New Properties ---

    // Bind methods
    // ... (existing binds) ...
    this.onDotScroll = this.onDotScroll.bind(this); // Bind new scroll handler
  }
  setupDragSelection(galleryContainer) {
    let isDragging = false;
    let startX, startY;
    let selectionBox = null;

    galleryContainer.addEventListener('mousedown', (e) => {
      if (this.isSelectionMode && e.button === 0) {  // Left click only
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionBox = document.createElement('div');
        selectionBox.style.position = 'absolute';
        selectionBox.style.border = '2px dashed blue';
        selectionBox.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        selectionBox.style.pointerEvents = 'none';  // Doesn't block interactions
        document.body.appendChild(selectionBox);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging && this.isSelectionMode) {
        e.preventDefault();  // Block default drag behavior
        e.stopPropagation();
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        const boxLeft = Math.min(startX, e.clientX);
        const boxTop = Math.min(startY, e.clientY);
        const boxRight = Math.max(startX, e.clientX);
        const boxBottom = Math.max(startY, e.clientY);

        // Update selection box position and size
        selectionBox.style.left = `${boxLeft}px`;
        selectionBox.style.top = `${boxTop}px`;
        selectionBox.style.width = `${Math.abs(width)}px`;
        selectionBox.style.height = `${Math.abs(height)}px`;

        // Improved overlap detection using rectangle intersection
        const items = galleryContainer.querySelectorAll('.gallery-item-container, .folder-button');
        items.forEach(item => {
          const rect = item.getBoundingClientRect();
          const isOverlapping =
            rect.left < boxRight &&
            rect.right > boxLeft &&
            rect.top < boxBottom &&
            rect.bottom > boxTop;

          if (isOverlapping) {
            item.classList.add('selected');
            item.classList.remove('greyed-out');
          } else {
            // Optionally deselect non-overlapping items if you want exclusive selection
            // item.classList.remove('selected');
          }
        });
        console.log(`Drag position: X=${e.clientX}, Y=${e.clientY}`);  // Debugging log
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isDragging && this.isSelectionMode) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = false;
        if (selectionBox) {
          selectionBox.remove();
          selectionBox = null;
        }
        this.updateGalleryButtonVisibility(galleryContainer, this.element.querySelector('.gallery-button-container'));
        this.updateImageCount(this.element.querySelector('.breadcrumb-container'), galleryContainer, this.totalGalleryItems);
        console.log("Drag ended successfully.");  // Debugging log
      }
    });
  }
  // --- Large View (Carousel) Methods ---
  getActive() { // Returns the currently shown slide _container_ element
    return this.element.querySelector('.slides > .slide-container.shown');
  }
  scrollToImage(index) { // Scrolls the _dots_ in large view
    const dots = this.element.querySelectorAll('.dots img');
    if (dots && dots[index]) {
      dots[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
  // selectImage now takes just the index (index within allLargeViewItemsData)
  selectImage(index) {
    const totalItems = this.allLargeViewItemsData.length;
    if (totalItems === 0 || index < 0 || index >= totalItems) {
      console.warn(`[Carousel] Cannot select image at index ${index}. Invalid index or no items.`);
       // Clear display if attempting to select invalid index
       this.slideContainer.innerHTML = '<div class="no-images">No items to display.</div>';
       // Deselect all dots
       this.dotContainer.querySelectorAll('.dot-thumbnail').forEach(dot => dot.classList.remove('active'));
       this.currentLargeViewIndex = -1;
       this.updateLargeViewButtonStates(); // Update button states
       return;
    }
  
    // Pause video on previously active slide
    const currentActiveSlideElement = this.slideContainer.querySelector('.slide-container.shown');
    if (currentActiveSlideElement) {
        const video = currentActiveSlideElement.querySelector('video');
        if (video && !video.paused) video.pause();
    }
  
    // Update the active index
    this.currentLargeViewIndex = index;
  
    // Update the slide display (creates/updates the single active slide DOM element)
    this.updateSlideDisplay(index);
  
    // Update active class on dots and scroll the dots container
    // First, remove active class from all dots (only in the rendered window)
    this.dotContainer.querySelectorAll('.dot-thumbnail.active').forEach(dot => dot.classList.remove('active'));
  
    // Then, add active class to the dot corresponding to the new index
    const newActiveDot = this.dotContainer.querySelector(`.dot-thumbnail-container[data-index="${index}"] .dot-thumbnail`);
    if (newActiveDot) {
         newActiveDot.classList.add('active');
         this.updateTaggedIndicator(newActiveDot); // Ensure tagged state is updated on the active dot
         // Scroll the dots container to the new active dot
         this.scrollToDot(index); // This also triggers renderDotWindow if the dot is outside the current window
    } else {
        // This happens if the target dot is outside the current rendered window
        // scrollToDot will handle adjusting the window and rendering it
        console.log(`[Carousel] Active dot for index ${index} not currently rendered. Scrolling to dot.`);
        this.scrollToDot(index); // Scroll and trigger render
        // The active class/tagged indicator will be set during renderDotWindow or the second pass in scrollToDot
    }
  
  
    this.resetZoom(); // Reset zoom when changing image
    this.updateLargeViewButtonStates(); // Update button states (prev/next disabled state etc.)
    this.updateImageCounter();
  }

  updateImageCounter() {
    let counterEl = this.element.querySelector('.comfy-carousel-box .image-counter');
    const total = this.allLargeViewItemsData?.length || 0;
    const current = total > 0 && this.currentLargeViewIndex >= 0 ? this.currentLargeViewIndex + 1 : 0;
    const text = `${current}/${total}`;
    const carouselBox = this.element.querySelector('.comfy-carousel-box');
    if (!counterEl && carouselBox) {
      counterEl = $el('div.image-counter', text);
      carouselBox.appendChild(counterEl);
    } else if (counterEl) {
      counterEl.textContent = text;
    }
  }

  createSlideElement(item, index) {
    const slideContainer = document.createElement('div');
    slideContainer.className = 'slide-container';
    slideContainer.dataset.index = index; // Index in the full list
    slideContainer.dataset.url = item.url;
    slideContainer.dataset.tagged = item.tagged ? 'true' : 'false';
  
    let mediaElement;
    if (item.type === 'video') {
      mediaElement = document.createElement('video');
      mediaElement.controls = true;
      mediaElement.loop = true;
      mediaElement.muted = false; // Audio on by default
      mediaElement.playsInline = true;
      mediaElement.src = item.url;
      mediaElement.dataset.originalSrc = item.url;
      // Add event listener to pause others when this one plays (if needed)
      mediaElement.onplay = () => {
        // You might need to pause other videos if you allowed multiple slides in DOM
        // With single slide approach, this isn't strictly necessary unless autoplay is complex
      };
    } else {
      mediaElement = document.createElement('img');
      mediaElement.src = item.url;
      mediaElement.dataset.originalSrc = item.url;
      mediaElement.alt = item.filename || '';
      mediaElement.loading = 'lazy'; // Lazy load the main image element
    }
  
    // Error handling for both types
    mediaElement.onerror = (e) => {
      console.error(`Error loading media: ${item.url}`, e);
      slideContainer.innerHTML = '<p style="color:red;">Error loading media</p>';
    };
  
    slideContainer.appendChild(mediaElement);
    return slideContainer;
  }

  updateSlideDisplay(index) {
      if (!this.slideContainer || this.allLargeViewItemsData.length === 0 || index < 0 || index >= this.allLargeViewItemsData.length) {
         // Clear slides display if no items or invalid index
         if(this.slideContainer) this.slideContainer.innerHTML = '<div class="no-images">No items to display.</div>';
         return;
      }
      const item = this.allLargeViewItemsData[index];
  
      // Clear previous slides
      this.slideContainer.innerHTML = '';
  
      // Create the new slide container and media element
      const slideContainerElement = this.createSlideElement(item, index); // Use a helper to create the DOM element
      slideContainerElement.classList.add('shown'); // Make it visible
  
      this.slideContainer.appendChild(slideContainerElement);
  
       // Attempt to autoplay video if it's the selected slide
       const mediaElement = slideContainerElement.querySelector('img, video');
       if (mediaElement && mediaElement.tagName === 'VIDEO') {
         // Check if video is already loaded and ready before trying to play
         if (mediaElement.readyState >= 3) { // Enough data to play
             mediaElement.play().catch(e => console.debug("Autoplay prevented/interrupted:", e));
         } else {
             // Wait for 'canplaythrough' or 'loadeddata' event
             mediaElement.addEventListener('canplaythrough', () => {
                 mediaElement.play().catch(e => console.debug("Autoplay prevented/interrupted (event):", e));
             }, { once: true });
         }
       }
  }
  // updateTaggedIndicator now takes the dot DOM element
  updateTaggedIndicator(dotElement) {
    if (!dotElement || !dotElement.classList.contains('dot-thumbnail')) {
        // console.warn("[Carousel] Invalid element passed to updateTaggedIndicator.");
        return;
    }
    const index = parseInt(dotElement.dataset.index, 10);
     if (isNaN(index) || !this.allLargeViewItemsData[index]) return;
  
    const itemData = this.allLargeViewItemsData[index];
    const isTagged = itemData?.tagged ?? false; // Check internal data
  
    // Update the dot element's class
    dotElement.classList.toggle('tagged', isTagged);
    // You might also want to update the corresponding itemData object
    if (itemData) itemData.tagged = isTagged;
  
    // The CSS rule .active.tagged already exists and targets the img,
    // so we don't need a separate 'active-tagged' class here.
  }

  async loadImage() {
    const activeItem = this.allLargeViewItemsData[this.currentLargeViewIndex];
    if (!activeItem) return;

    try {
      const response = await fetch(activeItem.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      
      const filename = activeItem.filename || 'file.png';
      const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });

      let loaded = false;

      // 1. Try delegating to app.handleFile (handles PNG/JSON natively, JPEG/WEBP via Wiz/imageGallery handler)
      if (typeof app.handleFile === 'function') {
        try {
          const handled = await app.handleFile(file);
          if (handled !== false) {
            loaded = true;
          }
        } catch (e) {
          console.warn("app.handleFile error, trying direct getMetadata fallback:", e);
        }
      }

      // 2. Direct metadata fallback if app.handleFile didn't load it
      if (!loaded) {
        const metadata = await getMetadata(file);
        if (metadata?.workflow) {
          try {
            const graphData = typeof metadata.workflow === 'string' ? JSON.parse(metadata.workflow) : metadata.workflow;
            app.loadGraphData(graphData);
            console.log("Loaded workflow from image metadata fallback.");
            loaded = true;
          } catch (e) {
            console.error("Error loading graphData from metadata fallback:", e);
          }
        } else if (metadata?.prompt) {
          try {
            const promptData = typeof metadata.prompt === 'string' ? JSON.parse(metadata.prompt) : metadata.prompt;
            app.loadApiJson(promptData);
            console.log("Loaded prompt from image metadata fallback.");
            loaded = true;
          } catch (e) {
            console.error("Error loading promptData from metadata fallback:", e);
          }
        }
      }

      // Close the gallery modal overlay after loading workflow
      this.close();
    } catch (error) {
      console.error("Error loading workflow for item:", error);
    }
  }
  
  async downloadImage() {
    const itemsToDownload = this.allLargeViewItemsData.filter(item => item.tagged);
    if (itemsToDownload.length === 0 && this.currentLargeViewIndex > -1) {
      itemsToDownload.push(this.allLargeViewItemsData[this.currentLargeViewIndex]);
    }
    
    if (itemsToDownload.length === 0) {
      alert("No items available to download");
      return;
    }
  
    for (const item of itemsToDownload) {
      try {
        const a = document.createElement('a');
        a.href = item.url;
        a.download = item.filename;
        a.click();
      } catch (error) {
        console.error("Download failed:", error);
      }
    }
  }
  
  showMovePopup(currentPath, onMove, onMoveAndOpen, itemsToMoveDetails = []) {
    const overlay = $el('div.move-overlay');
    const popup = $el('div.move-popup');
    popup.innerHTML = `
    <h3>Select destination folder:</h3>
    <input type="text" id="new-folder-name" placeholder="Enter new folder name to create..." required>
    <div class="breadcrumb-container"></div>
    <div class="popup-buttons">
        <button id="move-button">Move Here</button>
        <button id="move-open-button">Move & Open</button>
        <button id="cancel-button">Cancel</button>
    </div>
  `;

    function cleanFolderName(name) {
      if (!name) return '';  // Return empty if no name
      // Remove leading/trailing spaces/dots and replace forbidden characters
      return name.trim().replace(/^[ .]+|[ .]+$/g, '').replace(/[\\/:"*?<>|~]+/g, '_');
    }

    const input = popup.querySelector('#new-folder-name');
    const breadcrumbContainer = popup.querySelector('.breadcrumb-container');
    const moveButton = popup.querySelector('#move-button');
    const moveOpenButton = popup.querySelector('#move-open-button');
    const cancelButton = popup.querySelector('#cancel-button');
    let selectedPath = currentPath;

    // Function to update button labels based on input
    const updateButtonLabels = () => {
      const folderName = input.value.trim();
      if (folderName) {
        moveButton.textContent = 'Create Folder & Move';
        moveOpenButton.textContent = 'Create Folder, Move & Open';
      } else {
        moveButton.textContent = 'Move Here';
        moveOpenButton.textContent = 'Move & Open';
      }
    };

    input.addEventListener('input', updateButtonLabels);
    updateButtonLabels();  // Initial call

    const updatePopupView = async (path) => {
      selectedPath = path;
      breadcrumbContainer.innerHTML = '';
      console.log(`[Move Popup] Starting updatePopupView for path: '${selectedPath}'`);
      console.log(`[Move Popup]    itemsToMoveDetails count: ${itemsToMoveDetails?.length}`);

      const pathSegments = (selectedPath || '').replace(/\\/g, '/').split('/').filter(Boolean);
      const homeButton = document.createElement('button');
      homeButton.className = 'breadcrumb-navigation-button';
      homeButton.textContent = 'Home';
      homeButton.dataset.subfolder = '';
      homeButton.onclick = (e) => {
        updatePopupView(e.currentTarget.dataset.subfolder, itemsToMoveDetails);
      };
      breadcrumbContainer.appendChild(homeButton);

      let accumulatedPath = '';
      pathSegments.forEach((segment) => {
        accumulatedPath += (accumulatedPath ? '/' : '') + segment;
        const segmentButton = document.createElement('button');
        segmentButton.className = 'breadcrumb-navigation-button';
        segmentButton.textContent = segment;
        segmentButton.dataset.path = accumulatedPath;
        segmentButton.onclick = (e) => {
          updatePopupView(e.currentTarget.dataset.path, itemsToMoveDetails);
        };
        breadcrumbContainer.appendChild(segmentButton);
      });

      try {
        const response = await fetch(`/gallery/images?subfolder=${encodeURIComponent(selectedPath)}&page=1&per_page=0`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        let folders = data.items.filter(item => item.type === 'folder').map(item => item.name);

        if (itemsToMoveDetails.length > 0) {
          folders = folders.filter(fetchedFolderName => {
            return !itemsToMoveDetails.some(item =>
              item.type === 'folder' &&
              item.name === fetchedFolderName &&
              (item.subfolder || '') === selectedPath
            );
          });
        }

        if (folders.length > 0) {
          const select = document.createElement('select');
          select.className = 'folder-dropdown';
          const defaultOption = document.createElement('option');
          defaultOption.textContent = 'Select subfolder...';
          defaultOption.value = '';
          select.appendChild(defaultOption);
          folders.sort((a, b) => a.localeCompare(b));
          folders.forEach(folder => {
            const option = document.createElement('option');
            option.textContent = folder;
            option.value = folder;
            select.appendChild(option);
          });
          select.onchange = (e) => {
            const selectedValue = e.currentTarget.value;
            if (selectedValue) {
              const nextPath = selectedPath ? `${selectedPath}/${selectedValue}` : selectedValue;
              updatePopupView(nextPath, itemsToMoveDetails);
            }
          };
          breadcrumbContainer.appendChild(select);
        } else {
          console.log(`[Move Popup] No subfolders found in '${selectedPath}' for dropdown.`);
        }
      } catch (error) {
        console.error(`[Move Popup] Error fetching subfolders for ${selectedPath}:`, error);
        breadcrumbContainer.appendChild($el('span', { textContent: `Error: ${error.message}`, style: { color: '#ff8a80' } }));
      }
      console.log(`[Move Popup] Finished updatePopupView for path: '${selectedPath}'.`);
    };

    updatePopupView(selectedPath);

    moveButton.onclick = async () => {
      let folderName = input.value.trim();
      folderName = cleanFolderName(folderName);
      let finalPath = selectedPath;
      if (folderName) {
        finalPath = selectedPath ? `${selectedPath}/${folderName}` : folderName;
        try {
          const response = await fetch("/gallery/folder/create", {
            method: "POST",
            body: new URLSearchParams({ type: 'output', subfolder: selectedPath, foldername: folderName }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          });
          if (!response.ok) throw new Error(await response.text());
          console.log(`Folder '${finalPath}' created successfully.`);
        } catch (error) {
          console.error(`Error creating folder: ${error}`);
          alert(`Operation failed: ${error.message}`);
          return;
        }
      }
      await onMove(finalPath);
      overlay.remove();
      document.removeEventListener('keydown', this.boundEscHandlerPopup);
      if (this.isGalleryCarousel && this.isSelectionMode) {
        this.exitSelectionMode();
      }
    };

    moveOpenButton.onclick = async () => {
      let folderName = input.value.trim();
      folderName = cleanFolderName(folderName);
      let finalPath = selectedPath;
      if (folderName) {
        finalPath = selectedPath ? `${selectedPath}/${folderName}` : folderName;
        try {
          const response = await fetch("/gallery/folder/create", {
            method: "POST",
            body: new URLSearchParams({ type: 'output', subfolder: selectedPath, foldername: folderName }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          });
          if (!response.ok) throw new Error(await response.text());
          console.log(`Folder '${finalPath}' created successfully.`);
        } catch (error) {
          console.error(`Error creating folder: ${error}`);
          alert(`Operation failed: ${error.message}`);
          return;
        }
      }
      await onMoveAndOpen(finalPath);
      overlay.remove();
      document.removeEventListener('keydown', this.boundEscHandlerPopup);
      if (this.isGalleryCarousel && this.isSelectionMode) {
        this.exitSelectionMode();
      }
    };

    cancelButton.onclick = () => {
      overlay.remove();
      document.removeEventListener('keydown', this.boundEscHandlerPopup);
    };

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    input.focus();
  }
  updateLargeViewButtonStates() {
      const prevBtn = this.element.querySelector('.comfy-carousel-box .prev');
      const nextBtn = this.element.querySelector('.comfy-carousel-box .next');
      const totalItems = this.allLargeViewItemsData.length;
  
      // Disable nav buttons if 0 or 1 items
      const disableNav = totalItems <= 1;
      if (prevBtn) prevBtn.disabled = disableNav;
      if (nextBtn) nextBtn.disabled = disableNav;
  
       // Disable other buttons if no items are present at all
      const disableOtherButtons = totalItems === 0;
      this.element.querySelectorAll('.comfy-carousel-box .button-container button').forEach(btn => {
          // Don't disable the close button
          if (!btn.classList.contains('close')) {
              btn.disabled = disableOtherButtons;
          }
      });
  }
  handleMove() {
      let itemsToMoveDetails = [];
      let sourceSubfolder = '';
      
      // Check for selected items in gallery view first
      const selectedElements = this.element.querySelectorAll('.gallery-container .selected');
      
      if (selectedElements.length > 0) {
          // Handle gallery selection mode
          itemsToMoveDetails = Array.from(selectedElements).map(item => {
              if (item.classList.contains('folder-button')) {
                  const name = item.dataset.name;
                  const fullPath = (item.dataset.subfolder || '').replace(/\\/g, '/');
                  const lastSlash = fullPath.lastIndexOf('/');
                  const parentSubfolder = lastSlash !== -1 ? fullPath.substring(0, lastSlash) : '';
                  return { 
                      type: 'folder', 
                      subfolder: parentSubfolder, 
                      name: name 
                  };
              } else if (item.classList.contains('gallery-item-container')) {
                  return {
                      type: item.dataset.type,
                      subfolder: item.dataset.subfolder || '',
                      name: item.dataset.filename
                  };
              }
              return null;
          }).filter(Boolean);
          
          sourceSubfolder = this.currentGallerySubfolder || '';
      } 
      // Fall back to large view logic if no gallery selection
      else {
          const taggedItems = this.allLargeViewItemsData.filter(item => item.tagged);
          const activeItem = this.currentLargeViewItems[this.currentLargeViewIndex];
          
          if (taggedItems.length > 0) {
              itemsToMoveDetails = taggedItems;
          } else if (activeItem && this.currentLargeViewIndex > -1) {
              const activeItemData = this.allLargeViewItemsData[this.currentLargeViewIndex];
              if (activeItemData) {
                  itemsToMoveDetails = [activeItemData];
              }
          }
          
          sourceSubfolder = this.currentLargeViewFolder || '';
      }
  
      if (itemsToMoveDetails.length === 0) {
          console.warn("[Move Popup] No valid items found/selected to move.");
          alert("No items selected to move.");
          return;
      }
  
      // Rest of the existing move logic...
      const backendItemsData = itemsToMoveDetails.map(item => ({
          type: item.type,
          subfolder: item.subfolder || '',
          name: item.name
      }));
  
      const finalBackendItemsData = backendItemsData.filter(item => 
          item.type === 'image' || item.type === 'video' || item.type === 'folder'
      );
  
  
      // --- Define Actions for Popup ---
      const moveItemsAction = async (selectedFolder) => {
        try {
          console.log(`[Move Popup] Attempting to move ${finalBackendItemsData.length} item(s) to: ${selectedFolder}`);
          const response = await fetch("/gallery/items/move", {
            method: "POST",
            body: new URLSearchParams({
              type: 'output', // Assuming output type
              destination: selectedFolder, // The target folder path
              items: JSON.stringify(finalBackendItemsData) // Array of {type, subfolder, name}
            }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to move item(s): ${response.statusText}. Server: ${errorText}`);
          }
  
          console.log("[Move Popup] Move successful to:", selectedFolder);
  
          // --- Post-Move UI Update for Large View ---
          const urlsToRemove = finalBackendItemsData.map(d => createViewUrl(d.name, 'output', d.subfolder)); // URLs point to original location
          let newIndex = this.currentLargeViewIndex; // Start with current index
  
          urlsToRemove.forEach(urlToRemove => {
            const indexInFullList = this.allLargeViewItemsData.findIndex(item => item.url === urlToRemove);
            if (indexInFullList > -1) {
              if (indexInFullList < newIndex) {
                newIndex--; // Adjust index if removing items before current
              }
              this.allLargeViewItemsData.splice(indexInFullList, 1); // Remove from the full list
              // Optionally call external callback for node previews
              if (this.removeCallback) this.removeCallback(urlToRemove);
            } else {
                console.warn(`[Move Popup] Item URL not found in allLargeViewItemsData during removal: ${urlToRemove}`);
            }
          });
  
          // Refresh the large view display with remaining items
          this.refreshLargeView(Math.max(0, newIndex)); // Select adjusted index or 0 if empty
  
          alert(`Successfully moved ${finalBackendItemsData.length} item(s).`);
  
        } catch (error) {
          console.error('[Move Popup] Error moving item(s):', error);
          alert(`Failed to move item(s). Error: ${error.message}`);
          // Keep popup open on error? Or close anyway? Closing might be better.
          this.element.querySelector('.move-overlay')?.remove();
          document.removeEventListener('keydown', this.boundEscHandlerPopup); // Remove specific handler
        }
      };
  
      const moveAndOpenAction = async (selectedFolder) => {
          console.log(`[Gallery Move Popup] Attempting to move & open to: ${selectedFolder}`);
          try {
              const response = await fetch("/gallery/items/move", {
                  method: "POST",
                  body: new URLSearchParams({
                      type: 'output',
                      destination: selectedFolder,
                      items: JSON.stringify(itemsToMoveDetails)
                  }),
                  headers: { "Content-Type": "application/x-www-form-urlencoded" }
              });
      
              if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Failed to move item(s): ${response.statusText}. Server: ${errorText}`);
              }
      
              console.log("[Gallery Move Popup] Move successful, transitioning to destination gallery.");
      
              // Clear the move popup first
              this.element.querySelector('.move-overlay')?.remove();
              document.removeEventListener('keydown', this.boundEscHandlerPopup);
      
              // Reset the carousel state without fully closing it
              this.element.classList.remove('hide');
              this.element.innerHTML = ''; // Clear all content
              this.isSelectionMode = false;
              this.lastSelectedIndex = -1;
      
              // Immediately show the new gallery
              app.ui.galleryCarousel.showGalleryView(selectedFolder);
      
          } catch (error) {
              console.error('[Gallery Move Popup] Error in moveAndOpenAction:', error);
              alert(`Failed to move item(s). Error: ${error.message}`);
              this.element.querySelector('.move-overlay')?.remove();
              document.removeEventListener('keydown', this.boundEscHandlerPopup);
              this.exitSelectionMode();
          }
      };
  
  
      this.showMovePopup(sourceSubfolder, moveItemsAction, moveAndOpenAction, itemsToMoveDetails);
  }

  onDotScroll() {
      if (!this.dotContainer || this.allLargeViewItemsData.length === 0) return;
  
      const { scrollLeft, clientWidth, scrollWidth } = this.dotContainer;
  
      // Calculate the index at the left edge of the visible area
      // Adjust scrollLeft by the start index offset to get global scroll position
      // Then divide by item width to get the approximate starting index
      // Need to be careful with floating point results and clamping
      // A simpler approach: check if the *start* or *end* of the current rendered window is near the viewport edge
  
      const renderedStartPixel = this.dotWindowStartIndex * this.dotItemWidth;
      const renderedEndPixel = (this.dotWindowStartIndex + this.dotWindowSize) * this.dotItemWidth;
  
      const scrollBufferPixels = this.dotRenderBuffer * this.dotItemWidth;
  
      // Check if we are scrolling near the start of the rendered window
      const nearRenderedStart = scrollLeft < renderedStartPixel + scrollBufferPixels * 2; // Check slightly beyond buffer
      // Check if we are scrolling near the end of the rendered window
      const nearRenderedEnd = scrollLeft + clientWidth > renderedEndPixel - scrollBufferPixels * 2; // Check slightly before buffer
  
  
      let newWindowStartIndex = this.dotWindowStartIndex;
  
      if (nearRenderedStart && this.dotWindowStartIndex > 0) {
           // Calculate how many items to shift left, ensure not to go below 0
          const itemsToShift = Math.floor(this.dotWindowSize / 4); // Shift by a quarter window size
          newWindowStartIndex = Math.max(0, this.dotWindowStartIndex - itemsToShift);
          console.log(`[Carousel] Scrolling near start, shifting window left from ${this.dotWindowStartIndex} to ${newWindowStartIndex}`);
      } else if (nearRenderedEnd && this.dotWindowStartIndex + this.dotWindowSize < this.allLargeViewItemsData.length) {
           // Calculate how many items to shift right, ensure not to exceed total items
          const itemsToShift = Math.floor(this.dotWindowSize / 4); // Shift by a quarter window size
           newWindowStartIndex = Math.min(
               this.allLargeViewItemsData.length - this.dotWindowSize,
               this.dotWindowStartIndex + itemsToShift
           );
           console.log(`[Carousel] Scrolling near end, shifting window right from ${this.dotWindowStartIndex} to ${newWindowStartIndex}`);
      }
  
      // If the window start index changed, update and re-render
      if (newWindowStartIndex !== this.dotWindowStartIndex) {
          this.dotWindowStartIndex = newWindowStartIndex;
          this.renderDotWindow(); // Re-render the dots for the new window
          // Note: Re-rendering clears and recreates dot elements.
          // The scroll position might jump slightly. To fix this, you could
          // calculate the pixel delta caused by changing the window start
          // and adjust scrollLeft immediately after rendering.
          // For now, let's keep it simple and accept potential minor jump.
      }
  }

  renderDotWindow() {
      if (!this.dotContainer || this.allLargeViewItemsData.length === 0) return;
  
      // Calculate the window including the buffer
      const windowStart = Math.max(0, this.dotWindowStartIndex - this.dotRenderBuffer);
      const windowEnd = Math.min(this.allLargeViewItemsData.length, this.dotWindowStartIndex + this.dotWindowSize + this.dotRenderBuffer);
  
      // console.log(`[Carousel] Rendering dot window: ${windowStart} to ${windowEnd}`);
  
      const dotPlaceholders = this.dotContainer.querySelectorAll('.dot-thumbnail-container');
  
      // Iterate through ALL placeholders to update visibility or create content
      dotPlaceholders.forEach((placeholder, i) => {
           const item = this.allLargeViewItemsData[i];
           const isWithinWindow = i >= windowStart && i < windowEnd;
  
           let dotImg = placeholder.querySelector('.dot-thumbnail');
           let videoOverlay = placeholder.querySelector('.dot-video-overlay');
  
           if (isWithinWindow) {
               // Item should be visible - ensure content exists
               if (!dotImg) {
                    // --- Create and Append Image ---
                    const isVideoExt = (u) => u && /\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)(\?.*)?$/i.test(u);
                    let dotSrc = item.thumbnail_url;
                    if (!dotSrc || isVideoExt(dotSrc)) {
                        if (item.type === 'video') {
                            dotSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\' viewBox=\'0 0 128 128\'%3E%3Crect width=\'128\' height=\'128\' fill=\'%2318181f\' rx=\'10\'/%3E%3Ccircle cx=\'64\' cy=\'64\' r=\'24\' fill=\'%232d2d38\'/%3E%3Cpolygon points=\'58,52 76,64 58,76\' fill=\'%23a78bfa\'/%3E%3C/svg%3E';
                        } else {
                            dotSrc = item.url;
                        }
                    }
                    dotImg = document.createElement('img');
                    dotImg.className = 'dot-thumbnail';
                    dotImg.alt = `Thumbnail ${i + 1}`;
                    dotImg.dataset.index = i;
                    dotImg.src = dotSrc;
                    dotImg.onerror = function () {
                      if (item.type === 'video') {
                          this.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\' viewBox=\'0 0 128 128\'%3E%3Crect width=\'128\' height=\'128\' fill=\'%2318181f\' rx=\'10\'/%3E%3Ccircle cx=\'64\' cy=\'64\' r=\'24\' fill=\'%232d2d38\'/%3E%3Cpolygon points=\'58,52 76,64 58,76\' fill=\'%23a78bfa\'/%3E%3C/svg%3E';
                      } else {
                          console.warn(`Error loading thumbnail: ${this.src}`);
                          this.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23555\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dy=\'.3em\' fill=\'%23ccc\' text-anchor=\'middle\' font-size=\'10\'%3EError%3C/text%3E%3C/svg%3E';
                      }
                    };
                    dotImg.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const clickedIndex = parseInt(e.target.dataset.index, 10);
                        if (!isNaN(clickedIndex)) {
                            this.selectImage(clickedIndex); // Select image by index
                        }
                    });
                    placeholder.appendChild(dotImg); // Append the image
               }
  
               // Ensure video overlay exists for videos/gifs within the window
               const isVideoOrGif = item.type === 'video' || (item.type === 'image' && item.filename?.toLowerCase().endsWith('.gif'));
               if (isVideoOrGif && !videoOverlay) {
                    videoOverlay = document.createElement('div');
                    videoOverlay.className = 'dot-video-overlay';
                    placeholder.appendChild(videoOverlay); // Append the overlay
               } else if (!isVideoOrGif && videoOverlay) {
                    // If it's no longer a video/gif but has an overlay, remove it
                    videoOverlay.remove();
                    videoOverlay = null; // Clear reference
               }
  
  
               // Update classes for active/tagged state (now applies regardless of creation)
               if(dotImg) { // Ensure dotImg exists before trying to add classes
                  dotImg.classList.toggle('active', i === this.currentLargeViewIndex);
                  dotImg.classList.toggle('tagged', item.tagged ?? false);
                  // Ensure dotImg and overlay (if exists) are visible if they were hidden
                  dotImg.style.display = '';
                  if(videoOverlay) videoOverlay.style.display = '';
                  // Reset placeholder specific styles if they were used to hide
                  placeholder.style.width = `${this.dotItemWidth}px`; // Restore placeholder width
                  placeholder.style.height = `48px`; // Restore placeholder height
               }
  
  
           } else {
               // Item is outside the buffer window - ensure content is removed/hidden
               if (dotImg) dotImg.remove(); // Remove the actual image element
               if (videoOverlay) videoOverlay.remove(); // Remove the overlay
               // Set placeholder dimensions back to initial size if needed
               placeholder.style.width = `${this.dotItemWidth}px`; // Restore placeholder width
               placeholder.style.height = `48px`; // Restore placeholder height
               // Optionally, hide the placeholder or mark it as empty
               // placeholder.innerHTML = ''; // This was the previous logic, also works
           }
      });
  
      console.log(`[Carousel] Finished rendering dot window: ${windowStart} to ${windowEnd}.`);
  }

  createDotPlaceholders(totalItems) {
      if (!this.dotContainer) return;
      this.dotContainer.innerHTML = ''; // Clear existing dots
      for (let i = 0; i < totalItems; i++) {
          // Use a placeholder div that has the size of a dot
          const placeholder = $el('div.dot-thumbnail-container', {
              style: {
                  width: `${this.dotItemWidth}px`, // Match expected item width
                  height: `48px`, // Match dot height
                  flexShrink: 0,
                  // Use margin-right to represent gap if gap isn't handled by flexbox gap
                  // style overrides CSS rule's flex-shrink, so add margin-right if needed
                  // marginRight: '10px', // Example if needed
              },
              dataset: { index: i },
          });
          this.dotContainer.appendChild(placeholder);
      }
      console.log(`[Carousel] Created ${totalItems} dot placeholders.`);
  }

  // --- Carousel Setup (Large View) ---
  // Remove the 'pagination' parameter, it's no longer used here
  setupCarousel(allItems, activeIndex) {
    this.element.innerHTML = ''; // Clear existing content
    this.allLargeViewItemsData = allItems; // Store the full list
    // This activeIndex is the index within the *full* list
    this.currentLargeViewIndex = Math.max(0, Math.min(activeIndex, allItems.length - 1));
  
    if (allItems.length === 0) {
        this.currentLargeViewIndex = -1;
        this.showGalleryView(this.currentLargeViewFolder);
        return;
    }

    // If activeIndex was -1 (from empty state), reset to 0
    if (this.currentLargeViewIndex === -1) this.currentLargeViewIndex = 0;
  
    // Calculate the initial window based on the active index
    // This calculation needs to be consistent with showLargeViewFromGallery
    this.dotWindowStartIndex = Math.max(0, this.currentLargeViewIndex - Math.floor(this.dotWindowSize / 2));
    this.dotWindowStartIndex = Math.min(this.dotWindowStartIndex, this.allLargeViewItemsData.length - this.dotWindowSize);
    this.dotWindowStartIndex = Math.max(0, this.dotWindowStartIndex); // Final clamp
  
  
    const initialCounterText = allItems.length > 0 ? `${this.currentLargeViewIndex + 1}/${allItems.length}` : `0/0`;

    // Create the main carousel DOM structure
    const carouselBox = $el("div.comfy-carousel-box", [
      $el("div.slides"), // Slides container will be populated dynamically
      $el("div.dots"),     // Dots container will be populated dynamically
      $el("div.image-counter", initialCounterText),
      // Top-right Buttons
      $el("div.button-container", [
        $el("button.reset-zoom", { innerHTML: resetZoomSVG, onclick: () => this.resetZoom(), title: "Reset Zoom (d)" }),
        $el("button.download", { innerHTML: downloadSVG, onclick: () => this.downloadImage(), title: "Download Item (s)" }),
        $el("button.load", { innerHTML: loadSVG, onclick: () => { this.loadImage(); }, title: "Load Workflow (o)" }),
        $el("button.move", { innerHTML: moveButtonSVG, onclick: () => this.handleMove(), title: "Move Items (m)" }),
        $el("button.gallery", { innerHTML: gallerySVG, onclick: () => this.showGalleryView(this.currentLargeViewFolder, this.currentLargeViewIndex), title: "Back to Gallery (g)" }),
        $el("button.remove", { innerHTML: deleteButtonSVG, onclick: e => this.removeImage(e), title: "Remove Item(s) (Delete)" }),
        $el("button.close", { textContent: "✖", onclick: () => this.close(), title: "Close (Esc)" }),
      ]),
      // Prev/Next Buttons
      $el("button.prev", { textContent: "❮", onclick: e => this.prevSlide(e), title: "Previous (←)" }),
      $el("button.next", { textContent: "❯", onclick: e => this.nextSlide(e), title: "Next (→)" }),
    ]);
    this.element.appendChild(carouselBox);

    
  
    // Get references to the containers
    this.slideContainer = carouselBox.querySelector('.slides');
    this.dotContainer = carouselBox.querySelector('.dots');
    if (this.dotContainer) {
      // Add this block to handle wheel event
      this.dotContainer.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent default scrolling behavior
        this.dotContainer.scrollLeft += e.deltaY; // Scroll horizontally based on vertical wheel movement
      }, { passive: false });
    }
  
  
    // Populate the dot container with *placeholder* elements for the full list size
    this.createDotPlaceholders(this.allLargeViewItemsData.length);
  
    // Populate the slides container with the active slide
    this.updateSlideDisplay(this.currentLargeViewIndex);
  
    // Render the initial window of dots
    this.renderDotWindow();
  
    // Setup Dots container scrolling
    // The scroll handler is now onDotScroll, which manages the window
    if (this.dotContainer && !this._dotsScrollListener) {
        this._dotsScrollListener = this.onDotScroll.bind(this); // Bind and store
        this.dotContainer.addEventListener('scroll', this._dotsScrollListener, { passive: true }); // Use passive
    } else if (this.dotContainer && this._dotsScrollListener) {
         // If already bound, just ensure it's attached (should be if container is new)
         // Or explicitly remove and re-add if container might be reused?
         // Assuming container is new each time setupCarousel is called, attach listener.
         this.dotContainer.addEventListener('scroll', this._dotsScrollListener, { passive: true });
    }
  
  
    // Position the dots container scroll to show the active dot
    this.scrollToDot(this.currentLargeViewIndex, false); // Scroll instantly initially
  
    // Add keydown listener
    document.addEventListener("keydown", this.onKeydown, { capture: true });
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
    document.activeElement?.blur(); // Remove focus from other elements
  
    this.setupSlidesInteraction(this.slideContainer);
    this.updateLargeViewButtonStates(); // Ensure buttons are enabled/disabled correctly
    this.updateImageCounter();
  
    // Trigger lazy loading for the initial slides
    // This might be handled by createSlide/updateSlideDisplay
    // But we might need an observer if slides are created but not immediately visible
    // For simplicity here, createSlide populates the slides div immediately
    // and updateSlideDisplay makes the active one visible.
  }

  scrollToDot(index, smooth = true) {
    const dotPlaceholders = this.dotContainer?.querySelectorAll('.dot-thumbnail-container');
    if (!dotPlaceholders || !dotPlaceholders[index]) return;
  
    const dotElement = dotPlaceholders[index];
    
    // Calculate center position
    const dotLeft = dotElement.offsetLeft;
    const dotWidth = dotElement.offsetWidth;
    const containerWidth = this.dotContainer.clientWidth;
    
    // Scroll to center the dot
    const scrollLeft = dotLeft - (containerWidth / 2) + (dotWidth / 2);
    
    this.dotContainer.scrollTo({
      left: scrollLeft,
      behavior: smooth ? 'smooth' : 'instant'
    });
  
    // Ensure the dot window includes this index
    const windowStart = this.dotWindowStartIndex;
    const windowEnd = this.dotWindowStartIndex + this.dotWindowSize;
    
    if (index < windowStart || index >= windowEnd) {
      this.dotWindowStartIndex = Math.max(0, index - Math.floor(this.dotWindowSize / 2));
      this.dotWindowStartIndex = Math.min(this.dotWindowStartIndex, this.allLargeViewItemsData.length - this.dotWindowSize);
      this.renderDotWindow();
    }
  }

  // --- New method for horizontal loading ---
  setupSlidesInteraction(slidesContainer) {
    // Zooming with Wheel
    slidesContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const activeSlide = this.getActive();
      const mediaElement = activeSlide?.querySelector('img, video');
      if (!mediaElement) return;
      const scaleChange = e.deltaY < 0 ? 1.1 : 0.9; // Zoom in on scroll up, out on scroll down
      const oldScale = this.scale;
      this.scale = Math.max(0.1, Math.min(15, this.scale * scaleChange)); // Clamp scale
      const rect = mediaElement.getBoundingClientRect();
      // Calculate mouse position relative to the element's _visual center_ after scaling
      // This provides a more intuitive zoom-towards-mouse effect
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // Calculate the new translation needed to keep the mouse position fixed relative to the scaled content
      // Formula: newTranslate = mousePos - (mousePos - oldTranslate * oldScale) * (newScale / oldScale)
      // We divide by the new scale at the end for the CSS translate value
      const newTranslateX = mouseX - (mouseX - this.translateX * oldScale) * (this.scale / oldScale);
      const newTranslateY = mouseY - (mouseY - this.translateY * oldScale) * (this.scale / oldScale);
      this.translateX = newTranslateX / this.scale;
      this.translateY = newTranslateY / this.scale;
      this.updateZoom(); // Apply the new transform and clamp bounds
    }, { passive: false });
    // Panning with Drag
    slidesContainer.style.cursor = 'grab';
    let isDragging = false;
    let startX, startY;
    let dragStartX, dragStartY; // Initial translate values at drag start
    slidesContainer.addEventListener('mousedown', (e) => {
      // Only pan if scale is > 1 and not on video controls/buttons
      const target = e.target;
      if (this.scale <= 1 || target.tagName === 'BUTTON' || (target.tagName === 'VIDEO' && e.offsetY > target.clientHeight - 30)) { // Approx height of controls
        // If it's a video and click is likely on controls, let default happen
        if (target.tagName !== 'VIDEO' && target.tagName !== 'BUTTON') e.preventDefault(); // Prevent image ghost drag otherwise
        isDragging = false;
        return;
      }
      e.preventDefault(); // Prevent default drag behavior
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      // Store the _current_ scaled translation for calculation
      dragStartX = this.translateX * this.scale;
      dragStartY = this.translateY * this.scale;
      slidesContainer.style.cursor = 'grabbing';
      slidesContainer.style.userSelect = 'none';
    });
    slidesContainer.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Calculate the target _scaled_ translation
      const targetScaledX = dragStartX + dx;
      const targetScaledY = dragStartY + dy;
      // Apply bounds _before_ converting back to unscaled translate
      const activeMedia = this.getActive()?.querySelector('img, video');
      if (!activeMedia) return;
      // We need the container dimensions and media dimensions respecting 'contain'
      const containerRect = slidesContainer.getBoundingClientRect();
      // Use clientWidth/Height as fallback if natural/video dims aren't ready
      let mediaWidth = activeMedia.naturalWidth || activeMedia.videoWidth || activeMedia.clientWidth;
      let mediaHeight = activeMedia.naturalHeight || activeMedia.videoHeight || activeMedia.clientHeight;
      if (!mediaWidth || !mediaHeight || !containerRect.width || !containerRect.height) return; // Avoid errors if dimensions are zero
      // Calculate displayed dimensions based on 'contain'
      const containerRatio = containerRect.width / containerRect.height;
      const mediaRatio = mediaWidth / mediaHeight;
      let displayedWidth, displayedHeight;
      if (containerRatio > mediaRatio) { // Limited by height
        displayedHeight = containerRect.height;
        displayedWidth = displayedHeight * mediaRatio;
      } else { // Limited by width
        displayedWidth = containerRect.width;
        displayedHeight = displayedWidth / mediaRatio;
      }
      const scaledWidth = displayedWidth * this.scale;
      const scaledHeight = displayedHeight * this.scale;
      // Calculate max _scaled_ translation offsets
      const maxScaledX = Math.max(0, (scaledWidth - containerRect.width) / 2);
      const maxScaledY = Math.max(0, (scaledHeight - containerRect.height) / 2);
      // Clamp the target _scaled_ translation
      const clampedScaledX = Math.max(-maxScaledX, Math.min(maxScaledX, targetScaledX));
      const clampedScaledY = Math.max(-maxScaledY, Math.min(maxScaledY, targetScaledY));
      // Convert the _clamped scaled_ translation back to unscaled for CSS
      this.translateX = clampedScaledX / this.scale;
      this.translateY = clampedScaledY / this.scale;
      this.updateZoom(); // Apply transform immediately
    });
    const stopDragging = (e) => {
      if (isDragging) {
        isDragging = false;
        slidesContainer.style.cursor = 'grab';
        slidesContainer.style.userSelect = '';
      }
    };
    slidesContainer.addEventListener('mouseup', stopDragging);
    slidesContainer.addEventListener('mouseleave', stopDragging);
    // Also stop dragging if mouse leaves the window entirely
    window.addEventListener('blur', stopDragging); // Optional: more robust handling
    // Cleanup listener when carousel closes (handled in close method)
  }
  updateZoom() { // Applies transform to the _active media element_ and clamps bounds
    const activeSlide = this.getActive();
    const mediaElement = activeSlide?.querySelector('img, video');
    const slidesContainer = this.element.querySelector('.slides'); // Get container
    if (mediaElement && slidesContainer) {
      const containerRect = slidesContainer.getBoundingClientRect();
      // Use clientWidth/Height as fallback if natural/video dims aren't ready
      let mediaWidth = mediaElement.naturalWidth || mediaElement.videoWidth || mediaElement.clientWidth;
      let mediaHeight = mediaElement.naturalHeight || mediaElement.videoHeight || mediaElement.clientHeight;
      if (!mediaWidth || !mediaHeight || !containerRect.width || !containerRect.height) {
        // Dimensions not available yet, maybe apply default transform?
        mediaElement.style.transform = `scale(${this.scale}) translate(0px, 0px)`;
        return;
      }
      // Calculate displayed dimensions respecting 'contain'
      const containerRatio = containerRect.width / containerRect.height;
      const mediaRatio = mediaWidth / mediaHeight;
      let displayedWidth, displayedHeight;
      if (containerRatio > mediaRatio) { // Limited by height
        displayedHeight = containerRect.height;
        displayedWidth = displayedHeight * mediaRatio;
      } else { // Limited by width
        displayedWidth = containerRect.width;
        displayedHeight = displayedWidth / mediaRatio;
      }
      // Calculate max translation in _unscaled_ coordinates
      // Max offset = (Scaled Size - Container Size) / 2 / Scale
      const maxX = Math.max(0, (displayedWidth * this.scale - containerRect.width) / (2 * this.scale));
      const maxY = Math.max(0, (displayedHeight * this.scale - containerRect.height) / (2 * this.scale));
      // Clamp the current translateX/Y based on these calculated bounds
      this.translateX = Math.max(-maxX, Math.min(maxX, this.translateX));
      this.translateY = Math.max(-maxY, Math.min(maxY, this.translateY));
      // Apply the clamped transform
      mediaElement.style.transformOrigin = 'center center';
      mediaElement.style.transform = `scale(${this.scale}) translate(${this.translateX}px, ${this.translateY}px)`;
    }
  }
  resetZoom() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateZoom(); // Apply the reset transform
  }
  // --- Gallery View Methods ---
  // imagegallery.js (Partial - paste these functions into your ComfyCarousel class)
  async loadGalleryImages(e, loadPage = 1) {
    // Hide large view if showing
    const carouselBox = this.element.querySelector('.comfy-carousel-box');
    if (carouselBox) {
      carouselBox.classList.add('large-view-hidden');
    }
    // Stop propagation if it's an event from a click
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    // Determine the subfolder to load
    const rawSubfolder = (e && e.target && e.target.dataset.subfolder !== undefined)
      ? e.target.dataset.subfolder
      : this.currentGallerySubfolder; // Use current if not specified by event
    const subfolder = (rawSubfolder || '').replace(/\\/g, '/');
    const isNewFolder = subfolder !== this.currentGallerySubfolder;
    // Reset state ONLY if loading a new folder
    if (isNewFolder) {
      console.log(`[Gallery] Loading new folder: '${subfolder}'`);
      this.currentGalleryPage = 1; // Reset page
      this.totalGalleryPages = 1; // Reset total pages
      this.totalGalleryItems = 0; // Reset total items
      this.currentGallerySubfolder = subfolder; // Update current folder _before_ clearing
      this.clearGalleryView(); // Clear DOM and listeners for the old folder
      this.isLoadingMoreGalleryItems = false; // Ensure loading flag is reset
    } else {
      // Loading next page of the same folder
      // REMOVE or COMMENT OUT this check:
      // if (loadPage <= this.currentGalleryPage && this.element.querySelector('.gallery-container')) {
      //   console.log(`[Gallery] Already loaded or loading page ${loadPage}. Skipping request.`);
      //   this.currentGalleryPage = loadPage; // Update page number state even if skipping? Probably not needed if we skip.
      //   this.showLoadingIndicator(false);
      //   return;
      // }
      // The check `if (this.isLoadingMoreGalleryItems || this.currentGalleryPage >= this.totalGalleryPages)`
      // in the scroll listener already prevents redundant/beyond-end loads.
      // So, if we reach here in the else block, it means we are loading a valid next page.
      this.currentGalleryPage = loadPage; // <--- This line should now always execute in the else block
      console.log(`[Gallery] Loading page ${loadPage} for folder: '${subfolder}'`);
    }
    if (this.isLoadingMoreGalleryItems) {
      console.log("[Gallery] Already loading more items, skipping new fetch request.");
      this.showLoadingIndicator(true); // Ensure indicator is shown if another load is in progress
      return;
    }
    this.isLoadingMoreGalleryItems = true;
    this.showLoadingIndicator(true); // Ensure indicator is shown before fetch
    const fetchUrl = `/gallery/images?subfolder=${encodeURIComponent(subfolder)}&page=${this.currentGalleryPage}&per_page=${this.itemsPerGalleryPage}`;
    console.log(`[Gallery] Fetching: ${fetchUrl}`);
    try {
      const response = await fetch(fetchUrl);
      console.log(`[Gallery] Fetch response status: ${response.status}`);
      if (!response.ok) {
        // Log the error response text if possible
        let errorText = await response.text();
        console.error(`[Gallery] Fetch error response text: ${errorText}`);
        throw new Error(`Failed to load gallery items: ${response.statusText} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log("[Gallery] Data received:", data);
      if (!data || !Array.isArray(data.items)) { // Check if items is an array
        throw new Error("Invalid data structure received from server (missing or invalid 'items').");
      }
      console.log(`[Gallery] Received ${data.items.length} items for page ${this.currentGalleryPage}. Total items: ${data.total_items}, Total pages: ${data.total_pages}`);

      // Update pagination state based on backend response (important for total pages/items)
      this.totalGalleryItems = data.total_items;
      this.totalGalleryPages = data.total_pages;
      this.itemsPerGalleryPage = data.per_page; // <--- Also update per_page from backend

      // --- Get or Create UI Elements ---
      // --- Declare variables outside the if/else block ---
      let galleryContainer, galleryHeaderWrapper, galleryHeader, breadcrumbContainer, buttonContainer, sizeSlider, closeButton, storedSize;
      console.log("[Gallery] Checking existing UI elements. Container exists:", !!this.element.querySelector('.gallery-container')); // Keep initial check log
      // --- Create UI Elements IF loading page 1 or they don't exist ---
      if (this.currentGalleryPage === 1 || !this.element.querySelector('.gallery-container')) {
        console.log("[Gallery] Creating new gallery UI elements for page 1 or missing state.");
        // Clear existing elements if necessary (handles new folder or initial load into empty state)
        this.clearGalleryView();
        // --- Create UI Elements ---
        // 1. Gallery Header Wrapper (Fixed, full-width)
        galleryHeaderWrapper = $el("div.gallery-header-wrapper");
        // 2. Gallery Header (Centered, flex container for breadcrumb and close)
        galleryHeader = $el("div.gallery-header");
        // 3. Breadcrumb
        breadcrumbContainer = this.createBreadcrumb(data.current_folder, data.total_items);
        galleryHeader.appendChild(breadcrumbContainer); // Append breadcrumb TO galleryHeader
        console.log("[Gallery] Breadcrumb created and appended to header.");
        // 4. Close button for the whole gallery view
        closeButton = $el("button.close-gallery", {
          innerHTML: '×', // Use times symbol
          onclick: () => this.close(),
          title: "Close Gallery (Esc)"
        });
        galleryHeader.appendChild(closeButton); // Append close button TO galleryHeader
        console.log("[Gallery] Close button created and appended to header.");
        // Append inner header to wrapper
        galleryHeaderWrapper.appendChild(galleryHeader);
        // 5. Gallery Container (The scrolling grid)
        galleryContainer = $el("div.gallery-container");
        storedSize = localStorage.getItem('galleryImageSize') || '150';
        galleryContainer.style.setProperty('--image-size', `${storedSize}px`);
        galleryContainer.classList.add('show'); // Make it visible (CSS opacity transition)
        console.log("[Gallery] Gallery container created.");
        // 6. Size Slider (Fixed at bottom)
        sizeSlider = this.createSizeSlider(storedSize, galleryContainer);
        console.log("[Gallery] Size slider created.");
        // 7. Button Container (Fixed at bottom right)
        buttonContainer = this.createGalleryButtonContainer(galleryContainer, breadcrumbContainer);
        console.log("[Gallery] Gallery button container created.");
        // --- Append UI Elements to main carousel element ---
        this.element.appendChild(galleryHeaderWrapper);
        this.element.appendChild(galleryContainer);
        this.element.appendChild(sizeSlider);
        this.element.appendChild(buttonContainer);
        console.log("[Gallery] All main UI elements appended to carousel.");
        // Add scroll listener for infinite loading (only once per gallery view creation)
        this.setupInfiniteScroll(galleryContainer);
        console.log("[Gallery] Infinite scroll setup.");
      } else {
        console.log("[Gallery] Appending items to existing UI elements.");
        // If appending to existing, make sure we have references to buttonContainer and breadcrumbContainer
        galleryContainer = this.element.querySelector('.gallery-container'); // Get existing container
        breadcrumbContainer = this.element.querySelector('.breadcrumb-container'); // Get existing breadcrumb
        buttonContainer = this.element.querySelector('.gallery-button-container'); // Get existing buttons
        // Ensure breadcrumb count is updated on subsequent pages if total items changes
        if (breadcrumbContainer) {
          this.updateImageCount(breadcrumbContainer, galleryContainer, data.total_items);
        }
        // Ensure the 'show' class is present even if appending to existing
        if (galleryContainer && !galleryContainer.classList.contains('show')) {
          galleryContainer.classList.add('show');
          console.log("[Gallery] Ensured 'show' class is on existing gallery container.");
        }
      }
      // --- Append Items to Gallery Container ---
      console.log("[Gallery] Attempting to append items to gallery container...");
      // Ensure galleryContainer exists before appending
      if (galleryContainer) {
        this.appendGalleryItems(galleryContainer, data.items);
        console.log("[Gallery] Finished appendGalleryItems.");
      } else {
        console.error("[Gallery] Gallery container is null after creation/selection logic. Cannot append items.");
      }
      // --- Update UI States ---
      // This is done after appending items in case it relies on the number of items in the DOM
      this.updateImageCount(breadcrumbContainer, galleryContainer, data.total_items);
      console.log("[Gallery] Updated image count (post-append).");
      // Ensure gallery container is visible and potentially fade in
      // if (galleryContainer) {
      //   setTimeout(() => galleryContainer.classList.add('show'), 0);
      //   console.log("[Gallery] Applied 'show' class to gallery container.");
      // }
      // Re-apply selection mode styles if active
      if (this.isSelectionMode) {
        console.log("[Gallery] Re-applying selection styles.");
        this.applySelectionStyles(galleryContainer);
      }
      this.updateGalleryButtonVisibility(galleryContainer, buttonContainer); // Update delete/move visibility
      console.log("[Gallery] Updated button visibility.");
      // If no items were returned and it's the first page, show message
      // Check total_items from data, not just data.items.length
      if (this.currentGalleryPage === 1 && data.total_items === 0) {
        console.log("[Gallery] Folder is empty, showing message.");
        const emptyFolderSVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--cg-accent-primary); opacity: 0.8;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9" y1="13" x2="15" y2="13"></line></svg>`;
        const noItemsMsg = $el("div.no-images", [
          $el("div.no-images-icon", { innerHTML: emptyFolderSVG }),
          $el("span.no-images-text", "This folder is empty.")
        ]);
        // Remove any existing messages first
        galleryContainer?.querySelectorAll('.no-images').forEach(msg => msg.remove());
        galleryContainer?.appendChild(noItemsMsg);
      }
    } catch (error) {
      console.error("[Gallery] Error in loadGalleryImages:", error); // Log the caught error object
      alert(`Failed to load gallery: ${error.message}`);
      // Display error in the UI
      const galleryContainer = this.element.querySelector('.gallery-container');
      if (galleryContainer) {
        console.log("[Gallery] Displaying error in gallery container.");
        galleryContainer.innerHTML = ''; // Clear potentially partial content
        galleryContainer.appendChild($el("div.no-images", { // Re-use no-images style for error
          textContent: `Error loading gallery: ${error.message}`,
          style: { color: '#ff8a80' } // Error color
        }));
      }
    } finally {
      this.isLoadingMoreGalleryItems = false;
      this.showLoadingIndicator(false); // Hide loading indicator
      console.log("[Gallery] loadGalleryImages finally block finished.");
      setTimeout(() => this.checkAutoLoadNextPage(), 100);
    }
    // Return container for potential chaining/reference
    return this.element.querySelector('.gallery-container');
  }
  appendGalleryItems(galleryContainer, items) {
    if (!galleryContainer) {
        console.error("[Gallery] appendGalleryItems called without a valid container.");
        return;
      }
      if (!items || items.length === 0) {
        console.log("[Gallery] No items to append.");
        // Don't remove loading indicator here, let loadGalleryImages handle it
        return;
      }
      console.log(`[Gallery] Appending ${items.length} items to gallery container.`);

      // --- CHANGE 'const' to 'let' here ---
      let loadingIndicator = galleryContainer.querySelector('.gallery-loading-indicator');
      // ----------------------------------

      // Ensure the loading indicator exists and is at the end before appending
      if (this.currentGalleryPage < this.totalGalleryPages && this.totalGalleryPages > 1) {
        if (!loadingIndicator || loadingIndicator.parentNode !== galleryContainer) {
          console.log("[Gallery] Loading indicator missing or misplaced. Re-creating/re-appending.");
          loadingIndicator?.remove(); // Remove the old element if it existed
          // Now this reassignment is valid because loadingIndicator is 'let'
          loadingIndicator = this.createLoadingIndicator();
          galleryContainer.appendChild(loadingIndicator); // Ensure it's at the end
        } else {
          // If it exists and is in the right place, just ensure it's the last child for insertBefore logic
          galleryContainer.appendChild(loadingIndicator);
        }
      } else if (loadingIndicator) {
        // If all pages are loaded or total pages is 1, remove any existing indicator
        console.log("[Gallery] All pages loaded or only one page exists, removing loading indicator.");
        loadingIndicator.remove();
        // This reassignment is also now valid
        // loadingIndicator = null; // This line is actually unnecessary, removing from DOM is enough, but valid with 'let'
        // Also check for any lingering 'No items' message and remove it
        galleryContainer.querySelectorAll('.no-images').forEach(msg => msg.remove());
      }
    items.forEach((item, index) => {
      let element = null; // Initialize element to null
      try { // Add try-catch around element creation loop
        console.debug(`[Gallery] Appending item ${index + 1}/${items.length}: Type='${item.type}', Name='${item.name || item.filename}'`);
        // --- Inside appendGalleryItems function ---
        // In appendGalleryItems function, when creating folder buttons:
        if (item.type === 'folder') {
          // Create folder button with SVG icon using innerHTML
          const button = document.createElement('button');
          button.className = 'folder-button';
          const normSubfolder = (item.subfolder || '').replace(/\\/g, '/');
          button.dataset.subfolder = normSubfolder ? `${normSubfolder}/${item.name}` : item.name;
          button.dataset.name = item.name;
          button.dataset.type = 'folder';
          button.title = `Folder: ${item.name}`;

          button.addEventListener('click', (e) => {
            e.stopPropagation(); // Keep this line to prevent event bubbling beyond the button
            this.handleGalleryItemClick(e, button); // Change this line to call the main handler
          });

          // SVG as string with proper namespace
          button.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(1.4065934065934016 1.4065934065934016) scale(1 1)">
                <path d="M 86.351 17.027 H 35.525 c -1.909 0 -3.706 -0.903 -4.846 -2.435 l -2.457 -3.302 c -0.812 -1.092 -2.093 -1.735 -3.454 -1.735 H 3.649 C 1.634 9.556 0 11.19 0 13.205 V 29.11 c 0 -2.015 1.634 -1.649 3.649 -1.649 h 82.703 c 2.015 0 3.649 -0.366 3.649 1.649 v -8.435 C 90 18.661 88.366 17.027 86.351 17.027 z" fill="rgb(48,168,249)"/>
                <path d="M 86.351 80.444 H 3.649 C 1.634 80.444 0 78.81 0 76.795 V 29.11 c 0 -2.015 1.634 -3.649 3.649 -3.649 h 82.703 c 2.015 0 3.649 1.634 3.649 3.649 v 47.685 C 90 78.81 88.366 80.444 86.351 80.444 z" fill="rgb(42,152,234)"/>
            </g>
        </svg>
        <span class="folder-text">${item.name}</span>
    `;

          element = button;
        } else if (item.type === 'image' || item.type === 'video') {
            const isVideoExt = (u) => u && /\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)(\?.*)?$/i.test(u);
            let mediaSrc = item.thumbnail_url;
            if (!mediaSrc || isVideoExt(mediaSrc)) {
                if (item.type === 'video') {
                    mediaSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\' viewBox=\'0 0 128 128\'%3E%3Crect width=\'128\' height=\'128\' fill=\'%2318181f\' rx=\'10\'/%3E%3Ccircle cx=\'64\' cy=\'64\' r=\'24\' fill=\'%232d2d38\'/%3E%3Cpolygon points=\'58,52 76,64 58,76\' fill=\'%23a78bfa\'/%3E%3C/svg%3E';
                } else {
                    mediaSrc = item.url;
                }
            }
            const img = document.createElement('img');
            img.src = mediaSrc;
            img.loading = 'lazy';
            img.alt = item.filename;
            img.dataset.originalSrc = item.url; // Store original URL
            img.draggable = false;
            
            // In your image creation code, replace the onerror handler with this robust version:
            img.onerror = function() {
                if (item.type === 'video') {
                    this.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\' viewBox=\'0 0 128 128\'%3E%3Crect width=\'128\' height=\'128\' fill=\'%2318181f\' rx=\'10\'/%3E%3Ccircle cx=\'64\' cy=\'64\' r=\'24\' fill=\'%232d2d38\'/%3E%3Cpolygon points=\'58,52 76,64 58,76\' fill=\'%23a78bfa\'/%3E%3C/svg%3E';
                } else {
                    console.warn(`Error loading thumbnail: ${this.src}`);
                    this.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23555\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dy=\'.3em\' fill=\'%23ccc\' text-anchor=\'middle\' font-size=\'10\'%3EError%3C/text%3E%3C/svg%3E';
                }
                this.style.objectFit = 'contain'; // Ensure proper display of fallback
                this.style.backgroundColor = '#333'; // Add background for better visibility
            };
        
            const children = [img];
            
            // Add this block to show play button for GIFs
            if (item.type === 'video' || (item.type === 'image' && item.filename.toLowerCase().endsWith('.gif'))) {
                const videoOverlay = document.createElement('div');
                videoOverlay.className = 'video-overlay';
                children.push(videoOverlay);
            }
        
            // Create container with explicit dataset
            const container = document.createElement('div');
            container.className = 'gallery-item-container';
            container.dataset.type = item.type;
            container.dataset.url = item.url; // This is crucial
            container.dataset.filename = item.filename;
            container.dataset.subfolder = (item.subfolder || '').replace(/\\/g, '/');
            container.title = `${item.type}: ${item.filename}\nClick to view, Shift+Click to range select`;
            container.draggable = false;
            
            // For image/video containers
            container.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleGalleryItemClick(e, container);
            });
        
            children.forEach(child => container.appendChild(child));
            element = container;
        } else {
          console.warn("[Gallery] Unknown item type received:", item);
          // Add a placeholder for unknown types for visibility
          element = $el('div.gallery-item-container', {
            style: { backgroundColor: '#ff8a80', color: 'black', padding: '10px', textAlign: 'center' },
            textContent: `Unknown: ${item.name || item.filename}`,
            title: `Unknown item type: ${item.type}`
          });
        }
        if (element) {
          // Append before the loading indicator if it exists, otherwise just append
          if (loadingIndicator && loadingIndicator.parentNode === galleryContainer) {
            galleryContainer.insertBefore(element, loadingIndicator);
          } else {
            galleryContainer.appendChild(element);
          }
        }
      } catch (domError) {
        console.error("[Gallery] Error creating or appending element for item:", item, domError);
      }
    });
    console.log(`[Gallery] Finished appending loop. Appended ${items.length} items this page.`);
    if (loadingIndicator && this.currentGalleryPage < this.totalGalleryPages) {
      if (loadingIndicator.parentNode !== galleryContainer) {
        console.warn("[Gallery] Loading indicator detached after loop? Re-appending.");
        galleryContainer.appendChild(loadingIndicator);
      }
    } else if (loadingIndicator && loadingIndicator.parentNode === galleryContainer) {
      console.log("[Gallery] All pages loaded, removing loading indicator.");
      loadingIndicator.remove();
      galleryContainer.querySelectorAll('.no-images').forEach(msg => msg.remove());
    }
  }
  clearGalleryView() {
    const galleryHeaderWrapper = this.element.querySelector('.gallery-header-wrapper');
    const galleryContainer = this.element.querySelector('.gallery-container');
    const sizeSlider = this.element.querySelector('.gallery-size-slider');
    const galleryButtonContainer = this.element.querySelector('.gallery-button-container');

    if (galleryContainer && this.galleryScrollListener) {
      galleryContainer.removeEventListener('scroll', this.galleryScrollListener);
      this.galleryScrollListener = null;
    }
    if (this.galleryResizeListener) {
      window.removeEventListener('resize', this.galleryResizeListener);
      this.galleryResizeListener = null;
    }
    if (this.galleryObserver) {
      this.galleryObserver.disconnect();
      this.galleryObserver = null;
    }

    // Remove all gallery-specific elements
    galleryHeaderWrapper?.remove();
    galleryContainer?.remove();
    sizeSlider?.remove();
    galleryButtonContainer?.remove();

    console.log("[Gallery] Cleared gallery specific UI elements.");
    this.isSelectionMode = false;
    this.lastSelectedIndex = -1;
  }
  createLoadingIndicator() {
    return $el("div.gallery-loading-indicator", [
      $el("div.gallery-spinner")
    ]);
  }
  setupInfiniteScroll(galleryContainer) {
    if (!galleryContainer) return;
    
    if (this.galleryScrollListener) {
      galleryContainer.removeEventListener('scroll', this.galleryScrollListener);
    }
    if (this.galleryResizeListener) {
      window.removeEventListener('resize', this.galleryResizeListener);
    }
    if (this.galleryObserver) {
      this.galleryObserver.disconnect();
      this.galleryObserver = null;
    }

    const checkLoad = () => {
      if (this.isLoadingMoreGalleryItems || this.currentGalleryPage >= this.totalGalleryPages) {
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = galleryContainer;
      // Load next page if content fits within height (scrollHeight <= clientHeight) or near bottom
      if (scrollHeight <= clientHeight || (scrollHeight - scrollTop - clientHeight < clientHeight * 1.5)) {
        console.log(`[Gallery] Scroll threshold reached. Loading page ${this.currentGalleryPage + 1}`);
        this.loadGalleryImages(null, this.currentGalleryPage + 1);
      }
    };

    let scrollTimeout;
    this.galleryScrollListener = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkLoad, 100);
    };
    galleryContainer.addEventListener('scroll', this.galleryScrollListener, { passive: true });

    this.galleryResizeListener = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkLoad, 200);
    };
    window.addEventListener('resize', this.galleryResizeListener);

    if ('IntersectionObserver' in window) {
      this.galleryObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          console.log("[Gallery] Loading indicator intersected viewport. Checking next page load.");
          checkLoad();
        }
      }, {
        root: galleryContainer,
        rootMargin: '300px 0px',
        threshold: 0
      });
    }

    this.updateObserverTarget(galleryContainer);

    setTimeout(checkLoad, 150);
  }
  updateObserverTarget(galleryContainer) {
    if (!this.galleryObserver || !galleryContainer) return;
    this.galleryObserver.disconnect();
    const indicator = galleryContainer.querySelector('.gallery-loading-indicator');
    if (indicator && this.currentGalleryPage < this.totalGalleryPages) {
      this.galleryObserver.observe(indicator);
    }
  }
  checkAutoLoadNextPage() {
    const galleryContainer = this.element?.querySelector('.gallery-container');
    if (!galleryContainer || this.isLoadingMoreGalleryItems || this.currentGalleryPage >= this.totalGalleryPages) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = galleryContainer;
    if (scrollHeight <= clientHeight || (scrollHeight - scrollTop - clientHeight < clientHeight * 1.5)) {
      console.log(`[Gallery] Auto-loading page ${this.currentGalleryPage + 1} (large screen / unfilled container).`);
      this.loadGalleryImages(null, this.currentGalleryPage + 1);
    }
  }
  showLoadingIndicator(show) {
    let indicator = this.element.querySelector('.gallery-loading-indicator');
    const galleryContainer = this.element.querySelector('.gallery-container');
    if (show) {
      if (!indicator && galleryContainer && this.currentGalleryPage < this.totalGalleryPages) {
        indicator = this.createLoadingIndicator();
        galleryContainer.appendChild(indicator);
      }
      if (indicator) {
        indicator.classList.add('visible');
        this.updateObserverTarget(galleryContainer);
      }
    } else {
      if (indicator) indicator.classList.remove('visible');
    }
  }
  createBreadcrumb(currentFolder, totalItems) {
    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.className = 'breadcrumb-container';

    const breadcrumbNav = document.createElement('div');
    breadcrumbNav.className = 'breadcrumb-navigation';

    // Home Button
    const homeButton = document.createElement('button');
    homeButton.textContent = 'Home';
    homeButton.dataset.subfolder = '';
    homeButton.title = "Go to Root Folder";
    homeButton.addEventListener('click', (e) => {
      this.loadGalleryImages({
        target: {
          dataset: {
            subfolder: e.currentTarget.dataset.subfolder
          }
        }
      }, 1);
    });
    breadcrumbNav.appendChild(homeButton);

    // Path Segments
    let pathAccumulator = '';
    const normalizedFolder = (currentFolder || '').replace(/\\/g, '/');
    normalizedFolder.split('/').filter(Boolean).forEach(segment => {
      pathAccumulator += (pathAccumulator ? '/' : '') + segment;

      const button = document.createElement('button');
      button.textContent = segment;
      button.dataset.subfolder = pathAccumulator;
      button.title = `Go to Folder: ${segment}`;
      button.addEventListener('click', (e) => {
        this.loadGalleryImages({
          target: {
            dataset: {
              subfolder: e.currentTarget.dataset.subfolder
            }
          }
        }, 1);
      });
      breadcrumbNav.appendChild(button);
    });

    // Jump to Today Button
    const jumpButton = document.createElement('button');
    jumpButton.className = 'jump-to-today';
    jumpButton.textContent = 'Today';
    jumpButton.title = "Jump to Today's Folder";
    jumpButton.addEventListener('click', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayPath = `${year}/${month}/${day}`;
      this.loadGalleryImages({
        target: {
          dataset: {
            subfolder: todayPath
          }
        }
      }, 1);
    });

    // Item Count Display
    const imageCount = document.createElement('span');
    imageCount.className = 'image-count';
    imageCount.textContent = `${totalItems} items`;

    // Assemble components
    breadcrumbContainer.appendChild(breadcrumbNav);
    breadcrumbContainer.appendChild(jumpButton);
    breadcrumbContainer.appendChild(imageCount);

    return breadcrumbContainer;
  }
  updateImageCount(breadcrumbContainer, galleryContainer, totalItems) {
    const imageCountSpan = breadcrumbContainer?.querySelector('.image-count');
    if (!imageCountSpan || !galleryContainer) return;
    const loadedItemCount = galleryContainer.querySelectorAll('.gallery-item-container, .folder-button').length;
    const selectedCount = galleryContainer.querySelectorAll('.selected').length;
    if (this.isSelectionMode && selectedCount > 0) {
      imageCountSpan.textContent = `${selectedCount} selected / ${totalItems} total`;
    } else if (this.currentGalleryPage < this.totalGalleryPages) {
      imageCountSpan.textContent = `Loaded ${loadedItemCount} of ${totalItems}`;
    } else {
      // If all pages loaded or only one page exists
      imageCountSpan.textContent = `${totalItems} items`;
    }
  }
  cancelDeleteConfirmation() {
    const deleteButton = this.element.querySelector('.gallery-button-container .remove');
    // Only do something if the button and confirmation state indicate it's needed
    if (!deleteButton || !this.deleteConfirmActive) {
      return;
    }

    console.log("[Gallery] Cancelling delete confirmation.");

    // Clear the timeout
    if (this.deleteConfirmTimeout) {
      clearTimeout(this.deleteConfirmTimeout);
      this.deleteConfirmTimeout = null;
      console.log("[Gallery] Cleared delete confirmation timeout.");
    }

    // Remove the click listener if it was added
    if (this.clickHandler && this._clickListenerAdded) {
      document.removeEventListener('click', this.clickHandler, true); // Use capture: true
      this._clickListenerAdded = false;
      this.clickHandler = null; // Clear the reference
      console.log("[Gallery] Removed click-away listener.");
    }

    // Reset button appearance
    if (deleteButton.textContent === 'Confirm?') { // Check current text before changing
      deleteButton.innerHTML = deleteButtonSVG; // Revert to original icon
      deleteButton.style.width = ''; // Reset custom width
      deleteButton.title = 'Delete Selected (Del)';
      console.log("[Gallery] Reset delete button appearance.");
    }

    // Reset the state flag
    this.deleteConfirmActive = false;
  }
  createGalleryButtonContainer(galleryContainer, breadcrumbContainer) {
    const buttonContainer = $el('div.gallery-button-container.button-container'); // Specific class + common
    // --- Define Buttons ---
    const deleteButton = $el('button.remove', { innerHTML: deleteButtonSVG, style: { display: 'none' }, title: 'Delete Selected (Del)' });
    const moveButton = $el('button.move', { innerHTML: moveButtonSVG, style: { display: 'none' }, title: 'Move Selected (m)' });
    const selectButton = $el('button.select-images', { innerHTML: selectSVG, title: 'Toggle Selection Mode (s)' });
    const newFolderButton = $el('button.new-folder', { innerHTML: newFolderSVG, title: 'Create New Folder (n)' });
    const reloadButton = $el('button.reload-gallery', { innerHTML: reloadSVG, title: 'Reload Gallery (r)' });
    const scrollToTopButton = $el('button.scroll-to-top', { innerHTML: scrollToTopSVG, title: 'Scroll To Top (Home)' });
    // --- Add Event Listeners ---
    let confirmDelete = false; // State for delete confirmation
    this.handleDelete = async () => {
      const deleteButton = this.element.querySelector('.gallery-button-container .remove');
      if (!deleteButton) return; // Safety check

      // Define the click handler function ONCE, associated with the class instance
      // This handler will be used to cancel confirmation if a click happens outside the button
      if (!this.clickHandler) { // Define it only the first time handleDelete is called
        this.clickHandler = (e) => {
          // Check if the click was outside the delete button area
          if (!deleteButton.contains(e.target)) {
            this.cancelDeleteConfirmation();
          }
        };
      }


      if (!this.deleteConfirmActive) {
        // --- Enter confirmation mode ---
        console.log("[Gallery] Entering delete confirmation mode.");
        deleteButton.innerHTML = 'Confirm?'; // Change button text
        deleteButton.style.width = 'auto';    // Adjust width for text
        deleteButton.title = 'Confirm Delete';
        this.deleteConfirmActive = true;      // Set state flag

        // Add click-away listener
        // Use capture: true to ensure this listener runs before others on the document
        // Add a small delay to prevent the *same* click that triggered handleDelete
        // from immediately triggering the click-away handler.
        if (!this._clickListenerAdded) {
          setTimeout(() => {
            // Check if confirmation is still active after the timeout before adding listener
            if (this.deleteConfirmActive && !this._clickListenerAdded) {
              document.addEventListener('click', this.clickHandler, true); // Add with capture: true
              this._clickListenerAdded = true; // Set flag
              console.log("[Gallery] Added click-away listener for delete confirmation.");
            } else {
              // State changed before listener could be added (e.g., user pressed Del/Backspace again quickly)
              console.log("[Gallery] Confirmation state changed before listener timeout, not adding click listener.");
            }
          }, 10); // 10ms delay

        } else {
          console.log("[Gallery] Click-away listener already added (shouldn't happen in normal flow?).");
          // If somehow already added, ensure timeout is still valid
          if (!this.deleteConfirmTimeout) {
            // Re-add timeout if missing? Or just log warning?
            console.warn("[Gallery] Click listener added but timeout missing. Resetting timeout.");
            this.deleteConfirmTimeout = setTimeout(() => {
              console.log("[Gallery] Delete confirmation timed out (re-added timeout).");
              this.cancelDeleteConfirmation();
            }, 3500);
          }
        }

        // Auto-reset after timeout
        if (!this.deleteConfirmTimeout) { // Only set if not already active
          this.deleteConfirmTimeout = setTimeout(() => {
            console.log("[Gallery] Delete confirmation timed out.");
            this.cancelDeleteConfirmation();
          }, 3500);
        }


      } else {
        // --- Already confirming - proceed with actual deletion ---
        console.log("[Gallery] Confirming delete action - executing deletion logic.");

        // Before proceeding, immediately remove the click listener and timeout
        // This prevents them from interfering or triggering after deletion
        this.cancelDeleteConfirmation(); // This helper now handles cleanup

        // ... your existing deletion logic goes here ...
        const selectedElements = this.element.querySelectorAll('.gallery-container .selected');
        // ... (logic to get itemsToDelete from selectedElements) ...
        const itemsToDelete = Array.from(selectedElements).map(item => {
          if (item.classList.contains('folder-button')) {
            const name = item.dataset.name;
            const fullPath = (item.dataset.subfolder || '').replace(/\\/g, '/');
            const lastSlash = fullPath.lastIndexOf('/');
            const parentSubfolder = lastSlash !== -1 ? fullPath.substring(0, lastSlash) : '';
            return { type: 'folder', subfolder: parentSubfolder, name: name };
          } else if (item.classList.contains('gallery-item-container')) {
            const filename = item.dataset.filename;
            const subfolder = item.dataset.subfolder || '';
            return filename ? { type: item.dataset.type, subfolder: subfolder, name: filename } : null; // Capture type (image/video)
          } return null;
        }).filter(Boolean);

        if (itemsToDelete.length === 0) {
          console.warn("No items selected for deletion confirmation click.");
          // Should not happen if the button was visible, but safe check
          alert("No items selected to delete.");
          return;
        }

        console.log("Attempting to delete:", itemsToDelete);
        let failedDeletions = 0;
        let deletedCount = 0;

        // Asynchronous deletion loop
        const galleryContainer = this.element.querySelector('.gallery-container'); // Get container reference

        for (const item of itemsToDelete) {
          try {
            let endpoint = item.type === 'folder' ? '/gallery/folder/remove' : '/gallery/image/remove'; // Use image/remove for both image/video
            let bodyParams = { type: 'output', subfolder: item.subfolder };
            if (item.type === 'folder') bodyParams.foldername = item.name;
            else bodyParams.filename = item.name;

            console.log(`[Gallery] Sending DELETE request for ${item.type}: ${item.subfolder}/${item.name}`);
            const response = await fetch(endpoint, {
              method: "POST",
              body: new URLSearchParams(bodyParams),
              headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (!response.ok && response.status !== 404) {
              // Log the error response body
              const errorBody = await response.text();
              console.error(`[Gallery] DELETE failed for ${item.name}: HTTP ${response.status}, Body: ${errorBody}`);
              throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
            }

            // Remove from DOM on success (or if item wasn't found - 404)
            const elementToRemove = Array.from(selectedElements).find(el => {
              if (el.classList.contains('folder-button')) return el.dataset.name === item.name && el.dataset.subfolder === (item.subfolder ? `${item.subfolder}/${item.name}` : item.name);
              const filename = el.dataset.filename;
              const subfolder = el.dataset.subfolder;
              return filename === item.name && (subfolder || '') === (item.subfolder || '');
            });
            if (elementToRemove) {
              elementToRemove.remove();
              console.log(`[Gallery] Removed ${item.name} from DOM.`);
              deletedCount++;
            } else {
              console.warn(`[Gallery] Element for ${item.name} not found in DOM after deletion.`);
              // If it wasn't found but backend reported success (or 404), still count as deleted
              deletedCount++;
            }

          } catch (error) {
            failedDeletions++;
            console.error(`[Gallery] Error during deletion of ${item.name}:`, error);
            alert(`Failed to delete ${item.name}. See console for details.`);
          }
        }

        // --- Post Deletion UI Update ---
        this.totalGalleryItems -= deletedCount; // Update total count (best effort)
        const breadcrumbContainer = this.element.querySelector('.breadcrumb-container');
        this.updateImageCount(breadcrumbContainer, galleryContainer, this.totalGalleryItems);
        this.exitSelectionMode(galleryContainer, this.element.querySelector('.gallery-button-container'), true); // Exit selection after delete

        const remainingItems = galleryContainer?.querySelectorAll('.gallery-item-container, .folder-button');
        if (!remainingItems || remainingItems.length === 0 || this.totalGalleryItems <= 0) {
          const emptyFolderSVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--cg-accent-primary); opacity: 0.8;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9" y1="13" x2="15" y2="13"></line></svg>`;
          const noItemsMsg = $el("div.no-images", [
            $el("div.no-images-icon", { innerHTML: emptyFolderSVG }),
            $el("span.no-images-text", "This folder is empty.")
          ]);
          galleryContainer?.querySelectorAll('.no-images').forEach(msg => msg.remove());
          galleryContainer?.appendChild(noItemsMsg);
        }

        if (failedDeletions > 0) alert(`${itemsToDelete.length - failedDeletions} item(s) deleted. ${failedDeletions} failed.`);
      }
    };
    deleteButton.addEventListener('click', () => this.handleDelete());
    moveButton.addEventListener('click', () => {
      const selectedElements = this.element.querySelectorAll('.gallery-container .selected');
      if (this.isSelectionMode && selectedElements.length === 0) {
        alert("Please select items to move first");
        return;
      }
      this.handleMove();
    });
    selectButton.addEventListener('click', () => this.toggleSelectionMode(galleryContainer, buttonContainer, breadcrumbContainer));
    newFolderButton.addEventListener('click', () => this.createFolderPopup(galleryContainer, buttonContainer, breadcrumbContainer));
    reloadButton.addEventListener('click', () => this.loadGalleryImages({ target: { dataset: { subfolder: this.currentGallerySubfolder } } }, 1));
    scrollToTopButton.addEventListener('click', () => galleryContainer.scrollTo({ top: 0, behavior: 'smooth' }));
    buttonContainer.append(deleteButton, moveButton, selectButton, newFolderButton, reloadButton, scrollToTopButton);
    return buttonContainer;
  }
  createSizeSlider(initialValue, galleryContainer) {
    const sizeSlider = $el('input.gallery-size-slider', {
      type: 'range', min: '60', max: '400', value: initialValue, title: 'Adjust Thumbnail Size'
    });
    // Use throttled input for performance
    let sliderTimeout;
    sizeSlider.addEventListener('input', () => {
      if (sliderTimeout) clearTimeout(sliderTimeout);
      sliderTimeout = setTimeout(() => {
        const size = sizeSlider.value + 'px';
        if (galleryContainer) galleryContainer.style.setProperty('--image-size', size);
        localStorage.setItem('galleryImageSize', sizeSlider.value);
      }, 50); // Update max 20 times/sec
    });
    return sizeSlider;
  }
  handleGalleryItemClick(event, element) {
    event.stopPropagation();
    const galleryContainer = this.element.querySelector('.gallery-container');
    if (!galleryContainer) return;

    if (this.isSelectionMode) {
      // --- Selection Logic ---
      const currentIndex = Array.from(galleryContainer.children).indexOf(element);
      if (currentIndex === -1) return;

      if (event.shiftKey && this.lastSelectedIndex > -1) {
        // Range selection
        const start = Math.min(this.lastSelectedIndex, currentIndex);
        const end = Math.max(this.lastSelectedIndex, currentIndex);
        Array.from(galleryContainer.children).slice(start, end + 1).forEach(item => {
          item.classList.add('selected');
          item.classList.remove('greyed-out');
        });
      } else {
        // Toggle selection
        const isSelected = element.classList.toggle('selected');
        element.classList.toggle('greyed-out', !isSelected);
        this.lastSelectedIndex = isSelected ? currentIndex : -1;
      }

      this.updateGalleryButtonVisibility(galleryContainer, this.element.querySelector('.gallery-button-container'));
      this.updateImageCount(this.element.querySelector('.breadcrumb-container'), galleryContainer, this.totalGalleryItems);
    } else {
      // --- Default Action: Open Folder or Large View ---
      if (element.classList.contains('folder-button')) {
        this.loadGalleryImages({ target: element }, 1);
      } else if (element.classList.contains('gallery-item-container')) {
        const itemUrl = element.dataset.url;
        if (itemUrl) this.showLargeViewFromGallery(itemUrl);
      }
    }
  }
  toggleSelectionMode(galleryContainer, buttonContainer, breadcrumbContainer) {
    this.isSelectionMode = !this.isSelectionMode; // Toggle the flag
    const selectButton = buttonContainer?.querySelector('.select-images');

    if (this.isSelectionMode) {
      // Entering selection mode
      if (selectButton) {
        selectButton.innerHTML = selectExitSVG;
        selectButton.title = 'Exit Selection Mode (s)';
      }
      this.applySelectionStyles(galleryContainer);
      this.setupDragSelection(galleryContainer);
    } else {
      // Exiting selection mode - PROPERLY RESET STATE
      this.exitSelectionMode(galleryContainer, buttonContainer, true); // Force exit
    }

    // Always update these UI elements
    this.updateGalleryButtonVisibility(galleryContainer, buttonContainer);
    this.updateImageCount(breadcrumbContainer, galleryContainer, this.totalGalleryItems);
  }
  applySelectionStyles(galleryContainer) {
    if (!galleryContainer) return;
    galleryContainer.querySelectorAll('.folder-button, .gallery-item-container').forEach(item => {
      item.classList.toggle('greyed-out', !item.classList.contains('selected'));
    });
  }
  // In ComfyCarousel class
  exitSelectionMode(galleryContainer, buttonContainer, force = false) {
      if (!this.isSelectionMode && !force) return;
  
      console.log("[Gallery] Exiting selection mode.");
  
      // PROPER STATE RESET
      this.isSelectionMode = false;
      this.lastSelectedIndex = -1;
  
      // Reset the delete button confirmation state
      this.cancelDeleteConfirmation(); // This should also reset deleteConfirmActive and button look
  
      // Update select button icon
      const selectButton = buttonContainer?.querySelector('.select-images');
      if (selectButton) {
          selectButton.innerHTML = selectSVG; // Assuming selectSVG is the standard select icon
          selectButton.title = 'Toggle Selection Mode (s)';
      }
  
      // Clear selected/greyed-out classes from any items *remaining* in the DOM
      if (galleryContainer) {
          galleryContainer.querySelectorAll('.selected, .greyed-out').forEach(item => {
              item.classList.remove('selected', 'greyed-out');
          });
  
          // Ensure visibility update happens *after* class removal and deleted items are gone
          // Adding a minimal timeout can sometimes help, though not strictly necessary for sync ops
           setTimeout(() => {
               this.updateGalleryButtonVisibility(galleryContainer, buttonContainer);
                // Update image count displays
               const breadcrumbContainer = this.element.querySelector('.breadcrumb-container');
               this.updateImageCount(breadcrumbContainer, galleryContainer, this.totalGalleryItems);
           }, 0); // 0ms delay runs this on the next tick of the event loop
  
      } else {
          // If galleryContainer is null, still call updateVisibility but it will likely return early
           this.updateGalleryButtonVisibility(null, buttonContainer);
            // Update image count displays (will show total if no gallery)
           const breadcrumbContainer = this.element.querySelector('.breadcrumb-container');
           this.updateImageCount(breadcrumbContainer, null, this.totalGalleryItems);
      }
  
      // Reset delete button title display after exiting (cancelDeleteConfirmation should handle the title now)
      // const deleteBtn = buttonContainer?.querySelector('.remove');
      // if(deleteBtn) {
      //     deleteBtn.title = 'Delete Selected (Del)';
      // }
  }
  updateGalleryButtonVisibility(galleryContainer, buttonContainer) {
    if (!galleryContainer || !buttonContainer) return;

    const anySelected = galleryContainer.querySelector('.selected');
    const deleteBtn = buttonContainer.querySelector('.remove');
    const moveBtn = buttonContainer.querySelector('.move');

    if (deleteBtn) deleteBtn.style.display = anySelected ? 'flex' : 'none';
    if (moveBtn) moveBtn.style.display = anySelected ? 'flex' : 'none';

    // Reset delete button if no selections
    if (!anySelected) {
      if (deleteBtn && deleteBtn.textContent === 'Confirm?') {
        deleteBtn.innerHTML = deleteButtonSVG;
        deleteBtn.style.width = '';
        deleteBtn.title = 'Delete Selected (Del)';
      }
      this.deleteConfirmActive = false;
    }
  }
  
  createFolderPopup(galleryContainer, buttonContainer, breadcrumbContainer) {
    const selectedElements = galleryContainer?.querySelectorAll('.selected');
    const isMovingSelection = this.isSelectionMode && selectedElements?.length > 0;
    const overlay = $el('div.move-overlay');
    // --- START OF FIX ---
    // Use innerHTML for the static structure instead of nested $el calls in the children array
    const popup = $el('div.move-popup'); // Create the main popup div
    popup.innerHTML = `
        <h3>${isMovingSelection ? 'New Folder From Selection' : 'Create New Folder'}</h3>
        <input type="text" id="new-folder-name" placeholder="Enter folder name..." required>
        <div class="popup-buttons">
            <button class="ok-button">OK</button>
            <button class="cancel-button">Cancel</button>
        </div>
    `;
    // Get references using querySelector AFTER setting innerHTML
    const input = popup.querySelector('#new-folder-name');
    const okButton = popup.querySelector('.ok-button');
    const cancelButton = popup.querySelector('.cancel-button');
    // --- END OF FIX ---
  
    const performCreate = async () => {
      let folderName = input.value.trim();
      // Basic sanitization - remove leading/trailing dots/spaces, replace problematic chars
      folderName = folderName.replace(/^[ .]+|[ .]+$/g, '').replace(/[\\/:"*?<>|~]+/g, '_');
      if (!folderName) {
        alert("Folder name cannot be empty or contain only invalid characters.");
        input.focus(); return;
      }
      okButton.disabled = true; okButton.textContent = 'Creating...'; // Disable during operation
      try {
        // 1. Create Folder
        const createResponse = await fetch("/gallery/folder/create", { method: "POST", body: new URLSearchParams({ type: 'output', subfolder: this.currentGallerySubfolder, foldername: folderName }), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if (!createResponse.ok) throw new Error(`Create failed: ${await createResponse.text()}`);
        const newFolderPath = this.currentGallerySubfolder ? `${this.currentGallerySubfolder}/${folderName}` : folderName;
        console.log(`Folder '${folderName}' created.`);
        // 2. Move Selection if necessary
        if (isMovingSelection) {
          const itemsToMoveDetails = Array.from(selectedElements).map(item => { /* ... get details ... */
            // Ensure correct logic to get item details from the DOM elements
            if (item.classList.contains('folder-button')) {
              const name = item.dataset.name;
              const fullPath = (item.dataset.subfolder || '').replace(/\\/g, '/');
              // The parentSubfolder needs to be the folder *containing* the folder being moved.
              // The dataset.subfolder on a folder button IS the full path *to* that folder.
              const lastSlash = fullPath.lastIndexOf('/');
              const parentSubfolder = lastSlash !== -1 ? fullPath.substring(0, lastSlash) : '';
               return { type: 'folder', subfolder: parentSubfolder, name: name };
            } else if (item.classList.contains('gallery-item-container')) {
              // Item container has dataset directly
              const filename = item.dataset.filename;
              const subfolder = item.dataset.subfolder || '';
              return filename ? { type: 'image', subfolder: subfolder, name: filename } : null;
            } return null;
          }).filter(Boolean);
  
          if (itemsToMoveDetails.length > 0) {
            const moveResponse = await fetch("/gallery/items/move", { method: "POST", body: new URLSearchParams({ type: 'output', destination: newFolderPath, items: JSON.stringify(itemsToMoveDetails) }), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
            if (!moveResponse.ok) throw new Error(`Move failed: ${await moveResponse.text()}`);
            console.log(`Moved ${itemsToMoveDetails.length} items to ${newFolderPath}.`);
          }
          // Exit selection mode after moving
          this.exitSelectionMode(galleryContainer, buttonContainer, true);
        }
        // 3. Success: Close popup, load new/current folder
        overlay.remove();
        document.removeEventListener('keydown', escHandlerFolder);
        // Load the _new_ folder's content
        this.loadGalleryImages({ target: { dataset: { subfolder: newFolderPath } } }, 1);
      } catch (error) {
        console.error('Error creating folder or moving items:', error);
        alert(`Operation failed: ${error.message}`);
        okButton.disabled = false; okButton.textContent = 'OK'; // Re-enable button on error
      }
    };
    okButton.addEventListener('click', performCreate);
    cancelButton.addEventListener('click', () => {
      overlay.remove();
      document.removeEventListener('keydown', escHandlerFolder);
      // If creating a folder from selection was cancelled, exit selection mode
      if (isMovingSelection) {
          this.exitSelectionMode(galleryContainer, buttonContainer, true);
      }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); performCreate(); } });
    const escHandlerFolder = (e) => {
      if (e.key === "Escape") {
        cancelButton.click(); // Simulate cancel click
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', escHandlerFolder, { capture: true });
    overlay.appendChild(popup); document.body.appendChild(overlay); input.focus();
  }

  // --- Large View Display ---
  async showLargeViewFromGallery(clickedItemUrl) {
    const currentFolder = this.currentGallerySubfolder;
    this.currentLargeViewFolder = currentFolder; // Store the folder path
  
    try {
      // 1. Fetch ALL item metadata for the current folder (using the new endpoint)
      console.log(`[Carousel] Fetching all item metadata for folder: ${currentFolder}`);
      const metadataResponse = await fetch(
        `/gallery/items_metadata?subfolder=${encodeURIComponent(currentFolder)}`
      );
      if (!metadataResponse.ok) {
          throw new Error(`HTTP ${metadataResponse.status} fetching metadata: ${await metadataResponse.text()}`);
      }
      const metadata = await metadataResponse.json();
      // Filter to include only image/video items for the large view
      this.allLargeViewItemsData = metadata.items.filter(item => item.type === 'image' || item.type === 'video');
      console.log(`[Carousel] Fetched metadata for ${this.allLargeViewItemsData.length} media items.`);
  
      if (this.allLargeViewItemsData.length === 0) {
        console.log("[Carousel] No media items found in folder, cannot show large view.");
         this.close(); // Or show an empty message
         return;
      }
  
      // 2. Find the index of the clicked item within the *full* list
      let activeIndex = this.allLargeViewItemsData.findIndex(item => {
        const parsedItemUrl = new URL(item.url, window.location.origin);
        const parsedClickedUrl = new URL(clickedItemUrl, window.location.origin);
        return parsedItemUrl.searchParams.get('filename') === parsedClickedUrl.searchParams.get('filename') &&
          parsedItemUrl.searchParams.get('subfolder') === parsedClickedUrl.searchParams.get('subfolder');
      });
      if (activeIndex === -1) {
        console.warn(`[Carousel] Clicked item URL not found in full list: ${clickedItemUrl}. Defaulting to first item.`);
        activeIndex = 0; // Fallback to the first item
      }
  
      // 3. Calculate the initial window indices based on the active index
      this.dotWindowStartIndex = Math.max(0, activeIndex - Math.floor(this.dotWindowSize / 2));
      this.dotWindowStartIndex = Math.min(this.dotWindowStartIndex, this.allLargeViewItemsData.length - this.dotWindowSize);
      this.dotWindowStartIndex = Math.max(0, this.dotWindowStartIndex); // Final clamp
  
      const initialWindowItems = this.allLargeViewItemsData.slice(
          this.dotWindowStartIndex,
          this.dotWindowStartIndex + this.dotWindowSize
      );
      console.log(`[Carousel] Rendering initial window of ${initialWindowItems.length} items from index ${this.dotWindowStartIndex}. Active index (in full list): ${activeIndex}`);
  
  
      // 4. Setup the carousel UI with the items for the initial window
      // Pass the full list and the active index (within the full list) to setupCarousel
      // setupCarousel will need to calculate the active index *within the window*
      this.setupCarousel(this.allLargeViewItemsData, activeIndex);
  
  
    } catch (error) {
      console.error("Error preparing large view:", error);
      alert(`Could not load items: ${error.message}`);
      this.close();
    }
  }

  async showGalleryView(targetSubfolder = null, scrollToIndex = -1) {
    // Remove the default comfy-modal-content added by the base class
    const defaultModalContent = this.element.querySelector('.comfy-modal-content');
    if (defaultModalContent) {
      defaultModalContent.remove();
    }

    // Reset key state
    document.removeEventListener("keydown", this.onKeydown, { capture: true });
    document.addEventListener("keydown", this.onKeydown, { capture: true });

    // Clear existing content
    this.clearGalleryView();

    // Reset selection state
    this.isSelectionMode = false;
    this.lastSelectedIndex = -1;

    // Ensure main element is visible
    this.element.classList.add('show');
    this.element.classList.remove('hide');
    
    // 1. Hide large view elements if they exist
    const carouselBox = this.element.querySelector('.comfy-carousel-box');
    if (carouselBox) {
      carouselBox.classList.add('large-view-hidden');
      // Pause any active videos
      const activeVideo = carouselBox.querySelector('video:not([paused])');
      if (activeVideo) activeVideo.pause();
    }

    // 2. Determine the subfolder we intend to show
    // If targetSubfolder is null, use the last viewed gallery subfolder, or default to root ('')
    const folderToShow = targetSubfolder !== null ? targetSubfolder : (this.currentGallerySubfolder || '');

    await this.loadGalleryImages({
      target: { dataset: { subfolder: folderToShow } }
    }, 1); // Force loading/refreshing page 1

    // 4. Ensure the gallery container is visible after loading
    const galleryContainer = this.element.querySelector('.gallery-container');
    if (galleryContainer) {
      galleryContainer.classList.remove('large-view-hidden'); // Make sure it's not hidden from large view
      galleryContainer.classList.add('show'); // Apply show class for transitions/visibility
    } else {
      // This case should ideally not be reached if loadGalleryImages was successful
      console.error("[Gallery] Gallery container not found after loadGalleryImages call.");
      // Optionally, handle this error, e.g., by closing the dialog
      this.close();
      return;
    }

    // 5. Handle scroll position if requested
    //    This should run after galleryContainer is populated and visible.
    //    A timeout helps ensure the DOM has updated.
    if (scrollToIndex >= 0 && galleryContainer) {
      setTimeout(() => this.scrollToGalleryItem(scrollToIndex), 0);
    }

    // 6. Ensure proper z-index layering for gallery UI elements
    const headerWrapper = this.element.querySelector('.gallery-header-wrapper');
    const buttonContainer = this.element.querySelector('.gallery-button-container');
    const sizeSlider = this.element.querySelector('.gallery-size-slider'); // Ensure slider also has correct z-index if needed

    if (headerWrapper) headerWrapper.style.zIndex = 'calc(var(--comfy-carousel-z-index) + 10)'; // As per existing CSS [1]
    if (buttonContainer) buttonContainer.style.zIndex = 'calc(var(--comfy-carousel-z-index) + 10)'; // As per existing CSS [1]
    if (sizeSlider) sizeSlider.style.zIndex = 'calc(var(--comfy-carousel-z-index) + 1)'; // As per existing CSS for slider [1]


    // 7. Show the main dialog container if it was hidden
    this.element.classList.remove('hide');
    this.element.classList.add('show');
  }
  scrollToGalleryItem(index) {
    const galleryContainer = this.element.querySelector('.gallery-container');
    if (!galleryContainer) return;

    const items = galleryContainer.querySelectorAll('.gallery-item-container, .folder-button');
    if (index >= 0 && index < items.length) {
      items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  // --- Remove Item(s) from Large View ---
  async removeImage(e) {
    e?.stopPropagation();
    if (!this.allLargeViewItemsData || this.allLargeViewItemsData.length === 0) return;
  
    let itemsToRemoveDetails = [];
    const taggedItems = this.allLargeViewItemsData.filter(item => item.tagged);
    const activeItemData = this.allLargeViewItemsData[this.currentLargeViewIndex];
  
    if (taggedItems.length > 0) {
      itemsToRemoveDetails = taggedItems;
      console.log(`[Carousel] Removing ${taggedItems.length} tagged items.`);
    } else if (activeItemData) {
      itemsToRemoveDetails = [activeItemData];
      console.log("[Carousel] Removing active item.");
    } else {
      console.warn("[Carousel] No active or tagged item found to remove.");
      return;
    }
  
    if (itemsToRemoveDetails.length === 0) return;
  
    if (!confirm(`Remove ${itemsToRemoveDetails.length} item(s)?`)) return;
  
    let failedRemovals = 0;
    let deletedCount = 0;
    const originalActiveIndex = this.currentLargeViewIndex;  // Store the original index for reference
    const successfulRemovalsUrls = [];  // Track URLs of successfully removed items
  
    for (const itemDetail of itemsToRemoveDetails) {
      if (!itemDetail?.filename || itemDetail.type === 'folder') {
        console.warn("[Carousel] Skipping removal of invalid item:", itemDetail);
        failedRemovals++;
        continue;
      }
      try {
        const endpoint = '/gallery/image/remove';
        const bodyParams = {
          type: 'output',
          subfolder: itemDetail.subfolder || '',
          filename: itemDetail.filename
        };
        const response = await fetch(endpoint, {
          method: "POST",
          body: new URLSearchParams(bodyParams),
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        if (!response.ok && response.status !== 404) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        successfulRemovalsUrls.push(itemDetail.url);
        deletedCount++;
      } catch (error) {
        failedRemovals++;
        console.error(`[Carousel] Error deleting ${itemDetail.filename}:`, error);
      }
    }
  
    // Update the list with remaining items
    const originalItemsLength = this.allLargeViewItemsData.length;
    this.allLargeViewItemsData = this.allLargeViewItemsData.filter(item => !successfulRemovalsUrls.includes(item.url));
    const itemsRemovedCount = originalItemsLength - this.allLargeViewItemsData.length;
  
    // Recalculate the new index: Find the closest to the original active index
    if (this.allLargeViewItemsData.length > 0) {
      let newIndex = 0;  // Default to 0
      if (originalActiveIndex < this.allLargeViewItemsData.length) {
        newIndex = originalActiveIndex;  // If the original index is still valid, use it
      } else {
        // Otherwise, find the closest index
        newIndex = this.allLargeViewItemsData.length - 1;  // Start from the end
        let minDistance = Math.abs(originalActiveIndex - newIndex);
        for (let i = 0; i < this.allLargeViewItemsData.length; i++) {
          const distance = Math.abs(originalActiveIndex - i);
          if (distance < minDistance) {
            minDistance = distance;
            newIndex = i;
          }
        }
      }
      this.refreshLargeView(newIndex);  // Pass the recalculated index
    } else {
      this.showGalleryView(this.currentLargeViewFolder);  // No items left, return to gallery
    }
  
    if (this.removeCallback) {
      successfulRemovalsUrls.forEach(url => this.removeCallback(url));
    }
  
    if (failedRemovals > 0) alert(`${itemsRemovedCount} item(s) removed. ${failedRemovals} failed.`);
  }
  refreshLargeView(newActiveIndex = -1) {
    console.log(`[Carousel] Refreshing large view. Target active index: ${newActiveIndex}. Total items now: ${this.allLargeViewItemsData.length}`);
  
    // Determine index to select after refresh
    let finalIndex = 0;
    if (newActiveIndex >= 0 && newActiveIndex < this.allLargeViewItemsData.length) {
      finalIndex = newActiveIndex;
    } else if (this.allLargeViewItemsData.length > 0) {
      finalIndex = 0; // Default to first item if provided index is invalid
    } else {
      finalIndex = -1; // No items left
    }
    this.currentLargeViewIndex = finalIndex; // Update the internal index
  
    if (this.allLargeViewItemsData.length === 0) {
        this.showGalleryView(this.currentLargeViewFolder);
        return;
    }
  
    // Rebuild placeholders for the full list size
    this.createDotPlaceholders(this.allLargeViewItemsData.length);
  
    // Calculate the initial window based on the *new* active index
    this.dotWindowStartIndex = Math.max(0, this.currentLargeViewIndex - Math.floor(this.dotWindowSize / 2));
    this.dotWindowStartIndex = Math.min(this.dotWindowStartIndex, this.allLargeViewItemsData.length - this.dotWindowSize);
    this.dotWindowStartIndex = Math.max(0, this.dotWindowStartIndex);
  
    // Render the dots for the window
    this.renderDotWindow();
  
    // Update the slide display for the new active index
    this.updateSlideDisplay(this.currentLargeViewIndex);
  
    // Scroll dots container to the new active dot
    this.scrollToDot(this.currentLargeViewIndex, false); // Instant scroll on refresh
  
    this.updateLargeViewButtonStates(); // Update button states
  }
  // --- Navigation (Large View) ---
  prevSlide(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (this.allLargeViewItemsData.length <= 1) return; // No navigation needed
    let newIndex = (this.currentLargeViewIndex - 1 + this.allLargeViewItemsData.length) % this.allLargeViewItemsData.length;
    this.selectImage(newIndex); // Use the updated selectImage
  }
  nextSlide(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (this.allLargeViewItemsData.length <= 1) return;
    let newIndex = (this.currentLargeViewIndex + 1) % this.allLargeViewItemsData.length;
    this.selectImage(newIndex); // Use the updated selectImage
  }
  // --- Keydown Handler ---
  onKeydown(e) {
    // Ignore if typing in specific inputs/textareas unless it's Escape
    const targetTagName = e.target.tagName;
    const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT';
    const isPopupInput = e.target.id === 'new-folder-name' || e.target.closest('.move-popup');
    if (isInputFocused && !(isPopupInput && e.key === 'Escape')) {
      // Allow Escape in popups, otherwise ignore keys in inputs
      return;
    }
    let handled = false; // Flag to prevent default if we handle the key
    // --- Gallery View Specific Keys ---
    const galleryContainer = this.element.querySelector('.gallery-container');
    const isInGalleryView = galleryContainer && galleryContainer.offsetParent !== null; // Check if gallery is visible
    if (isInGalleryView) {
      switch (e.key) {
        case "Escape":
          if (this.isSelectionMode) {
            this.exitSelectionMode(galleryContainer, this.element.querySelector('.gallery-button-container'));
            this.updateImageCount(this.element.querySelector('.breadcrumb-container'), galleryContainer, this.totalGalleryItems);
            handled = true;
          } else { this.close(); handled = true; } // Close gallery if not selecting
          break;
        // In onKeydown handler:
        case "s": case "S":
            if (!isInputFocused) { // Only handle if not in input field
                this.toggleSelectionMode(
                    this.element.querySelector('.gallery-container'),
                    this.element.querySelector('.gallery-button-container'),
                    this.element.querySelector('.breadcrumb-container')
                );
                handled = true;
            }
            break;
        case "Delete": case "Backspace":
          this.handleDelete();
          handled = true;
          break;
        case "a": case "A":
          if (e.ctrlKey || e.metaKey) { // Ctrl+A or Cmd+A
            if (this.isSelectionMode) {
              galleryContainer.querySelectorAll('.folder-button, .gallery-item-container').forEach(item => { item.classList.add('selected'); item.classList.remove('greyed-out'); });
              this.lastSelectedIndex = -1;
              this.updateGalleryButtonVisibility(galleryContainer, this.element.querySelector('.gallery-button-container'));
              this.updateImageCount(this.element.querySelector('.breadcrumb-container'), galleryContainer, this.totalGalleryItems);
              handled = true;
            }
          }
          break;
        case "n": case "N":
          this.createFolderPopup(galleryContainer, this.element.querySelector('.gallery-button-container'), this.element.querySelector('.breadcrumb-container'));
          handled = true;
          break;
        case "m": case "M":
          if (this.isSelectionMode && galleryContainer.querySelector('.selected')) {
            this.handleMove(); // Use class method directly
            handled = true;
          }
          break;
        case "r": case "R":
          this.loadGalleryImages({ target: { dataset: { subfolder: this.currentGallerySubfolder } } }, 1); // Reload page 1
          handled = true;
          break;
        case "Home":
          galleryContainer.scrollTo({ top: 0, behavior: 'smooth' });
          handled = true;
          break;
        case "End":
          galleryContainer.scrollTo({ top: galleryContainer.scrollHeight, behavior: 'smooth' });
          // Optionally trigger load more if near bottom and not all loaded?
          handled = true;
          break;
        case "PageUp":
          galleryContainer.scrollBy({ top: -galleryContainer.clientHeight * 0.8, behavior: 'smooth' });
          handled = true;
          break;
        case "PageDown":
          galleryContainer.scrollBy({ top: galleryContainer.clientHeight * 0.8, behavior: 'smooth' });
          // Optionally trigger load more?
          handled = true;
          break;
      }
    }
    // --- Large View Specific Keys ---
    else if (this.element.querySelector('.slides')) { // Check if large view is active
      switch (e.key) {
        case "Escape": this.close(); handled = true; break;
        case "ArrowLeft": this.prevSlide(e); handled = true; break;
        case "ArrowRight": this.nextSlide(e); handled = true; break;
        // Inside onKeydown handler, in the Large View Specific Keys section:
        case "t": case "T": // Tagging
           if (this.currentLargeViewIndex > -1 && this.allLargeViewItemsData[this.currentLargeViewIndex]) {
             const itemData = this.allLargeViewItemsData[this.currentLargeViewIndex];
             itemData.tagged = !itemData.tagged; // Toggle internal state
        
             // Find the corresponding dot element in the DOM window
             const activeDotElement = this.dotContainer?.querySelector(`.dot-thumbnail-container[data-index="${this.currentLargeViewIndex}"] .dot-thumbnail`);
             if (activeDotElement) {
               this.updateTaggedIndicator(activeDotElement); // Update UI using the dot element
             }
             console.log(`Item ${this.currentLargeViewIndex} tagged: ${itemData.tagged}`);
             handled = true;
           }
           break;
        case "d": case "D": this.resetZoom(); handled = true; break;
        case "g": case "G": this.showGalleryView(this.currentLargeViewFolder, this.currentLargeViewIndex); handled = true; break;
        case "o": case "O": this.loadImage(); handled = true; break;
        case " ": // Spacebar for Video Play/Pause
          const activeMedia = this.getActive()?.querySelector('video');
          if (activeMedia) {
            if (activeMedia.paused) activeMedia.play().catch(err => console.warn("Play interrupted:", err));
            else activeMedia.pause();
            handled = true;
          }
          break;
        case "Delete": case "Backspace": this.removeImage(e); handled = true; break;
        case "m": case "M": this.handleMove(); handled = true; break;
        case "s": case "S": this.downloadImage(); handled = true; break; // Download on S
      }
    } else {
      // Neither gallery nor large view seems active, but modal is open? Close on escape.
      if (e.key === "Escape") { this.close(); handled = true; }
    }
    // Prevent default browser action if we handled the key
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  // --- Initialization & Closing ---
  initializeGallerySize() { // Called once during extension setup
    const storedSize = localStorage.getItem('galleryImageSize') || '150';
    document.documentElement.style.setProperty('--image-size', `${storedSize}px`);
  }
  // Show method for the Node Carousel (double-click) - NOT paginated
  showNodeCarousel(imageUrls, activeIndex, removeCallback) {
    // Remove the default comfy-modal-content added by the base class
    const defaultModalContent = this.element.querySelector('.comfy-modal-content');
    if (defaultModalContent) {
      defaultModalContent.remove();
    }
    if (!imageUrls || imageUrls.length === 0) return; // Don't show if empty
    this.isGalleryCarousel = false;
    this.removeCallback = removeCallback;
    // Map simple URLs to the item structure expected by setupCarousel
    const items = imageUrls.map(url => {
      const parsed = parseViewURL(url);
      // Basic type detection from URL (can be improved)
      const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(parsed.filename || '');
      return {
        type: isVideo ? 'video' : 'image',
        url: url,
        thumbnail_url: url, // Use itself as thumbnail for node view
        tagged: false,
        filename: parsed.filename,
        subfolder: parsed.subfolder || '',
      };
    });
    this.currentLargeViewFolder = items[0]?.subfolder || ''; // Set folder context
    this.setupCarousel(items, activeIndex); // Use the standard large view setup
    this.element.classList.add('show');
    this.element.classList.remove('hide');
    // super.show() might not be needed if we manage visibility directly
    if (!document.body.contains(this.element)) { // Ensure dialog is in the DOM
      document.body.appendChild(this.element);
    }
  }
  // show() is now primarily for the dialog container, content managed by loadGalleryImages/setupCarousel
  // Inside ComfyCarousel class
  // --- Modified close method ---
  close() {
    // Just hide everything rather than removing
    this.element.querySelectorAll('.comfy-carousel-box, .gallery-container').forEach(el => {
      el.classList.add('large-view-hidden');
    });
    this.element.classList.remove('show');
  
    // Keep the rest of your cleanup logic (event listeners, etc)
    document.removeEventListener("keydown", this.onKeydown, { capture: true });
  
    // Remove gallery scroll listener if it exists
    const galleryContainer = this.element.querySelector('.gallery-container');
    if (galleryContainer && this.galleryScrollListener) {
      galleryContainer.removeEventListener('scroll', this.galleryScrollListener);
      this.galleryScrollListener = null; // Clear the reference
    }
  
    // REMOVE the dots scroll listener
     if (this.dotContainer && this._dotsScrollListener) {
        this.dotContainer.removeEventListener('scroll', this._dotsScrollListener);
        this._dotsScrollListener = null;
     }
  
  
    // Start fade-out animation
    this.element.classList.add('hide');
    this.element.classList.remove('show');
  
    // Reset internal states for large view
    this.allLargeViewItemsData = []; // Clear the full list data
    this.currentLargeViewIndex = -1;
    this.dotWindowStartIndex = 0; // Reset window state
    this.dotContainer = null; // Clear DOM references
    this.slideContainer = null; // Clear DOM references
  
    this.taggedImages = null; // Reset tagged state
    this.lastSelectedIndex = -1; // Reset shift-click state
    this.cancelDeleteConfirmation(); // Ensure delete state is reset
  
    // Reset pagination state for gallery
    this.currentGalleryPage = 1;
    this.totalGalleryPages = 1;
    this.isLoadingMoreGalleryItems = false;
    // Keep currentGallerySubfolder for next opening
  
    document.body.style.overflow = ''; // Restore body scroll AFTER animation (or maybe immediately?)
  
    // Clear ALL content after animation completes
    // Use 'transitionend' event for more robust clearing after animation,
    // or just a setTimeout matching the CSS transition duration.
    setTimeout(() => {
         if (this.element) this.element.innerHTML = '';
    }, 300); // Match CSS animation duration
  }

  show() {
    this.element.classList.remove('hide');
    this.element.classList.add('show');
    
    // Re-attach keydown listener
    document.addEventListener("keydown", this.onKeydown, { capture: true });
    
    // Ensure gallery container is visible and has the correct state
    const galleryContainer = this.element.querySelector('.gallery-container');
    if (galleryContainer) {
      galleryContainer.classList.remove('large-view-hidden');
      galleryContainer.classList.add('show');
      
      // Re-setup scroll listener if necessary
      if (!this.galleryScrollListener) {
        this.setupInfiniteScroll(galleryContainer);
      } else {
        this.checkAutoLoadNextPage();
      }
    }
    
    console.log("[Gallery] show method called, classes:", this.element.classList.value);
  }

} // End of ComfyCarousel class
// === App Extension Registration ===

async function triggerBuildThumbs() {
  const ui = app.ui;
  if (!ui?.galleryCarousel) return;

  const subfolderToProcess = ui.galleryCarousel.currentGallerySubfolder || "";
  const folderDisplayName = subfolderToProcess || "Output Root";

  if (
    !confirm(
      `Optimize thumbnails in folder "${folderDisplayName}"?\n\n` +
      `This generates small ".thumb.jpeg" files for faster gallery loading and processes subfolders recursively.`
    )
  ) {
    return;
  }

  try {
    const response = await fetch("/gallery/process_thumbnails", {
      method: "POST",
      body: new URLSearchParams({
        type: "output",
        subfolder: subfolderToProcess,
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.ok) {
      alert("Thumbnail optimization started in the background. Reload the gallery after a while to see changes.");
    } else {
      throw new Error(await response.text());
    }
  } catch (error) {
    console.error("Error optimizing thumbnails:", error);
    alert(`Failed to start thumbnail optimization: ${error.message}`);
  }
}

async function addGalleryButtonToMenu() {
  const openGallery = () => {
    const ui = app.ui;
    if (ui?.galleryCarousel) {
      ui.galleryCarousel.showGalleryView();
    }
  };

  // 1. Add to modern ComfyUI Topbar (app.menu.settingsGroup) - EXACT SAME AS Model Manager & Manager!
  if (app.menu?.settingsGroup && !window._imageGallerySettingsGroupBtnAdded) {
    let ComfyButtonClass =
      window.comfyAPI?.button?.ComfyButton ||
      window.comfyAPI?.ui?.components?.button?.ComfyButton ||
      app.ui?.button?.ComfyButton;

    try {
      if (ComfyButtonClass) {
        const galleryBtn = new ComfyButtonClass({
          icon: "image",
          tooltip: "Open Image Gallery",
          action: openGallery,
        });
        if (galleryBtn.element) {
          galleryBtn.element.title = "Open Image Gallery";
        }
        app.menu.settingsGroup.append(galleryBtn);
        window._imageGallerySettingsGroupBtnAdded = true;
        console.log("[ImageGallery] Appended ComfyButton to app.menu.settingsGroup");
      } else {
        const btn = document.createElement("button");
        btn.id = "comfyui-image-gallery-button";
        btn.textContent = "🖼️";
        btn.title = "Open Image Gallery";
        btn.onclick = openGallery;
        if (app.menu.settingsGroup.element) {
          app.menu.settingsGroup.element.append(btn);
        } else if (typeof app.menu.settingsGroup.append === "function") {
          app.menu.settingsGroup.append(btn);
        }
        window._imageGallerySettingsGroupBtnAdded = true;
        console.log("[ImageGallery] Appended DOM button to app.menu.settingsGroup");
      }
    } catch (err) {
      console.warn("[ImageGallery] Error appending button to app.menu.settingsGroup:", err);
    }
  }

  // 2. Add to app.ui.menuContainer for legacy menu support
  if (app.ui?.menuContainer && !document.getElementById("comfy-image-gallery-menu-btn")) {
    const btn = document.createElement("button");
    btn.id = "comfy-image-gallery-menu-btn";
    btn.textContent = "🖼️";
    btn.title = "Open Image Gallery";
    btn.onclick = openGallery;
    app.ui.menuContainer.appendChild(btn);
    console.log("[ImageGallery] Appended button to app.ui.menuContainer");
  }
}

function ensureGalleryButtonInMenu() {
  addGalleryButtonToMenu();

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    addGalleryButtonToMenu();
    if (window._imageGallerySettingsGroupBtnAdded || attempts > 30) {
      clearInterval(interval);
    }
  }, 500);
}

app.registerExtension({
  name: "Comfy.ImageGallery",

  commands: [
    {
      id: "imageGallery.open",
      label: "Gallery",
      icon: "pi pi-images",
      function: () => {
        const ui = app.ui;
        if (!ui?.galleryCarousel) return;
        ui.galleryCarousel.showGalleryView();
      },
    },
    {
      id: "imageGallery.buildThumbs",
      label: "Build Thumbs",
      icon: "pi pi-cog",
      function: () => {
        triggerBuildThumbs();
      },
    },
  ],

  menuCommands: [
    {
      path: ["Image Gallery"],
      commands: ["imageGallery.open", "imageGallery.buildThumbs"],
    },
  ],

  getCanvasMenuItems(canvas) {
    return [
      null,
      {
        content: "🖼️ Open Image Gallery",
        callback: () => {
          app.ui?.galleryCarousel?.showGalleryView();
        }
      }
    ];
  },

  getNodeMenuItems(node) {
    return [
      {
        content: "🖼️ Open Image Gallery",
        callback: () => {
          app.ui?.galleryCarousel?.showGalleryView();
        }
      }
    ];
  },

  init() {
    console.log("Initializing Image Gallery Extension");

    const ui = app.ui;

    ui.galleryCarousel = new ComfyCarousel(true);
    ui.nodeCarousel = new ComfyCarousel(false);

    ui.galleryCarousel.initializeGallerySize();

    ensureGalleryButtonInMenu();
  },

  async setup() {
    console.log("Setting up Image Gallery listeners...");

    ensureGalleryButtonInMenu();

    const input = document.getElementById("comfy-file-input");
    if (input) {
      let types =
        input.getAttribute("accept")?.split(",").map((t) => t.trim()) ??
        [];

      ["image/webp", "image/jpeg", "image/png"].forEach((type) => {
        if (!types.includes(type)) types.push(type);
      });
      input.setAttribute("accept", types.join(","));
    }

    const origHandleFile = app.handleFile;
    if (origHandleFile) {
      app.handleFile = function (file, ...args) {
        return handleFile.call(app, origHandleFile, file, ...args);
      }.bind(app);
    }
  },

  // Keep: your node double-click behavior (unchanged)
  beforeRegisterNodeDef(nodeType, nodeData, nodeConfig) {
    // Add Double-Click Functionality to Nodes with Images
    const nodePrototype = nodeType.prototype;

    // Function to check if click is on the image area (approximate)
    const isImageClick = (node, pos) => {
      if (!node) return false;

      const imgs = node.imgs || node.images;
      if (!imgs || !imgs.length) return false;

      let imageY;

      // Prefer explicit offset if provided by the node
      if (node.imageOffset !== undefined) {
        imageY = node.imageOffset + node.pos[1];
      } else if (typeof node.computeImageSize === "function" && imgs?.[0]) {
        const img = imgs[0];
        if (img?.naturalWidth && img?.naturalHeight) {
          const [, height] = node.computeImageSize(img.naturalWidth, img.naturalHeight);
          imageY = node.pos[1] + node.size[1] - height - 4; // approx padding
        }
      } else if (typeof node.getBounding === "function") {
        // Fallback guess based on node bounding box
        const b = node.getBounding();
        imageY = b[1] + (b[3] - b[1]) * 0.5;
      }

      if (imageY === undefined) return false;
      return pos[1] >= imageY;
    };

    // Store original onDblClick if it exists
    const origOnDblClick = nodePrototype.onDblClick;

    // Define the new onDblClick
    nodePrototype.onDblClick = function (e, pos, ...args) {
      const node = this;
      const imgs = node.imgs || node.images;

      if (imgs?.length && isImageClick(node, pos)) {
        let imageIndex = node.imageIndex ?? node.overIndex ?? 0;
        imageIndex = Math.max(0, Math.min(imageIndex, imgs.length - 1));

        const src = imgs?.[imageIndex]?.src;
        if (src && app.ui?.galleryCarousel) {
          const parsed = parseViewURL(src);
          const targetSubfolder = parsed.subfolder || "";

          app.ui.galleryCarousel.showGalleryView(targetSubfolder).then(() => {
            if (!parsed.filename) return;
            const galleryContainer = app.ui.galleryCarousel.element.querySelector('.gallery-container');
            if (!galleryContainer) return;

            const items = Array.from(galleryContainer.querySelectorAll('.gallery-item-container'));
            const targetItem = items.find(item =>
              item.dataset.filename === parsed.filename ||
              (item.dataset.url && item.dataset.url.includes(parsed.filename))
            );

            if (targetItem) {
              targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              app.ui.galleryCarousel.handleGalleryItemClick(new MouseEvent('click'), targetItem);
            }
          }).catch(err => {
            console.error("[ImageGallery] Error opening gallery on double click:", err);
          });
          return;
        } else if (src && app.ui?.nodeCarousel?.showNodeCarousel) {
          app.ui.nodeCarousel.showNodeCarousel(
            imgs.map((img) => img.src),
            imageIndex
          );
          return;
        }
      }

      // Otherwise, call original handler if present
      if (origOnDblClick) return origOnDblClick.apply(node, [e, pos, ...args]);
    };
  },
});
