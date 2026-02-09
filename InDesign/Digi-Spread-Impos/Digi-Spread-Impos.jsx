#target indesign
#targetengine "session"

// =============================================================================
// CONSTANTS
// =============================================================================
var DEFAULT_LOAD_PATH = ""; 
var DEFAULT_SAVE_PATH = "";
var DEFAULT_BASE_NAME = "";
var DEFAULT_DIALOG_POSITION = [1800, 600];
var MAX_FORMAT_DIFFERENCE = 999;
var DEFAULT_PANEL_MARGINS = 20;
var DEFAULT_LABEL_WIDTH = 45;

var REQUIRED_SIGNATURE_MULTIPLE = 8; // Printer's signature requirement

var DEFAULT_MARGINS = {
    inner: 12,
    outer: 4,
    top: 5,
    bottom: 5
};

var DOC_FORMATS_HORIZONTAL = {
    A6: {width: 105, height: 148},
    A5: {width: 148, height: 210},
    A4: {width: 210, height: 297}
};

var IMPOS_DOC_FORMATS = {
    Landscape_SRA3: { width: 450, height: 320 },
    Landscape_A3: {width: 420, height: 297 },
    Landscape_SRA4: { width: 320, height: 225 },
    Landscape_A4: { width: 297, height: 210 },
    Portrait_SRA3: { width: 320, height: 450 },
    Portrait_A3: {width: 297, height: 420 },
    Portrait_SRA4: { width: 225, height: 320 },
    Portrait_A4: { width: 210, height: 297 }
};

// =============================================================================
// MAIN
// =============================================================================
main();

