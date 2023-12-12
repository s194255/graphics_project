var Mo;
var lightPos;
var motion = 1.0;
var ligtSpin = 1.0;
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse){
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    return drawingInfo
}

function initObject(gl, program, obj_filename, scale)
{
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, program);
    // Start reading the OBJ file
    readOBJFile(obj_filename, gl, model, scale, true);
    return model;
}

function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    // o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 4, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    return o;
}
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    return buffer;
}
function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
    }
    request.open('GET', fileName, true); // Create a request to get file
    request.send(); // Send the request
}
function CreateMVPTeapot(){
    var PLoc = gl.getUniformLocation(teapotProgram, "P");
    var P = perspective(65, 1, 1, 10);
    gl.uniformMatrix4fv(PLoc, false, flatten(P));

    var VLoc = gl.getUniformLocation(teapotProgram, "V");
    var eyeLoc = gl.getUniformLocation(teapotProgram, "eye");
    var at = vec3(0, 0, -3.0);
    var eye = vec3(0, 0, 1.0);
    var up = vec3(0.0, 1.0, 0.0);
    var V = lookAt(eye, at, up);
    // var V = mat4();
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    gl.uniform3fv(eyeLoc, eye);

    var LaLoc = gl.getUniformLocation(teapotProgram, "La");
    var La = vec3(1.0, 1.0,1.0);
    gl.uniform3fv(LaLoc, La);

    // var MLoc = gl.getUniformLocation(teapotProgram, "M");
    // modelTeapot.M = translate(0, -1, -3);
    // gl.uniformMatrix4fv(MLoc, false, flatten(modelTeapot.M));

    Mo = mat4();
}

function createSlidersTeapot(){
    var kdRange = document.getElementById("kdRange");
    var kaRange = document.getElementById("kaRange");
    var ksRange = document.getElementById("ksRange");
    var sRange = document.getElementById("sRange");
    var LiRange = document.getElementById("LiRange");
    var toggleMotion = document.getElementById("toggleMotion");
    var toggleLightSpin = document.getElementById("toggleLightSpin");
    var k_dLoc = gl.getUniformLocation(teapotProgram, "k_d");
    var k_aLoc = gl.getUniformLocation(teapotProgram, "k_a");
    var LiLoc = gl.getUniformLocation(teapotProgram, "Li");
    var k_sLoc = gl.getUniformLocation(teapotProgram, "k_s");
    var sLoc = gl.getUniformLocation(teapotProgram, "s");

    var k_d = parseFloat(kdRange.value);
    gl.uniform1f(k_dLoc, k_d);
    var k_a = parseFloat(kaRange.value);
    gl.uniform1f(k_aLoc, k_a);
    var k_s = parseFloat(ksRange.value);
    gl.uniform1f(k_sLoc, k_s);
    var s = parseFloat(sRange.value);
    gl.uniform1f(sLoc, s);
    var Li = parseFloat(LiRange.value);
    gl.uniform3fv(LiLoc, vec3(Li, Li, Li));

    kdRange.addEventListener("input", function () {
        gl.useProgram( teapotProgram );
        var k_d = parseFloat(kdRange.value);
        gl.uniform1f(k_dLoc, k_d);
    });

    kaRange.addEventListener("input", function () {
        gl.useProgram( teapotProgram );
        var k_a = parseFloat(kaRange.value);
        gl.uniform1f(k_aLoc, k_a);
    });

    ksRange.addEventListener("input", function () {
        gl.useProgram( teapotProgram );
        var k_s = parseFloat(ksRange.value);
        gl.uniform1f(k_sLoc, k_s);
    });

    sRange.addEventListener("input", function () {
        gl.useProgram( teapotProgram );
        var s = parseFloat(sRange.value);
        gl.uniform1f(sLoc, s);
    });

    LiRange.addEventListener("input", function () {
        gl.useProgram( teapotProgram );
        var Li = parseFloat(LiRange.value);
        gl.uniform3fv(LiLoc, vec3(Li, Li, Li));
    });

    toggleMotion.addEventListener("click", function () {
        motion = 1 - motion;
    });

    toggleLightSpin.addEventListener("click", function () {
        ligtSpin = 1 - ligtSpin;
    });
}
function initTeapot(){
    gl.useProgram( teapotProgram );
    CreateMVPTeapot();
    createSlidersTeapot();
    modelTeapot = initObject(gl, teapotProgram, "teapot.obj", 0.25);
}