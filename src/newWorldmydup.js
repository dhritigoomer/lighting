// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform float u_Size;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform int u_whichTexture;
    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        }
        else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        }
        else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        }
        else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        }
        else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        }
        else {
            gl_FragColor = vec4(1,.2,.2,1);
        }

    }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let g_globalX = 0;
let g_globalY = 0;
let g_globalZ = 0;
let g_origin = [0, 0];

// animal drawing
var FrontLeftLegXAngle = 0;
var FrontLeftLegYAngle = 0;
var FrontLeftLegZAngle = 0;

var FrontRightLegXAngle = 0;
var FrontRightLegYAngle = 0;
var FrontRightLegZAngle = 0;

var BackLeftLegXAngle = 0;
var BackLeftLegYAngle = 0;
var BackLeftLegZAngle = 0;

var BackRightLegXAngle = 0;
var BackRightLegYAngle = 0;
var BackRightLegZAngle = 0;

var BottomFrontLeftLegXAngle = 0;
var BottomFrontLeftLegYAngle = 0;
var BottomFrontLeftLegZAngle = 0;

var BottomFrontRightLegXAngle = 0;
var BottomFrontRightLegYAngle = 0;
var BottomFrontRightLegZAngle = 0;

var BottomBackLeftLegXAngle = 0;
var BottomBackLeftLegYAngle = 0;
var BottomBackLeftLegZAngle = 0;

var BottomBackRightLegXAngle = 0;
var BottomBackRightLegYAngle = 0;
var BottomBackRightLegZAngle = 0;

var HeadXAngle = 0;
var HeadYAngle = 0;
var HeadZAngle = 0;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler1');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 25;
let g_headAngle = 0;
let g_leftAngle = -12;
let g_rightAngle = -12;
let g_leftFootAngle = 12;
let g_rightFootAngle = 12;
let g_magentaAngle = 0;
let g_headAnimation = false;
let g_magentaAnimation = false;

