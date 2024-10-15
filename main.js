// Basic setup for WebGL canvas and context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize shader program (basic shaders)
const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  void main() {
    vec2 position = a_position + u_translation;
    vec2 zeroToOne = position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 u_color;
  void main() {
    gl_FragColor = u_color;
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// Look up attribute and uniform locations
const positionLocation = gl.getAttribLocation(program, 'a_position');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const colorLocation = gl.getUniformLocation(program, 'u_color');
const translationLocation = gl.getUniformLocation(program, 'u_translation');

// Create buffer and set position data for a circle (bouncing ball)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const numSegments = 100;
const ballRadius = 50;
const ballVertices = [];
for (let i = 0; i <= numSegments; i++) {
  const angle = i * 2 * Math.PI / numSegments;
  ballVertices.push(ballRadius * Math.cos(angle), ballRadius * Math.sin(angle));
}
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ballVertices), gl.STATIC_DRAW);

// Variables for ball physics
let ballPosition = [canvas.width / 2, canvas.height / 2];
let ballVelocity = [200, -300];  // px/s
let gravity = [0, 1000];  // Gravity affecting y-axis (px/s^2)
const timeStep = 1 / 60;  // 60 FPS
const restitution = 0.8;  // Bounciness factor
let isDragging = false;  // Track whether the user is dragging the ball
let lastMousePos = { x: ballPosition[0], y: ballPosition[1] }; // Store last mouse position

// Event listeners for mouse control
canvas.addEventListener('mousedown', (event) => {
  const mousePos = getMousePosition(event);
  if (isInsideBall(mousePos)) {
    isDragging = true;
    lastMousePos = mousePos; // Update last mouse position
  }
});

canvas.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const mousePos = getMousePosition(event);
    ballPosition[0] = mousePos.x;
    ballPosition[1] = mousePos.y;

    // Calculate velocity based on mouse movement
    ballVelocity[0] = (mousePos.x - lastMousePos.x) / timeStep;
    ballVelocity[1] = (mousePos.y - lastMousePos.y) / timeStep;

    lastMousePos = mousePos; // Update last mouse position
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

// Helper function to get the mouse position relative to the canvas
function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// Helper function to check if the mouse is inside the ball
function isInsideBall(mousePos) {
  const dx = mousePos.x - ballPosition[0];
  const dy = mousePos.y - ballPosition[1];
  return Math.sqrt(dx * dx + dy * dy) <= ballRadius;
}

function drawScene() {
  // Adjust canvas size if needed
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use our program
  gl.useProgram(program);

  // Bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Set resolution uniform
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // Set ball color
  gl.uniform4f(colorLocation, 1, 0.5, 0, 1);

  // Apply physics (if not dragging)
  if (!isDragging) {
    // Physics calculations (Euler integration)
    ballVelocity[1] += gravity[1] * timeStep;
    ballPosition[0] += ballVelocity[0] * timeStep;
    ballPosition[1] += ballVelocity[1] * timeStep;

    // Check for collisions with walls and apply bounce
    if (ballPosition[0] - ballRadius < 0 || ballPosition[0] + ballRadius > canvas.width) {
      ballVelocity[0] *= -restitution;
      ballPosition[0] = Math.max(ballRadius, Math.min(canvas.width - ballRadius, ballPosition[0]));
    }
    if (ballPosition[1] - ballRadius < 0 || ballPosition[1] + ballRadius > canvas.height) {
      ballVelocity[1] *= -restitution;
      ballPosition[1] = Math.max(ballRadius, Math.min(canvas.height - ballRadius, ballPosition[1]));
    }
  }

  // Set translation uniform
  gl.uniform2f(translationLocation, ballPosition[0], ballPosition[1]);

  // Draw circle
  gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);

  // Loop
  requestAnimationFrame(drawScene);
}

drawScene();