"use strict";

// default values
var program;
var canvas;
var gl;

var objectForce = 10.0;
var objectMass = 10.0;

var shape = "dodecahedron";
var motion = "straight";

var positionsArray = [];
var colorsArray = [];
var normalsArray = [];

var numPositions = 108;
var numPositions = 108;
var A = (1 + Math.sqrt(5)) / 2;
var B = 1 / A;

var vertices = [
  vec4(1, 1, 1, 1.0), //8
  vec4(1, 1, -1, 1.0), //7
  vec4(1, -1, 1, 1.0), //6
  vec4(1, -1, -1, 1.0), //5
  vec4(-1, 1, 1, 1.0), //4
  vec4(-1, 1, -1, 1.0), //3
  vec4(-1, -1, 1, 1.0), //2
  vec4(-1, -1, -1, 1.0), //1
  vec4(0, B, A, 1.0), //12
  vec4(0, B, -A, 1.0), //11
  vec4(0, -B, A, 1.0), //10
  vec4(0, -B, -A, 1.0), //9
  vec4(B, A, 0, 1.0), //16
  vec4(B, -A, 0, 1.0), //15
  vec4(-B, A, 0, 1.0), //14
  vec4(-B, -A, 0, 1.0), //13
  vec4(A, 0, B, 1.0), //20
  vec4(A, 0, -B, 1.0), //18
  vec4(-A, 0, B, 1.0), //19
  vec4(-A, 0, -B, 1.0), //17
];

var baseColor = vec4(1.0, 0.0, 1.0, 1.0);

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 20.0;

var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var near = 0.3;
var far = 3.0;
var radius = 1.0;
var theta = -0.8;
var phi = 0.0;
var dr = (5.0 * Math.PI) / 180.0;
var aspect;

var velocity = 1.0;
var acceleration = 0.0;
var angle = 0.0;

var startTime = null;
var isAnimating = false;

var translation = vec4(-15.0, 0.0, 0.0, 1.0);
var indexColor = 0;

var vertexColors = [
  vec4(1.0, 0.0, 0.0, 1.0), // Red
  vec4(0.0, 1.0, 0.0, 1.0), // Green
  vec4(0.0, 0.0, 1.0, 1.0), // Blue
  vec4(1.0, 1.0, 0.0, 1.0), // Yellow
  vec4(1.0, 0.0, 1.0, 1.0), // Magenta
  vec4(0.0, 1.0, 1.0, 1.0), // Cyan
  vec4(0.5, 0.5, 0.5, 1.0), // Gray
  vec4(1.0, 0.5, 0.0, 1.0), // Orange
  vec4(0.5, 0.0, 0.5, 1.0), // Purple
  vec4(0.5, 0.5, 0.0, 1.0), // Olive
  vec4(0.0, 0.5, 0.5, 1.0), // Teal
  vec4(0.5, 0.0, 0.0, 1.0), // Maroon
  vec4(0.0, 0.5, 0.0, 1.0), // Dark Green
  vec4(0.0, 0.0, 0.5, 1.0), // Navy
  vec4(1.0, 0.75, 0.8, 1.0), // Pink
  vec4(0.75, 1.0, 0.8, 1.0), // Light Green
  vec4(0.75, 0.8, 1.0, 1.0), // Light Blue
  vec4(1.0, 0.75, 0.5, 1.0), // Peach
  vec4(0.75, 0.5, 1.0, 1.0), // Lavender
  vec4(0.5, 1.0, 0.75, 1.0), // Mint
];