// Set up actions for the HTML UI elements
function addActionsforHTMLUI() {

  document.getElementById('FrontLeftLegXSlide').addEventListener('input', function() {FrontLeftLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('FrontLeftLegYSlide').addEventListener('input', function() {FrontLeftLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('FrontLeftLegZSlide').addEventListener('input', function() {FrontLeftLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('FrontRightLegXSlide').addEventListener('input', function() {FrontRightLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('FrontRightLegYSlide').addEventListener('input', function() {FrontRightLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('FrontRightLegZSlide').addEventListener('input', function() {FrontRightLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('BackLeftLegXSlide').addEventListener('input', function() {BackLeftLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('BackLeftLegYSlide').addEventListener('input', function() {BackLeftLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('BackLeftLegZSlide').addEventListener('input', function() {BackLeftLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('BackRightLegXSlide').addEventListener('input', function() {BackRightLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('BackRightLegYSlide').addEventListener('input', function() {BackRightLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('BackRightLegZSlide').addEventListener('input', function() {BackRightLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('BottomFrontLeftLegXSlide').addEventListener('input', function() {BottomFrontLeftLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomFrontLeftLegYSlide').addEventListener('input', function() {BottomFrontLeftLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomFrontLeftLegZSlide').addEventListener('input', function() {BottomFrontLeftLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('BottomFrontRightLegXSlide').addEventListener('input', function() {BottomFrontRightLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomFrontRightLegYSlide').addEventListener('input', function() {BottomFrontRightLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomFrontRightLegZSlide').addEventListener('input', function() {BottomFrontRightLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('BottomBackLeftLegXSlide').addEventListener('input', function() {BottomBackLeftLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomBackLeftLegYSlide').addEventListener('input', function() {BottomBackLeftLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomBackLeftLegZSlide').addEventListener('input', function() {BottomBackLeftLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('BottomBackRightLegXSlide').addEventListener('input', function() {BottomBackRightLegXAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomBackRightLegYSlide').addEventListener('input', function() {BottomBackRightLegYAngle = this.value; renderAllShapes(); });
  document.getElementById('BottomBackRightLegZSlide').addEventListener('input', function() {BottomBackRightLegZAngle = this.value; renderAllShapes(); });

  document.getElementById('HeadXSlide').addEventListener('input', function() {HeadXAngle = this.value; renderAllShapes(); });
  document.getElementById('HeadYSlide').addEventListener('input', function() {HeadYAngle = this.value; renderAllShapes(); });
  document.getElementById('HeadZSlide').addEventListener('input', function() {HeadZAngle = this.value; renderAllShapes(); });

  document.getElementById('angleSlide').addEventListener('input', function() { g_globalY = this.value; renderAllShapes(); });


}

function initTextures() {

    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    image.onload = function(){ sendImagetoTexture0(image);}
    image.src = 'farm-2.jpg';

    var image2 = new Image();
    if (!image2) {
        console.log('Failed to create the image object');
        return false;
    }
    image2.onload = function(){ sendImagetoTexture1(image2);}
    image2.src = 'grass.jpg';

    return true;
}

function sendImagetoTexture0(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler0, 0);
    console.log('Finished loadTexture');
}

function sendImagetoTexture1(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler1, 1);
    console.log('Finished loadTexture');

}

var g_startTime = performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
    g_seconds=performance.now()/1000.0-g_startTime;
    updateAnimationAngles();

    renderAllShapes();
    requestAnimationFrame(tick);
}

var g_shapesList = [];

function origin(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    g_origin = [x, y];
}

function click(ev) {
    let coordinates = convertCoordinatesEventToGL(ev);
    g_globalX = g_globalX - coordinates[0]*360;
    g_globalY = g_globalY - coordinates[1]*360;

    renderAllShapes();
}

function originCoords(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    g_origin = [x, y];
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;

    let temp = [x,y];
    x = (x - g_origin[0])/400;
    y = (y - g_origin[1])/400;
    g_origin = temp;

    return([x,y]);
}

function updateAnimationAngles() {
    // if (g_headAnimation) {
    //     g_headAngle = (45 * Math.sin(g_seconds));
    // }

    if (g_magentaAnimation) {
        g_magentaAngle = (45 * Math.sin(3 * g_seconds));
      }

}

var g_eye = [0,0,3];
var g_at = [0,0,-100];
var g_up = [0,1,0];
var g_camera = new Camera();

function keydown(ev) {
    if (ev.keyCode == 65) {     // D
        g_camera.right();
    }
    else if (ev.keyCode == 68) {    // A
        g_camera.left();
    }
    else if (ev.keyCode == 83) {  // S
        g_camera.back();
    }

    else if (ev.keyCode == 87) {
        g_camera.forward();  // W
    }
    else if (ev.keyCode == 81) {    // Q
        g_camera.panLeft();
    }
    else if (ev.keyCode == 69) {    // E
        g_camera.panRight();
    }

    else if (ev.keyCode == 82) { // R
        g_camera.panUp();
    }

    else if(ev.keyCode == 70) { // F
        g_camera.panDown();
    }

    else if (ev.keyCode == 32) {    // Space
        g_camera.eye.elements[1] += 0.2;
    }

    else if (ev.keyCode == 16) {    // Shift
        g_camera.eye.elements[1] -= 0.2;
    }


    renderAllShapes();
    console.log(ev.keyCode);
}

function renderAllShapes() {
    var startTime = performance.now();

    var projMat = new Matrix4();
    projMat.setPerspective(30, 1*canvas.width/canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();
    viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2], g_at[0], g_at[1], g_at[2], g_up[0], g_up[1], g_up[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    globalRotMat.rotate(g_globalX,1,0,0); // x-axis
    globalRotMat.rotate(g_globalY,0,1,0); // y-axis
    globalRotMat.rotate(g_globalZ,0,0,1);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Colors

    // Skybox
    var sky = new Cube();
    sky.color = [1.0, 0.0, 0.0, 1.0];
    sky.textureNum = 0;
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.render();

    // Floor
    var floor = new Cube();
    floor.color = [1.0, 0.0, 0.0, 1.0];
    floor.textureNum = 1;
    floor.matrix.translate(0, -0.75, 0.0);
    floor.matrix.scale(10, 0.01, 10);
    floor.matrix.translate(-0.5, 0.0, -0.5);
    floor.render();

    // drawMap();

    var head = new Cube();
    head.color = [150/255, 150/255, 150/255, 1 ];
    head.textureNum = 0;
    head.matrix.rotate(-HeadXAngle, 1, 0, 0);
    head.matrix.rotate(-HeadYAngle, 0, 1, 0);
    head.matrix.rotate(-HeadZAngle, 0, 0, 1);
    head.matrix.scale(0.35, 0.35, 0.35);
    head.matrix.translate(-.5, 0.25, -0.8);
    head.render();

    var body = new Cube();
    body.color = [150/255, 150/255, 150/255, 1 ];
    body.textureNum = 1;
    body.matrix.scale(.5, 0.4, 0.65);
    body.matrix.translate(-.5, -.25, -0.25);
    body.render();

    drawAnimal();

    var duration = performance.now() - startTime;
	  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {   // we take the text and its htmlID
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
      console.log("Failed to get " + htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text; // send inner html to whatver the text was
  }

  function main() {
      setupWebGL();

      connectVariablestoGLSL();

      addActionsforHTMLUI();

      document.onkeydown = keydown;

      initTextures();

      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      requestAnimationFrame(tick);

  }
