"use strict";

// default values
var program;
var canvas;
var gl;

var shape = "dodecahedron";

var positionsArray = [];
var colorsArray = [];
var normalsArray = [];

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

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 20.0;

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
var dr = 5.0 * Math.PI/180.0;
var aspect;

var translation = vec4(-15.0, 0.0, 0.0, 1.0);
var indexColor = 0;

var velocity = 1.0;
var acceleration = 0.0;
var angle = 0.0;
var trajectory = "straight";

var startTime = null;
var isAnimating = false;

var main = function () {

    function quad(a, b, c, d, color) {
        var indices = [a, b, c, a, c, d];

        var t1 = subtract(vertices[b], vertices[a]);
        var t2 = subtract(vertices[c], vertices[b]);
        var normal = cross(t1, t2);
        normal = vec3(normal);

        for (var i = 0; i < indices.length; i++) {
            positionsArray.push(vertices[indices[i]]);
            colorsArray.push(color);
            normalsArray.push(normal);
        }
    }

    function penta(a, b, c, d, e, color) {
        var indices = [a, b, c, c, e, a, c, d, e];

        var t1 = subtract(vertices[b], vertices[a]);
        var t2 = subtract(vertices[c], vertices[b]);
        var normal = cross(t1, t2);
        normal = vec3(normal);

        for (var i = 0; i < indices.length; i++) {
            positionsArray.push(vertices[indices[i]]);
            colorsArray.push(color);
            normalsArray.push(normal);
        }
    }

    function colorCube() {
        var baseColor = hexToRgb(document.getElementById("baseColor").value);
        var gradientColors = generateGradientColors(baseColor, 6);

        quad(1, 0, 3, 2, gradientColors[0]);
        quad(2, 3, 7, 6, gradientColors[1]);
        quad(3, 0, 4, 7, gradientColors[2]);
        quad(6, 5, 1, 2, gradientColors[3]);
        quad(4, 5, 6, 7, gradientColors[4]);
        quad(5, 4, 0, 1, gradientColors[5]);
    }

    function colorDodecahedron() {
        var baseColor = hexToRgb(document.getElementById("baseColor").value);
        var gradientColors = generateGradientColors(baseColor, 12);

        penta(0, 16, 2, 10, 8, gradientColors[0]);
        penta(0, 8, 4, 14, 12, gradientColors[1]);
        penta(16, 17, 1, 12, 0, gradientColors[2]);
        penta(1, 9, 11, 3, 17, gradientColors[3]);
        penta(1, 12, 14, 5, 9, gradientColors[4]);
        penta(2, 13, 15, 6, 10, gradientColors[5]);
        penta(13, 3, 17, 16, 2, gradientColors[6]);
        penta(3, 11, 7, 15, 13, gradientColors[7]);
        penta(4, 8, 10, 6, 18, gradientColors[8]);
        penta(14, 5, 19, 18, 4, gradientColors[9]);
        penta(5, 19, 7, 11, 9, gradientColors[10]);
        penta(15, 7, 19, 18, 6, gradientColors[11]);
    }

    function generateGradientColors(baseColor, numColors) {
        var colors = [];
        for (var i = 0; i < numColors; i++) {
            var factor = i / (numColors - 1);
            var color = vec4(
                baseColor[0] * (1 - factor) + factor,
                baseColor[1] * (1 - factor) + factor,
                baseColor[2] * (1 - factor) + factor,
                1.0
            );
            colors.push(color);
        }
        return colors;
    }

    function calculatePosition(t) {
        var radAngle = angle * (Math.PI / 180); // Convert angle to radians
        var x, y;

        switch (trajectory) {
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
                y = velocity * t * Math.sin(radAngle) - 0.5 * acceleration * t * t;
                break;
        }

        return { x, y };
    }

    function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        positionsArray = [];
        colorsArray = [];
        normalsArray = [];

        if (shape === "cube") {
            colorCube();
        } else if (shape === "dodecahedron") {
            colorDodecahedron();
        }

        // Initialize buffers
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

        var positionLoc = gl.getAttribLocation(program, "aPosition");
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

        var colorLoc = gl.getAttribLocation(program, "aColor");
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

        gl.drawArrays(gl.TRIANGLES, 0, positionsArray.length);
    }

    function hexToRgb(hex) {
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        return vec4(r / 255, g / 255, b / 255, 1.0);
    }

    function eventListeners() {
        document.getElementById("object-select").addEventListener("change", function() {
            shape = this.value;
            drawScene();
        });

        document.getElementById("Button1").onclick = function(){near  *= 1.1; far *= 1.1;};
        document.getElementById("Button2").onclick = function(){near *= 0.9; far *= 0.9;};
        document.getElementById("Button3").onclick = function(){radius *= 2.0;};
        document.getElementById("Button4").onclick = function(){radius *= 0.5;};
        document.getElementById("Button5").onclick = function(){theta += dr;};
        document.getElementById("Button6").onclick = function(){theta -= dr;};
        document.getElementById("Button7").onclick = function(){phi += dr;};
        document.getElementById("Button8").onclick = function(){phi -= dr;};

        // Add event listener for base color input
        document.getElementById("baseColor").addEventListener("input", drawScene);

        // Add event listeners for trajectory controls
        document.getElementById("trajectory-select").addEventListener("change", function() {
            trajectory = this.value;
        });

        document.getElementById("velocity").addEventListener("input", function() {
            velocity = parseFloat(this.value);
        });

        document.getElementById("acceleration").addEventListener("input", function() {
            acceleration = parseFloat(this.value);
        });

        document.getElementById("angle").addEventListener("input", function() {
            angle = parseFloat(this.value);
        });

        // Add event listeners for start and stop buttons
        document.getElementById("startButton").addEventListener("click", function() {
            isAnimating = true;
            startTime = null; // Reset start time
            requestAnimationFrame(render);
        });

        document.getElementById("stopButton").addEventListener("click", function() {
            isAnimating = false;
        });
    }

    function init() {
        canvas = document.getElementById("gl-canvas");

        gl = canvas.getContext('webgl2');
        if (!gl) alert("WebGL 2.0 isn't available" );

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);

        aspect =  canvas.width / canvas.height;

        gl.enable(gl.DEPTH_TEST);

        // Initialize shaders
        program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);

        modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
        projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

        drawScene();
    }

    function render(currentTime) {
        if (!isAnimating) return;

        if (!startTime) startTime = currentTime;
        var elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        eye = vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
        projectionMatrix = ortho(-8.0, 8.0, -8.0, 8.0, -8.0, 8.0);

        const { x, y } = calculatePosition(elapsedTime);

        modelViewMatrix = translate(x, y, 0);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        drawScene();

        requestAnimationFrame(render);
    }

    eventListeners();
    init();
}

main();