// --- 1. SETUP CANVAS ---
const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });

const refCanvas = document.getElementById('refCanvas');
const refCtx = refCanvas.getContext('2d', { willReadFrequently: true });

// --- 2. DRAW A REFERENCE IMAGE ---
function drawReference() {
    refCtx.fillStyle = 'white';
    refCtx.fillRect(0, 0, 300, 300);

    refCtx.lineWidth = 10;
    refCtx.strokeStyle = 'black';
    refCtx.beginPath();
    refCtx.arc(150, 150, 50, 0, Math.PI * 2);
    refCtx.stroke();
}
drawReference();

// Initialize drawing canvas background to white 
drawCtx.fillStyle = 'white';
drawCtx.fillRect(0, 0, 300, 300);

// --- 3. DRAWING MECHANICS ---
let isDrawing = false;

drawCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    drawCtx.beginPath();
    drawCtx.moveTo(e.offsetX, e.offsetY);
});

drawCanvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        drawCtx.lineTo(e.offsetX, e.offsetY);
        drawCtx.strokeStyle = 'black';
        drawCtx.lineWidth = 10;
        drawCtx.lineCap = 'round';
        drawCtx.stroke();
    }
});

drawCanvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

drawCanvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

function clearCanvas() {
    drawCtx.fillStyle = 'white';
    drawCtx.fillRect(0, 0, 300, 300);
    document.getElementById('scoreDisplay').innerText = "Score: --%";
}

// --- 4. SCORING MECHANICS ---
function calculateScore() {
    const refData = refCtx.getImageData(0, 0, 300, 300).data;
    const drawData = drawCtx.getImageData(0, 0, 300, 300).data;

    let totalPixels = refData.length / 4;
    let matchingPixels = 0;

    for (let i = 0; i < refData.length; i += 4) {
        let refIsDark = refData[i] < 128;
        let drawIsDark = drawData[i] < 128;

        if (refIsDark === drawIsDark) {
            matchingPixels++;
        }
    }

    let score = (matchingPixels / totalPixels) * 100;

    document.getElementById('scoreDisplay').innerText = `Score: ${score.toFixed(2)}%`;
}