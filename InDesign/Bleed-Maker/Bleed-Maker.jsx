#target indesign
#targetengine "session_bleed_maker"

/**
 * ================================================================
 * BLEED MAKER
 * ================================================================
 * FIX:
 * - Removed "Rotation Safety Fuse". Now processes rotated items 
 *   (based on their Bounding Box).
 * - Full Undo Support enabled.
 * ================================================================
 */

var SCRIPT_LABEL = "BLEED_MAKER_STRIP"; 
var LAYER_NAME = "Bleed_Maker_Generated"; 
var MIN_COVERAGE_PERCENT = 0.9; 
var myPalette = null;

function main() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }

    if (myPalette instanceof Window) {
        myPalette.show();
        return;
    }

    var doc = app.activeDocument;
    var dp = doc.documentPreferences;

    var defTop = Math.round(Number(dp.documentBleedTopOffset) * 100) / 100;
    var defBottom = Math.round(Number(dp.documentBleedBottomOffset) * 100) / 100;
    var defInside = Math.round(Number(dp.documentBleedInsideOrLeftOffset) * 100) / 100;
    var defOutside = Math.round(Number(dp.documentBleedOutsideOrRightOffset) * 100) / 100;

    // --- UI BUILD ---
    myPalette = new Window("palette", "Bleed Maker v1.1"); 
    myPalette.orientation = "column";
    myPalette.alignChildren = "fill";
    myPalette.spacing = 10;

    var pnlBleed = myPalette.add("panel", undefined, "Bleed Settings (mm)");
    pnlBleed.orientation = "column";
    pnlBleed.alignChildren = "left";

    function addInputRow(parent, label, value) {
        var g = parent.add("group");
        g.orientation = "row";
        var lbl = g.add("statictext", undefined, label);
        lbl.preferredSize.width = 60;
        var inp = g.add("edittext", undefined, String(value));
        inp.characters = 8;
        return inp;
    }

    var grpTopRow = pnlBleed.add("group");
    grpTopRow.orientation = "row";
    var lblTop = grpTopRow.add("statictext", undefined, "Top:");
    lblTop.preferredSize.width = 60;
    var inpTop = grpTopRow.add("edittext", undefined, String(defTop));
    inpTop.characters = 8;
    var chkLink = grpTopRow.add("checkbox", undefined, "Link all");
    chkLink.value = true;

    var inpBottom = addInputRow(pnlBleed, "Bottom:", defBottom);
    var inpInside = addInputRow(pnlBleed, "Left:", defInside);
    var inpOutside = addInputRow(pnlBleed, "Right:", defOutside);

    // --- ADVANCED PANEL (With Descriptions Restored) ---
    var pnlAdv = myPalette.add("panel", undefined, "Advanced");
    pnlAdv.orientation = "column";
    pnlAdv.alignChildren = "left";
    
    // Sample Size Row
    var grpSample = pnlAdv.add("group");
    grpSample.orientation = "row";
    var lblS = grpSample.add("statictext", undefined, "Sample Size:");
    lblS.preferredSize.width = 80;
    var inpSample = grpSample.add("edittext", undefined, "1.0");
    inpSample.characters = 5;
    // Description text (Gray)
    var descS = grpSample.add("statictext", undefined, "mm (Strip thickness)");
    descS.graphics.foregroundColor = descS.graphics.newPen(descS.graphics.PenType.SOLID_COLOR, [0.4, 0.4, 0.4], 1);

    // Inner Offset Row
    var grpOffset = pnlAdv.add("group");
    grpOffset.orientation = "row";
    var lblO = grpOffset.add("statictext", undefined, "Inner Offset:");
    lblO.preferredSize.width = 80;
    var inpOffset = grpOffset.add("edittext", undefined, "0.0");
    inpOffset.characters = 5;
    // Description text (Gray)
    var descO = grpOffset.add("statictext", undefined, "mm (Skip white edge)");
    descO.graphics.foregroundColor = descO.graphics.newPen(descO.graphics.PenType.SOLID_COLOR, [0.4, 0.4, 0.4], 1);

    // --- LOGIC ---
    function syncValues(sourceText) {
        if (chkLink.value) {
            inpTop.text = sourceText;
            inpBottom.text = sourceText;
            inpInside.text = sourceText;
            inpOutside.text = sourceText;
        }
    }
    inpTop.onChanging = function() { syncValues(this.text); };
    chkLink.onClick = function() {
        if (this.value) {
            syncValues(inpTop.text);
            inpBottom.enabled = false; inpInside.enabled = false; inpOutside.enabled = false;
        } else {
            inpBottom.enabled = true; inpInside.enabled = true; inpOutside.enabled = true;
        }
    };
    if (chkLink.value) {
        inpBottom.enabled = false; inpInside.enabled = false; inpOutside.enabled = false;
    }

    // --- BUTTONS ---
    var grpBtn = myPalette.add("group");
    grpBtn.orientation = "row";
    grpBtn.alignment = "fill"; 
    grpBtn.alignChildren = ["fill", "center"];
    
    var btnRemove = grpBtn.add("button", undefined, "Remove Bleeds");
    
    var spacer = grpBtn.add("statictext", undefined, "");
    spacer.alignment = ["fill", "fill"]; 

    var grpActions = grpBtn.add("group");
    grpActions.orientation = "row";
    var btnClose = grpActions.add("button", undefined, "Close");
    var btnRun = grpActions.add("button", undefined, "Run"); 

    function updateUI() {
        if (app.documents.length > 0) {
            btnRemove.enabled = bleedsExist(app.activeDocument);
        } else {
            btnRemove.enabled = false;
        }
    }

    // --- EVENTS ---
    btnClose.onClick = function() { myPalette.close(); };

    btnRemove.onClick = function() {
        if (app.documents.length === 0) return;
        
        app.doScript(function() {
             if (!confirm("Remove all generated bleeds?")) return;
             var c = removeBleedsSafely(app.activeDocument);
             alert("Removed " + c + " strips.");
             updateUI(); 
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Remove Bleeds");
    };

    btnRun.onClick = function() {
        if (app.documents.length === 0) { alert("Open a doc!"); return; }
        
        app.doScript(function() {
            var currentDoc = app.activeDocument; 

            var t = parseFloat(inpTop.text) || 0;
            var b = parseFloat(inpBottom.text) || 0;
            var i = parseFloat(inpInside.text) || 0;
            var o = parseFloat(inpOutside.text) || 0;
            var s = parseFloat(inpSample.text) || 1.0;
            var off = parseFloat(inpOffset.text) || 0;

            if (s <= 0) { alert("Sample size error"); return; }
            if (off < 0) { alert("Offset cannot be negative"); return; }
            if (t<=0 && b<=0 && i<=0 && o<=0) { alert("Set bleeds > 0"); return; }

            removeBleedsSafely(currentDoc);
            processDocument(currentDoc, t, b, i, o, s, off);
            
            updateUI();
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Bleed Maker Run");
    };

    myPalette.onActivate = function() { updateUI(); };
    updateUI();
    myPalette.show();
}

// --- CORE FUNCTIONS ---

function getBleedLayer(doc) {
    var layer = doc.layers.item(LAYER_NAME);
    if (!layer.isValid) {
        layer = doc.layers.add({name: LAYER_NAME});
        try { layer.move(LocationOptions.AT_END); } catch(e){}
    }
    return layer;
}

function findBestBackgroundCandidate(page) {
    var graphics = page.allGraphics;
    if (graphics.length === 0) return null;
    
    var validCandidates = [];
    
    for (var i = 0; i < graphics.length; i++) {
        var g = graphics[i];
        
        // UNLOCKED: Now accepts rotated items.
        // Warning: geometricBounds on rotated items returns the Bounding Box,
        // so strips might be placed relative to the unrotated bounding box.
        
        if (validateCoverage(page, g)) {
            validCandidates.push(g);
        }
    }
    
    if (validCandidates.length === 0) return null;
    if (validCandidates.length === 1) return validCandidates[0];

    var best = validCandidates[0];
    var maxArea = getArea(best.parent);

    for (var k = 1; k < validCandidates.length; k++) {
        var currentArea = getArea(validCandidates[k].parent);
        if (currentArea > maxArea) {
            maxArea = currentArea;
            best = validCandidates[k];
        }
    }
    return best;
}

function getArea(item) {
    var b = item.geometricBounds;
    return (b[2] - b[0]) * (b[3] - b[1]);
}

function removeBleedsSafely(doc) {
    var itemsToDelete = [];
    var layer = doc.layers.item(LAYER_NAME);
    if (layer.isValid) {
        var layerItems = layer.allPageItems;
        for (var i = 0; i < layerItems.length; i++) {
            itemsToDelete.push(layerItems[i]);
        }
    } else {
        var allItems = doc.allPageItems;
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            if (item.isValid && item.label === SCRIPT_LABEL) itemsToDelete.push(item);
        }
    }

    var counter = 0;
    for (var k = 0; k < itemsToDelete.length; k++) {
        var target = itemsToDelete[k];
        try { if (target.isValid) { target.locked = false; target.remove(); counter++; } } catch(e) {}
    }
    return counter;
}

function bleedsExist(doc) {
    var layer = doc.layers.item(LAYER_NAME);
    if (layer.isValid && layer.pageItems.length > 0) return true;
    
    var allItems = doc.allPageItems;
    for (var i = 0; i < allItems.length; i++) {
        if (allItems[i].isValid && allItems[i].label === SCRIPT_LABEL) return true;
    }
    return false;
}

function processDocument(doc, userTop, userBottom, userInside, userOutside, sampleSize, offset) {
    var originalHUnits = doc.viewPreferences.horizontalMeasurementUnits;
    var originalVUnits = doc.viewPreferences.verticalMeasurementUnits;
    doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
    doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;

    try {
        var dp = doc.documentPreferences;
        if (dp.documentBleedUniformSize) dp.documentBleedUniformSize = false;
        dp.documentBleedTopOffset = userTop;
        dp.documentBleedBottomOffset = userBottom;
        dp.documentBleedInsideOrLeftOffset = userInside;
        dp.documentBleedOutsideOrRightOffset = userOutside;
    } catch(e) {}

    var bleedLayer = getBleedLayer(doc);

    var progWin = new Window("palette", "Processing...", undefined, {closeButton: false});
    var progBar = progWin.add("progressbar", undefined, 0, doc.pages.length);
    progBar.preferredSize.width = 300;
    progWin.show();

    var processed = 0;
    
    try {
        var facing = doc.documentPreferences.facingPages;
        for (var k = 0; k < doc.pages.length; k++) {
            var page = doc.pages[k];
            progBar.value = k+1;
            
            var targetGraphic = findBestBackgroundCandidate(page);
            if (targetGraphic === null) continue; 

            var bleedLeft, bleedRight;
            if (facing) {
                if (page.side == PageSideOptions.LEFT_HAND) {
                    bleedLeft = userOutside; bleedRight = userInside;
                } else {
                    bleedLeft = userInside; bleedRight = userOutside;
                }
            } else {
                bleedLeft = userInside; bleedRight = userOutside;
            }

            processPageGraphic(targetGraphic, userTop, userBottom, bleedLeft, bleedRight, sampleSize, offset, bleedLayer);
            processed++;
        }
    } catch(err) {
        alert("Error: " + err.message);
    } finally {
        progWin.close();
        doc.viewPreferences.horizontalMeasurementUnits = originalHUnits;
        doc.viewPreferences.verticalMeasurementUnits = originalVUnits;
    }
}

function validateCoverage(page, graphic) {
    var pageB = page.bounds;
    var pageH = pageB[2] - pageB[0];
    var pageW = pageB[3] - pageB[1];
    var pageArea = pageH * pageW;
    var frameB = graphic.parent.geometricBounds;
    var frameH = frameB[2] - frameB[0];
    var frameW = frameB[3] - frameB[1];
    var frameArea = frameH * frameW;
    return frameArea >= (pageArea * MIN_COVERAGE_PERCENT);
}

function processPageGraphic(graphic, bTop, bBottom, bLeft, bRight, sampleSize, offset, targetLayer) {
    var sourceFrame = graphic.parent;
    var b = sourceFrame.geometricBounds;
    var y1 = b[0], x1 = b[1], y2 = b[2], x2 = b[3];
    var moveDist = offset + sampleSize;

    if (bRight > 0) {
        var cropR = [y1, x2 - offset - sampleSize, y2, x2 - offset];
        var mRight = createScaleMatrix(bRight / sampleSize, 1);
        createBleedStrip(sourceFrame, cropR, [moveDist, 0], AnchorPoint.LEFT_CENTER_ANCHOR, mRight, targetLayer);
    }
    
    if (bLeft > 0) {
        var cropL = [y1, x1 + offset, y2, x1 + offset + sampleSize];
        var mLeft = createScaleMatrix(bLeft / sampleSize, 1);
        createBleedStrip(sourceFrame, cropL, [-moveDist, 0], AnchorPoint.RIGHT_CENTER_ANCHOR, mLeft, targetLayer);
    }

    var topStrip = null;
    var bottomStrip = null;

    if (bTop > 0) {
        var cropT = [y1 + offset, x1, y1 + offset + sampleSize, x2];
        var mTop = createScaleMatrix(1, bTop / sampleSize);
        topStrip = createBleedStrip(sourceFrame, cropT, [0, -moveDist], AnchorPoint.BOTTOM_CENTER_ANCHOR, mTop, targetLayer);
    }
    
    if (bBottom > 0) {
        var cropB = [y2 - offset - sampleSize, x1, y2 - offset, x2];
        var mBottom = createScaleMatrix(1, bBottom / sampleSize);
        bottomStrip = createBleedStrip(sourceFrame, cropB, [0, moveDist], AnchorPoint.TOP_CENTER_ANCHOR, mBottom, targetLayer);
    }

    if (topStrip) fillCornersFromHorizontalStrip(topStrip, bLeft, bRight, targetLayer);
    if (bottomStrip) fillCornersFromHorizontalStrip(bottomStrip, bLeft, bRight, targetLayer);
}

function createScaleMatrix(x, y) {
    return app.transformationMatrices.add({horizontalScaleFactor: x, verticalScaleFactor: y});
}

function createBleedStrip(frame, crop, move, anchor, matrix, layer) {
    try {
        var s = frame.duplicate();
        s.label = SCRIPT_LABEL;
        s.itemLayer = layer; 
        s.geometricBounds = crop;
        s.move(undefined, move);
        s.transform(CoordinateSpaces.PASTEBOARD_COORDINATES, anchor, matrix);
        return s;
    } catch(e) { return null; }
}

function fillCornersFromHorizontalStrip(strip, bLeft, bRight, layer) {
    var b = strip.geometricBounds;
    if (bLeft > 0) {
        var l = strip.duplicate();
        l.label = SCRIPT_LABEL;
        l.itemLayer = layer; 
        l.geometricBounds = [b[0], b[1], b[2], b[1] + bLeft];
        l.move(undefined, [-bLeft, 0]);
    }
    if (bRight > 0) {
        var r = strip.duplicate();
        r.label = SCRIPT_LABEL;
        r.itemLayer = layer; 
        r.geometricBounds = [b[0], b[3] - bRight, b[2], b[3]];
        r.move(undefined, [bRight, 0]);
    }
}

main();
