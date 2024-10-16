// Get WebGL context
const canvas = document.getElementById("glCanvas");
const ctx = canvas.getContext("3d");

// Get control elements
const initialVelocityInput = document.getElementById("initialVelocity");
const accelerationInput = document.getElementById("acceleration");
const slopeAngleInput = document.getElementById("slopeAngle");
const slopeAngleValue = document.getElementById("slopeAngleValue");
const cubeSizeInput = document.getElementById("cubeSize");
const cubeSizeValue = document.getElementById("cubeSizeValue");
const cubePositionInput = document.getElementById("cubePosition");
const faceColor1Input = document.getElementById("faceColor1");
const faceColor2Input = document.getElementById("faceColor2");
const faceColor3Input = document.getElementById("faceColor3");
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

    // Draw the cube with user-defined colors
    drawCube(x, y, cubeSize, faceColor1Input.value, faceColor2Input.value, faceColor3Input.value);
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
