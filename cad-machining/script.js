/* ============================================================
   CAD Machining Analyzer — script.js
   Parses DXF, detects holes, renders technical drawing,
   generates machining instructions.
   ============================================================ */

'use strict';

// ── DOM refs ──────────────────────────────────────────────────
const fileInput       = document.getElementById('dxf-file-input');
const dropzone        = document.getElementById('dropzone');
const pasteArea       = document.getElementById('dxf-paste');
const analyzeBtn      = document.getElementById('analyze-btn');
const clearBtn        = document.getElementById('clear-btn');
const exportBtn       = document.getElementById('export-btn');
const printBtn        = document.getElementById('print-btn');
const statusMsg       = document.getElementById('status-msg');
const canvas          = document.getElementById('drawing-canvas');
const canvasPlaceholder = document.getElementById('canvas-placeholder');
const instructionsSection = document.getElementById('instructions-section');
const summaryLine     = document.getElementById('summary-line');
const holeTbody       = document.getElementById('hole-tbody');
const opsList         = document.getElementById('ops-list');
const sfGrid          = document.getElementById('sf-grid');
const unitSelect      = document.getElementById('unit-select');
const threadSelect    = document.getElementById('thread-select');
const materialSelect  = document.getElementById('material-select');

// ── Drill size tables ─────────────────────────────────────────
// Standard metric drill sizes in mm (ISO 286)
const METRIC_DRILLS = [
    0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,
    1.0,1.05,1.1,1.15,1.2,1.25,1.3,1.35,1.4,1.45,1.5,
    1.6,1.7,1.75,1.8,1.9,
    2.0,2.05,2.1,2.15,2.2,2.25,2.3,2.4,2.5,
    2.6,2.7,2.75,2.8,2.9,
    3.0,3.1,3.2,3.3,3.4,3.5,3.6,3.7,3.8,3.9,
    4.0,4.1,4.2,4.3,4.4,4.5,4.6,4.7,4.8,4.9,
    5.0,5.1,5.2,5.3,5.4,5.5,5.6,5.7,5.8,5.9,
    6.0,6.1,6.2,6.3,6.4,6.5,6.6,6.7,6.8,6.9,
    7.0,7.1,7.2,7.3,7.4,7.5,7.6,7.7,7.8,7.9,
    8.0,8.1,8.2,8.3,8.4,8.5,8.6,8.7,8.8,8.9,
    9.0,9.1,9.2,9.3,9.4,9.5,9.6,9.7,9.8,9.9,
    10.0,10.2,10.5,10.8,
    11.0,11.2,11.5,11.8,
    12.0,12.5,13.0,13.5,14.0,14.5,15.0,
    16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0
];

// Standard fractional / letter / number drill sizes in mm
const IMPERIAL_DRILLS_MM = [
    0.343,0.368,0.394,0.406,0.432,0.457,0.483,0.508,
    0.533,0.559,0.584,0.610,0.635,0.660,0.686,0.711,
    0.737,0.762,0.787,0.813,0.838,0.864,0.889,0.914,
    0.940,0.965,0.991,1.016,1.041,1.067,1.092,1.118,
    1.143,1.168,1.194,1.219,1.245,1.270,1.295,1.321,
    1.346,1.372,1.397,1.422,1.448,1.473,1.499,1.524,
    1.549,1.575,1.600,1.626,1.651,1.676,1.702,1.727,
    1.753,1.778,1.803,1.829,1.854,1.880,1.905,1.930,
    1.956,1.981,2.007,2.032,2.057,2.083,2.108,2.134,
    2.159,2.184,2.210,2.261,2.286,2.311,2.337,2.362,
    2.388,2.413,2.438,2.464,2.489,2.515,2.540,2.616,
    2.692,2.769,2.845,2.921,2.997,3.073,3.150,3.226,
    3.302,3.378,3.454,3.531,3.607,3.683,3.759,3.835,
    3.912,3.988,4.064,4.140,4.216,4.293,4.369,4.445,
    4.521,4.597,4.674,4.750,4.826,4.902,4.978,5.055,
    5.131,5.207,5.283,5.359,5.436,5.512,5.588,5.664,
    5.740,5.817,5.893,5.969,6.045,6.122,6.198,6.274,
    6.350,6.452,6.553,6.655,6.756,6.858,6.959,7.061,
    7.144,7.258,7.366,7.493,7.620,7.747,7.874,8.001,
    8.128,8.255,8.382,8.509,8.636,8.763,8.890,9.017,
    9.144,9.271,9.398,9.525,9.652,9.779,9.906,10.034,
    10.318,10.716,11.113,11.509,11.906,12.303,12.700,
    13.097,13.494,13.891,14.288,14.684,15.081,15.875,
    17.463,19.050,20.638,22.225,23.813,25.400
];

