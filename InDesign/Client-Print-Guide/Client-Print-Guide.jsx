// @target indesign

/******************************************************************************
 * PDF IMPORT WITH MARGIN, TRIM FRAMES, BLEED LINE, DIMENSIONS, AND CUT SIMULATION
 ******************************************************************************/

// ==============================================================================
// CONSTANTS
// ==============================================================================

var MARGIN_FRAME_COLOR = [0, 180, 0];
var TRIM_FRAME_COLOR = [255, 0, 0];
var BLEED_LINE_COLOR = [0, 0, 0];
var DIMENSION_COLOR = [0, 100, 255];

var INFO_BG_COLOR = [235, 235, 255];
var INFO_ACCENT_COLOR = [0, 100, 255];
var WARN_BG_COLOR = [255, 250, 220];
var WARN_ACCENT_COLOR = [255, 165, 0];
var DANGER_BG_COLOR = [255, 235, 235];
var DANGER_ACCENT_COLOR = [255, 0, 0];

var FRAME_STROKE_WEIGHT = 0.5;
var CANVAS_MARGIN_TOP = 40;
var CANVAS_MARGIN_BOTTOM = 30;
var CANVAS_MARGIN_LEFT = 40;
var CANVAS_MARGIN_RIGHT = 80;
var CUT_OFFSET = 15;

// ==============================================================================
// MAIN
// ==============================================================================

function main() {
    var userScriptUnit = app.scriptPreferences.measurementUnit;
    app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;

    try {
        if (app.documents.length === 0) {
            alert("No document is open. Please open a document first.");
            return;
        }

        var sourceDoc = app.activeDocument;

        try {
            sourceDoc.fullName;
        } catch (e) {
            alert("Please save the document first.");
            return;
        }

        var options = showUI();
        if (options === null) return;

        var dimensions = getDocumentDimensions(sourceDoc);

        var pdfFile = exportToPDF(sourceDoc);
        if (!pdfFile || !pdfFile.exists) {
            throw new Error("PDF export failed.");
        }

        var newDoc = createNewDocument(dimensions, options);
        importPDFToDocument(newDoc, pdfFile, dimensions, options);

        var isMarginDrawn = false;
        var isTrimDrawn = false;
        var isBleedDrawn = false;

        // Draw frames based on user selection and available document dimensions
        if (options.frames.safeMarginFrame && 
           (dimensions.marginTop > 0 || dimensions.marginBottom > 0 || dimensions.marginLeft > 0 || dimensions.marginRight > 0)) {
            drawMarginFrame(newDoc, dimensions);
            isMarginDrawn = true;
        }

        if (options.frames.trimFrame) {
            drawTrimFrame(newDoc, dimensions);
            isTrimDrawn = true;
        }

        if (options.frames.bleedLine && 
           (dimensions.bleedTop > 0 || dimensions.bleedBottom > 0 || dimensions.bleedLeft > 0 || dimensions.bleedRight > 0)) {
            drawBleedLine(newDoc, dimensions);
            isBleedDrawn = true;
        }

        // Draw scissors on top of everything
        if (options.frames.trimFrame) {
            drawScissorsIcon(newDoc, dimensions, TRIM_FRAME_COLOR);
        }

        drawDimensions(newDoc, dimensions, options);

        if (options.panels.info || options.panels.warning || options.panels.danger) {
            drawInfoPanel(newDoc, dimensions, options);
        }

        drawLegend(newDoc, dimensions, isMarginDrawn, isTrimDrawn, isBleedDrawn, options);

        alert("Process completed successfully.");

    } catch (e) {
        alert("Error: " + e.message + "\nLine: " + e.line);
    } finally {
        app.scriptPreferences.measurementUnit = userScriptUnit;
    }
}

// ==============================================================================
// UI
// ==============================================================================

