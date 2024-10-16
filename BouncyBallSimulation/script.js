var gl;
var pointsArray = [];
var colorsArray = [];

var ballPosition = [0.0, 0.9, 0.0]; 
var ballVelocity = [0.0, -0.01, 0.0];
var gravity = -0.0005; 
var restitution = 0.4; 
var coefFriction = 0.02;
var acceleration = 0;

var dragging = false; 
var lastMousePosition = [0, 0]; 
var releaseVelocity = [0.0, 0.0]; 

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;
var leftWall = -window.innerWidth / 830;
var rightWall = -leftWall;
var topWall = window.innerHeight / 900;
var frictionMove = mapCoefFrictionToFrictionMove(1 - coefFriction); 
var borderless = false; 

window.onload = function init() {
  var canvas = document.getElementById("gl-canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2.0 isn't available");
  }

  // Ball geometry 
  var ballRadius = 0.05 * 2.5; 
  var slices = 100; 

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

  // Add slider event listeners
  document.getElementById("coefFriction").oninput = function(event) {
    coefFriction = parseFloat(event.target.value);
    frictionMove = mapCoefFrictionToFrictionMove(1 - coefFriction);
    document.getElementById("coefFrictionDisplay").innerHTML = coefFriction.toFixed(2);
  };
  document.getElementById("restitution").oninput = function(event) {
    restitution = parseFloat(event.target.value);
    document.getElementById("restitutionDisplay").innerHTML = restitution.toFixed(2);
  };
  document.getElementById("gravity").oninput = function(event) {
    gravity = parseFloat(event.target.value);
    document.getElementById("gravityDisplay").innerHTML = gravity.toFixed(5); 
  };
  document.getElementById("acceleration").oninput = function(event) {
    acceleration = parseFloat(event.target.value);
    document.getElementById("accelerationDisplay").innerHTML = acceleration.toFixed(5);
  };

  // Add borderless toggle listener
  document.getElementById("borderlessToggle").addEventListener("change", function() {
    borderless = this.checked;
  });

  // Add reset button listener
  document.getElementById("resetButton").addEventListener("click", resetToDefaults);

  // Add collapse/expand button listener
  document.getElementById("toggleButton").addEventListener("click", toggleMenu);

  render();
};

function resetToDefaults() {
  // Reset sliders to default values
  document.getElementById("coefFriction").value = 0.02;
  document.getElementById("restitution").value = 0.4;
  document.getElementById("gravity").value = -0.0005;
  document.getElementById("acceleration").value = 0;

  // Update the corresponding variables and display values
  coefFriction = 0.02;
  frictionMove = mapCoefFrictionToFrictionMove(1 - coefFriction); 
  restitution = 0.4;
  gravity = -0.0005;
  acceleration = 0;

  document.getElementById("coefFrictionDisplay").innerHTML = coefFriction.toFixed(2);
  document.getElementById("restitutionDisplay").innerHTML = restitution.toFixed(2);
  document.getElementById("gravityDisplay").innerHTML = gravity.toFixed(4);
  document.getElementById("accelerationDisplay").innerHTML = acceleration.toFixed(5);
}

function toggleMenu() {
  var controls = document.getElementById("controls");
  var toggleButton = document.getElementById("toggleButton"); 
  
  if (controls.classList.contains("collapsed")) {
      controls.classList.remove("collapsed");
      toggleButton.innerHTML = "Collapse Menu"; 
  } else {
      controls.classList.add("collapsed");
      toggleButton.innerHTML = "Expand Menu";
  }
}

function mapCoefFrictionToFrictionMove(coefFriction) {
  // Ensure coefFriction is within the range [0, 1]
  if (coefFriction < 0) coefFriction = 0;
  if (coefFriction > 1) coefFriction = 1;

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
    dragging = true;
    lastMousePosition = worldPos; 
    ballVelocity = [0, 0];
  }
}

function dragBall(event) {
  if (!dragging) return;

  var mouseX = event.clientX;
  var mouseY = event.clientY;
  var worldPos = convertToWebGLCoordinates(mouseX, mouseY);

  var deltaX = worldPos[0] - lastMousePosition[0];
  var deltaY = worldPos[1] - lastMousePosition[1];

  ballPosition[0] += deltaX; 
  ballPosition[1] += deltaY; 

  releaseVelocity[0] = deltaX;
  releaseVelocity[1] = deltaY;

  lastMousePosition = worldPos;
}

function releaseBall() {
  if (!dragging) return;

  dragging = false;
  ballVelocity = releaseVelocity.slice();
}

function convertToWebGLCoordinates(mouseX, mouseY) {
  var canvas = document.getElementById("gl-canvas");
  var rect = canvas.getBoundingClientRect();

  var aspect = canvasWidth / canvasHeight;

  var x = ((mouseX - rect.left) / canvas.width) * 2 - 1; 
  var y = -(((mouseY - rect.top) / canvas.height) * 2 - 1); 

  x *= aspect;

  return [x, y];
}

function updatePhysics() {
  if (!dragging) {
    // Apply gravity to velocity
    ballVelocity[1] += gravity;

    // Apply acceleration to velocity
    ballVelocity[0] += acceleration;

    // Update ball position based on velocity
    ballPosition[0] += ballVelocity[0];
    ballPosition[1] += ballVelocity[1];

    // Check for bounce on the ground
    if (ballPosition[1] <= -1 + 0.125) {
      ballVelocity[1] = -ballVelocity[1] * restitution;
      ballVelocity[0] *= frictionMove; 
      ballPosition[1] = -1 + 0.125;
    }

    // Check for bounce on the ceiling
    if (ballPosition[1] >= topWall) {
      ballVelocity[1] = -ballVelocity[1] * restitution;
      ballPosition[1] = topWall; 
    }

    // Handle borderless behavior
    if (borderless) {
      if (ballPosition[0] >= rightWall) {
        ballPosition[0] = leftWall;
      } else if (ballPosition[0] <= leftWall) {
        ballPosition[0] = rightWall;
      }
    } else {
      // Check for collision with left and right walls (with borders)
      if (ballPosition[0] >= rightWall || ballPosition[0] <= leftWall) {
        ballVelocity[0] = -ballVelocity[0] * restitution;
        if (ballPosition[0] >= rightWall) 
              ballPosition[0] = rightWall;
        else  ballPosition[0] = leftWall; 
      }
    }
  }

  // Update speed display
  document.getElementById("speedX").innerHTML = ballVelocity[0].toFixed(2);
  document.getElementById("speedY").innerHTML = ballVelocity[1].toFixed(2);
  document.getElementById("positionX").innerHTML = ballPosition[0].toFixed(2);
  document.getElementById("positionY").innerHTML = ballPosition[1].toFixed(2);
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