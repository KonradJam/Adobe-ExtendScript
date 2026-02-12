# Digi-Spread-Impos 📄✨

**Advanced PDF to Booklet & Imposition Automation for Adobe InDesign**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-Adobe%20InDesign-red) ![Language](https://img.shields.io/badge/language-ExtendScript-yellow)

## Overview

**Digi-Spread-Impos** is a professional automation tool designed for DTP operators and digital printers. It transforms single-page or multi-page PDFs into production-ready imposed sheets in minutes.

The script handles the entire workflow: from analyzing the source PDF geometry to generating a print-ready booklet spread, and finally imposing it onto standard print sheets (SRA3/A3/A4) with automated crop marks.

**Perfect for:** Digital printing, brochures, zines, and saddle-stitched booklets.

---

## ✨ Key Features

### 1. Intelligent PDF Analysis
*   **Flexible Input**: Supports both **single-page** PDFs and **multi-page** PDF documents.
*   **Auto-Detection**: Automatically detects standard formats (A6, A5, A4) based on the input PDF geometry.
*   **Smart Bleed Calculation**: Calculates suggested bleed by comparing the PDF size to standard ISO formats.
*   **Customizable**: Allows manual adjustment of final trim size, bleeds, and margins before processing.

### 2. Printer's Spreads Creation
*   **Booklet Mode**: Automatically converts pages into proper printer spreads (2-up).
*   **Page Count Validation**: Checks if the total page count is divisible by 8 (standard signature requirement).
*   **Auto-Correction**: Offers to automatically add blank pages if the count doesn't match the signature requirement.

### 3. Automated Imposition
*   **Sheet Optimization**: Suggests available imposition layouts based on the spread size and target sheet (e.g., *Landscape SRA3*, *Portrait A3*).
*   **Yield Calculation**: Instantly shows how many items fit on the selected sheet (e.g., *"2 items on Landscape SRA3"*).
*   **Crop Marks**: Draws professional registration crop marks on a separate layer (`Print Marks`).
*   **Auto-Save**: Automatically saves the final imposition file (`[DocName] - impos.indd`) in the source directory.

---

## 🚀 Installation

1.  **Download** the `Digi-Spread-Impos.jsx` file.
2.  **Locate your Scripts Panel folder**:
    *   **Windows**: `C:\Program Files\Adobe\Adobe InDesign [Version]\Scripts\Scripts Panel\`
    *   **macOS**: `/Applications/Adobe InDesign [Version]/Scripts/Scripts Panel/`
3.  **Copy** the script file into this folder.
4.  **Restart** InDesign is usually not required; the script should appear immediately in the Scripts panel.

---

## 📖 Usage Guide

### Step 1: Launch
1.  Open Adobe InDesign.
2.  Go to `Window > Utilities > Scripts`.
3.  Double-click **Digi-Spread-Impos**.

### Step 2: Load & Configure
1.  Click **Load file/s** to select your PDF(s).
    *   **Single File**: Select one multi-page PDF.
    *   **Multiple Files**: Select multiple single-page PDFs (they will be combined).
2.  **Format Dialog**: The script will display detected dimensions.
    *   Review the **Width/Height** (target trim size).
    *   Adjust **Bleed** if necessary.
    *   Set **Margins** (Inner/Outer/Top/Bottom).
3.  Click **OK**. The script will import pages into a new document.

### Step 3: Create Spread & Impose
1.  In the main panel, under the **Imposition** section, choose an action:
    *   **Printer's Spread**: Generates only the booklet PDF (`[DocName] - spread.pdf`).
    *   **Impos**: Performs the full workflow (Spread creation + Layout on print sheet).
2.  If you chose **Impos**, select your target sheet size from the dropdown (e.g., `Landscape SRA3`).
3.  Click **OK**.

### Step 4: Final Output
The script will generate:
1.  A **Spread PDF** file in the source folder.
2.  An **Imposition InDesign file** (`- impos.indd`) with the final layout and crop marks, saved and ready for print.

---

## ⚠️ Requirements & Compatibility

*   **Adobe InDesign**: CS6 (tested) and CC versions.
*   **Operating System**: Windows (tested) / macOS.
*   **Input Files**: Standard PDFs (single or multi-page).
*   **Supported Input Formats**: A6, A5, A4.
*   **Supported Output Sheets**: A4 up to SRA3.

## 🐛 Known Limitations

*   Input formats larger than A4 or smaller than A6 may not be auto-detected correctly.
*   Imposition target sheets are limited to the range between A4 and SRA3.

---

## 📄 License

This project is licensed under the **MIT License**.

---
*Created by a DTP professional for professionals.*