function showUI() {
    var win = new Window("dialog", "Client Print Guide");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 15;

    var dimPanel = win.add("panel", undefined, "Dimensions");
    dimPanel.orientation = "column";
    dimPanel.alignChildren = ["left", "top"];
    dimPanel.margins = 15;
    var cbTrimSize = dimPanel.add("checkbox", undefined, "Trim Size");
    cbTrimSize.value = true;
    var cbBleedSize = dimPanel.add("checkbox", undefined, "Bleed Size");
    cbBleedSize.value = true;
    var cbBleedAllowance = dimPanel.add("checkbox", undefined, "Total Project Size");
    cbBleedAllowance.value = true;
    var cbSafeMargin = dimPanel.add("checkbox", undefined, "Safe Area");
    cbSafeMargin.value = true;

    var framesPanel = win.add("panel", undefined, "Frames");
    framesPanel.orientation = "column";
    framesPanel.alignChildren = ["left", "top"];
    framesPanel.margins = 15;
    var cbSafeMarginFrame = framesPanel.add("checkbox", undefined, "Safe Area Frame");
    cbSafeMarginFrame.value = true;
    var cbTrimFrame = framesPanel.add("checkbox", undefined, "Trim Frame (with scissors)");
    cbTrimFrame.value = true;
    var cbBleedLine = framesPanel.add("checkbox", undefined, "Bleed Frame");
    cbBleedLine.value = true;

    var infoPanel = win.add("panel", undefined, "Information Panels");
    infoPanel.orientation = "column";
    infoPanel.alignChildren = ["left", "top"];
    infoPanel.margins = 15;
    var cbInfo = infoPanel.add("checkbox", undefined, "Info");
    cbInfo.value = false;
    var cbWarning = infoPanel.add("checkbox", undefined, "Warning");
    cbWarning.value = false;
    var cbDanger = infoPanel.add("checkbox", undefined, "Danger");
    cbDanger.value = false;

    var cbSimulateCut = win.add("checkbox", undefined, "Simulate Right Bleed Cut");
    cbSimulateCut.value = false;
    cbSimulateCut.margins = [0, 5, 0, 5]; 

    var btnGroup = win.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignment = "right";
    btnGroup.add("button", undefined, "OK", {name: "ok"});
    btnGroup.add("button", undefined, "Cancel", {name: "cancel"});

    if (win.show() !== 1) return null;

    return {
        dimensions: {
            trimSize: cbTrimSize.value,
            bleedSize: cbBleedSize.value,
            bleedAllowance: cbBleedAllowance.value,
            safeMargin: cbSafeMargin.value
        },
        frames: {
            safeMarginFrame: cbSafeMarginFrame.value,
            trimFrame: cbTrimFrame.value,
            bleedLine: cbBleedLine.value
        },
        panels: {
            info: cbInfo.value,
            warning: cbWarning.value,
            danger: cbDanger.value
        },
        simulateCut: cbSimulateCut.value
    };
}

// ==============================================================================
// DOCUMENT / PDF OPERATIONS
// ==============================================================================

function getDocumentDimensions(doc) {
    var prefs = doc.documentPreferences;
    var sourcePage = doc.pages[0];
    var marginPrefs = sourcePage.marginPreferences;

    return {
        pageWidth: prefs.pageWidth,
        pageHeight: prefs.pageHeight,
        bleedTop: prefs.documentBleedTopOffset,
        bleedBottom: prefs.documentBleedBottomOffset,
        bleedLeft: prefs.documentBleedInsideOrLeftOffset,
        bleedRight: prefs.documentBleedOutsideOrRightOffset,
        marginTop: marginPrefs.top,
        marginBottom: marginPrefs.bottom,
        marginLeft: marginPrefs.left,
        marginRight: marginPrefs.right,
        totalWidth: prefs.pageWidth + prefs.documentBleedInsideOrLeftOffset + prefs.documentBleedOutsideOrRightOffset,
        totalHeight: prefs.pageHeight + prefs.documentBleedTopOffset + prefs.documentBleedBottomOffset
    };
}

