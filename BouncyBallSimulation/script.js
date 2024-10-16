var gl;
var pointsArray = [];
var colorsArray = [];

var ballPosition = [0.0, 0.9, 0.0]; // Initial position
var ballVelocity = [0.0, -0.01, 0.0]; // Initial velocity (going downwards)
var gravity = -0.001;
var restitution = 0.4; // Bounce factor
var coefFriction = 0.02;

var dragging = false; // Tracks whether the ball is being dragged
var lastMousePosition = [0, 0]; // Last known mouse position in world coordinates
var releaseVelocity = [0.0, 0.0]; // Velocity upon release

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

// Fixed canvas dimensions
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;
var leftWall = -window.innerWidth / 830;
var rightWall = -leftWall;
var topWall = window.innerHeight / 900;
var frictionMove = mapCoefFrictionToFrictionMove(1 - coefFriction);

window.onload = function init() {
  var canvas = document.getElementById("gl-canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2.0 isn't available");
  }

  // Ball geometry (a simple circle approximation) with increased radius
  var ballRadius = 0.05 * 2.5; // Ball is now 2.5 times bigger
  var slices = 100; // Increase the number of slices for smoother circle

  for (var i = 0; i <= slices; i++) {
    var theta = (i * 2 * Math.PI) / slices;
    var x = ballRadius * Math.cos(theta);
    var y = ballRadius * Math.sin(theta);
    pointsArray.push(vec4(x, y, 0.0, 1.0));
    colorsArray.push(vec4(1.0, 0.0, 0.0, 1.0)); // Red ball
  }

  gl.viewport(0, 0, canvasWidth, canvasHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

  // Calculate aspect ratio
  var aspect = canvasWidth / canvasHeight;

  // Adjust projection matrix to match the aspect ratio
  projectionMatrix = ortho(-aspect, aspect, -1, 1, -1, 1);

  // Add mouse event listeners
  canvas.addEventListener("mousedown", startDrag);
  canvas.addEventListener("mousemove", dragBall);
  canvas.addEventListener("mouseup", releaseBall);

  render();
};

function mapCoefFrictionToFrictionMove(coefFriction) {
  // Ensure coefFriction is within the range [0, 1]
  if (coefFriction < 0 || coefFriction > 1) {
      throw new Error("coefFriction must be between 0 and 1.");
  }

  // Calculate frictionMove using the linear mapping formula
  const frictionMove = 0.85 + (coefFriction * 0.1499);
  
  return frictionMove;
}

function startDrag(event) {
  // Convert mouse coordinates to WebGL coordinates
  var mouseX = event.clientX;
  var mouseY = event.clientY;
  var worldPos = convertToWebGLCoordinates(mouseX, mouseY);

  // Check if the mouse is within the ball
  var distance = Math.sqrt(
    Math.pow(worldPos[0] - ballPosition[0], 2) +
      Math.pow(worldPos[1] - ballPosition[1], 2)
  );
  if (distance <= 0.125) {
    // Ball radius is approximately 0.125 in WebGL units
    dragging = true;
    lastMousePosition = worldPos; // Store in world coordinates
    ballVelocity = [0, 0]; // Stop ball motion while dragging
  }
}

function dragBall(event) {
  if (!dragging) return;

  var mouseX = event.clientX;
  var mouseY = event.clientY;
  var worldPos = convertToWebGLCoordinates(mouseX, mouseY);

  // Calculate the change in position since the last mouse move
  var deltaX = worldPos[0] - lastMousePosition[0];
  var deltaY = worldPos[1] - lastMousePosition[1];

  // Update the ball's position based on the change in mouse position
  ballPosition[0] += deltaX; 
  ballPosition[1] += deltaY; 

  // Update the release velocity based on the change in position
  releaseVelocity[0] = deltaX;
  releaseVelocity[1] = deltaY;

  lastMousePosition = worldPos;
}

function releaseBall() {
  if (!dragging) return;

  dragging = false;
  // Apply the release velocity to the ball's velocity
  ballVelocity = releaseVelocity.slice();
}

function convertToWebGLCoordinates(mouseX, mouseY) {
  var canvas = document.getElementById("gl-canvas");
  var rect = canvas.getBoundingClientRect();

  // Calculate aspect ratio
  var aspect = canvasWidth / canvasHeight;

  var x = ((mouseX - rect.left) / canvas.width) * 2 - 1; 
  var y = -(((mouseY - rect.top) / canvas.height) * 2 - 1); 

  console.log(window.innerWidth);
  console.log(window.innerHeight);
  // Adjust for aspect ratio
  x *= aspect;

  return [x, y];
}

function updatePhysics() {
  if (!dragging) {
    // Apply gravity to velocity
    ballVelocity[1] += gravity;

    // Update ball position based on velocity
    ballPosition[0] += ballVelocity[0];
    ballPosition[1] += ballVelocity[1];

    // Check for bounce on the ground
    if (ballPosition[1] <= -1 + 0.125) {
      // Ground level considering the ball's radius
      ballVelocity[1] = -ballVelocity[1] * restitution;
      ballVelocity[0] *= frictionMove;
      ballPosition[1] = -1 + 0.125; // Prevent going below ground
    }

    if (ballPosition[1] >= topWall) {
      // Sky level considering the ball's radius
      ballVelocity[1] = -ballVelocity[1] * restitution;
      ballPosition[1] = topWall; // Prevent going above the screen
    }

    // Check for collision with left and right walls
    if (ballPosition[0] >= rightWall || ballPosition[0] <= leftWall) {
      ballVelocity[0] = -ballVelocity[0] * restitution;
      if (ballPosition[0] >= rightWall) 
            ballPosition[0] = rightWall;
      else  ballPosition[0] = leftWall;
    }
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  updatePhysics();

  modelViewMatrix = translate(ballPosition[0], ballPosition[1], ballPosition[2]);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  gl.drawArrays(gl.TRIANGLE_FAN, 0, pointsArray.length);

  requestAnimationFrame(render);
}