// Metric tap drill sizes: { nominalDia mm, pitch mm, tapDrillMm, label }
const METRIC_TAPS = [
    {d:1.6, p:0.35, drill:1.25,  label:'M1.6×0.35'},
    {d:2.0, p:0.40, drill:1.60,  label:'M2×0.4'},
    {d:2.5, p:0.45, drill:2.05,  label:'M2.5×0.45'},
    {d:3.0, p:0.50, drill:2.50,  label:'M3×0.5'},
    {d:3.5, p:0.60, drill:2.90,  label:'M3.5×0.6'},
    {d:4.0, p:0.70, drill:3.30,  label:'M4×0.7'},
    {d:5.0, p:0.80, drill:4.20,  label:'M5×0.8'},
    {d:6.0, p:1.00, drill:5.00,  label:'M6×1.0'},
    {d:7.0, p:1.00, drill:6.00,  label:'M7×1.0'},
    {d:8.0, p:1.25, drill:6.80,  label:'M8×1.25'},
    {d:10.0,p:1.50, drill:8.50,  label:'M10×1.5'},
    {d:12.0,p:1.75, drill:10.20, label:'M12×1.75'},
    {d:14.0,p:2.00, drill:12.00, label:'M14×2.0'},
    {d:16.0,p:2.00, drill:14.00, label:'M16×2.0'},
    {d:18.0,p:2.50, drill:15.50, label:'M18×2.5'},
    {d:20.0,p:2.50, drill:17.50, label:'M20×2.5'},
    {d:24.0,p:3.00, drill:21.00, label:'M24×3.0'}
];

// Imperial tap drills: { nominalIn, drill_mm, label }
const IMPERIAL_TAPS = [
    {d:1.854,   drill:1.52,  label:'#2-56 UNF'},
    {d:2.184,   drill:1.88,  label:'#4-40 UNC'},
    {d:2.184,   drill:2.05,  label:'#4-48 UNF'},
    {d:2.692,   drill:2.26,  label:'#5-40 UNC'},
    {d:3.073,   drill:2.69,  label:'#6-32 UNC'},
    {d:3.505,   drill:3.10,  label:'#8-32 UNC'},
    {d:3.759,   drill:3.45,  label:'#8-36 UNF'},
    {d:4.166,   drill:3.76,  label:'#10-24 UNC'},
    {d:4.166,   drill:3.96,  label:'#10-32 UNF'},
    {d:6.350,   drill:5.10,  label:'1/4-20 UNC'},
    {d:6.350,   drill:5.56,  label:'1/4-28 UNF'},
    {d:7.938,   drill:6.91,  label:'5/16-18 UNC'},
    {d:7.938,   drill:7.26,  label:'5/16-24 UNF'},
    {d:9.525,   drill:7.94,  label:'3/8-16 UNC'},
    {d:9.525,   drill:8.47,  label:'3/8-24 UNF'},
    {d:11.113,  drill:9.40,  label:'7/16-14 UNC'},
    {d:12.700,  drill:10.72, label:'1/2-13 UNC'},
    {d:12.700,  drill:11.51, label:'1/2-20 UNF'},
    {d:15.875,  drill:13.49, label:'5/8-11 UNC'},
    {d:19.050,  drill:16.66, label:'3/4-10 UNC'}
];

// ── Speed & Feed tables (RPM guidelines) ──────────────────────
// Surface speeds (m/min) for HSS drills per material
const SURFACE_SPEEDS = {
    al:      { min: 60,  max: 120, label: 'Aluminium'       },
    steel:   { min: 20,  max: 35,  label: 'Mild Steel'      },
    ss:      { min: 8,   max: 20,  label: 'Stainless Steel' },
    brass:   { min: 40,  max: 80,  label: 'Brass'           },
    plastic: { min: 60,  max: 150, label: 'Plastic/Nylon'   }
};

