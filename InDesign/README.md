# Adobe InDesign ExtendScripts 🆔

Welcome to the **InDesign** section of the automation toolkit.
Here you will find scripts specifically designed to automate layout, pre-press, and production workflows within Adobe InDesign.

## 📂 Available Scripts

Below is a list of currently available tools. Click on the script name to view its detailed documentation and installation instructions.

| Script Name | Description | Key Features |
| :--- | :--- | :--- |
| **[Digi-Spread-Impos](./Digi-Spread-Impos)** | Automated booklet creation and imposition. | • PDF to Booklet conversion<br>• Auto-imposition on SRA3/A3<br>• Automated crop marks<br>• Multi-page PDF support |
| **[Bleed-Maker](./Bleed-Maker)** | Emergency bleed generator using pixel stretch technology. | • Auto-extends artwork edges<br>• Inner Offset (ignores white margins)<br>• Non-destructive (dedicated layer)<br>• Floating control panel |
| *Coming Soon* | *More scripts are being developed...* | *Batch processing, layer management, etc.* |

---


## ⚙️ General Installation Guide for InDesign

While each script has its own specific instructions, the general method for installing scripts in InDesign is standard:

1.  **Download** the desired script (`.jsx` file) from its subfolder.
2.  Open **Adobe InDesign**.
3.  Open the Scripts Panel: `Window > Utilities > Scripts` (or `Window > Automation > Scripts` in older versions).
4.  Right-click on the **User** folder in the panel and select **Reveal in Explorer** (Windows) or **Reveal in Finder** (macOS).
5.  **Copy** the downloaded `.jsx` file into this folder.
6.  The script will appear immediately in the InDesign Scripts Panel.

---

## 🧩 Compatibility

*   **Versions Tested**: CS6, CC 2024/2025.
*   **Platform**: Windows & macOS.
*   **Engine**: ExtendScript (ECMAScript 3 standard with Adobe extensions).

## 🐛 Troubleshooting

If a script fails to run:
1.  Check if you have an open document (some scripts require it).
2.  Ensure you have read/write permissions for the folder where the script is trying to save files.
3.  Check the specific `README` of the script for "Known Limitations".

---

[⬅️ Back to Main Repository](../README.md)