function exportToPDF(doc) {
    var folderPath = doc.filePath.fsName;
    var docName = doc.name.replace(/\.(indd|indt)$/i, "");
    var pdfFile = new File(folderPath + "/" + docName + "- preview.pdf");

    try {
        var basePreset = app.pdfExportPresets.item("[High Quality Print]");
        if (basePreset.isValid) {
            app.pdfExportPreferences.properties = basePreset.properties;
        }
    } catch (e) {}

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

function createNewDocument(dimensions, options) {
    var doc = app.documents.add();
    var prefs = doc.documentPreferences;
    
    var cutAddedSpace = (options.simulateCut && dimensions.bleedRight > 0) ? CUT_OFFSET : 0;

    prefs.pageWidth = dimensions.totalWidth + CANVAS_MARGIN_LEFT + CANVAS_MARGIN_RIGHT + cutAddedSpace;
    prefs.pageHeight = dimensions.totalHeight + CANVAS_MARGIN_TOP + CANVAS_MARGIN_BOTTOM;
    prefs.documentBleedTopOffset = 0;
    prefs.documentBleedBottomOffset = 0;
    prefs.documentBleedInsideOrLeftOffset = 0;
    prefs.documentBleedOutsideOrRightOffset = 0;
    prefs.facingPages = false;

    return doc;
}

function importPDFToDocument(doc, pdfFile, dimensions, options) {
    var page = doc.pages[0];

    app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_BLEED;
    app.pdfPlacePreferences.transparentBackground = true;
    app.pdfPlacePreferences.pageNumber = 1;

    var placedPDF = page.place(pdfFile);
    var mainFrame = placedPDF[0].parent;
    mainFrame.move([CANVAS_MARGIN_LEFT, CANVAS_MARGIN_TOP]);

    // Visually separate the right bleed by duplicating and clipping
    if (options.simulateCut && dimensions.bleedRight > 0) {
        var top = CANVAS_MARGIN_TOP;
        var left = CANVAS_MARGIN_LEFT;
        var bottom = CANVAS_MARGIN_TOP + dimensions.totalHeight;
        var right = CANVAS_MARGIN_LEFT + dimensions.totalWidth;
        var cutRightEdge = right - dimensions.bleedRight;

        var cutFrame = mainFrame.duplicate();
        mainFrame.geometricBounds = [top, left, bottom, cutRightEdge];
        cutFrame.geometricBounds = [top, cutRightEdge, bottom, right];
        cutFrame.move(undefined, [CUT_OFFSET, 0]); 
    }
}

// ==============================================================================
// DRAWING FRAMES & MARKS
// ==============================================================================

function drawMarginFrame(doc, dimensions) {
    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Safe Margin Frame");
    var strokeStyle = getDashedStrokeStyle(doc);

    var zeroX = CANVAS_MARGIN_LEFT + dimensions.bleedLeft;
    var zeroY = CANVAS_MARGIN_TOP + dimensions.bleedTop;

    var bounds = [
        zeroY + dimensions.marginTop,
        zeroX + dimensions.marginLeft,
        zeroY + dimensions.pageHeight - dimensions.marginBottom,
        zeroX + dimensions.pageWidth - dimensions.marginRight
    ];

    var frame = page.rectangles.add();
    frame.itemLayer = layer;
    frame.geometricBounds = bounds;
    frame.strokeWeight = FRAME_STROKE_WEIGHT;
    frame.strokeType = strokeStyle;
    frame.fillColor = doc.swatches.item("None");
    setRGBStrokeColor(doc, frame, MARGIN_FRAME_COLOR);
}

function drawTrimFrame(doc, dimensions) {
    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Trim Frame");
    var strokeStyle = getDashedStrokeStyle(doc);

    var zeroX = CANVAS_MARGIN_LEFT + dimensions.bleedLeft;
    var zeroY = CANVAS_MARGIN_TOP + dimensions.bleedTop;

    var bounds = [
        zeroY,
        zeroX,
        zeroY + dimensions.pageHeight,
        zeroX + dimensions.pageWidth
    ];

    var frame = page.rectangles.add();
    frame.itemLayer = layer;
    frame.geometricBounds = bounds;
    frame.strokeWeight = FRAME_STROKE_WEIGHT;
    frame.strokeType = strokeStyle;
    frame.fillColor = doc.swatches.item("None");
    setRGBStrokeColor(doc, frame, TRIM_FRAME_COLOR);
}

function drawBleedLine(doc, dimensions) {
    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Bleed Frame");
    var strokeStyle = getDashedStrokeStyle(doc);

    var bounds = [
        CANVAS_MARGIN_TOP,
        CANVAS_MARGIN_LEFT,
        CANVAS_MARGIN_TOP + dimensions.totalHeight,
        CANVAS_MARGIN_LEFT + dimensions.totalWidth
    ];
    var frame = page.rectangles.add();
    frame.itemLayer = layer;
    frame.geometricBounds = bounds;
    frame.strokeWeight = FRAME_STROKE_WEIGHT;
    frame.strokeType = strokeStyle;
    frame.fillColor = doc.swatches.item("None");
    setRGBStrokeColor(doc, frame, BLEED_LINE_COLOR);
}

function drawScissorsIcon(doc, dimensions, rgbColor) {
    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Trim Marks"); // Creates layer on top
    
    var zeroX = CANVAS_MARGIN_LEFT + dimensions.bleedLeft;
    var zeroY = CANVAS_MARGIN_TOP + dimensions.bleedTop;
    var rightX = zeroX + dimensions.pageWidth;
    var centerY = zeroY + dimensions.pageHeight / 2;

    var tf = page.textFrames.add();
    tf.itemLayer = layer;
    tf.geometricBounds = [centerY - 10, rightX - 10, centerY + 10, rightX + 10];
    tf.fillColor = doc.swatches.item("None");
    tf.strokeColor = doc.swatches.item("None");
    tf.contents = String.fromCharCode(0xF022);

    var txt = tf.texts[0];
    txt.pointSize = 16;
    txt.justification = Justification.CENTER_ALIGN;

    try {
        var wingdingsFont = app.fonts.item("Wingdings");
        if (wingdingsFont.isValid) {
            txt.appliedFont = wingdingsFont;
        } else {
            var wingdingsAlt = app.fonts.itemByName("Wingdings");
            if (wingdingsAlt.isValid) txt.appliedFont = wingdingsAlt;
        }
    } catch (e) {}

    var color = getOrCreateRGBColor(doc, rgbColor);
    txt.fillColor = color;

    tf.rotationAngle = -90;
    tf.fit(FitOptions.FRAME_TO_CONTENT);

    var bounds = tf.geometricBounds;
    var currentWidth = bounds[3] - bounds[1];
    var currentHeight = bounds[2] - bounds[0];

    tf.geometricBounds = [
        centerY - (currentHeight / 2),
        rightX - (currentWidth / 2),
        centerY + (currentHeight / 2),
        rightX + (currentWidth / 2)
    ];
}

// ==============================================================================
// DIMENSIONS
// ==============================================================================

function drawDimensions(doc, dimensions, options) {
    var opts = options.dimensions;
    if (!opts.trimSize && !opts.bleedSize && !opts.bleedAllowance && !opts.safeMargin) return;

    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Dimensions");
    var color = getOrCreateRGBColor(doc, DIMENSION_COLOR);

    var zeroX = CANVAS_MARGIN_LEFT + dimensions.bleedLeft;
    var zeroY = CANVAS_MARGIN_TOP + dimensions.bleedTop;

    var yLevel1 = CANVAS_MARGIN_TOP - 6;
    var yLevel2 = CANVAS_MARGIN_TOP - 14;
    var yLevel3 = CANVAS_MARGIN_TOP - 22;

    var xLevel1 = CANVAS_MARGIN_LEFT - 6;
    var xLevel2 = CANVAS_MARGIN_LEFT - 14;
    var xLevel3 = CANVAS_MARGIN_LEFT - 22;

    var mLeftStartX = zeroX;
    var mRightStartX = zeroX + dimensions.pageWidth - dimensions.marginRight;

    // Horizontal
    if (opts.safeMargin) {
        if (dimensions.marginLeft > 0) {
            drawDimLine(doc, page, layer, color, mLeftStartX, mLeftStartX + dimensions.marginLeft, yLevel1, dimensions.marginLeft, false);
        }
        if (dimensions.marginRight > 0) {
            drawDimLine(doc, page, layer, color, mRightStartX, mRightStartX + dimensions.marginRight, yLevel1, dimensions.marginRight, false);
        }
    }

    if (opts.bleedAllowance) {
        if (dimensions.bleedLeft > 0) {
            drawDimLine(doc, page, layer, color, CANVAS_MARGIN_LEFT, CANVAS_MARGIN_LEFT + dimensions.bleedLeft, yLevel2, dimensions.bleedLeft, false);
        }
        if (dimensions.bleedRight > 0) {
            var rightBleedStartX = zeroX + dimensions.pageWidth;
            drawDimLine(doc, page, layer, color, rightBleedStartX, rightBleedStartX + dimensions.bleedRight, yLevel2, dimensions.bleedRight, false);
        }
    }

    if (opts.trimSize) {
        drawDimLine(doc, page, layer, color, zeroX, zeroX + dimensions.pageWidth, yLevel2, dimensions.pageWidth, false);
    }

    if (opts.bleedSize) {
        drawDimLine(doc, page, layer, color, CANVAS_MARGIN_LEFT, CANVAS_MARGIN_LEFT + dimensions.totalWidth, yLevel3, dimensions.totalWidth, false);
    }

    // Vertical
    var mTopStartY = zeroY;
    var mBottomStartY = zeroY + dimensions.pageHeight - dimensions.marginBottom;

    if (opts.safeMargin) {
        if (dimensions.marginTop > 0) {
            drawDimLine(doc, page, layer, color, mTopStartY, mTopStartY + dimensions.marginTop, xLevel1, dimensions.marginTop, true);
        }
        if (dimensions.marginBottom > 0) {
            drawDimLine(doc, page, layer, color, mBottomStartY, mBottomStartY + dimensions.marginBottom, xLevel1, dimensions.marginBottom, true);
        }
    }

    if (opts.bleedAllowance) {
        if (dimensions.bleedTop > 0) {
            drawDimLine(doc, page, layer, color, CANVAS_MARGIN_TOP, CANVAS_MARGIN_TOP + dimensions.bleedTop, xLevel2, dimensions.bleedTop, true);
        }
        if (dimensions.bleedBottom > 0) {
            var bottomBleedStartY = zeroY + dimensions.pageHeight;
            drawDimLine(doc, page, layer, color, bottomBleedStartY, bottomBleedStartY + dimensions.bleedBottom, xLevel2, dimensions.bleedBottom, true);
        }
    }

    if (opts.trimSize) {
        drawDimLine(doc, page, layer, color, zeroY, zeroY + dimensions.pageHeight, xLevel2, dimensions.pageHeight, true);
    }

    if (opts.bleedSize) {
        drawDimLine(doc, page, layer, color, CANVAS_MARGIN_TOP, CANVAS_MARGIN_TOP + dimensions.totalHeight, xLevel3, dimensions.totalHeight, true);
    }
}

// ==============================================================================
// LEGEND
// ==============================================================================

function drawLegend(doc, dimensions, isMarginDrawn, isTrimDrawn, isBleedDrawn, options) {
    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Legend");
    var dashedStyle = getDashedStrokeStyle(doc);

    var green = getOrCreateRGBColor(doc, MARGIN_FRAME_COLOR);
    var red = getOrCreateRGBColor(doc, TRIM_FRAME_COLOR);
    var black = getOrCreateRGBColor(doc, BLEED_LINE_COLOR);

    var isCutSimulated = options.simulateCut && dimensions.bleedRight > 0;
    var cutOffsetRight = isCutSimulated ? CUT_OFFSET : 0;

    var legendX = CANVAS_MARGIN_LEFT + dimensions.totalWidth + 8 + cutOffsetRight;
    var legendBottom = CANVAS_MARGIN_TOP + dimensions.totalHeight;
    var lineLength = 12;

    var items = [];
    if (isMarginDrawn) items.push({label: "Safe Area Frame", color: green, dashed: true});
    if (isTrimDrawn) items.push({label: "Trim Frame", color: red, dashed: true});
    if (isBleedDrawn) items.push({label: "Bleed Frame", color: black, dashed: true});

    if (items.length === 0) return;

    var estimatedTotalHeight = 8 + (items.length * 6);
    var startY = legendBottom - estimatedTotalHeight;

    var titleFrame = page.textFrames.add();
    titleFrame.itemLayer = layer;
    titleFrame.geometricBounds = [startY, legendX, startY + 10, legendX + 50]; // Large enough initial box
    titleFrame.fillColor = doc.swatches.item("None");
    titleFrame.strokeColor = doc.swatches.item("None");
    titleFrame.contents = "Legend";

    var titleText = titleFrame.texts[0];
    titleText.pointSize = 6;
    titleText.fillColor = doc.swatches.item("Black");
    titleText.justification = Justification.LEFT_ALIGN;

    try {
        var boldFont = app.fonts.item("Arial\tBold");
        if (boldFont.isValid) titleText.appliedFont = boldFont;
    } catch (e) {}

    titleFrame.fit(FitOptions.FRAME_TO_CONTENT);
    var tBounds = titleFrame.geometricBounds;
    var tHeight = tBounds[2] - tBounds[0];
    var currentY = tBounds[2] + 4; // Start items below title

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var lineY = currentY + 1.5;

        var sampleLine = page.graphicLines.add();
        sampleLine.itemLayer = layer;
        sampleLine.geometricBounds = [lineY, legendX, lineY, legendX + lineLength];
        sampleLine.strokeWeight = 0.5;
        sampleLine.strokeColor = item.color;
        if (item.dashed) sampleLine.strokeType = dashedStyle;

        var labelFrame = page.textFrames.add();
        labelFrame.itemLayer = layer;
        labelFrame.geometricBounds = [lineY, legendX + lineLength + 3, lineY + 10, legendX + 50];
        labelFrame.fillColor = doc.swatches.item("None");
        labelFrame.strokeColor = doc.swatches.item("None");
        labelFrame.contents = item.label;

        var labelText = labelFrame.texts[0];
        labelText.pointSize = 4.5;
        labelText.fillColor = doc.swatches.item("Black");
        labelText.justification = Justification.LEFT_ALIGN;
        labelText.hyphenation = false;

        try {
            var regFont = app.fonts.item("Arial\tRegular");
            if (regFont.isValid) labelText.appliedFont = regFont;
        } catch (e) {}

        labelFrame.fit(FitOptions.FRAME_TO_CONTENT);
        
        var lBounds = labelFrame.geometricBounds;
        var lHeight = lBounds[2] - lBounds[0];
        var lWidth = lBounds[3] - lBounds[1];

        // Vertically center text frame to line
        var textStartY = lineY - (lHeight / 2);
        var textStartX = legendX + lineLength + 3;
        labelFrame.geometricBounds = [textStartY, textStartX, textStartY + lHeight, textStartX + lWidth];

        currentY += Math.max(lHeight, 4) + 2; 
    }
}