// Feed per rev (mm/rev) for HSS drills by diameter range
function feedPerRev(dMm) {
    if (dMm < 3)   return {min:0.04, max:0.06};
    if (dMm < 6)   return {min:0.06, max:0.12};
    if (dMm < 10)  return {min:0.10, max:0.18};
    if (dMm < 16)  return {min:0.15, max:0.25};
    if (dMm < 25)  return {min:0.20, max:0.35};
    return {min:0.25, max:0.45};
}

// ── DXF Parser ───────────────────────────────────────────────
function parseDXF(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const entities = [];

    // Find the ENTITIES section
    let i = 0;
    let inEntities = false;
    while (i < lines.length) {
        const code = lines[i].trim();
        const val  = (lines[i+1] || '').trim();
        if (code === '2' && val.toUpperCase() === 'ENTITIES') { inEntities = true; i += 2; break; }
        i += 2;
    }
    if (!inEntities) {
        // Try scanning the whole file for CIRCLE / ARC entities regardless
        i = 0;
    }

    let entity = null;
    while (i < lines.length) {
        const code = parseInt(lines[i].trim(), 10);
        const val  = (lines[i+1] || '').trim();

        if (code === 0) {
            if (entity) entities.push(entity);
            const type = val.toUpperCase();
            if (type === 'CIRCLE' || type === 'ARC' || type === 'LWPOLYLINE' || type === 'LINE') {
                entity = { type, x:0, y:0, r:0, startAngle:0, endAngle:360, layer:'0', vertices:[], bulges:[] };
            } else {
                entity = null;
            }
        } else if (entity) {
            if (code === 8)  entity.layer = val;
            if (code === 10) entity.x = parseFloat(val) || 0;
            if (code === 20) entity.y = parseFloat(val) || 0;
            if (code === 40) entity.r = parseFloat(val) || 0;
            if (code === 50) entity.startAngle = parseFloat(val) || 0;
            if (code === 51) entity.endAngle   = parseFloat(val) || 0;
            // LWPOLYLINE vertices
            if (code === 10 && entity.type === 'LWPOLYLINE') {
                entity.vertices.push({x: parseFloat(val) || 0, y: 0});
            }
            if (code === 20 && entity.type === 'LWPOLYLINE' && entity.vertices.length) {
                entity.vertices[entity.vertices.length - 1].y = parseFloat(val) || 0;
            }
            if (code === 42 && entity.type === 'LWPOLYLINE') {
                entity.bulges.push(parseFloat(val) || 0);
            }
            if (code === 11) entity.x2 = parseFloat(val) || 0;
            if (code === 21) entity.y2 = parseFloat(val) || 0;
        }
        i += 2;
    }
    if (entity) entities.push(entity);
    return entities;
}

// ── Hole extraction ───────────────────────────────────────────
function extractHoles(entities) {
    const holes = [];
    for (const e of entities) {
        if (e.type === 'CIRCLE' && e.r > 0) {
            holes.push({ x: e.x, y: e.y, r: e.r, layer: e.layer });
        }
        if (e.type === 'ARC' && e.r > 0) {
            // Count as full circle if arc spans >= 355 degrees
            const span = ((e.endAngle - e.startAngle) + 360) % 360;
            if (span >= 355 || span === 0) {
                holes.push({ x: e.x, y: e.y, r: e.r, layer: e.layer });
            }
        }
    }
    // De-duplicate (same center ± 0.01 and same radius)
    return holes.filter((h, idx, arr) =>
        arr.findIndex(o =>
            Math.abs(o.x - h.x) < 0.01 &&
            Math.abs(o.y - h.y) < 0.01 &&
            Math.abs(o.r - h.r) < 0.01
        ) === idx
    );
}

// ── Nearest drill size lookup ─────────────────────────────────
function nearestDrill(diamMm, useImperial) {
    const table = useImperial ? IMPERIAL_DRILLS_MM : METRIC_DRILLS;
    let best = table[0];
    for (const d of table) {
        if (Math.abs(d - diamMm) < Math.abs(best - diamMm)) best = d;
    }
    return best;
}

// ── Tap suggestion ────────────────────────────────────────────
function suggestTap(diamMm, useImperial, threadStd) {
    const taps = threadStd === 'imperial' ? IMPERIAL_TAPS : METRIC_TAPS;
    const TOLERANCE = 0.3; // mm — how close tap drill must be to actual hole
    let best = null;
    let bestDiff = Infinity;
    for (const t of taps) {
        const diff = Math.abs(t.drill - diamMm);
        if (diff < TOLERANCE && diff < bestDiff) {
            bestDiff = diff;
            best = t;
        }
    }
    return best;
}

