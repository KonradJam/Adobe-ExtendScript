# Client Print Guide 📏🖨️

**Visual Print Guide & Client Proof Generator for Adobe InDesign**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-Adobe%20InDesign-red) ![Language](https://img.shields.io/badge/language-ExtendScript-yellow)

## Overview

**Client Print Guide** is a professional automation tool designed for DTP operators and graphic designers. It is engineered to help clearly communicate print specifications to clients by generating a visually rich, self-explanatory proof of their artwork.

The script automates the process of exporting the current design, placing it on a larger presentation canvas, and drawing precise dimension lines, bounding frames, and safe margins . Its standout feature is the **Bleed Cut Simulation**, which visually demonstrates how the bleed will be trimmed off, helping non-technical clients understand print and guillotine requirements.

**Perfect for:** Client proofs, print specifications, educational guides for clients, and quick dimension checking.

---

## ✨ Key Features

### 1. Visual Frames & Precise Dimensions
*   **Automated Bounding Boxes**: Draws color-coded frames for Safe Area (Green), Trim (Red), and Bleed (Black) .
*   **Detailed Dimensions**: Automatically generates dimension lines with exact millimeter measurements for safe margins, trim size, bleed size, and total project size .
*   **Auto-Generated Legend**: Creates a clear legend explaining the frame colors to the client .

### 2. Information Panels
*   **Custom Callouts**: Easily generate pre-styled "Info" (Blue), "Warning" (Yellow), and "Danger" (Red) text panels next to the artwork . Perfect for highlighting specific issues (e.g., low-resolution images, missing bleeds) or adding instructions.

### 3. Bleed Cut Simulation
*   **Visual Demonstration**: Visually separates and offsets the right bleed area (with a scissors icon) to clearly show clients exactly what part of their design will be cut off .

### 4. Non-Destructive Layered Workflow
*   **Safe Execution**: Operates non-destructively by exporting your current artwork to PDF and creating a brand new presentation document .
*   **Organized Layers**: Automatically places artwork, dimensions, frames, legends, and panels on separate, neatly organized layers .

---

## 🚀 Installation

1.  **Download** the `Client-Print-Guide.jsx` file.
2.  **Locate your Scripts Panel folder**:
    *   **Windows**: `C:\Program Files\Adobe\Adobe InDesign [Version]\Scripts\Scripts Panel\`
    *   **macOS**: `/Applications/Adobe InDesign [Version]/Scripts/Scripts Panel/`
3.  **Copy** the script file into this folder.
4.  **Restart** InDesign is usually not required; the script should appear immediately in the Scripts panel.

---

## 📖 Usage Guide

### Step 1: Launch & Preparation
1.  Open your artwork in Adobe InDesign.
2.  **Crucial:** Ensure your document is saved and has proper document sizes, margins, and bleeds set up in *File > Document Setup*.
3.  Go to `Window > Utilities > Scripts`.
4.  Double-click **Client Print Guide**. A configuration dialog will appear .

### Step 2: Configure Presentation
In the dialog panel, select what you want to show the client :
*   **Dimensions**: Toggle visibility for Trim Size, Bleed Size, Total Project Size, and Safe Area.
*   **Frames**: Enable or disable the Safe Area Frame, Trim Frame (with scissors icon), and Bleed Frame.
*   **Information Panels**: Check Info, Warning, or Danger to spawn editable text boxes.
*   **Simulate Right Bleed Cut**: Check this to visually slice off the right bleed.

### Step 3: Generate Output
1.  Click **OK**.
2.  The script will export your document to a temporary High Quality PDF and automatically build a new presentation document .

---

## ⚠️ Requirements & Compatibility

*   **Adobe InDesign**: CS6 and CC versions.
*   **Operating System**: Windows / macOS.
*   **Input Files**: Must be a saved `.indd` file with properly defined dimensions and bleeds .

## 🐛 Known Limitations

*   The source document must be saved on a physical drive before running the script (requires a valid `filePath` for PDF export) .
*   The script processes only the first page/spread of the active document .

---

## 📄 License

This project is licensed under the **MIT License**.

---
*Created by a DTP professional for professionals.*