// ==============================================================================
// INFO PANELS
// ==============================================================================

function drawInfoPanel(doc, dimensions, options) {
    var opts = options.panels;
    if (!opts) return;

    var page = doc.pages[0];
    var layer = getOrCreateLayer(doc, "Info Panel");

    var colors = {
        infoBg: safeAddColor(doc, "RGB_235_235_255", INFO_BG_COLOR),
        infoAccent: safeAddColor(doc, "RGB_0_100_255", INFO_ACCENT_COLOR),
        warnBg: safeAddColor(doc, "RGB_255_250_220", WARN_BG_COLOR),
        warnAccent: safeAddColor(doc, "RGB_255_165_0", WARN_ACCENT_COLOR),
        dangerBg: safeAddColor(doc, "RGB_255_235_235", DANGER_BG_COLOR),
        dangerAccent: safeAddColor(doc, "RGB_255_0_0", DANGER_ACCENT_COLOR),
        paper: doc.swatches.item("Paper"),
        black: doc.swatches.item("Black"),
        none: doc.swatches.item("None")
    };

    var fonts = {
        reg: app.fonts.item("Arial\tRegular"),
        bold: app.fonts.item("Arial\tBold")
    };

    if (!fonts.reg.isValid) fonts.reg = app.fonts.itemByName("Arial");
    if (!fonts.bold.isValid) fonts.bold = app.fonts.itemByName("Arial");

    var isCutSimulated = options.simulateCut && dimensions.bleedRight > 0;
    var cutOffsetRight = isCutSimulated ? CUT_OFFSET : 0;

    var zeroX = CANVAS_MARGIN_LEFT + dimensions.bleedLeft;
    var rightEdgeTrim = zeroX + dimensions.pageWidth;

    var panelWidth = 55;
    var panelStartX = rightEdgeTrim + dimensions.bleedRight + 10 + cutOffsetRight;
    var currentY = CANVAS_MARGIN_TOP;

    if (opts.info) {
        var infoResult = drawInfoBlock(page, layer, currentY, panelStartX, panelWidth, colors, fonts);
        currentY = infoResult.bottomY + 5;
    }

    if (opts.warning) {
        var warnResult = drawWarningBlock(page, layer, currentY, panelStartX, panelWidth, colors, fonts);
        currentY = warnResult.bottomY + 5;
    }

    if (opts.danger) {
        drawDangerBlock(page, layer, currentY, panelStartX, panelWidth, colors, fonts);
    }
}

