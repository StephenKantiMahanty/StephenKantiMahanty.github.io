const canvas = document.getElementById("drawing-surface");
const context = canvas.getContext("2d");

const clearButton = document.getElementById("clear-button");
const demoButton = document.getElementById("demo-button");
const totalScoreEl = document.getElementById("total-score");
const scoreMessageEl = document.getElementById("score-message");
const radiusScoreEl = document.getElementById("radius-score");
const connectivityScoreEl = document.getElementById("connectivity-score");
const densityScoreEl = document.getElementById("density-score");
const radiusDetailEl = document.getElementById("radius-detail");
const connectivityDetailEl = document.getElementById("connectivity-detail");
const densityDetailEl = document.getElementById("density-detail");
const pointCountEl = document.getElementById("point-count");
const radiusValueEl = document.getElementById("radius-value");
const closureValueEl = document.getElementById("closure-value");
const gapValueEl = document.getElementById("gap-value");
const statusPillEl = document.getElementById("status-pill");

const POINT_SPACING = 6;
const MIN_POINTS = 28;

let points = [];
let pointerActive = false;
let locked = false;
let showTarget = false;

function resizeCanvasForDisplay() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width * ratio);
    const height = Math.round((rect.width * 640 / 880) * ratio);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    render();
}

function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function addPoint(point) {
    const previous = points[points.length - 1];

    if (!previous || distance(previous, point) >= POINT_SPACING) {
        points.push(point);
    }
}

function beginDrawing(event) {
    if (locked) {
        resetField();
    }

    pointerActive = true;
    statusPillEl.textContent = "Recording";
    addPoint(getCanvasPoint(event));
    updateTelemetry();
    canvas.setPointerCapture(event.pointerId);
    render();
}

function continueDrawing(event) {
    if (!pointerActive) {
        return;
    }

    addPoint(getCanvasPoint(event));
    updateTelemetry();
    render();
}

function endDrawing(event) {
    if (!pointerActive) {
        return;
    }

    pointerActive = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
    }
    locked = points.length >= MIN_POINTS;
    statusPillEl.textContent = locked ? "Scored" : "Too Short";
    updateTelemetry();
    render();
}

