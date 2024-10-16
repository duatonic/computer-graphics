// Get WebGL context
const canvas = document.getElementById("glCanvas");
const ctx = canvas.getContext("2d");

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

// Add event listeners
initialVelocityInput.addEventListener('input', () => { v0 = parseFloat(initialVelocityInput.value); });
accelerationInput.addEventListener('input', () => { a = parseFloat(accelerationInput.value); });
slopeAngleInput.addEventListener('input', () => {
    theta = parseFloat(slopeAngleInput.value);
    slopeAngleValue.textContent = theta;
});
cubeSizeInput.addEventListener('input', () => {
    cubeSize = parseFloat(cubeSizeInput.value);
    cubeSizeValue.textContent = cubeSize;
});
cubePositionInput.addEventListener('input', () => {
    cubePosition = parseFloat(cubePositionInput.value);
});
faceColor1Input.addEventListener('input', () => { faceColor1 = faceColor1Input.value; });
faceColor2Input.addEventListener('input', () => { faceColor2 = faceColor2Input.value; });
faceColor3Input.addEventListener('input', () => { faceColor3 = faceColor3Input.value; });

// Handle start/stop button
startStopButton.addEventListener('click', () => {
    isAnimating = !isAnimating;
    startStopButton.textContent = isAnimating ? "Stop" : "Start";
    if (isAnimating) {
        lastTime = 0; // Reset the last time for new animation
        elapsedTime = 0; // Reset elapsed time
        requestAnimationFrame(animate);
    }
});

// Calculate object movement based on physics (for slope simulation)
function calculatePositionSlope(t, v0, a, theta) {
    const radTheta = theta * (Math.PI / 180); // Convert angle to radians
    const horizontalDisplacement = v0 * t + 0.5 * a * t * t; // s = v₀t + ½at²
    const x = 50 + cubePosition + horizontalDisplacement * Math.cos(radTheta); // X position (adjusted for slope)
    
    // Invert the sign of sin(theta) to move downwards
    const y = 200 + horizontalDisplacement * Math.sin(radTheta); // Y position (adjusted for slope)
    
    return { x, y };
}

// Draw the cube in 3D
function drawCube(x, y, size, frontColor, rightColor, topColor) {
    const halfSize = size / 2;

    // Draw the front face
    ctx.fillStyle = frontColor;
    ctx.fillRect(x - halfSize, y - halfSize, size, size);

    // Draw the right face
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(x + halfSize, y - halfSize);
    ctx.lineTo(x + halfSize, y + halfSize);
    ctx.lineTo(x + halfSize * 1.2, y + halfSize * 0.8);
    ctx.lineTo(x + halfSize * 1.2, y - halfSize * 0.2);
    ctx.closePath();
    ctx.fill();

    // Draw the top face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x - halfSize, y - halfSize);
    ctx.lineTo(x + halfSize, y - halfSize);
    ctx.lineTo(x + halfSize * 1.2, y - halfSize * 0.2);
    ctx.lineTo(x - halfSize * 0.2, y - halfSize * 0.2);
    ctx.closePath();
    ctx.fill();
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
