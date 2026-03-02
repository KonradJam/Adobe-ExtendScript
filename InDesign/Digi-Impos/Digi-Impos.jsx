#target indesign
#targetengine "session"

// =============================================================================
// CONSTANTS
// =============================================================================

var DEFAULT_DIALOG_POSITION = [1800, 600];
var DEFAULT_PANEL_MARGINS = 15; // Increased for better look
var SAFE_MARGIN = 5; 

var IMPOS_DOC_FORMATS = {
    Landscape_SRA3: { width: 450, height: 320 },
    Landscape_A3:   { width: 420, height: 297 },
    Landscape_SRA4: { width: 320, height: 225 },
    Landscape_A4:   { width: 297, height: 210 },
    Portrait_SRA3:  { width: 320, height: 450 },
    Portrait_A3:    { width: 297, height: 420 },
    Portrait_SRA4:  { width: 225, height: 320 },
    Portrait_A4:    { width: 210, height: 297 }
};

// =============================================================================
// MAIN
// =============================================================================

main();

function main() {
    var userScriptUnit = app.scriptPreferences.measurementUnit;
    var userHorizontalUnit = app.viewPreferences.horizontalMeasurementUnits;
    var userVerticalUnit = app.viewPreferences.verticalMeasurementUnits;
    
    app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;
    app.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
    app.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;
    
    var actionDlg = null;
    
    function showActionWindow() {
        var dlg = new Window("palette", "Digi-Impos");
        dlg.location = DEFAULT_DIALOG_POSITION;
        
        var commonCutPanel = dlg.add("panel", undefined, "Common Cut");
        commonCutPanel.orientation = "column";
        commonCutPanel.alignChildren = "left";
        // Apply larger margins for better cosmetics
        commonCutPanel.margins = DEFAULT_PANEL_MARGINS; 
        
        var checkboxHorizontal = commonCutPanel.add("checkbox", undefined, "Horizontal Common Cut");
        checkboxHorizontal.value = false;
        
        var checkboxVertical = commonCutPanel.add("checkbox", undefined, "Vertical Common Cut");
        checkboxVertical.value = false;
        
        var btnImpos = dlg.add("button", undefined, "Impos");
        
        btnImpos.onClick = function() {
            if (app.documents.length === 0) {
                alert("No document is open. Please open a file first.");
                return;
            }

            var doc = app.activeDocument;
            
            if (!doc.saved || !doc.filePath) {
                alert("Please save the document first.");
                return;
            }

            var useHorizontalCut = checkboxHorizontal.value;
            var useVerticalCut = checkboxVertical.value;

            var itemSize = getItemSize(doc);
            
            var selection = showFormatSelectionDialog(itemSize, useHorizontalCut, useVerticalCut);

            if (selection) {
                try {
                    performImposition(doc, selection, itemSize, useHorizontalCut, useVerticalCut);
                    // No alert on success, just finish silently
                } catch(e) {
                    alert("Error during imposition at line " + e.line + ":\n" + e.message);
                }
            }
        };
        
        dlg.onClose = function() {
            try {
                app.scriptPreferences.measurementUnit = userScriptUnit;
                app.viewPreferences.horizontalMeasurementUnits = userHorizontalUnit;
                app.viewPreferences.verticalMeasurementUnits = userVerticalUnit;
            } catch(e) { /* ignore */ }
            return true;
        };
        
        dlg.show();
        actionDlg = dlg;
    }
    
    app.doScript(showActionWindow, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Commercial Imposition Script");
    
    app.addEventListener("beforeClose", function(event) {
        if (actionDlg && actionDlg instanceof Window && actionDlg.visible) {
            actionDlg.close();
        }
    });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getItemSize(doc) {
    var prefs = doc.documentPreferences;
    
    var w = prefs.pageWidth;
    var h = prefs.pageHeight;
    
    var bTop = prefs.documentBleedTopOffset;
    var bBottom = prefs.documentBleedBottomOffset;
    var bLeft = prefs.documentBleedInsideOrLeftOffset;
    var bRight = prefs.documentBleedOutsideOrRightOffset;
    
    var totalWidth = w + bLeft + bRight;
    var totalHeight = h + bTop + bBottom;
    
    return {
        width: totalWidth,
        height: totalHeight,
        pageWidth: w,
        pageHeight: h,
        bleedTop: bTop,
        bleedBottom: bBottom,
        bleedLeft: bLeft,
        bleedRight: bRight
    };
}

function showFormatSelectionDialog(itemSize, horizontalCut, verticalCut) {
    var dlg = new Window("dialog", "Imposition Document Format");
    dlg.orientation = "column";
    
    var panel = dlg.add("panel", undefined, "Select Output Sheet");
    panel.alignChildren = "left";
    panel.margins = 20;
    
    var dropdown = panel.add("dropdownlist");
    dropdown.preferredSize.width = 400;
    
    var validOptions = 0;
    
    for (var key in IMPOS_DOC_FORMATS) {
        if (IMPOS_DOC_FORMATS.hasOwnProperty(key)) {
            var paper = IMPOS_DOC_FORMATS[key];
            
            var usableWidth = paper.width - SAFE_MARGIN;
            var usableHeight = paper.height - SAFE_MARGIN;
            
            var cols = 0;
            var rows = 0;
            
            if (verticalCut) {
                var availableForPagesW = usableWidth - (itemSize.bleedLeft + itemSize.bleedRight);
                if (availableForPagesW > 0) {
                    cols = Math.floor(availableForPagesW / itemSize.pageWidth);
                }
            } else {
                cols = Math.floor(usableWidth / itemSize.width);
            }
            
            if (horizontalCut) {
                var availableForPagesH = usableHeight - (itemSize.bleedTop + itemSize.bleedBottom);
                if (availableForPagesH > 0) {
                    rows = Math.floor(availableForPagesH / itemSize.pageHeight);
                }
            } else {
                rows = Math.floor(usableHeight / itemSize.height);
            }
            
            var totalItems = cols * rows;
            
            if (totalItems > 0) {
                // CLEANED UP LABEL: Removed dimensions in brackets
                var label = key.replace("_", " ");
                label += " -> " + totalItems + " items (" + cols + " x " + rows + ")";
                
                var item = dropdown.add("item", label);
                
                item.paperData = {
                    key: key,
                    width: paper.width,
                    height: paper.height,
                    row: rows,
                    col: cols
                };
                validOptions++;
            }
        }
    }
    
    if (validOptions === 0) {
        alert("The document is too large for any defined paper size!");
        dlg.close();
        return null;
    }
    
    dropdown.selection = 0;
    
    var btnGroup = dlg.add("group");
    var btnOK = btnGroup.add("button", undefined, "OK");
    var btnCancel = btnGroup.add("button", undefined, "Cancel");
    
    var result = null;
    
    btnOK.onClick = function() {
        result = dropdown.selection.paperData;
        dlg.close();
    };
    
    btnCancel.onClick = function() {
        dlg.close();
    };
    
    dlg.show();
    return result;
}

// =============================================================================
// IMPOSITION LOGIC
// =============================================================================

function performImposition(sourceDoc, paperSelection, itemSize, horizontalCut, verticalCut) {
    var totalPages = sourceDoc.pages.length;
    
    var pdfFile = exportSourceToPDF(sourceDoc);
    if (!pdfFile || !pdfFile.exists) throw new Error("PDF export failed");
    
    var imposDoc = createImpositionDocument(paperSelection);
    
    var contentLayer = imposDoc.layers.item(0);
    contentLayer.name = "Imposition";
    var marksLayer = imposDoc.layers.add({name: "Print Marks"});
    
    var gapY = horizontalCut ? 0 : (itemSize.bleedTop + itemSize.bleedBottom);
    var gapX = verticalCut ? 0 : (itemSize.bleedLeft + itemSize.bleedRight);
    
    var totalGridWidth = 0;
    if (verticalCut) {
        totalGridWidth = (paperSelection.col * itemSize.pageWidth) + itemSize.bleedLeft + itemSize.bleedRight;
    } else {
        totalGridWidth = paperSelection.col * itemSize.width;
    }
    
    var totalGridHeight = 0;
    if (horizontalCut) {
        totalGridHeight = (paperSelection.row * itemSize.pageHeight) + itemSize.bleedTop + itemSize.bleedBottom;
    } else {
        totalGridHeight = paperSelection.row * itemSize.height;
    }
    
    var startX = (paperSelection.width - totalGridWidth) / 2;
    var startY = (paperSelection.height - totalGridHeight) / 2;
    
    var gridData = {
        startX: startX,
        startY: startY,
        cols: paperSelection.col,
        rows: paperSelection.row,
        pageWidth: itemSize.pageWidth,
        pageHeight: itemSize.pageHeight,
        bleedLeft: itemSize.bleedLeft,
        bleedRight: itemSize.bleedRight,
        bleedTop: itemSize.bleedTop,
        bleedBottom: itemSize.bleedBottom,
        gapX: gapX,
        gapY: gapY,
        hCut: horizontalCut, 
        vCut: verticalCut   
    };
    
    for (var i = 0; i < totalPages; i++) {
        var targetPage = (i === 0) ? imposDoc.pages[0] : imposDoc.pages.add();
        placeAndGridPDF_CommonCut(targetPage, pdfFile, i + 1, paperSelection, gridData, contentLayer);
        drawCropMarks_CommonCut(targetPage, marksLayer, gridData);
    }
}

function placeAndGridPDF_CommonCut(targetPage, pdfFile, pdfPageNum, paperSelection, gridData, layer) {
    app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_BLEED;
    app.pdfPlacePreferences.transparentBackground = true;
    app.pdfPlacePreferences.pageNumber = pdfPageNum;
    
    var startX = gridData.startX;
    var startY = gridData.startY;
    var pageW = gridData.pageWidth;
    var pageH = gridData.pageHeight;
    var bL = gridData.bleedLeft;
    var bR = gridData.bleedRight;
    var bT = gridData.bleedTop;
    var bB = gridData.bleedBottom;
    var gapX = gridData.gapX;
    var gapY = gridData.gapY;
    var hCut = gridData.hCut; 
    var vCut = gridData.vCut; 

    for (var row = 0; row < paperSelection.row; row++) {
        for (var col = 0; col < paperSelection.col; col++) {
            app.pdfPlacePreferences.pageNumber = pdfPageNum;
            
            var currentTrimX = startX + bL + (col * (pageW + gapX));
            var currentTrimY = startY + bT + (row * (pageH + gapY));
            
            var placedPDF = targetPage.place(pdfFile, undefined, layer)[0];
            var frame = placedPDF.parent;
            
            var naturalX = currentTrimX - bL;
            var naturalY = currentTrimY - bT;
            frame.move([naturalX, naturalY]);
            
            var geom = frame.geometricBounds;
            
            if (vCut) {
                if (col > 0) geom[1] += bL; 
                if (col < paperSelection.col - 1) geom[3] -= bR;
            }
            
            if (hCut) {
                if (row > 0) geom[0] += bT;
                if (row < paperSelection.row - 1) geom[2] -= bB;
            }
            
            frame.geometricBounds = geom;
        }
    }
}

// =============================================================================
// CROP MARKS
// =============================================================================

function drawCropMarks_CommonCut(page, layer, gridData) {
    var markLen = 5;
    var markWeight = 0.1;
    var doc = page.parent.parent;
    
    var regColor = doc.swatches.item("Registration");
    if (!regColor.isValid) regColor = doc.swatches.item("Black");
    
    var startX = gridData.startX;
    var startY = gridData.startY;
    var cols = gridData.cols;
    var rows = gridData.rows;
    var pageW = gridData.pageWidth;
    var pageH = gridData.pageHeight;
    var bL = gridData.bleedLeft;
    var bR = gridData.bleedRight;
    var bT = gridData.bleedTop;
    var bB = gridData.bleedBottom;
    var gapX = gridData.gapX;
    var gapY = gridData.gapY;
    
    var offsetTop = (bT > 0) ? 0 : 3;
    var offsetBottom = (bB > 0) ? 0 : 3;
    var offsetLeft = (bL > 0) ? 0 : 3;
    var offsetRight = (bR > 0) ? 0 : 3;

    // 1. VERTICAL MARKS
    for (var c = 0; c < cols; c++) {
        var currentTrimX = startX + bL + (c * (pageW + gapX));
        var cutX_Left = currentTrimX;
        var cutX_Right = currentTrimX + pageW;
        
        var blockBottom = startY + bT + ((rows-1) * (pageH + gapY)) + pageH + bB;
        
        var mkTL = page.graphicLines.add(layer);
        mkTL.geometricBounds = [startY - offsetTop - markLen, cutX_Left, startY - offsetTop, cutX_Left];
        mkTL.strokeColor = regColor;
        mkTL.strokeWeight = markWeight;
        
        var mkTR = page.graphicLines.add(layer);
        mkTR.geometricBounds = [startY - offsetTop - markLen, cutX_Right, startY - offsetTop, cutX_Right];
        mkTR.strokeColor = regColor;
        mkTR.strokeWeight = markWeight;
        
        var mkBL = page.graphicLines.add(layer);
        mkBL.geometricBounds = [blockBottom + offsetBottom, cutX_Left, blockBottom + offsetBottom + markLen, cutX_Left];
        mkBL.strokeColor = regColor;
        mkBL.strokeWeight = markWeight;
        
        var mkBR = page.graphicLines.add(layer);
        mkBR.geometricBounds = [blockBottom + offsetBottom, cutX_Right, blockBottom + offsetBottom + markLen, cutX_Right];
        mkBR.strokeColor = regColor;
        mkBR.strokeWeight = markWeight;
    }
    
    // 2. HORIZONTAL MARKS
    for (var r = 0; r < rows; r++) {
        var currentTrimY = startY + bT + (r * (pageH + gapY));
        var cutY_Top = currentTrimY;
        var cutY_Bottom = currentTrimY + pageH;
        
        var blockRight = startX + bL + ((cols-1) * (pageW + gapX)) + pageW + bR;
        
        var mkLT = page.graphicLines.add(layer);
        mkLT.geometricBounds = [cutY_Top, startX - offsetLeft - markLen, cutY_Top, startX - offsetLeft];
        mkLT.strokeColor = regColor;
        mkLT.strokeWeight = markWeight;
        
        var mkLB = page.graphicLines.add(layer);
        mkLB.geometricBounds = [cutY_Bottom, startX - offsetLeft - markLen, cutY_Bottom, startX - offsetLeft];
        mkLB.strokeColor = regColor;
        mkLB.strokeWeight = markWeight;
        
        var mkRT = page.graphicLines.add(layer);
        mkRT.geometricBounds = [cutY_Top, blockRight + offsetRight, cutY_Top, blockRight + offsetRight + markLen];
        mkRT.strokeColor = regColor;
        mkRT.strokeWeight = markWeight;
        
        var mkRB = page.graphicLines.add(layer);
        mkRB.geometricBounds = [cutY_Bottom, blockRight + offsetRight, cutY_Bottom, blockRight + offsetRight + markLen];
        mkRB.strokeColor = regColor;
        mkRB.strokeWeight = markWeight;
    }
}

function exportSourceToPDF(doc) {
    var folder = doc.filePath;
    var docName = doc.name.replace(/\.indd$/i, "");
    var pdfFile = new File(folder + "/" + docName + ".pdf");
    
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
    
    doc.exportFile(ExportFormat.PDF_TYPE, pdfFile, false);
    return pdfFile;
}

function createImpositionDocument(paperSelection) {
    var doc = app.documents.add();
    var prefs = doc.documentPreferences;
    
    prefs.pageWidth = paperSelection.width;
    prefs.pageHeight = paperSelection.height;
    prefs.facingPages = false;
    prefs.documentBleedTopOffset = 0;
    prefs.documentBleedBottomOffset = 0;
    prefs.documentBleedInsideOrLeftOffset = 0;
    prefs.documentBleedOutsideOrRightOffset = 0;
    
    return doc;
}