function drawInfoBlock(page, layer, startY, startX, width, colors, fonts) {
    var panelItems = [];
    var mainFrame = page.textFrames.add();
    panelItems.push(mainFrame);

    mainFrame.itemLayer = layer;
    mainFrame.geometricBounds = [startY, startX, startY + 30, startX + width];
    mainFrame.fillColor = colors.infoBg;
    mainFrame.strokeColor = colors.none;
    mainFrame.textFramePreferences.insetSpacing = [12, 5, 5, 5];
    mainFrame.textFramePreferences.autoSizingType = AutoSizingTypeEnum.HEIGHT_ONLY;
    mainFrame.textFramePreferences.autoSizingReferencePoint = AutoSizingReferenceEnum.TOP_CENTER_POINT;
    mainFrame.contents = "Sample text";

    for (var i = 0; i < mainFrame.paragraphs.length; i++) {
        var p = mainFrame.paragraphs[i];
        p.pointSize = 3.2;
        p.justification = Justification.LEFT_ALIGN;
        p.fillColor = colors.black;
        p.bulletsAndNumberingListType = ListType.BULLET_LIST;
        p.leftIndent = 4;
        p.firstLineIndent = -2;
        if (fonts.reg.isValid) p.appliedFont = fonts.reg;
    }

    var circleSize = 5;
    var iconY = startY + 3.5;
    var iconX = startX + 4;

    var iconBg = page.ovals.add();
    panelItems.push(iconBg);

    iconBg.itemLayer = layer;
    iconBg.geometricBounds = [iconY, iconX, iconY + circleSize, iconX + circleSize];
    iconBg.fillColor = colors.infoAccent;
    iconBg.strokeColor = colors.none;

    var iconTextFrame = page.textFrames.add();
    panelItems.push(iconTextFrame);

    iconTextFrame.itemLayer = layer;
    iconTextFrame.geometricBounds = [iconY, iconX, iconY + circleSize, iconX + circleSize];
    iconTextFrame.fillColor = colors.none;
    iconTextFrame.strokeColor = colors.none;
    iconTextFrame.contents = "i";
    iconTextFrame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
    iconTextFrame.textFramePreferences.insetSpacing = [0, 0, 0, 0];

    var iText = iconTextFrame.texts[0];
    iText.pointSize = 4;
    iText.justification = Justification.CENTER_ALIGN;
    iText.fillColor = colors.paper;
    if (fonts.bold.isValid) iText.appliedFont = fonts.bold;

    var headerFrame = page.textFrames.add();
    panelItems.push(headerFrame);

    headerFrame.itemLayer = layer;
    headerFrame.geometricBounds = [iconY, iconX + circleSize + 2, iconY + circleSize, startX + width - 5];
    headerFrame.contents = "Info";
    headerFrame.fillColor = colors.none;
    headerFrame.strokeColor = colors.none;
    headerFrame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;

    var hText = headerFrame.texts[0];
    hText.pointSize = 6;
    hText.fillColor = colors.infoAccent;
    if (fonts.bold.isValid) hText.appliedFont = fonts.bold;

    mainFrame.recompose();
    var panelGroup = page.groups.add(panelItems);

    return {
        group: panelGroup,
        bottomY: panelGroup.geometricBounds[2]
    };
}