function main() {
    app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;
    app.doScript(showActionWindow, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Import PDF Script");
}

var actionDlg = null;

function showActionWindow() {
    var dlg = new Window("palette", "Print Prep");
    dlg.location = DEFAULT_DIALOG_POSITION;

    // File buttons
    var filePanel = dlg.add("panel", undefined, "File operations");
    filePanel.orientation = "row";
    var btnOpen = filePanel.add("button", undefined, "Load file/s");
    var btnSaveAs = filePanel.add("button", undefined, "Save As");

    btnOpen.onClick = function() {
        openPDFFiles();
    };

    btnSaveAs.onClick = function() {
        saveMyFile();
    };

    // Export buttons
    var exportPanel = dlg.add("panel", undefined, "Export PDF");
    exportPanel.orientation = "column";
    var exportPanelGroup = exportPanel.add("group");
    exportPanelGroup.orientation = "row";
    var btnExport = exportPanelGroup.add("button", undefined, "Export");
    var checkboxBleed = exportPanelGroup.add("checkbox", undefined, "With bleeds");
    checkboxBleed.value = true;

    var presets = app.pdfExportPresets.everyItem().name;
    var dropdownPresets = exportPanel.add("dropdownlist", undefined, presets);
    dropdownPresets.selection = (presets && presets.length > 1) ? 1 : 0;

    btnExport.onClick = function() {
        if (!dropdownPresets.selection) {
            alert("No PDF export preset selected.");
            return;
        }
        exportPdfForOrder(checkboxBleed.value, dropdownPresets.selection.text);
    };

    // Imposition Panel
    var impositionPanel = dlg.add("panel", undefined, "Imposition");
    impositionPanel.orientation = "column";
    var imposBtnGroup = impositionPanel.add("group");
    imposBtnGroup.orientation = "row";

    var btnSpread = imposBtnGroup.add("button", undefined, "Printer's Spread");
    var btnImpos = imposBtnGroup.add("button", undefined, "Impos");

    // Button: Only generate Spread PDF
    btnSpread.onClick = function() {
        var result = createSpreadFile();
        if (result) {
            alert("Spread PDF created successfully:\n" + result.file.fsName);
        }
    };

    // Button: Generate Spread PDF + Imposition
    btnImpos.onClick = function() {
        try {
            var docImposSetup = setImpositionDocumentSize();
            if (!docImposSetup) {
                return;
            }

            var spread = createSpreadFile();
            if (!spread) {
                return;
            }

            var impos = imposition(docImposSetup, spread.file, spread.folder, spread.pages, spread.bleed, 0);
            if (!impos) {
                return;
            }
            drawCropMarks(impos.doc, impos.gridData);

        } catch (e) {
            alert("An error occurred at line " + e.line + ":\n" + e.message);
        }
    };

    dlg.onClose = function() {
        return true;
    };

    dlg.show();
    actionDlg = dlg;
}

// Close dialog when InDesign closes
app.addEventListener("beforeClose", function(event) {
    if (actionDlg && actionDlg instanceof Window && actionDlg.visible) {
        actionDlg.close();
        actionDlg = null;
    }
});

// =============================================================================
// FILE OPERATIONS
// =============================================================================

function openPDFFiles() {
    var folderLoadObj = new Folder(DEFAULT_LOAD_PATH);
    var myFile;

    if (folderLoadObj.exists) {
        myFile = folderLoadObj.openDlg("Load files", "*.pdf", true);
    } else {
        myFile = File.openDialog("Load files", "*.pdf", true);
    }

    if (!myFile) {
        return;
    }

    if (myFile.length > 1) {
        openMultiplePDFFiles(myFile);
    } else {
        openSinglePDFFile(myFile[0]);
    }
}

function openMultiplePDFFiles(myFile) {
    if (!myFile || myFile.length === 0) {
        return;
    }

    // Sort files by number in filename
    myFile.sort(function(a, b) {
        return extractNumber(a.name) - extractNumber(b.name);
    });

    var doc = app.documents.add();
    var sizes = setDocumentSize(myFile[0]);

    if (!sizes) {
        doc.close(SaveOptions.NO);
        return;
    }

    var docSize = sizes.docSize;
    var marginSize = sizes.marginSize;

    setDocumentPreferences(doc, docSize);

    var progressWin = new Window("palette");
    progressWin.text = "Progress...";
    var progressBar = progressWin.add("progressbar", [12, 12, 350, 24], 0, myFile.length);
    progressWin.show();

    app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_MEDIA;
    app.pdfPlacePreferences.transparentBackground = false;

    try {
        for (var i = 0; i < myFile.length; i++) {
            var currentFile = myFile[i];
            var page = (i === 0) ? doc.pages[0] : doc.pages.add();

            setMargins(page, marginSize);
            var placedItem = page.place(currentFile)[0];
            centerContent(placedItem, docSize);
            progressBar.value = i + 1;
        }

        progressWin.close();
        alert("Done. " + myFile.length + " pages loaded.");

    } catch (e) {
        progressWin.close();
        alert("Error loading files at line " + e.line + ":\n" + e.message);
    }
}

function openSinglePDFFile(myFile) {
    if (!myFile) {
        return;
    }

    var sizes = setDocumentSize(myFile);
    if (!sizes) {
        return;
    }

    var docSize = sizes.docSize;
    var marginSize = sizes.marginSize;

    var doc = app.documents.add();
    setDocumentPreferences(doc, docSize);

    var progressWin = new Window("palette", "Processing...");
    var lblStatus = progressWin.add("statictext", undefined, "Loading page: 1...");
    progressWin.show();

    app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_MEDIA;
    app.pdfPlacePreferences.transparentBackground = false;

    var pageCounter = 1;
    var keepGoing = true;

    try {
        while (keepGoing) {
            lblStatus.text = "Loading page: " + pageCounter;
            progressWin.update();

            app.pdfPlacePreferences.pageNumber = pageCounter;
            var page = (pageCounter === 1) ? doc.pages[0] : doc.pages.add();
            setMargins(page, marginSize);

            try {
                var placedItem = page.place(myFile)[0];

                if (placedItem.pdfAttributes.pageNumber != pageCounter) {
                    page.remove();
                    keepGoing = false;
                } else {
                    centerContent(placedItem, docSize);
                    pageCounter++;
                }
            } catch (eInner) {
                if (page.allPageItems.length === 0) {
                    page.remove();
                }
                keepGoing = false;
            }
        }

        progressWin.close();
        alert("Done. " + (pageCounter - 1) + " pages loaded.");

    } catch (e) {
        progressWin.close();
        alert("Error loading file at line " + e.line + ":\n" + e.message);
    }
}

function setDocumentSize(myFile) {
    if (!myFile) {
        return null;
    }

    var tempDoc = app.documents.add();
    var result = null;

    try {
        var tempPage = tempDoc.pages[0];
        app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_MEDIA;
        app.pdfPlacePreferences.pageNumber = 1;

        var myPDF = tempPage.place(myFile)[0];
        var gb = myPDF.geometricBounds;
        var pdfWidth = parseInt(gb[3] - gb[1] + 0.5, 10);
        var pdfHeight = parseInt(gb[2] - gb[0] + 0.5, 10);

        // Find closest format
        var format = "A5";
        var diff = MAX_FORMAT_DIFFERENCE;

        for (var key in DOC_FORMATS_HORIZONTAL) {
            if (DOC_FORMATS_HORIZONTAL.hasOwnProperty(key)) {
                var d = Math.abs(DOC_FORMATS_HORIZONTAL[key].width - pdfWidth);
                if (d < diff) {
                    format = key;
                    diff = d;
                }
            }
        }

        // Create dialog for document size
        var dlgDocSize = new Window("dialog", "Document format");

        // PDF size panel
        var pdfSizePanel = dlgDocSize.add("panel", undefined, "PDF file size");
        pdfSizePanel.orientation = "column";
        pdfSizePanel.alignment = ["fill", "top"];
        pdfSizePanel.alignChildren = "left";
        pdfSizePanel.margins = DEFAULT_PANEL_MARGINS;
        pdfSizePanel.add("statictext", undefined, "Width: " + pdfWidth + " mm");
        pdfSizePanel.add("statictext", undefined, "Height: " + pdfHeight + " mm");

        // Document size panel
        var docSizePanel = dlgDocSize.add("panel", undefined, "Document size");
        docSizePanel.orientation = "column";
        docSizePanel.alignment = ["fill", "top"];
        docSizePanel.alignChildren = "left";
        docSizePanel.margins = DEFAULT_PANEL_MARGINS;

        // Document width
        var widthGroup = docSizePanel.add("group");
        widthGroup.orientation = "row";
        var labelWidth = widthGroup.add("statictext", undefined, "Width: ");
        labelWidth.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var docWidth = widthGroup.add("edittext", undefined, DOC_FORMATS_HORIZONTAL[format].width);
        docWidth.characters = 4;
        widthGroup.add("statictext", undefined, " mm");

        // Document height
        var heightGroup = docSizePanel.add("group");
        heightGroup.orientation = "row";
        var labelHeight = heightGroup.add("statictext", undefined, "Height: ");
        labelHeight.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var docHeight = heightGroup.add("edittext", undefined, DOC_FORMATS_HORIZONTAL[format].height);
        docHeight.characters = 4;
        heightGroup.add("statictext", undefined, " mm");

        // Document bleed
        var bleedGroup = docSizePanel.add("group");
        bleedGroup.orientation = "row";
        var labelBleed = bleedGroup.add("statictext", undefined, "Bleed: ");
        labelBleed.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var bleedField = bleedGroup.add("edittext", undefined, Math.max(0, Math.round(diff / 2)));
        bleedField.characters = 3;
        bleedGroup.add("statictext", undefined, " mm");

        // Margin size panel
        var marginSizePanel = dlgDocSize.add("panel", undefined, "Margin size");
        marginSizePanel.orientation = "column";
        marginSizePanel.alignment = ["fill", "top"];
        marginSizePanel.alignChildren = "left";
        marginSizePanel.margins = DEFAULT_PANEL_MARGINS;

        // Margin inner
        var innerGroup = marginSizePanel.add("group");
        innerGroup.orientation = "row";
        var labelInner = innerGroup.add("statictext", undefined, "Inner: ");
        labelInner.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var innerMargin = innerGroup.add("edittext", undefined, DEFAULT_MARGINS.inner);
        innerMargin.characters = 4;
        innerGroup.add("statictext", undefined, " mm");

        // Margin outer
        var outerGroup = marginSizePanel.add("group");
        outerGroup.orientation = "row";
        var labelOuter = outerGroup.add("statictext", undefined, "Outer: ");
        labelOuter.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var outerMargin = outerGroup.add("edittext", undefined, DEFAULT_MARGINS.outer);
        outerMargin.characters = 4;
        outerGroup.add("statictext", undefined, " mm");

        // Margin top
        var topGroup = marginSizePanel.add("group");
        topGroup.orientation = "row";
        var labelTop = topGroup.add("statictext", undefined, "Top: ");
        labelTop.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var topMargin = topGroup.add("edittext", undefined, DEFAULT_MARGINS.top);
        topMargin.characters = 4;
        topGroup.add("statictext", undefined, " mm");

        // Margin bottom
        var bottomGroup = marginSizePanel.add("group");
        bottomGroup.orientation = "row";
        var labelBottom = bottomGroup.add("statictext", undefined, "Bottom: ");
        labelBottom.preferredSize.width = DEFAULT_LABEL_WIDTH;
        var bottomMargin = bottomGroup.add("edittext", undefined, DEFAULT_MARGINS.bottom);
        bottomMargin.characters = 4;
        bottomGroup.add("statictext", undefined, " mm");

        // Buttons
        var btnDocSizeGroup = dlgDocSize.add("group");
        var btnOK = btnDocSizeGroup.add("button", undefined, "OK");
        var btnCancel = btnDocSizeGroup.add("button", undefined, "Cancel");

        btnOK.onClick = function() {
            var docSize = {
                width: parseFloat(docWidth.text),
                height: parseFloat(docHeight.text),
                bleed: parseFloat(bleedField.text)
            };

            var marginSize = {
                inner: parseFloat(innerMargin.text),
                outer: parseFloat(outerMargin.text),
                top: parseFloat(topMargin.text),
                bottom: parseFloat(bottomMargin.text)
            };

            result = {docSize: docSize, marginSize: marginSize};
            dlgDocSize.close();
        };

        btnCancel.onClick = function() {
            dlgDocSize.close();
        };

        dlgDocSize.show();

    } catch (e) {
        alert("Error in setDocumentSize at line " + e.line + ":\n" + e.message);
    } finally {
        if (tempDoc && tempDoc.isValid) {
            tempDoc.close(SaveOptions.NO);
        }
    }

    return result;
}

function setDocumentPreferences(doc, docSize) {
    if (!doc || !doc.isValid || !docSize) {
        return;
    }

    var prefs = doc.documentPreferences;
    prefs.pageWidth = docSize.width;
    prefs.pageHeight = docSize.height;
    prefs.pageBinding = PageBindingOptions.LEFT_TO_RIGHT;
    prefs.documentBleedBottomOffset = docSize.bleed;
    prefs.documentBleedTopOffset = docSize.bleed;
    prefs.documentBleedInsideOrLeftOffset = docSize.bleed;
    prefs.documentBleedOutsideOrRightOffset = docSize.bleed;
}

function setMargins(page, marginSize) {
    if (!page || !page.isValid || !marginSize) {
        return;
    }

    var isOddPage = (parseInt(page.name, 10) % 2 !== 0);

    page.marginPreferences.top = marginSize.top;
    page.marginPreferences.bottom = marginSize.bottom;

    if (isOddPage) {
        page.marginPreferences.left = marginSize.inner;
        page.marginPreferences.right = marginSize.outer;
    } else {
        page.marginPreferences.left = marginSize.outer;
        page.marginPreferences.right = marginSize.inner;
    }
}

function centerContent(placedItem, docSize) {
    if (!placedItem || !placedItem.isValid || !docSize) {
        return;
    }

    var frame = placedItem.parent;
    var gb = frame.geometricBounds;
    var frameWidth = gb[3] - gb[1];
    var frameHeight = gb[2] - gb[0];
    var xOffset = (docSize.width - frameWidth) / 2;
    var yOffset = (docSize.height - frameHeight) / 2;

    frame.move([xOffset, yOffset]);
}

function saveMyFile() {
    if (app.documents.length === 0) {
        alert("No document is open. Open a document and try again.");
        return;
    }

    var doc = app.activeDocument;
    var targetFolder = new Folder(DEFAULT_SAVE_PATH);
    var userFile;

    if (targetFolder.exists) {
        var defaultFile = new File(targetFolder.fsName + "/" + DEFAULT_BASE_NAME + ".indd");
        userFile = defaultFile.saveDlg("Save as...");
    } else {
        userFile = File.saveDialog("Save as...", "*.indd");
    }

    if (!userFile) {
        return;
    }

    try {
        doc.save(userFile);
        alert("File saved successfully:\n" + userFile.fsName);
    } catch (e) {
        alert("Error saving file at line " + e.line + ":\n" + e.message);
    }
}

// =============================================================================
// EXPORT OPERATIONS
// =============================================================================

function exportPdfForOrder(withBleed, presetName) {
    if (app.documents.length === 0) {
        alert("No document is open. Open a document and try again.");
        return;
    }

    var doc = app.activeDocument;
    var docName = doc.name.replace(/\.indd$/i, "");
    var docFolder = doc.filePath;
    var pdfFileName = docName + " - for order.pdf";
    var pdfFile = new File(docFolder + "/" + pdfFileName);

    var preset = app.pdfExportPresets.item(presetName);
    if (!preset.isValid) {
        alert("PDF preset '" + presetName + "' does not exist. Using default settings.");
        preset = app.pdfExportPresets.item(0);
    }

    var tempPreset = preset.duplicate();
    tempPreset.name = "Temp_Auto_Export_" + new Date().getTime();
    tempPreset.useDocumentBleedWithPDF = withBleed;

    try {
        doc.exportFile(ExportFormat.PDF_TYPE, pdfFile, false, tempPreset);
        alert("PDF was exported:\n" + pdfFile.fsName);
    } catch (e) {
        alert("Error exporting PDF at line " + e.line + ":\n" + e.message);
    } finally {
        if (tempPreset && tempPreset.isValid) {
            tempPreset.remove();
        }
    }
}

// =============================================================================
// SPREAD OPERATIONS
// =============================================================================

function createSpreadFile() {
    if (app.documents.length === 0) {
        alert("No document is open. Open a document and try again.");
        return null;
    }

    var doc = app.activeDocument;

    // Ensure page count is divisible by REQUIRED_SIGNATURE_MULTIPLE (typically 8)
    if (!ensurePagesDivisibleByMultiple(doc, REQUIRED_SIGNATURE_MULTIPLE)) {
        return null;
    }

    var folder = doc.filePath;
    if (!folder) {
        alert("Please save the document first (so it has a folder path).");
        return null;
    }

    var tempPdfFile = new File(folder + "/temp_single_pages.pdf");

    // Set up PDF export preferences
    var basePreset = app.pdfExportPresets.item("[High Quality Print]");
    if (basePreset.isValid) {
        app.pdfExportPreferences.properties = basePreset.properties;
    }

    app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
    app.pdfExportPreferences.viewPDF = false;
    app.pdfExportPreferences.exportReaderSpreads = false;
    app.pdfExportPreferences.useDocumentBleedWithPDF = true;
    app.pdfExportPreferences.bleedMarks = false;
    app.pdfExportPreferences.cropMarks = false;
    app.pdfExportPreferences.registrationMarks = false;
    app.pdfExportPreferences.colorBars = false;
    app.pdfExportPreferences.pageInformationMarks = false;

    // Export single pages
    try {
        doc.exportFile(ExportFormat.PDF_TYPE, tempPdfFile, false);
    } catch (e) {
        alert("Export error at line " + e.line + ":\n" + e.message);
        return null;
    }

    var totalPages = doc.pages.length; // updated after possible additions
    var pageWidth = doc.documentPreferences.pageWidth;
    var pageHeight = doc.documentPreferences.pageHeight;
    var bleed = doc.documentPreferences.documentBleedOutsideOrRightOffset;

    // Create spread document
    var spreadDoc = app.documents.add();
    var prefs = spreadDoc.documentPreferences;
    prefs.pageWidth = pageWidth * 2;
    prefs.pageHeight = pageHeight;
    prefs.facingPages = false;
    prefs.documentBleedTopOffset = bleed;
    prefs.documentBleedBottomOffset = bleed;
    prefs.documentBleedInsideOrLeftOffset = bleed;
    prefs.documentBleedOutsideOrRightOffset = bleed;

    app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_BLEED;
    app.pdfPlacePreferences.transparentBackground = true;

    var leftIndex = totalPages;
    var rightIndex = 1;
    var spreadCounter = 0;

    try {
        while (spreadCounter < Math.ceil(totalPages / 2)) {
            var targetPage = (spreadCounter === 0) ? spreadDoc.pages[0] : spreadDoc.pages.add();

            // Left page (from end)
            app.pdfPlacePreferences.pageNumber = leftIndex;
            var pdfLeft = targetPage.place(tempPdfFile)[0];
            var pdfLeftFrame = pdfLeft.parent;
            var gbLeft = pdfLeftFrame.geometricBounds;
            pdfLeftFrame.geometricBounds = [gbLeft[0], gbLeft[1], gbLeft[2], gbLeft[3] - bleed];
            pdfLeftFrame.move([-bleed, -bleed]);

            // Right page (from start)
            app.pdfPlacePreferences.pageNumber = rightIndex;
            var pdfRight = targetPage.place(tempPdfFile)[0];
            var pdfRightFrame = pdfRight.parent;
            var gbRight = pdfRightFrame.geometricBounds;
            pdfRightFrame.geometricBounds = [gbRight[0], gbRight[1] + bleed, gbRight[2], gbRight[3]];
            var rightWidth = pdfRightFrame.geometricBounds[3] - pdfRightFrame.geometricBounds[1];
            pdfRightFrame.move([rightWidth - bleed, -bleed]);

            // Spread order logic
            if (spreadCounter % 2 === 0) {
                leftIndex--;
                rightIndex++;
            } else {
                leftIndex++;
                rightIndex--;
            }

            // Swap indices for next iteration
            var tempRightIndex = rightIndex;
            rightIndex = leftIndex;
            leftIndex = tempRightIndex;

            spreadCounter++;
        }

    } catch (e) {
        alert("Error creating spread at line " + e.line + ":\n" + e.message);
        spreadDoc.close(SaveOptions.NO);
        if (tempPdfFile.exists) {
            tempPdfFile.remove();
        }
        return null;
    }

    // Export spread
    var spreadFile = new File(folder + "/spread_file.pdf");
    try {
        spreadDoc.exportFile(ExportFormat.PDF_TYPE, spreadFile, false);
    } catch (e) {
        alert("Spread export error at line " + e.line + ":\n" + e.message);
        spreadDoc.close(SaveOptions.NO);
        if (tempPdfFile.exists) {
            tempPdfFile.remove();
        }
        return null;
    }

    spreadDoc.close(SaveOptions.NO);

    // Clean up temporary file
    if (tempPdfFile.exists) {
        tempPdfFile.remove();
    }

    return {
        file: spreadFile,
        folder: folder,
        pages: Math.ceil(totalPages / 2),
        bleed: bleed
    };
}

function ensurePagesDivisibleByMultiple(doc, multiple) {
    if (!doc || !doc.isValid) {
        alert("No valid document.");
        return false;
    }

    if (!multiple || multiple < 2) {
        return true;
    }

    var totalPages = doc.pages.length;
    var remainder = totalPages % multiple;

    if (remainder === 0) {
        return true;
    }

    var pagesNeeded = multiple - remainder;
    var confirmMsg = "The page count (" + totalPages + ") is not divisible by " + multiple + ".\n" +
                     "Do you want to add " + pagesNeeded + " blank pages to reach " + (totalPages + pagesNeeded) + "?\n\n" +
                     "Note: This will modify the current InDesign document.";

    if (!confirm(confirmMsg)) {
        return false;
    }

    try {
        addBlankPagesToEnd(doc, pagesNeeded);
        return true;
    } catch (e) {
        alert("Error adding pages at line " + e.line + ":\n" + e.message);
        return false;
    }
}

function addBlankPagesToEnd(doc, count) {
    if (!count || count <= 0) {
        return;
    }

    var refPage = doc.pages[doc.pages.length - 1];

    for (var i = 0; i < count; i++) {
        var newPage = doc.pages.add(LocationOptions.AT_END);
        copyMarginPreferences(refPage, newPage);
        // Leave page empty by design.
    }
}

function copyMarginPreferences(fromPage, toPage) {
    if (!fromPage || !fromPage.isValid || !toPage || !toPage.isValid) {
        return;
    }

    try {
        var mFrom = fromPage.marginPreferences;
        var mTo = toPage.marginPreferences;
        mTo.top = mFrom.top;
        mTo.bottom = mFrom.bottom;
        mTo.left = mFrom.left;
        mTo.right = mFrom.right;
    } catch (e) {
        // If margin prefs cannot be copied for any reason, ignore.
    }
}

// =============================================================================
// IMPOSITION OPERATIONS
// =============================================================================

function setImpositionDocumentSize() {
    if (app.documents.length === 0) {
        alert("No document is open. Open a document and try again.");
        return null;
    }

    var doc = app.activeDocument;
    var docPrefs = doc.documentPreferences;
    var docWidth = docPrefs.pageWidth;
    var docHeight = docPrefs.pageHeight;
    var bleedTop = docPrefs.documentBleedTopOffset;
    var bleedBottom = docPrefs.documentBleedBottomOffset;
    var bleedOutside = docPrefs.documentBleedOutsideOrRightOffset;

    var spreadWidth = (docWidth * 2) + (bleedOutside * 2);
    var spreadHeight = docHeight + bleedTop + bleedBottom;

    var dlgImposDocSize = new Window("dialog", "Imposition document format");
    dlgImposDocSize.orientation = "column";

    var imposDocSizePanel = dlgImposDocSize.add("panel", undefined, "Imposition size");
    imposDocSizePanel.margins = DEFAULT_PANEL_MARGINS;

    var imposDocSizeDropdownlist = imposDocSizePanel.add("dropdownlist");
    imposDocSizeDropdownlist.preferredSize.width = 320;

    // Calculate acceptable formats
    for (var key in IMPOS_DOC_FORMATS) {
        if (IMPOS_DOC_FORMATS.hasOwnProperty(key)) {
            var row = Math.floor(IMPOS_DOC_FORMATS[key].height / spreadHeight);
            var col = Math.floor(IMPOS_DOC_FORMATS[key].width / spreadWidth);
            var numberOfItems = row * col;

            if (numberOfItems > 0) {
                var labelText = key.replace("_", " ") + " (" + numberOfItems + " items)";
                var listItem = imposDocSizeDropdownlist.add("item", labelText);
                listItem.imposDocKey = key;
                listItem.row = row;
                listItem.col = col;
            }
        }
    }

    if (imposDocSizeDropdownlist.items.length > 0) {
        imposDocSizeDropdownlist.selection = 0;
    } else {
        alert("No suitable imposition format found for this spread size.");
        return null;
    }

    var buttonGroup = dlgImposDocSize.add("group");
    var buttonOK = buttonGroup.add("button", undefined, "OK");
    var buttonCancel = buttonGroup.add("button", undefined, "Cancel");

    var result = null;

    buttonOK.onClick = function() {
        var selectedKey = imposDocSizeDropdownlist.selection.imposDocKey;
        var size = IMPOS_DOC_FORMATS[selectedKey];
        result = {
            width: size.width,
            height: size.height,
            row: imposDocSizeDropdownlist.selection.row,
            col: imposDocSizeDropdownlist.selection.col
        };
        dlgImposDocSize.close();
    };

    buttonCancel.onClick = function() {
        dlgImposDocSize.close();
    };

    dlgImposDocSize.show();
    return result;
}

function imposition(docImposSetup, sourcePdf, currentFolder, numberOfPages, bleed, offset) {
    if (!docImposSetup || !sourcePdf || !sourcePdf.exists) {
        alert("Invalid imposition parameters.");
        return null;
    }

    var doc = app.documents.add();
    var prefs = doc.documentPreferences;
    prefs.pageWidth = docImposSetup.width;
    prefs.pageHeight = docImposSetup.height;
    prefs.facingPages = false;

    app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_BLEED;
    app.pdfPlacePreferences.transparentBackground = true;

    var pdfWidth = 0;
    var pdfHeight = 0;
    var moveX = 0;
    var moveY = 0;

    try {
        for (var i = 0; i < numberOfPages; i++) {
            var targetPage = (i === 0) ? doc.pages[0] : doc.pages.add();
            app.pdfPlacePreferences.pageNumber = i + 1;
            var pdf = targetPage.place(sourcePdf)[0];

            var pdfBounds = pdf.geometricBounds;
            pdfWidth = pdfBounds[3] - pdfBounds[1];
            pdfHeight = pdfBounds[2] - pdfBounds[0];
            var pdfFrame = pdf.parent;

            // Calculate centering
            moveX = (docImposSetup.width - pdfWidth * docImposSetup.col) / 2;
            moveY = (docImposSetup.height - pdfHeight * docImposSetup.row) / 2;
            pdfFrame.move([moveX, moveY]);

            // Duplicate items in grid
            for (var r = 0; r < docImposSetup.row; r++) {
                for (var c = 0; c < docImposSetup.col; c++) {
                    if (r === 0 && c === 0) continue;
                    var duplicate = pdfFrame.duplicate();
                    duplicate.move(undefined, [pdfWidth * c, pdfHeight * r]);
                }
            }
        }

    } catch (e) {
        alert("Error in imposition at line " + e.line + ":\n" + e.message);
        doc.close(SaveOptions.NO);
        return null;
    }

    var gridData = {
        col: docImposSetup.col,
        row: docImposSetup.row,
        itemWidth: pdfWidth - (bleed * 2),
        itemHeight: pdfHeight - (bleed * 2),
        marginX: moveX,
        marginY: moveY,
        bleed: bleed,
        offset: bleed === 0 ? 3 : 0
    };

    // Note: The source PDF (spread file) is NOT removed because it is linked in the InDesign document.

    return { doc: doc, gridData: gridData };
}

function drawCropMarks(imposDoc, gridData) {
    if (!imposDoc || !imposDoc.isValid || !gridData) {
        return;
    }

    var doc = imposDoc;
    var layer = doc.layers.add({name: "Print Marks"});
    layer.layerColor = UIColors.BLACK;

    var masterSpread = doc.masterSpreads.item(0);
    var masterPage = masterSpread.pages.item(0);

    var marksColorName = "Registration";
    var marksLength = 5;
    var marksWeight = 0.25;

    var startX = gridData.marginX;
    var startY = gridData.marginY;
    var gridCol = gridData.col;
    var gridRow = gridData.row;
    var itemWidth = gridData.itemWidth;
    var itemHeight = gridData.itemHeight;
    var bleed = gridData.bleed;
    var offset = gridData.offset;

    var registrationColor = doc.swatches.item(marksColorName);
    if (!registrationColor.isValid) {
        alert("Registration color not found. Crop marks will not be created.");
        return;
    }

    try {
        // Vertical marks
        for (var i = 0; i < gridCol; i++) {
            var positionTopX = startX + bleed + ((bleed * 2 + itemWidth) * i);
            var positionTopY = startY - offset;

            var markTopLeft = masterPage.graphicLines.add(layer);
            markTopLeft.geometricBounds = [positionTopY, positionTopX, positionTopY - marksLength, positionTopX];
            markTopLeft.strokeColor = registrationColor;
            markTopLeft.strokeWeight = marksWeight;

            var markTopRight = markTopLeft.duplicate();
            markTopRight.move(undefined, [itemWidth, 0]);

            var markBottomLeft = markTopLeft.duplicate();
            markBottomLeft.move(undefined, [0, (bleed * 2 + itemHeight) * gridRow + marksLength + (offset * 2)]);

            var markBottomRight = markTopRight.duplicate();
            markBottomRight.move(undefined, [0, (bleed * 2 + itemHeight) * gridRow + marksLength + (offset * 2)]);
        }

        // Horizontal marks
        for (var j = 0; j < gridRow; j++) {
            var positionLeftY = startY + bleed + ((bleed * 2 + itemHeight) * j);
            var positionLeftX = startX - offset;

            var markLeftTop = masterPage.graphicLines.add(layer);
            markLeftTop.geometricBounds = [positionLeftY, positionLeftX, positionLeftY, positionLeftX - marksLength];
            markLeftTop.strokeColor = registrationColor;
            markLeftTop.strokeWeight = marksWeight;

            var markLeftBottom = markLeftTop.duplicate();
            markLeftBottom.move(undefined, [0, itemHeight]);

            var markRightTop = markLeftTop.duplicate();
            markRightTop.move(undefined, [(bleed * 2 + itemWidth) * gridCol + marksLength + (offset * 2), 0]);

            var markRightBottom = markLeftBottom.duplicate();
            markRightBottom.move(undefined, [(bleed * 2 + itemWidth) * gridCol + marksLength + (offset * 2), 0]);
        }

    } catch (e) {
        alert("Error drawing crop marks at line " + e.line + ":\n" + e.message);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function extractNumber(filename) {
    var cleanName = decodeURI(filename);
    var regex = /(\d+)(?!.*\d)/;
    var match = cleanName.match(regex);

    if (match) {
        return parseInt(match[0], 10);
    }

    // Fallback: sort alphabetically if no number found
    return cleanName.toLowerCase().charCodeAt(0) * 1000;
}
