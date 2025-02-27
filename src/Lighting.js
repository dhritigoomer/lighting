// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;
    attribute vec4 a_Position;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform bool u_normalOn;
    uniform float u_Size;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        if (u_normalOn) {
            v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
        }
        else {
            v_Normal = a_Normal;
        }
        v_VertPos = u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;

    uniform vec3 u_lightPos;
    uniform vec3 u_cameraPos;
    uniform vec3 u_lightColor;
    uniform vec4 u_FragColor;  // uniform変数
    uniform bool u_lightOn;

    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform int u_whichTexture;
    void main() {
        if (u_whichTexture == -3) {
            gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
        }
        else if (u_whichTexture == -2) {
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
        vec3 lightVector = u_lightPos - vec3(v_VertPos);
        float r = length(lightVector);

        vec3 L = normalize(lightVector);
        vec3 N = normalize(v_Normal);
        float nDotL = max(dot(N, L), 0.0);

        vec3 R = reflect(-L, N);
        vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
        float specular = pow(max(dot(E, R), 0.0), 10.0);

        vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
        vec3 ambient = vec3(gl_FragColor) * 0.3;
        if (u_lightOn) {
            // if (u_whichTexture == 0) {
            //     gl_FragColor = vec4(specular*u_lightColor + diffuse*u_lightColor + ambient, 1.0);
            // }
            // else {
            //     gl_FragColor = vec4(diffuse + ambient, 1.0);
            // }
            if (u_whichTexture == 0) {
                gl_FragColor = vec4(diffuse+ambient, 1.0);
            }
            else {
                gl_FragColor = vec4(specular * u_lightColor + diffuse * u_lightColor + ambient, gl_FragColor.a);
            }
        }

    }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_lightPos;
let u_cameraPos;
let u_spotLightPos;
let u_spotLightCutoff;
let u_spotLightDir;
let u_normalOn;
let u_lightOn;
let u_lightColor;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let g_globalX = 0;
let g_globalY = 0;
let g_globalZ = 0;
let g_origin = [0, 0];
let g_lightColor = [1.0, 1.0, 1.0];

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

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
      console.log('Failed to get the storage location of u_lightPos');
      return;
    }

    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
      console.log('Failed to get the storage location of u_cameraPos');
      return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
      console.log('Failed to get the storage location of u_lightOn');
      return;
    }

    u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
    if (!u_lightColor) {
      console.log('Failed to get the storage location of u_lightColor');
      return;
    }

    u_normalOn = gl.getUniformLocation(gl.program, 'u_normalOn');
    if (!u_normalOn) {
      console.log('Failed to get the storage location of u_normalOn');
      return;
    }

    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_NormalMatrix) {
        console.log('Failed to get the storage location of u_NormalMatrix');
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

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler2');
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
let g_headAnimation = false;
let g_magentaAnimation;
let g_lightPos = [0, 1, -2];
let g_lightOn = false;
let g_normalOn = false;

// Set up actions for the HTML UI elements
function addActionsforHTMLUI() {


    document.getElementById('normalOn').onclick = function () { g_normalOn = true; };
    document.getElementById('normalOff').onclick = function () { g_normalOn = false; };

    document.getElementById('light_on').addEventListener('click', function () { g_lightOn = true; });
    document.getElementById('light_off').addEventListener('click', function () { g_lightOn = false; });

    document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_lightPos[0] = this.value/100; renderAllShapes();}});
    document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_lightPos[1] = this.value/100; renderAllShapes();}});
    document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_lightPos[2] = this.value/100; renderAllShapes();}});
    document.getElementById('colorSlide').addEventListener('mousemove', function () { g_lightColor[2] = this.value / 10; });

    document.getElementById('kickLeft').addEventListener('input', function () { g_leftAngle = this.value; renderAllShapes() });
    document.getElementById('kickLeftFoot').addEventListener('input', function () { g_leftFootAngle = this.value; renderAllShapes() });
    document.getElementById('kickRight').addEventListener('input', function () { g_rightAngle = this.value; renderAllShapes() });
    document.getElementById('kickRightFoot').addEventListener('input', function () { g_rightFootAngle = this.value; renderAllShapes() });
    document.getElementById('angleSlide').addEventListener('input', function() { g_globalY = this.value; renderAllShapes(); });

}

function initTextures() {

    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    image.onload = function(){ sendImagetoTexture0(image);}
    image.src = 'ice.jpg'

    var image2 = new Image();
    if (!image2) {
        console.log('Failed to create the image object');
        return false;
    }
    image2.onload = function(){ sendImagetoTexture1(image2);}
    image2.src = 'snow.png';

    var image3 = new Image();
    if (!image3) {
        console.log('Failed to create the image object');
        return false;
    }
    image3.onload = function(){ sendImagetoTexture2(image3);}
    image3.src = 'sky.jpg';

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

function sendImagetoTexture2(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler2, 2);
    console.log('Finished loadTexture');
}