function drawWarningBlock(page, layer, startY, startX, width, colors, fonts) {
    var panelItems = [];
    var iconSize = 5;
    var iconY = startY + 3.5;
    var iconX = startX + 4;

    var mainFrame = page.textFrames.add();
    panelItems.push(mainFrame);

    mainFrame.itemLayer = layer;
    mainFrame.geometricBounds = [startY, startX, startY + 30, startX + width];
    mainFrame.fillColor = colors.warnBg;
    mainFrame.strokeColor = colors.none;
    mainFrame.textFramePreferences.insetSpacing = [12, 5, 5, 5];
    mainFrame.textFramePreferences.autoSizingType = AutoSizingTypeEnum.HEIGHT_ONLY;
    mainFrame.textFramePreferences.autoSizingReferencePoint = AutoSizingReferenceEnum.TOP_CENTER_POINT;
    mainFrame.contents = "Sample text";

    for (var j = 0; j < mainFrame.paragraphs.length; j++) {
        var wp = mainFrame.paragraphs[j];
        wp.pointSize = 3.2;
        wp.justification = Justification.LEFT_ALIGN;
        wp.fillColor = colors.black;
        wp.bulletsAndNumberingListType = ListType.BULLET_LIST;
        wp.leftIndent = 4;
        wp.firstLineIndent = -2;
        if (fonts.reg.isValid) wp.appliedFont = fonts.reg;
    }

    var triangle = page.polygons.add();
    panelItems.push(triangle);

    triangle.itemLayer = layer;
    triangle.fillColor = colors.warnAccent;
    triangle.strokeColor = colors.none;
    triangle.paths.item(0).entirePath = [
        [iconX + (iconSize / 2), iconY],
        [iconX + iconSize, iconY + iconSize],
        [iconX, iconY + iconSize]
    ];

    var iconTextFrame = page.textFrames.add();
    panelItems.push(iconTextFrame);

    iconTextFrame.itemLayer = layer;
    iconTextFrame.geometricBounds = [iconY, iconX, iconY + iconSize, iconX + iconSize];
    iconTextFrame.fillColor = colors.none;
    iconTextFrame.strokeColor = colors.none;
    iconTextFrame.contents = "!";
    iconTextFrame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
    iconTextFrame.textFramePreferences.insetSpacing = [0, 0, 0, 0];

    var excText = iconTextFrame.texts[0];
    excText.pointSize = 3.5;
    excText.justification = Justification.CENTER_ALIGN;
    excText.fillColor = colors.paper;
    if (fonts.bold.isValid) excText.appliedFont = fonts.bold;

    var headerFrame = page.textFrames.add();
    panelItems.push(headerFrame);

    headerFrame.itemLayer = layer;
    headerFrame.geometricBounds = [iconY, iconX + iconSize + 2, iconY + iconSize, startX + width - 5];
    headerFrame.contents = "Warning";
    headerFrame.fillColor = colors.none;
    headerFrame.strokeColor = colors.none;
    headerFrame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;

    var whText = headerFrame.texts[0];
    whText.pointSize = 6;
    whText.fillColor = colors.warnAccent;
    if (fonts.bold.isValid) whText.appliedFont = fonts.bold;

    mainFrame.recompose();
    var panelGroup = page.groups.add(panelItems);

    return {
        group: panelGroup,
        bottomY: panelGroup.geometricBounds[2]
    };
}

