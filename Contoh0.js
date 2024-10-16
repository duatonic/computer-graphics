// Get WebGL context
const canvas = document.getElementById("glCanvas");
const ctx = canvas.getContext("webgl");

// Get control elements
const initialVelocityInput = document.getElementById("initialVelocity");
const accelerationInput = document.getElementById("acceleration");
const slopeAngleInput = document.getElementById("slopeAngle");
const slopeAngleValue = document.getElementById("slopeAngleValue");
const cubeSizeInput = document.getElementById("cubeSize");
const cubeSizeValue = document.getElementById("cubeSizeValue");
const cubePositionInput = document.getElementById("cubePosition");
const frontColorInput = document.getElementById("frontColor");
const backColorInput = document.getElementById("backColor");
const topColorInput = document.getElementById("topColor");
const bottomColorInput = document.getElementById("bottomColor");
const rightColorInput = document.getElementById("rightColor");
const leftColorInput = document.getElementById("leftColor");
const dodecaFace1ColorInput = document.getElementById("dodecaFace1Color");
const dodecaFace2ColorInput = document.getElementById("dodecaFace2Color");
const dodecaFace3ColorInput = document.getElementById("dodecaFace3Color");
const dodecaFace4ColorInput = document.getElementById("dodecaFace4Color");
const dodecaFace5ColorInput = document.getElementById("dodecaFace5Color");
const dodecaFace6ColorInput = document.getElementById("dodecaFace6Color");
const dodecaFace7ColorInput = document.getElementById("dodecaFace7Color");
const dodecaFace8ColorInput = document.getElementById("dodecaFace8Color");
const dodecaFace9ColorInput = document.getElementById("dodecaFace9Color");
const dodecaFace10ColorInput = document.getElementById("dodecaFace10Color");
const dodecaFace11ColorInput = document.getElementById("dodecaFace11Color");
const dodecaFace12ColorInput = document.getElementById("dodecaFace12Color");
const startStopButton = document.getElementById("startStopButton");
const timeDisplay = document.getElementById("timeDisplay");

// Initialize parameters
let v0 = parseFloat(initialVelocityInput.value);
let a = parseFloat(accelerationInput.value);
let theta = parseFloat(slopeAngleInput.value);
let cubeSize = parseFloat(cubeSizeInput.value);
let cubePosition = parseFloat(cubePositionInput.value);
let isAnimating = false;
let elapsedTime = 0;
let lastTime = 0;

// Cube vertices (in 3D space)
const vertices = [
    [-1, -1,  1], // 0: front bottom left
    [ 1, -1,  1], // 1: front bottom right
    [ 1,  1,  1], // 2: front top right
    [-1,  1,  1], // 3: front top left
    [-1, -1, -1], // 4: back bottom left
    [ 1, -1, -1], // 5: back bottom right
    [ 1,  1, -1], // 6: back top right
    [-1,  1, -1]  // 7: back top left
];

// Dodecahedron vertices and faces
const dodecaVertices = [
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
    [0, 0.618, 1.618], [0, 0.618, -1.618], [0, -0.618, 1.618], [0, -0.618, -1.618],
    [0.618, 1.618, 0], [0.618, -1.618, 0], [-0.618, 1.618, 0], [-0.618, -1.618, 0],
    [1.618, 0, 0.618], [1.618, 0, -0.618], [-1.618, 0, 0.618], [-1.618, 0, -0.618]
];

const dodecaFaces = [
    [0, 8, 4, 14, 12], [1, 9, 5, 15, 13], [2, 10, 6, 16, 14], [3, 11, 7, 17, 15],
    [0, 12, 1, 13, 17], [2, 14, 4, 18, 16], [3, 15, 5, 19, 17], [0, 8, 2, 10, 18],
    [1, 9, 3, 11, 19], [4, 8, 10, 6, 18], [5, 9, 11, 7, 19], [6, 10, 2, 16, 14]
];

// Simple perspective projection (projects 3D points onto 2D plane)
function project([x, y, z], width, height, scale = 200) {
    const distance = 4; // Distance from the viewer
    const factor = scale / (distance - z);
    const x2d = x * factor + width / 2;
    const y2d = y * factor + height / 2;
    return [x2d, y2d];
}