// ── Hole classification ───────────────────────────────────────
function classifyHole(dMm) {
    if (dMm < 1.0) return { type: 'micro',   badge: 'badge-small',   label: 'Micro' };
    if (dMm > 30)  return { type: 'bore',     badge: 'badge-bore',    label: 'Bore'  };
    return              { type: 'through',  badge: 'badge-through', label: 'Through' };
}

// ── RPM calculation ───────────────────────────────────────────
function calcRPM(surfaceSpeedMPerMin, dMm) {
    return Math.round((surfaceSpeedMPerMin * 1000) / (Math.PI * dMm));
}

// ── Format numbers ────────────────────────────────────────────
function fmt(n, dec = 3) { return Number(n).toFixed(dec); }
function fmtCoord(n) { return fmt(n, 2); }

// Convert mm → in if needed
function dispVal(mm, useIn, dec = 3) {
    return useIn ? fmt(mm / 25.4, dec) + ' in' : fmt(mm, dec) + ' mm';
}

// ── Part bounds (used for boundary rect + edge distances) ─────
function computePartBounds(holes, allEntities) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const e of allEntities) {
        if (e.type === 'CIRCLE' || e.type === 'ARC') {
            minX = Math.min(minX, e.x - e.r); maxX = Math.max(maxX, e.x + e.r);
            minY = Math.min(minY, e.y - e.r); maxY = Math.max(maxY, e.y + e.r);
        }
        if (e.type === 'LINE') {
            minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x);
            minY = Math.min(minY, e.y); maxY = Math.max(maxY, e.y);
            if (e.x2 !== undefined) {
                minX = Math.min(minX, e.x2); maxX = Math.max(maxX, e.x2);
                minY = Math.min(minY, e.y2); maxY = Math.max(maxY, e.y2);
            }
        }
        if (e.type === 'LWPOLYLINE') {
            for (const v of e.vertices) {
                minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
                minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
            }
        }
    }
    if (!isFinite(minX)) {
        for (const h of holes) {
            minX = Math.min(minX, h.x - h.r); maxX = Math.max(maxX, h.x + h.r);
            minY = Math.min(minY, h.y - h.r); maxY = Math.max(maxY, h.y + h.r);
        }
    }
    return { minX, maxX, minY, maxY };
}