function drawDangerBlock(page, layer, startY, startX, width, colors, fonts) {
    var panelItems = [];
    var iconSize = 5;
    var iconY = startY + 3.5;
    var iconX = startX + 4;

    var mainFrame = page.textFrames.add();
    panelItems.push(mainFrame);

    mainFrame.itemLayer = layer;
    mainFrame.geometricBounds = [startY, startX, startY + 30, startX + width];
    mainFrame.fillColor = colors.dangerBg;
    mainFrame.strokeColor = colors.none;
    mainFrame.textFramePreferences.insetSpacing = [12, 5, 5, 5];
    mainFrame.textFramePreferences.autoSizingType = AutoSizingTypeEnum.HEIGHT_ONLY;
    mainFrame.textFramePreferences.autoSizingReferencePoint = AutoSizingReferenceEnum.TOP_CENTER_POINT;
    mainFrame.contents = "Sample text";

    for (var k = 0; k < mainFrame.paragraphs.length; k++) {
        var dp = mainFrame.paragraphs[k];
        dp.pointSize = 3.2;
        dp.justification = Justification.LEFT_ALIGN;
        dp.fillColor = colors.black;
        dp.bulletsAndNumberingListType = ListType.BULLET_LIST;
        dp.leftIndent = 4;
        dp.firstLineIndent = -2;
        if (fonts.reg.isValid) dp.appliedFont = fonts.reg;
    }

    var triangle = page.polygons.add();
    panelItems.push(triangle);

    triangle.itemLayer = layer;
    triangle.fillColor = colors.dangerAccent;
    triangle.strokeColor = colors.none;
    triangle.paths.item(0).entirePath = [
        [iconX + (iconSize / 2), iconY],
        [iconX + iconSize, iconY + iconSize],
        [iconX, iconY + iconSize]
    ];

    var iconTextFrame = page.textFrames.add();
    panelItems.push(iconTextFrame);

    iconTextFrame.itemLayer = layer;
    iconTextFrame.geometricBounds = [iconY, iconX, iconY + iconSize, iconX + iconSize];
    iconTextFrame.fillColor = colors.none;
    iconTextFrame.strokeColor = colors.none;
    iconTextFrame.contents = "!";
    iconTextFrame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
    iconTextFrame.textFramePreferences.insetSpacing = [0, 0, 0, 0];

    var dExcText = iconTextFrame.texts[0];
    dExcText.pointSize = 3.5;
    dExcText.justification = Justification.CENTER_ALIGN;
    dExcText.fillColor = colors.paper;
    if (fonts.bold.isValid) dExcText.appliedFont = fonts.bold;

    var headerFrame = page.textFrames.add();
    panelItems.push(headerFrame);

    headerFrame.itemLayer = layer;
    headerFrame.geometricBounds = [iconY, iconX + iconSize + 2, iconY + iconSize, startX + width - 5];
    headerFrame.contents = "Danger";
    headerFrame.fillColor = colors.none;
    headerFrame.strokeColor = colors.none;
    headerFrame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;

    var dText = headerFrame.texts[0];
    dText.pointSize = 6;
    dText.fillColor = colors.dangerAccent;
    if (fonts.bold.isValid) dText.appliedFont = fonts.bold;

    mainFrame.recompose();
    var panelGroup = page.groups.add(panelItems);

    return {
        group: panelGroup,
        bottomY: panelGroup.geometricBounds[2]
    };
}