// Draw the cube using projected vertices
function drawCube(x, y, size, frontColor, rightColor, topColor) {
    const scaledVertices = vertices.map(v => {
        return [v[0] * size / 2 + x, v[1] * size / 2 + y, v[2] * size / 2];
    });

    const projectedVertices = scaledVertices.map(v => project(v, canvas.width, canvas.height));

    // Draw front face
    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(projectedVertices[0][0], projectedVertices[0][1]);
    ctx.lineTo(projectedVertices[1][0], projectedVertices[1][1]);
    ctx.lineTo(projectedVertices[2][0], projectedVertices[2][1]);
    ctx.lineTo(projectedVertices[3][0], projectedVertices[3][1]);
    ctx.closePath();
    ctx.fill();

    // Draw right face
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(projectedVertices[1][0], projectedVertices[1][1]);
    ctx.lineTo(projectedVertices[5][0], projectedVertices[5][1]);
    ctx.lineTo(projectedVertices[6][0], projectedVertices[6][1]);
    ctx.lineTo(projectedVertices[2][0], projectedVertices[2][1]);
    ctx.closePath();
    ctx.fill();

    // Draw top face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(projectedVertices[3][0], projectedVertices[3][1]);
    ctx.lineTo(projectedVertices[2][0], projectedVertices[2][1]);
    ctx.lineTo(projectedVertices[6][0], projectedVertices[6][1]);
    ctx.lineTo(projectedVertices[7][0], projectedVertices[7][1]);
    ctx.closePath();
    ctx.fill();
}

// Draw the dodecahedron using projected vertices
function drawDodecahedron(x, y, size, colors) {
    const scaledVertices = dodecaVertices.map(v => {
        return [v[0] * size / 2 + x, v[1] * size / 2 + y, v[2] * size / 2];
    });

    const projectedVertices = scaledVertices.map(v => project(v, canvas.width, canvas.height));

    dodecaFaces.forEach((face, index) => {
        ctx.fillStyle = colors[index];
        ctx.beginPath();
        ctx.moveTo(projectedVertices[face[0]][0], projectedVertices[face[0]][1]);
        face.forEach(vertexIndex => {
            ctx.lineTo(projectedVertices[vertexIndex][0], projectedVertices[vertexIndex][1]);
        });
        ctx.closePath();
        ctx.fill();
    });
}

// Calculate object movement based on physics (for slope simulation)
function calculatePositionSlope(t, v0, a, theta) {
    const radTheta = theta * (Math.PI / 180); // Convert angle to radians
    const horizontalDisplacement = v0 * t + 0.5 * a * t * t; // s = v₀t + ½at²
    const x = 50 + cubePosition + horizontalDisplacement * Math.cos(radTheta); // X position (adjusted for slope)
    
    const y = 200 + horizontalDisplacement * Math.sin(radTheta); // Y position (adjusted for slope)
    
    return { x, y };
}

// Draw the slope with improved gradient
function drawSlope() {
    const slopeStartX = 50;
    const slopeStartY = 200;
    const slopeEndX = slopeStartX + 300 * Math.cos(theta * (Math.PI / 180));
    const slopeEndY = slopeStartY + 300 * Math.sin(theta * (Math.PI / 180));

    const gradient = ctx.createLinearGradient(slopeStartX, slopeStartY, slopeEndX, slopeEndY);
    gradient.addColorStop(0, "#8B4513"); // Brown for slope
    gradient.addColorStop(1, "#A0522D");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(slopeStartX, slopeStartY);
    ctx.lineTo(slopeEndX, slopeEndY);
    ctx.lineTo(slopeEndX, slopeEndY + 50); // Add thickness
    ctx.lineTo(slopeStartX, slopeStartY + 50);
    ctx.closePath();
    ctx.fill();
}

// Draw the scene
function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the slope
    drawSlope();

    // Calculate the position of the cube
    const { x, y } = calculatePositionSlope(elapsedTime, v0, a, theta);

    // Get user-defined colors for the cube
    const cubeColors = {
        front: frontColorInput.value,
        back: backColorInput.value,
        top: topColorInput.value,
        bottom: bottomColorInput.value,
        right: rightColorInput.value,
        left: leftColorInput.value
    };

    // Draw the cube with user-defined colors
    drawCube(x, y, cubeSize, cubeColors.front, cubeColors.right, cubeColors.top);

    // Get user-defined colors for the dodecahedron
    const dodecaColors = [
        dodecaFace1ColorInput.value, dodecaFace2ColorInput.value, dodecaFace3ColorInput.value,
        dodecaFace4ColorInput.value, dodecaFace5ColorInput.value, dodecaFace6ColorInput.value,
        dodecaFace7ColorInput.value, dodecaFace8ColorInput.value, dodecaFace9ColorInput.value,
        dodecaFace10ColorInput.value, dodecaFace11ColorInput.value, dodecaFace12ColorInput.value
    ];

    // Draw the dodecahedron with user-defined colors
    drawDodecahedron(x + 200, y, cubeSize, dodecaColors);
}

// Animation loop
function animate(currentTime) {
    if (lastTime === 0) lastTime = currentTime; // Initialize last time
    const deltaTime = (currentTime - lastTime) / 1000; // Convert ms to seconds
    elapsedTime += deltaTime;
    lastTime = currentTime;

    drawScene();

    // Update time display
    timeDisplay.textContent = elapsedTime.toFixed(1);

    if (isAnimating) {
        requestAnimationFrame(animate);
    }
}