# Digi-Impos 📄✂️

**Advanced Commercial Print Imposition & Common Cut Automation for Adobe InDesign**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-Adobe%20InDesign-red) ![Language](https://img.shields.io/badge/language-ExtendScript-yellow)

## Overview

**Digi-Impos** is a professional automation tool designed for DTP operators and digital printers. It is engineered specifically for imposing commercial print jobs (Akcydensy) such as business cards, flyers, tickets, and single-page artworks.

The script automates the tedious process of calculating grid layouts, duplicating artworks across print sheets, and drawing precise crop marks. Its standout feature is the **Common Cut (Butt Cut)** support, which intelligently removes bleeds between adjacent items while maintaining outer bleeds, perfectly optimizing jobs for guillotine cutting.

**Perfect for:** Digital printing, business cards, flyers, invitations, and any step-and-repeat imposition.

---

## ✨ Key Features

### 1. Intelligent Grid Calculation
*   **Auto-Fit Algorithm**: Automatically calculates how many items fit on standard digital print sheets (from A4 to SRA3).
*   **Margin Awareness**: Always reserves a configurable safe margin (default 5mm) for gripper edges and crop marks.
*   **Multi-Page Support**: Can impose multi-page PDFs, automatically generating a separate imposed print sheet for every source page.

### 2. Advanced Common Cut Logic
*   **Standard Imposition**: Standard grid with full bleeds around every single item.
*   **Horizontal Common Cut**: Removes top and bottom bleeds between items (items stack vertically edge-to-edge), saving paper and cutting time.
*   **Vertical Common Cut**: Removes left and right bleeds between items (items stack horizontally edge-to-edge).
*   **Combined Cuts**: Supports both horizontal and vertical common cuts simultaneously.

### 3. Professional Crop Marks Engine
*   **Dynamic Offset**: Marks automatically adjust their position. If a bleed is present, marks start exactly at the bleed edge. If no bleed (or removed via common cut), marks safely offset by 3mm.
*   **Layer Management**: Automatically separates artwork onto an "Imposition" layer and crop marks onto a "Print Marks" layer.
*   **Registration Color**: Marks are drawn at 0.1mm thickness using the standard document Registration color.

---

## 🚀 Installation

1.  **Download** the `Digi-Impos.jsx` file.
2.  **Locate your Scripts Panel folder**:
    *   **Windows**: `C:\Program Files\Adobe\Adobe InDesign [Version]\Scripts\Scripts Panel\`
    *   **macOS**: `/Applications/Adobe InDesign [Version]/Scripts/Scripts Panel/`
3.  **Copy** the script file into this folder.
4.  **Restart** InDesign is usually not required; the script should appear immediately in the Scripts panel.

---

## 📖 Usage Guide

### Step 1: Launch & Preparation
1.  Open your artwork in Adobe InDesign.
2.  **Crucial:** Ensure your document is saved and has proper bleeds set up in *File > Document Setup*.
3.  Go to `Window > Utilities > Scripts`.
4.  Double-click **Digi-Impos**. A floating palette will appear.

### Step 2: Configure Common Cuts
In the floating panel, select your cutting preferences:
*   **Horizontal Common Cut**: Check this if you want items to touch vertically (top-to-bottom).
*   **Vertical Common Cut**: Check this if you want items to touch horizontally (left-to-right).
*   *Leave both unchecked for a standard grid with gaps between all items.*

### Step 3: Impose
1.  Click the **Impos** button.
2.  The script will export your document to a temporary PDF and calculate available layouts.
3.  A dialog will appear showing all print sheets that can fit your artwork.
4.  Select your desired target sheet from the dropdown (e.g., `Landscape SRA3 -> 21 items (7 x 3)`).
5.  Click **OK**.

### Step 4: Final Output
The script will silently generate a brand new InDesign document containing:
1.  Your artwork properly stepped and repeated.
2.  Precision crop marks on a dedicated layer.
3.  Multi-page documents will have multiple spreads corresponding to the source file.

---

## ⚠️ Requirements & Compatibility

*   **Adobe InDesign**: CS6 (tested) and CC versions.
*   **Operating System**: Windows (tested) / macOS.
*   **Input Files**: Must be a saved `.indd` file with properly defined document bleeds.
*   **Supported Output Sheets**: A4 up to SRA3.

## 🐛 Known Limitations

*   The source document must be saved on a physical drive before running the script (requires a valid `filePath` for PDF export).
*   Imposition target sheets are limited to the predefined internal list. To add custom sheet sizes, edit the `IMPOS_DOC_FORMATS` object at the top of the script.

---

## 📄 License

This project is licensed under the **MIT License**.

---
*Created by a DTP professional for professionals.*