function main() {
    setupWebGL();

    connectVariablestoGLSL();

    addActionsforHTMLUI();

    // got help from tiffany guan on mouse rotation code

    var mouseX = null;
    var mouseY = null;
    var mouseDown = false;

    canvas.onmousedown = function(ev) {
        mouseDown = true;
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    };

    canvas.onmouseup = function(ev) {
        mouseDown = false;
    };

    canvas.onmousemove = function(ev) {
        if (mouseDown) {
        // updated values of xyz
        var newX = ev.clientX;
        var newY = ev.clientY;

        g_camera.at.elements[0] += (newX - mouseX) * 0.5;
        g_camera.at.elements[1] += (newY - mouseY) * 0.5;

        mouseX = newX;
        mouseY = newY;

        renderAllShapes();
        }
    };

    document.onkeydown = keydown;

    initTextures();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(tick);

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

    g_lightPos[0] = Math.cos(g_seconds);

}

var g_camera = new Camera();

function keydown(ev) {
    if (ev.keyCode == 65) {     // A
        g_camera.left();
    }
    else if (ev.keyCode == 68) {    // D
        g_camera.right();
    }
    else if (ev.keyCode == 83) {  // S
        g_camera.back();
    }
    else if (ev.keyCode == 87) {  // W
        g_camera.forward();
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
    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
        g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
        g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    globalRotMat.rotate(g_globalX,1,0,0); // x-axis
    globalRotMat.rotate(g_globalY,0,1,0); // y-axis
    globalRotMat.rotate(g_globalZ,0,0,1);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Colors
    var BLACK = [0.230, 0.182, 0.182, 1.0];
    var BROWN = [0.610, 0.603, 0.531, 1.0];
    var PINK = [0.830, 0.681, 0.681, 1.0];
    // var WHITE = [1.0, 1.0, 1.0, 1.0];

    // Skybox
    var sky = new Cube();
    sky.color = [1.0, 0.0, 0.0, 1.0];
    sky.textureNum = 2;
    if (g_normalOn) sky.textureNum = -3;
    sky.matrix.scale(-50, -50, -50);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.renderfast();

    // Light
    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
    gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);
    gl.uniform1i(u_lightOn, g_lightOn);
    // gl.uniform1i(u_normalOn, g_normalOn);

    var light = new Cube();
    light.color = [2, 2, 0, 1];
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-.1, -.1, -.1);
    light.matrix.translate(-.5, -.5, -.5);
    light.render();

    // Cubes
    icecube = new Cube();
    icecube.textureNum = 2;
    if (g_normalOn)icecube.textureNum = -3;
    icecube.matrix.scale(.5, .5, .5);
    icecube.matrix.translate(-2, 0.5, 4);
    icecube.normalMatrix.setInverseOf(icecube.matrix).transpose();
    icecube.render();

    // Sphere
    var sphere = new Sphere();
    sphere.matrix.translate(-0.75, 0.75, -.3);
    sphere.matrix.scale(.5, .5, .5);
    if (g_normalOn) {
        sphere.textureNum = -3;
    } else {
        sphere.textureNum = 1;
    }
    sphere.normalMatrix.setInverseOf(sphere.matrix).transpose();
    sphere.render();

    // Floor
    var floor = new Cube();
    floor.color = [1.0, 0.0, 0.0, 1.0];
    floor.textureNum = 1;
    floor.matrix.translate(0, -0.75, 0.0);
    floor.matrix.scale(35, 0.01, 35);
    floor.matrix.translate(-0.5, 0.0, -0.5);
    floor.renderfast();

    // drawMap();

    // Bunny head

    var head = new Cube();
    head.color = BROWN;
    if (g_normalOn) head.textureNum = -3;
    head.matrix.scale(0.45, 0.4, 0.4);
    head.matrix.translate(0, 0.4, -2.125);
    head.matrix.translate(-0.5, -0.5, 0);
    head.normalMatrix.setInverseOf(head.matrix).transpose();
    head.render();

    // Eyes

    var leftEye = new Cube();
    leftEye.color = BLACK;
    if (g_normalOn) leftEye.textureNum = -3;
    leftEye.matrix.scale(0.075, 0.15, 0.1);
    leftEye.matrix.translate(-2, 1.3, -8.6);
    leftEye.normalMatrix.setInverseOf(leftEye.matrix).transpose();
    leftEye.render();

    var rightEye = new Cube();
    rightEye.color = BLACK;
    if (g_normalOn) rightEye.textureNum = -3;
    rightEye.matrix.scale(0.075, 0.15, 0.1);
    rightEye.matrix.translate(1, 1.3, -8.6);
    rightEye.normalMatrix.setInverseOf(rightEye.matrix).transpose();
    rightEye.render();

    // Ears
    var ear1 = new Cube();
    ear1.color = BROWN;
    if (g_normalOn) ear1.textureNum = -3;
    ear1.matrix.scale(0.11, 0.6, 0.1);
    ear1.matrix.translate(-1.5, 0.25, -5.75);
    ear1.matrix.rotate(-20, 1, 45, 0);
    ear1.normalMatrix.setInverseOf(ear1.matrix).transpose();
    ear1.render();

    var ear2 = new Cube();
    ear2.color = BROWN;
    if (g_normalOn) ear2.textureNum = -3;
    ear2.matrix.scale(0.11, 0.6, 0.1);
    ear2.matrix.translate(0.5, 0.25, -5.75);
    ear2.matrix.rotate(20, 1, 45, 0);
    ear2.normalMatrix.setInverseOf(ear2.matrix).transpose();
    ear2.render();

    var nose = new Cube();
    nose.color = PINK;
    if (g_normalOn) nose.textureNum = -3;
    nose.matrix.scale(0.1, 0.1, 0.1);
    nose.matrix.translate(-0.5, 0.9, -9);
    nose.normalMatrix.setInverseOf(nose.matrix).transpose();
    nose.render();


    // Body

    var body = new Cube();
    body.color = BROWN;
    if (g_normalOn) body.textureNum = -3;
    body.matrix.rotate(12, 1, 0, 0);
    body.matrix.scale(0.5, 0.4, 0.8);
    body.matrix.translate(-0.5, -1, -0.8);
    body.normalMatrix.setInverseOf(body.matrix).transpose();
    body.render();

    // Legs
    var frontlegL = new Cube();
    frontlegL.color = BROWN;
    if (g_normalOn) frontlegL.textureNum = -3;
    frontlegL.matrix.rotate(12, 1, 0, 0);
    frontlegL.matrix.scale(0.15, 0.5, 0.13);
    frontlegL.matrix.translate(-2, -1.5, -5);
    frontlegL.normalMatrix.setInverseOf(frontlegL.matrix).transpose();
    frontlegL.render();

    var frontlegR = new Cube();
    frontlegR.color = BROWN;
    if (g_normalOn) frontlegR.textureNum = -3;
    frontlegR.matrix.rotate(12, 1, 0, 0);
    frontlegR.matrix.scale(0.15, 0.5, 0.13);
    frontlegR.matrix.translate(1, -1.5, -5);
    frontlegR.normalMatrix.setInverseOf(frontlegR.matrix).transpose();
    frontlegR.render();

    // Back haunches
    var haunchL = new Cube();
    haunchL.color = BROWN;
    if (g_normalOn) haunchL.textureNum = -3;
    haunchL.matrix.rotate(12, 1, 0, 0);
    haunchL.matrix.rotate(g_leftAngle, 1, 0, 0);
    haunchL.matrix.rotate(0, 1, 0, 0);
    haunchL.matrix.translate(-0.3, -0.56, -0.15);
    var leftCoords = new Matrix4(haunchL.matrix);
    haunchL.matrix.scale(0.15, 0.4, 0.3);
    haunchL.normalMatrix.setInverseOf(haunchL.matrix).transpose();
    haunchL.render();

    var haunchR = new Cube();
    haunchR.color = BROWN;
    if (g_normalOn) haunchR.textureNum = -3;
    haunchR.matrix.rotate(12, 1, 0, 0);
    haunchR.matrix.rotate(g_rightAngle, 1, 0, 0);
    haunchR.matrix.translate(0.15, -0.56, -0.15);
    var rightCoords = new Matrix4(haunchR.matrix);
    haunchR.matrix.scale(0.15, 0.4, 0.3);
    haunchR.normalMatrix.setInverseOf(haunchR.matrix).transpose();
    haunchR.render();

    // Back legs

    var backlegL = new Cube();
    backlegL.color = BROWN;
    if (g_normalOn) backlegL.textureNum = -3;
    backlegL.matrix = leftCoords;
    backlegL.matrix.translate(0, 0, 0.3);
    backlegL.matrix.rotate(280 - g_leftFootAngle, 1, 0, 0);
    backlegL.matrix.translate(0, 0, -0.075 / 2);
    backlegL.matrix.scale(0.15, 0.5, 0.075);
    backlegL.normalMatrix.setInverseOf(backlegL.matrix).transpose();
    backlegL.render();

    var backlegR = new Cube();
    backlegR.color = BROWN;
    if (g_normalOn) backlegR.textureNum = -3;
    backlegR.matrix = rightCoords;
    backlegR.matrix.translate(0, 0, 0.3);
    backlegR.matrix.rotate(280 - g_rightFootAngle, 1, 0, 0);
    backlegR.matrix.translate(0, 0, -0.075 / 2);
    backlegR.matrix.scale(0.15, 0.5, 0.075);
    backlegR.normalMatrix.setInverseOf(backlegR.matrix).transpose();
    backlegR.render();

    var tail = new Cube();
    tail.color = BROWN;
    if (g_normalOn) tail.textureNum = -3;
    tail.matrix.scale(0.2, 0.2, 0.2);
    tail.matrix.translate(-0.5, -1.6, 0);
    tail.matrix.rotate(12, 1, 0, 0);
    tail.normalMatrix.setInverseOf(tail.matrix).transpose();
    tail.render();

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