// ── Technical Drawing Renderer ────────────────────────────────
function renderDrawing(holes, allEntities, useIn, bounds) {
    if (!holes.length) return;

    const ctx = canvas.getContext('2d');
    const { minX, maxX, minY, maxY } = bounds;

    const MARGIN = 40;        // px
    const TITLE_H = 80;       // title block height px
    const W = 900, H = 620;
    const PIXEL_RATIO = 3;    // render at 3× for high-res PNG export
    canvas.width  = W * PIXEL_RATIO;
    canvas.height = H * PIXEL_RATIO;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

    const drawW = W - MARGIN * 2;
    const drawH = H - MARGIN * 2 - TITLE_H;
    const partW = maxX - minX || 1;
    const partH = maxY - minY || 1;
    const scale = Math.min(drawW / (partW * 1.25), drawH / (partH * 1.25));
    const offX = MARGIN + drawW / 2 - ((minX + maxX) / 2) * scale;
    // DXF Y is bottom-up; canvas Y is top-down → flip
    const offY = MARGIN + drawH / 2 + ((minY + maxY) / 2) * scale;

    function tx(x) { return offX + x * scale; }
    function ty(y) { return offY - y * scale; }   // flip Y

    // ── Background ──
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, W, H);

    // ── Border ──
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    // ── Drawing area divider ──
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, H - TITLE_H - 4);
    ctx.lineTo(W - 10, H - TITLE_H - 4);
    ctx.stroke();

    // ── Part boundary rectangle ──
    const bndLeft   = tx(minX);
    const bndRight  = tx(maxX);
    const bndTop    = ty(maxY);   // maxY in DXF = top in canvas (Y flipped)
    const bndBottom = ty(minY);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(bndLeft, bndTop, bndRight - bndLeft, bndBottom - bndTop);
    ctx.setLineDash([]);
    ctx.font = '8px Courier New';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PART BOUNDARY', bndRight - 2, bndTop - 2);

    // ── Draw LINE entities ──
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    for (const e of allEntities) {
        if (e.type !== 'LINE') continue;
        ctx.beginPath();
        ctx.moveTo(tx(e.x), ty(e.y));
        // LINE entity needs x2/y2 — skip if missing
        if (e.x2 !== undefined) {
            ctx.lineTo(tx(e.x2), ty(e.y2));
            ctx.stroke();
        }
    }

    // ── Draw ARC entities (partial arcs) ──
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    for (const e of allEntities) {
        if (e.type !== 'ARC') continue;
        const span = ((e.endAngle - e.startAngle) + 360) % 360;
        if (span >= 355 || span === 0) continue; // full circles handled separately
        const rPx = e.r * scale;
        ctx.beginPath();
        ctx.arc(tx(e.x), ty(e.y), rPx,
            (-e.endAngle * Math.PI / 180),
            (-e.startAngle * Math.PI / 180));
        ctx.stroke();
    }

    // helper: format a DXF-unit distance for display
    function dimFmt(v) {
        return useIn ? fmt(v / 25.4, 3) + '"' : fmt(v, 2) + 'mm';
    }

    // ── Draw holes ──
    holes.forEach((h, idx) => {
        const cx = tx(h.x);
        const cy = ty(h.y);
        const rPx = Math.max(h.r * scale, 3);

        // Centerlines — extend from boundary edge to boundary edge
        const clLeft   = bndLeft  - 6;
        const clRight  = bndRight + 6;
        const clTop    = bndTop   - 6;
        const clBottom = bndBottom + 6;

        ctx.strokeStyle = '#cc3300';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([6, 3, 1.5, 3]);
        ctx.beginPath();
        ctx.moveTo(clLeft, cy);
        ctx.lineTo(clRight, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, clTop);
        ctx.lineTo(cx, clBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Edge-distance labels along centerlines
        const dLeft   = h.x - minX;
        const dRight  = maxX - h.x;
        const dTop    = maxY - h.y;   // DXF Y: maxY = top edge
        const dBottom = h.y - minY;

        ctx.font = '7px Courier New';
        ctx.fillStyle = '#cc3300';

        // Horizontal labels (above the centerline)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const midLeft  = (clLeft  + cx) / 2;
        const midRight = (cx + clRight) / 2;
        if (cx - clLeft > 22)   ctx.fillText(dimFmt(dLeft),  midLeft,  cy - 2);
        if (clRight - cx > 22)  ctx.fillText(dimFmt(dRight), midRight, cy - 2);

        // Vertical labels (to the right of the centerline)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const midTop    = (clTop    + cy) / 2;
        const midBottom = (cy + clBottom) / 2;
        if (cy - clTop    > 22) ctx.fillText(dimFmt(dTop),    cx + 3, midTop);
        if (clBottom - cy > 22) ctx.fillText(dimFmt(dBottom), cx + 3, midBottom);

        // Hole circle
        ctx.strokeStyle = '#1a3a5c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.stroke();

        // Hole number balloon
        const ballR = 10;
        const bx = cx + rPx + 18;
        const by = cy - rPx - 8;
        ctx.fillStyle = '#1a3a5c';
        ctx.beginPath();
        ctx.arc(bx, by, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a3a5c';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + rPx + 3, cy - 3);
        ctx.lineTo(bx - ballR + 2, by + ballR * 0.3);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx + 1, bx, by);

        // Diameter annotation
        if (rPx > 8) {
            const dLabel = useIn
                ? 'Ø' + fmt(h.r * 2 / 25.4, 4) + '"'
                : 'Ø' + fmt(h.r * 2, 2);
            ctx.fillStyle = '#1a3a5c';
            ctx.font = '8.5px Courier New';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(dLabel, cx + rPx + 4, cy + rPx + 12);
        }
    });

    // ── Title block ──
    const tbY = H - TITLE_H + 2;

    ctx.fillStyle = '#e8f0f8';
    ctx.fillRect(11, tbY, W - 22, TITLE_H - 14);

    // Vertical dividers in title block
    const cols = [W * 0.35, W * 0.55, W * 0.72, W * 0.85];
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 0.8;
    for (const cx2 of cols) {
        ctx.beginPath();
        ctx.moveTo(cx2, tbY);
        ctx.lineTo(cx2, H - 14);
        ctx.stroke();
    }

    // Horizontal divider (top row of title block)
    ctx.beginPath();
    ctx.moveTo(11, tbY + 26);
    ctx.lineTo(W - 11, tbY + 26);
    ctx.stroke();

    const tbFont = '9px Courier New';
    const tbFontB = 'bold 11px Courier New';
    ctx.fillStyle = '#1a3a5c';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Cell headers (top row)
    const cellData = [
        [14,    tbY + 3, 'DRAWING TITLE', tbFont],
        [cols[0]+6, tbY + 3, 'MATERIAL', tbFont],
        [cols[1]+6, tbY + 3, 'SCALE', tbFont],
        [cols[2]+6, tbY + 3, 'HOLES', tbFont],
        [cols[3]+6, tbY + 3, 'DATE', tbFont],
    ];
    for (const [x, y, txt, f] of cellData) {
        ctx.font = f;
        ctx.fillText(txt, x, y);
    }

    // Cell values (bottom row)
    const matLabel = materialSelect.options[materialSelect.selectedIndex].text;
    const scaleVal = fmt(scale, 2) + ':1 (px/mm)';
    const today = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
    const vals = [
        [14,    tbY + 30, 'CAD MACHINING ANALYSIS', tbFontB],
        [cols[0]+6, tbY + 30, matLabel.toUpperCase(), tbFontB],
        [cols[1]+6, tbY + 30, scaleVal, tbFont],
        [cols[2]+6, tbY + 30, String(holes.length), tbFontB],
        [cols[3]+6, tbY + 30, today, tbFont],
    ];
    for (const [x, y, txt, f] of vals) {
        ctx.font = f;
        ctx.fillText(txt, x, y);
    }

    // Show drawing
    canvasPlaceholder.style.display = 'none';
    canvas.style.display = 'block';
    exportBtn.disabled = false;
}