function resetField() {
    points = [];
    pointerActive = false;
    locked = false;
    statusPillEl.textContent = "Waiting";
    totalScoreEl.textContent = "0";
    radiusScoreEl.textContent = "0";
    connectivityScoreEl.textContent = "0";
    densityScoreEl.textContent = "0";
    scoreMessageEl.textContent = "Press and drag inside the field.";
    radiusDetailEl.textContent = "Consistency of distance from center";
    connectivityDetailEl.textContent = "Continuous stroke with minimal gaps";
    densityDetailEl.textContent = "Points packed tightly along the path";
    pointCountEl.textContent = "0";
    radiusValueEl.textContent = "0 px";
    closureValueEl.textContent = "0%";
    gapValueEl.textContent = "0 px";
    render();
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function average(values) {
    if (!values.length) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeScore() {
    if (points.length < MIN_POINTS) {
        return null;
    }

    const center = {
        x: average(points.map((point) => point.x)),
        y: average(points.map((point) => point.y)),
    };

    const radii = points.map((point) => distance(point, center));
    const meanRadius = average(radii);
    const radiusVariance = Math.sqrt(average(radii.map((radius) => (radius - meanRadius) ** 2)));
    const radiusConsistency = clamp(1 - radiusVariance / Math.max(meanRadius, 1), 0, 1);
    const canvasLimit = Math.min(canvas.width, canvas.height) * 0.42;
    const radiusSize = clamp(meanRadius / Math.max(canvasLimit, 1), 0, 1);
    const radiusScore = Math.round((radiusConsistency * 0.72 + radiusSize * 0.28) * 100);

    const gaps = [];

    for (let index = 1; index < points.length; index += 1) {
        const gap = distance(points[index - 1], points[index]);
        gaps.push(gap);
    }

    const averageGap = average(gaps);
    const maxGap = gaps.length ? Math.max(...gaps) : 0;
    const gapVariance = Math.sqrt(average(gaps.map((gap) => (gap - averageGap) ** 2)));
    const expectedGap = POINT_SPACING * (window.devicePixelRatio || 1) * 1.45;
    const gapStability = clamp(1 - Math.max(0, averageGap - expectedGap) / expectedGap, 0, 1);
    const maxGapPenalty = clamp(1 - Math.max(0, maxGap - expectedGap * 1.35) / (expectedGap * 4.2), 0, 1);
    const closureDistance = distance(points[0], points[points.length - 1]);
    const closure = clamp(1 - closureDistance / Math.max(meanRadius * 0.9, 1), 0, 1);
    const connectivityScore = Math.round((gapStability * 0.45 + maxGapPenalty * 0.25 + closure * 0.3) * 100);

    const targetDenseGap = POINT_SPACING * (window.devicePixelRatio || 1) * 1.1;
    const gapTightness = clamp(targetDenseGap / Math.max(averageGap, 1), 0, 1);
    const spacingConsistency = clamp(1 - gapVariance / Math.max(expectedGap, 1), 0, 1);
    const densityScore = Math.round((gapTightness * 0.7 + spacingConsistency * 0.3) * 100);

    const totalScore = Math.round(radiusScore * 0.4 + connectivityScore * 0.35 + densityScore * 0.25);

    return {
        totalScore,
        radiusScore,
        connectivityScore,
        densityScore,
        meanRadius,
        averageGap,
        closure,
        center,
    };
}

function updateTelemetry() {
    pointCountEl.textContent = String(points.length);

    const score = computeScore();

    if (!score) {
        if (points.length === 0) {
            return;
        }

        scoreMessageEl.textContent = "Keep going. The loop needs more points before scoring.";
        statusPillEl.textContent = pointerActive ? "Recording" : "Too Short";
        return;
    }

    totalScoreEl.textContent = String(score.totalScore);
    radiusScoreEl.textContent = String(score.radiusScore);
    connectivityScoreEl.textContent = String(score.connectivityScore);
    densityScoreEl.textContent = String(score.densityScore);
    radiusValueEl.textContent = `${Math.round(score.meanRadius)} px`;
    closureValueEl.textContent = `${Math.round(score.closure * 100)}%`;
    gapValueEl.textContent = `${score.averageGap.toFixed(1)} px`;

    radiusDetailEl.textContent = score.radiusScore >= 80
        ? "Strong radius control across the stroke"
        : "Radius drift is reducing the circle quality";
    connectivityDetailEl.textContent = score.connectivityScore >= 80
        ? "The loop stays connected and closes cleanly"
        : "Visible breaks or an open loop are lowering the score";
    densityDetailEl.textContent = score.densityScore >= 80
        ? "Point spacing is compact and consistent"
        : "Add more points or move more slowly for denser coverage";

    if (score.totalScore >= 92) {
        scoreMessageEl.textContent = "Nearly machine-clean.";
    } else if (score.totalScore >= 80) {
        scoreMessageEl.textContent = "Strong circle. Minor wobble remains.";
    } else if (score.totalScore >= 60) {
        scoreMessageEl.textContent = "Readable circle, but the form is breaking down.";
    } else {
        scoreMessageEl.textContent = "Loose sketch. Keep the radius steadier and close the loop.";
    }
}

function drawTargetRing() {
    if (!showTarget) {
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.24;

    context.save();
    context.setLineDash([8, 14]);
    context.strokeStyle = "rgba(249, 199, 79, 0.35)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
}

function drawPoints() {
    if (points.length === 0) {
        return;
    }

    context.save();
    context.strokeStyle = "rgba(64, 224, 208, 0.16)";
    context.lineWidth = Math.max(1, canvas.width / 880);
    context.beginPath();

    for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        context.moveTo(previous.x, previous.y);
        context.lineTo(current.x, current.y);
    }

    context.stroke();

    for (const point of points) {
        context.beginPath();
        context.fillStyle = "rgba(155, 247, 255, 0.96)";
        context.shadowBlur = 14;
        context.shadowColor = "rgba(64, 224, 208, 0.7)";
        context.arc(point.x, point.y, Math.max(1.9, canvas.width / 280), 0, Math.PI * 2);
        context.fill();
    }

    if (locked && points.length >= MIN_POINTS) {
        const score = computeScore();

        if (score) {
            context.beginPath();
            context.strokeStyle = "rgba(249, 199, 79, 0.5)";
            context.lineWidth = 1.5;
            context.arc(score.center.x, score.center.y, score.meanRadius, 0, Math.PI * 2);
            context.stroke();
        }
    }

    context.restore();
}

function drawCenterText() {
    if (points.length !== 0) {
        return;
    }

    context.save();
    context.fillStyle = "rgba(119, 164, 173, 0.9)";
    context.textAlign = "center";
    context.font = `${Math.max(14, canvas.width / 42)}px Courier New`;
    context.fillText("TRACE A CIRCLE", canvas.width / 2, canvas.height / 2 - 10);
    context.font = `${Math.max(11, canvas.width / 65)}px Courier New`;
    context.fillText("the score locks when you release", canvas.width / 2, canvas.height / 2 + 26);
    context.restore();
}

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.strokeStyle = "rgba(155, 247, 255, 0.05)";
    context.lineWidth = 1;

    for (let x = 40; x < canvas.width; x += 40) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
    }

    for (let y = 40; y < canvas.height; y += 40) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }

    context.restore();

    drawTargetRing();
    drawPoints();
    drawCenterText();
}

canvas.addEventListener("pointerdown", beginDrawing);
canvas.addEventListener("pointermove", continueDrawing);
canvas.addEventListener("pointerup", endDrawing);
canvas.addEventListener("pointerleave", endDrawing);
canvas.addEventListener("pointercancel", endDrawing);

clearButton.addEventListener("click", resetField);
demoButton.addEventListener("click", () => {
    showTarget = !showTarget;
    demoButton.textContent = showTarget ? "Hide Target" : "Show Target";
    render();
});

window.addEventListener("resize", resizeCanvasForDisplay);

resizeCanvasForDisplay();
resetField();