var main = function () {
  function quad(a, b, c, d) {
    var indices = [a, b, c, a, c, d];

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    indexColor %= 20;

    for (var i = 0; i < indices.length; i++) {
      positionsArray.push(vertices[indices[i]]);
      colorsArray.push(vertexColors[indexColor]);

      normalsArray.push(normal);
    }

    indexColor++;
  }

  function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
  }

  function penta(a, b, c, d, e) {
    var indices = [a, b, c, c, e, a, c, d, e];

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    indexColor %= 20;

    for (var i = 0; i < indices.length; i++) {
      positionsArray.push(vertices[indices[i]]);
      colorsArray.push(vertexColors[a]);

      normalsArray.push(normal);
    }

    indexColor++;
  }

  function colorPenta() {
    penta(0, 16, 2, 10, 8);
    penta(0, 8, 4, 14, 12);
    penta(16, 17, 1, 12, 0);
    penta(1, 9, 11, 3, 17);
    penta(1, 12, 14, 5, 9);
    penta(2, 13, 15, 6, 10);
    penta(13, 3, 17, 16, 2);
    penta(3, 11, 7, 15, 13);
    penta(4, 8, 10, 6, 18);
    penta(14, 5, 19, 18, 4);
    penta(5, 19, 7, 11, 9);
    penta(15, 7, 19, 18, 6);
  }

  function hexToRgb(hex) {
    var bigint = parseInt(hex.slice(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return vec4(r / 255, g / 255, b / 255, 1.0);
  }

  function eventListeners() {
    document.getElementById("object-select").onchange = function () {
      shape = this.value;

      if (shape === "cube") {
        numPositions = 36;
        vertices = [
          vec4(-6.5, -6.5, 6.5, 7.0),
          vec4(-6.5, 6.5, 6.5, 7.0),
          vec4(6.5, 6.5, 6.5, 7.0),
          vec4(6.5, -6.5, 6.5, 7.0),
          vec4(-6.5, -6.5, -6.5, 7.0),
          vec4(-6.5, 6.5, -6.5, 7.0),
          vec4(6.5, 6.5, -6.5, 7.0),
          vec4(6.5, -6.5, -6.5, 7.0),
        ];
      } else if (shape === "dodecahedron") {
        numPositions = 108;
        vertices = [
          vec4(1, 1, 1, 1.0), //8
          vec4(1, 1, -1, 1.0), //7
          vec4(1, -1, 1, 1.0), //6
          vec4(1, -1, -1, 1.0), //5
          vec4(-1, 1, 1, 1.0), //4
          vec4(-1, 1, -1, 1.0), //3
          vec4(-1, -1, 1, 1.0), //2
          vec4(-1, -1, -1, 1.0), //1
          vec4(0, B, A, 1.0), //12
          vec4(0, B, -A, 1.0), //11
          vec4(0, -B, A, 1.0), //10
          vec4(0, -B, -A, 1.0), //9
          vec4(B, A, 0, 1.0), //16
          vec4(B, -A, 0, 1.0), //15
          vec4(-B, A, 0, 1.0), //14
          vec4(-B, -A, 0, 1.0), //13
          vec4(A, 0, B, 1.0), //20
          vec4(A, 0, -B, 1.0), //18
          vec4(-A, 0, B, 1.0), //19
          vec4(-A, 0, -B, 1.0), //17
        ];
      }

      positionsArray = [];
      colorsArray = [];

      init();
    };

    document.getElementById("baseColor").onchange = function () {
      var color = hexToRgb(this.value);
      baseColor = color;

      init();
    };

    document.getElementById("Button1").onclick = function () {
      near *= 1.1;
      far *= 1.1;
    };
    document.getElementById("Button2").onclick = function () {
      near *= 0.9;
      far *= 0.9;
    };
    document.getElementById("Button3").onclick = function () {
      radius *= 2.0;
    };
    document.getElementById("Button4").onclick = function () {
      radius *= 0.5;
    };
    document.getElementById("Button5").onclick = function () {
      theta += dr;
    };
    document.getElementById("Button6").onclick = function () {
      theta -= dr;
    };
    document.getElementById("Button7").onclick = function () {
      phi += dr;
    };
    document.getElementById("Button8").onclick = function () {
      phi -= dr;
    };

    document.getElementById("ambientSlider").oninput = function () {
      var value = parseFloat(this.value);
      lightAmbient = vec4(value, value, value, 1.0);
      ambientProduct = mult(lightAmbient, materialAmbient);
    };

    document.getElementById("diffuseSlider").oninput = function () {
      var value = parseFloat(this.value);
      lightDiffuse = vec4(value, value, value, 1.0);
      diffuseProduct = mult(lightDiffuse, materialDiffuse);
    };

    document.getElementById("specularSlider").oninput = function () {
      var value = parseFloat(this.value);
      lightSpecular = vec4(value, value, value, 1.0);
      specularProduct = mult(lightSpecular, materialSpecular);
    };

    document.getElementById("lightXSlider").oninput = function () {
      lightPosition[0] = parseFloat(this.value);
    };

    document.getElementById("lightYSlider").oninput = function () {
      lightPosition[1] = parseFloat(this.value);
    };

    document.getElementById("lightZSlider").oninput = function () {
      lightPosition[2] = parseFloat(this.value);
    };

    document.getElementById("baseColor").oninput = function () {
      var color = hexToRgb(this.value);
      baseColor = color;
    };

    // Add event listeners for trajectory controls
    document.getElementById("trajectory-select").onchange = function () {
      motion = this.value;
    };
    document.getElementById("velocity").oninput = function () {
      velocity = parseFloat(this.value);
    };
    document.getElementById("acceleration").oninput = function () {
      acceleration = parseFloat(this.value);
    };
    document.getElementById("angle").oninput = function () {
      angle = parseFloat(this.value);
    };

    // Add event listeners for start and stop buttons
    document.getElementById("startButton").onclick = function () {
      isAnimating = true;
      startTime = null; // Reset start time
      requestAnimationFrame(render);
    };
    document.getElementById("stopButton").onclick = function () {
      isAnimating = false;
    };
  }

  function calculatePosition(t) {
    var radAngle = angle * (Math.PI / 180); // Convert angle to radians
    var x, y;

    switch (motion) {
      case "straight":
        x = velocity * t;
        y = 0;
        break;
      case "angled":
        x = velocity * t * Math.cos(radAngle);
        y = velocity * t * Math.sin(radAngle);
        break;
      case "parabola":
        x = velocity * t * Math.cos(radAngle);
        y = velocity * t * Math.sin(radAngle) - 0.5 * 0.005 * t * t;
        break;
    }

    return { x, y };
  }

  eventListeners();
  init();

  function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    aspect = canvas.width / canvas.height;

    gl.enable(gl.DEPTH_TEST);

    if (shape === "cube") {
      normalsArray = [];
      colorCube();
    } else if (shape === "dodecahedron") {
      normalsArray = [];
      colorPenta();
    }

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    gl.uniform1f(
      gl.getUniformLocation(program, "uShininess"),
      materialShininess
    );

    render();
  }

  function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(theta)
    );
    modelViewMatrix = lookAt(eye, at, up);

    // projectionMatrix = ortho(-2.0, 2.0, -2.0 / aspect, 2.0 / aspect, near, far);
    projectionMatrix = ortho(-16.0, 16.0, -16.0 / aspect, 16.0 / aspect, -16.0, 16.0);

    if (isAnimating) {
      if (startTime === null) {
        startTime = timestamp;
      }
      var elapsedTime = (timestamp - startTime) / 1000; // Convert to seconds
      var position = calculatePosition(elapsedTime);

      // Update the modelViewMatrix with the new position
      var translationMatrix = translate(position.x, position.y, 0);
      modelViewMatrix = mult(modelViewMatrix, translationMatrix);
    }

    // modelViewMatrix = mat4();
    // modelViewMatrix = mult(
    //     modelViewMatrix,
    //     rotate(theta[xAxis], vec3(1, 0, 0))
    // );
    // modelViewMatrix = mult(
    //     modelViewMatrix,
    //     rotate(theta[yAxis], vec3(0, 1, 0))
    // );
    // modelViewMatrix = mult(
    //     modelViewMatrix,
    //     rotate(theta[zAxis], vec3(0, 0, 1))
    // );

    gl.uniform4fv(
      gl.getUniformLocation(program, "uAmbientProduct"),
      ambientProduct
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "uDiffuseProduct"),
      diffuseProduct
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "uSpecularProduct"),
      specularProduct
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightPosition"),
      lightPosition
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightPosition"),
      lightPosition
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightPosition"),
      lightPosition
    );

    gl.uniform4fv(gl.getUniformLocation(program, "uMaterialColor"), baseColor);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    if (isAnimating) {
      requestAnimationFrame(render);
    }
  }
};

main();