// ── Machining instructions builder ───────────────────────────
function buildInstructions(holes, useIn, threadStd, material, bounds) {
    const ss = SURFACE_SPEEDS[material] || SURFACE_SPEEDS.al;
    const useImperial = (unitSelect.value === 'in');
    const { minX, maxX, minY, maxY } = bounds;

    // Annotate holes
    const annotated = holes.map((h, i) => {
        const dMm = h.r * 2;
        const cls  = classifyHole(dMm);
        const drill = nearestDrill(dMm, useImperial);
        const tap   = suggestTap(dMm, useImperial, threadStd);
        const fpr   = feedPerRev(dMm);
        const rpmMin = calcRPM(ss.min, dMm);
        const rpmMax = calcRPM(ss.max, dMm);
        const edgeLeft   = h.x - minX;
        const edgeRight  = maxX - h.x;
        const edgeTop    = maxY - h.y;
        const edgeBottom = h.y - minY;
        const minEdge = Math.min(edgeLeft, edgeRight, edgeTop, edgeBottom);
        const minWall = minEdge - h.r;
        return { ...h, idx: i + 1, dMm, cls, drill, tap, fpr, rpmMin, rpmMax,
                 edgeLeft, edgeRight, edgeTop, edgeBottom, minEdge, minWall };
    });

    // Sort by size for operations ordering
    const bySize = [...annotated].sort((a, b) => a.dMm - b.dMm);

    // ── Table rows ──
    holeTbody.innerHTML = '';
    for (const h of annotated) {
        const dDisp  = dispVal(h.dMm, useIn);
        const drillDisp = dispVal(h.drill, useIn);
        const tapLabel  = h.tap ? h.tap.label : '—';
        const xDisp  = dispVal(Math.abs(h.x), useIn, 2);
        const yDisp  = dispVal(Math.abs(h.y), useIn, 2);
        const htype  = h.tap
            ? `<span class="badge badge-tap">TAP</span>`
            : `<span class="badge ${h.cls.badge}">${h.cls.label.toUpperCase()}</span>`;
        const notes  = h.dMm < 1 ? 'Use stub drill; centre punch carefully' :
                       h.dMm > 30 ? 'Bore or end-mill after pilot drill' :
                       h.tap ? `Drill then tap ${h.tap.label}` : 'Drill through / to depth';

        const edgeDisp = dispVal(h.minEdge, useIn, 2);
        const wallDisp = dispVal(h.minWall, useIn, 2);
        const wallStyle = h.minWall < 0
            ? 'color:#cc0000;font-weight:bold'
            : h.minWall < 2
            ? 'color:#cc6600;font-weight:bold'
            : '';

        holeTbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${h.idx}</td>
                <td>${dDisp}</td>
                <td>${xDisp}</td>
                <td>${yDisp}</td>
                <td>${edgeDisp}</td>
                <td style="${wallStyle}">${wallDisp}</td>
                <td>${htype}</td>
                <td>${drillDisp}</td>
                <td>${tapLabel}</td>
                <td style="white-space:normal;min-width:180px">${notes}</td>
            </tr>
        `);
    }

    // ── Summary line ──
    const tapCount  = annotated.filter(h => h.tap).length;
    const warnCount = annotated.filter(h => h.minWall < 2).length;
    const warnText  = warnCount ? ` ${warnCount} hole${warnCount !== 1 ? 's' : ''} with wall <2mm — see warnings below.` : '';
    summaryLine.textContent =
        `// Found ${holes.length} hole${holes.length !== 1 ? 's' : ''} ` +
        `(${tapCount} tap candidate${tapCount !== 1 ? 's' : ''}). ` +
        `Material: ${ss.label}. Thread standard: ${threadStd === 'imperial' ? 'Imperial UNC/UNF' : 'Metric ISO'}.` +
        warnText;

    // ── Operations sequence ──
    opsList.innerHTML = '';
    const steps = [];

    steps.push(`<strong>Setup:</strong> Secure workpiece in vice or fixture. Zero X/Y datum at a reference hole or part corner. Ensure part is level (run DTI across face; max 0.02 mm runout).`);
    steps.push(`<strong>Centre drill all ${holes.length} hole locations</strong> (NC60 or A-centre, 120° included angle). This prevents drill wander. Use ${material === 'al' ? '1500–3000' : material === 'ss' ? '400–800' : '800–1500'} RPM.`);

    // Group by drill size
    const drillGroups = {};
    for (const h of bySize) {
        const key = fmt(h.drill, 3);
        if (!drillGroups[key]) drillGroups[key] = [];
        drillGroups[key].push(h.idx);
    }

    for (const [drillSz, idxs] of Object.entries(drillGroups)) {
        const drillMm = parseFloat(drillSz);
        const sf = SURFACE_SPEEDS[material];
        const rpmMin = calcRPM(sf.min, drillMm);
        const rpmMax = calcRPM(sf.max, drillMm);
        const fpr    = feedPerRev(drillMm);
        const dispD  = dispVal(drillMm, useIn);
        steps.push(
            `<strong>Drill Ø${dispD}</strong> — holes ${idxs.join(', ')}. ` +
            `RPM ${rpmMin}–${rpmMax}. Feed ${fmt(fpr.min,2)}–${fmt(fpr.max,2)} mm/rev. ` +
            `Use cutting fluid${material === 'ss' ? ' (sulphurised oil recommended)' : ''}. ` +
            `Peck cycle every ${drillMm < 5 ? '1×D' : '2×D'} to clear chips.`
        );
    }

    // Tapping operations
    const tapHoles = annotated.filter(h => h.tap);
    if (tapHoles.length) {
        const tapGroups = {};
        for (const h of tapHoles) {
            const k = h.tap.label;
            if (!tapGroups[k]) tapGroups[k] = [];
            tapGroups[k].push(h.idx);
        }
        for (const [tapLabel, idxs] of Object.entries(tapGroups)) {
            steps.push(
                `<strong>Tap ${tapLabel}</strong> — holes ${idxs.join(', ')}. ` +
                `Use quality HSS or spiral-flute tap. Apply tapping compound. ` +
                `Hand tap: 1–2 turns forward, ½ turn back to break chip. ` +
                `Machine tap: ${material === 'ss' ? '40–80' : material === 'al' ? '200–400' : '100–200'} RPM.`
            );
        }
    }

    // Bore / large holes
    const boreHoles = annotated.filter(h => h.cls.type === 'bore');
    if (boreHoles.length) {
        steps.push(
            `<strong>Bore/finish large holes</strong> — holes ${boreHoles.map(h=>h.idx).join(', ')}. ` +
            `Pilot drill to within 2–3 mm of final diameter. Finish with boring bar or end mill to tolerance. ` +
            `Target H7 tolerance where close fits required.`
        );
    }

    // Thin wall / edge clearance warnings
    const thinWalls = annotated.filter(h => h.minWall < 2 && h.minWall >= 0);
    const overlapWalls = annotated.filter(h => h.minWall < 0);
    if (overlapWalls.length) {
        steps.push(
            `<strong style="color:#cc0000">⚠ BOUNDARY OVERLAP — holes ${overlapWalls.map(h=>h.idx).join(', ')}:</strong> ` +
            `Hole radius exceeds distance to part boundary. These holes may break out through the edge. ` +
            `Verify part dimensions and re-check DXF boundary before machining.`
        );
    }
    if (thinWalls.length) {
        steps.push(
            `<strong style="color:#cc6600">⚠ Thin wall — holes ${thinWalls.map(h=>h.idx).join(', ')}:</strong> ` +
            `Minimum remaining material (wall) is less than 2 mm. Risk of cracking or deflection during drilling. ` +
            `Ensure solid clamping support near the thin section; consider a backing block.`
        );
    }

    steps.push(`<strong>Deburr all holes</strong> — use countersink bit at ~45° by hand, or deburr tool. Remove all swarf from interior. Blow out with compressed air.`);
    steps.push(`<strong>Inspect:</strong> verify all hole diameters with pin gauges or calipers. Check depth with depth gauge. Verify thread engagement with go/no-go gauges.`);

    for (const s of steps) {
        const li = document.createElement('li');
        li.innerHTML = s;
        opsList.appendChild(li);
    }

    // ── Speed & Feed cards ──
    sfGrid.innerHTML = '';
    // Unique drill sizes
    const uniqueDrills = [...new Set(annotated.map(h => h.drill))].sort((a,b)=>a-b);
    for (const dMm of uniqueDrills) {
        const sf  = SURFACE_SPEEDS[material];
        const fpr = feedPerRev(dMm);
        const rpmMin = calcRPM(sf.min, dMm);
        const rpmMax = calcRPM(sf.max, dMm);
        const dispD  = dispVal(dMm, useIn);
        sfGrid.insertAdjacentHTML('beforeend', `
            <div class="sf-card">
                <div class="sf-card-title">Ø${dispD} DRILL</div>
                <div class="sf-card-body">
                    RPM: <span>${rpmMin}–${rpmMax}</span><br>
                    Feed: <span>${fmt(fpr.min,2)}–${fmt(fpr.max,2)} mm/rev</span><br>
                    Surface speed: <span>${sf.min}–${sf.max} m/min</span><br>
                    Material: <span>${sf.label}</span>
                </div>
            </div>
        `);
    }

    instructionsSection.classList.remove('hidden');
}

// ── Main analyze function ─────────────────────────────────────
function analyze(dxfText) {
    if (!dxfText.trim()) {
        setStatus('No DXF content provided.', 'error');
        return;
    }
    setStatus('Parsing DXF…');

    let entities;
    try {
        entities = parseDXF(dxfText);
    } catch (e) {
        setStatus('Parse error: ' + e.message, 'error');
        return;
    }

    const holes = extractHoles(entities);
    if (!holes.length) {
        setStatus('No holes (CIRCLE/ARC entities) found in the DXF. Ensure you saved a 2D drawing view or flat pattern.', 'error');
        return;
    }

    const useIn     = unitSelect.value === 'in';
    const threadStd = threadSelect.value;
    const material  = materialSelect.value;
    const bounds    = computePartBounds(holes, entities);

    setStatus(`Found ${holes.length} hole${holes.length !== 1 ? 's' : ''}. Rendering drawing…`);
    renderDrawing(holes, entities, useIn, bounds);
    buildInstructions(holes, useIn, threadStd, material, bounds);
    setStatus(`Done. ${holes.length} holes analyzed.`, 'ok');
}

// ── Event listeners ───────────────────────────────────────────
analyzeBtn.addEventListener('click', () => analyze(pasteArea.value));

clearBtn.addEventListener('click', () => {
    pasteArea.value = '';
    setStatus('');
    canvas.style.display = 'none';
    canvasPlaceholder.style.display = '';
    instructionsSection.classList.add('hidden');
    exportBtn.disabled = true;
});

exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'machining-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

printBtn.addEventListener('click', () => window.print());

// File upload
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        pasteArea.value = e.target.result;
        setStatus(`Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsText(file);
});

// Drag & drop on dropzone
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-active'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        pasteArea.value = ev.target.result;
        setStatus(`Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsText(file);
});

// ── Helpers ───────────────────────────────────────────────────
function setStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = 'status-message' + (type ? ' ' + type : '');
}