// ==============================================================================
// HELPERS
// ==============================================================================

function drawDimLine(doc, page, layer, color, startPos, endPos, staticAxisPos, val, isVertical) {
    if (val <= 0.1) return;

    var line = page.graphicLines.add();
    line.itemLayer = layer;

    if (isVertical) {
        line.geometricBounds = [startPos, staticAxisPos, endPos, staticAxisPos];
    } else {
        line.geometricBounds = [staticAxisPos, startPos, staticAxisPos, endPos];
    }

    line.strokeColor = color;
    line.strokeWeight = 0.25;
    line.leftLineEnd = ArrowHead.BAR_ARROW_HEAD;
    line.rightLineEnd = ArrowHead.BAR_ARROW_HEAD;

    var tf = page.textFrames.add();
    tf.itemLayer = layer;

    var midPos = startPos + (endPos - startPos) / 2;
    tf.geometricBounds = [10, 10, 30, 60];
    tf.fillColor = doc.swatches.item("None");
    tf.strokeColor = doc.swatches.item("None");
    tf.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;

    var num = Math.round(val * 10) / 10;
    var displayValue = num.toString().replace(".", ",") + " mm";

    tf.contents = displayValue;

    var txt = tf.texts[0];
    txt.appliedParagraphStyle = doc.paragraphStyles[0];
    txt.pointSize = "9 pt";
    txt.justification = Justification.CENTER_ALIGN;
    txt.fillColor = color;
    txt.hyphenation = false;

    try {
        var font = app.fonts.item("Arial\tRegular");
        if (font.isValid) txt.appliedFont = font;
    } catch (e) {}

    tf.fit(FitOptions.FRAME_TO_CONTENT);

    var bounds = tf.geometricBounds;
    var currentHeight = bounds[2] - bounds[0];
    var currentWidth = bounds[3] - bounds[1];

    if (isVertical) {
        tf.rotationAngle = 90;
        tf.geometricBounds = [
            midPos - (currentWidth / 2),
            staticAxisPos - 0.5 - currentHeight,
            midPos + (currentWidth / 2),
            staticAxisPos - 0.5
        ];
    } else {
        tf.geometricBounds = [
            staticAxisPos - 0.5 - currentHeight,
            midPos - (currentWidth / 2),
            staticAxisPos - 0.5,
            midPos + (currentWidth / 2)
        ];
    }
}

function getDashedStrokeStyle(doc) {
    var possibleNames = ["ID_Dashed", "Dashed", "Kreskowana", "Kreskowa", "Kreskowa 3 i 2"];

    for (var i = 0; i < possibleNames.length; i++) {
        var style = doc.strokeStyles.itemByName(possibleNames[i]);
        if (style.isValid) return style;
    }

    try {
        var customName = "Script_Dashed";
        var customStyle = doc.dashedStrokeStyles.itemByName(customName);
        if (!customStyle.isValid) {
            customStyle = doc.dashedStrokeStyles.add({
                name: customName,
                dashArray: [2, 2]
            });
        }
        return customStyle;
    } catch (e) {
        return doc.strokeStyles[0];
    }
}

function getOrCreateLayer(doc, layerName) {
    var layer = doc.layers.itemByName(layerName);
    if (!layer.isValid) {
        layer = doc.layers.add({name: layerName});
    }
    return layer;
}

function getOrCreateRGBColor(doc, rgb) {
    var colorName = "RGB_" + rgb[0] + "_" + rgb[1] + "_" + rgb[2];
    var color = doc.colors.itemByName(colorName);

    if (!color.isValid) {
        color = doc.colors.add({
            name: colorName,
            model: ColorModel.PROCESS,
            space: ColorSpace.RGB,
            colorValue: rgb
        });
    }
    return color;
}

function setRGBStrokeColor(doc, frame, rgb) {
    frame.strokeColor = getOrCreateRGBColor(doc, rgb);
}

function safeAddColor(doc, name, rgb) {
    var c = doc.colors.itemByName(name);
    if (!c.isValid) {
        c = doc.colors.add({
            name: name,
            model: ColorModel.PROCESS,
            space: ColorSpace.RGB,
            colorValue: rgb
        });
    }
    return c;
}

// ==============================================================================
// INIT
// ==============================================================================
main();
