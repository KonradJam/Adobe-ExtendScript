# Bleed-Maker 🎨✨

**Emergency Bleed Generator for Adobe InDesign**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-Adobe%20InDesign-red) ![Language](https://img.shields.io/badge/language-ExtendScript-yellow)

## Overview

**Bleed-Maker** is a rescue tool for DTP operators dealing with client-supplied files that were delivered "to trim" without bleeds. Instead of manually editing images in Photoshop, this script automatically generates bleeds directly in Adobe InDesign by sampling and stretching edge pixels of existing artwork.

The script uses an intelligent **pixel-stretch technology** that extracts a narrow strip from the artwork's edge and extends it outward to create proper bleed areas—ideal for backgrounds, landscapes, gradients, and abstract graphics.

**Perfect for:** Print production emergencies, client files without bleeds, and deadline-critical projects.

---

## ✨ Key Features

### 1. Intelligent Pixel Stretch Technology
- **Non-Reflective Method**: Unlike mirroring techniques that can distort text or logos near edges, Bleed-Maker samples a thin strip (e.g., 1mm) from the project edge and stretches it outward.
- **Background-Optimized**: Works exceptionally well with solid backgrounds, photographic landscapes, gradients, and abstract designs.
- **Natural Edge Blur**: Creates a seamless "blur effect" that extends the background into the bleed area.

### 2. Granular Edge Control
- **Independent Settings**: Control each edge separately (Top, Bottom, Left, Right).
- **Link All Function**: Quick-apply mode—enter once, apply to all edges simultaneously.
- **Inner Offset**: Game-changer for files with white margins. Sample the image deeper (e.g., 1mm inside) to ignore white borders or edge artifacts.
- **Sample Size**: User-defined thickness of the pixel strip to be stretched.

### 3. Professional Floating UI
- **Palette Mode**: Non-blocking floating panel that stays above the document, allowing uninterrupted workflow.
- **Smart Buttons**: "Remove Bleeds" button activates only when script-generated elements are detected.
- **Auto-Load Settings**: Automatically reads current bleed values from the active document settings.
- **Persistent Interface**: Window remains accessible during work sessions.

### 4. Safety & Workflow Hygiene
- **Dedicated Layer**: All generated elements are placed on a separate `Bleed_Maker_Generated` layer, keeping client artwork untouched.
- **Full Undo Support**: Entire generation process counts as a single history step—one Ctrl+Z reverts everything.
- **Non-Destructive**: Works on a copy of the image fragment; original artwork remains intact.
- **Auto-Cleanup**: Automatically removes old script-generated bleeds before creating new ones, preventing frame duplication.
- **Smart Selection**: Algorithm automatically detects the "best candidate" for background extension (largest graphic on page), ignoring small elements.

---

## 🚀 Installation

1. **Download** the `Bleed-Maker.jsx` file.
2. **Locate your Scripts Panel folder**:
   - **Windows**: `C:\Program Files\Adobe\Adobe InDesign [Version]\Scripts\Scripts Panel\`
   - **macOS**: `/Applications/Adobe InDesign [Version]/Scripts/Scripts Panel/`
3. **Copy** the script file into this folder.
4. **Restart** InDesign is usually not required; the script should appear immediately in the Scripts panel.

---

## 📖 Usage Guide

### Step 1: Launch
1. Open Adobe InDesign with a document containing images without bleeds.
2. Go to `Window > Utilities > Scripts`.
3. Double-click **Bleed-Maker**.

### Step 2: Configure Settings
1. The floating panel will display current document bleed settings.
2. **Adjust Edge Values**:
   - Set individual values for Top, Bottom, Left, and Right edges.
   - Or use **Link All** to apply the same value to all edges.
3. **Inner Offset** (optional):
   - If your artwork has white margins or unwanted edge artifacts, set an offset (e.g., 1mm).
   - This tells the script to sample pixels deeper inside the image.
4. **Sample Size**:
   - Define how thick the pixel strip should be (typically 1-3mm).

### Step 3: Generate Bleeds
1. Click **Generate Bleeds**.
2. The script will:
   - Automatically detect the largest graphic on each page.
   - Extract edge samples based on your settings.
   - Stretch pixels outward to create bleeds.
   - Place all generated frames on the `Bleed_Maker_Generated` layer.

### Step 4: Review & Remove (If Needed)
1. Review the generated bleeds in your document.
2. If adjustments are needed:
   - Click **Remove Bleeds** to delete all script-generated elements.
   - Adjust settings and regenerate.

---

## ⚠️ Requirements & Compatibility

- **Adobe InDesign**: CS6 (tested) and CC versions.
- **Operating System**: Windows / macOS.
- **Input Requirements**: Documents with placed images (JPEG, TIFF, PSD, etc.).
- **Best Results With**: Solid backgrounds, landscapes, gradients, abstract graphics.

## 🐛 Known Limitations

- **Text/Logo Edges**: Not recommended for images with text or logos directly at trim edges (use Inner Offset to mitigate).
- **Complex Patterns**: May not work well with geometric patterns or repeating designs at edges.
- **Manual Intervention**: Some cases may still require manual Photoshop editing for optimal results.

---

## 💡 Pro Tips

- **White Margin Files**: Always use Inner Offset (1-3mm) to skip white borders.
- **Testing**: Generate bleeds on a test page first to verify sample quality.
- **Undo-Friendly**: Don't hesitate to regenerate—full undo support makes iteration quick.
- **Layer Management**: Keep the `Bleed_Maker_Generated` layer locked after final approval to prevent accidental edits.

---

## 📄 License

This project is licensed under the **MIT License**.

---

*Created by a DTP professional for professionals.*
