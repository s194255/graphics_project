var canvas;
var gl;
var g_objDoc = null;
var g_drawingInfo = null;
var viewAngle = 0.0;
var modelTeapot;
var modelGround;
var teapotProgram;
var groundProgram;
var Mo;
var num_indices_ground;
var num_indices_quad;
var lightPos;
var teapotHeightAngle = 0.0;
var motion = 1.0;
var ligtSpin = 1.0;
var P;
var V;
window.onload = function init()
{
    canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas, { alpha: false, stencil: true });
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }
    teapotProgram = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot" );
    groundProgram = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground" );
    InitPV();
    initTeapot();
    InitGround();
    animate();
}

function InitPV(){
    P = perspective(65, 1, 1, 10);
    var at = vec3(0, 0, -3.0);
    var eye = vec3(0, 0, 1.0);
    var up = vec3(0.0, 1.0, 0.0);
    V = lookAt(eye, at, up);
    gl.useProgram(groundProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "P"), false, flatten(P));
    gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "V"), false, flatten(V));
    gl.uniform3fv(gl.getUniformLocation(groundProgram, "eye"), eye);

    gl.useProgram(teapotProgram)
    gl.uniformMatrix4fv(gl.getUniformLocation(teapotProgram, "P"), false, flatten(P));
    gl.uniformMatrix4fv(gl.getUniformLocation(teapotProgram, "V"), false, flatten(V));
    gl.uniform3fv(gl.getUniformLocation(teapotProgram, "eye"), eye);
}

function render(){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    updateGlobals();
    
    gl.colorMask(false, false, false, false);
    gl.depthMask(false);
    gl.enable(gl.STENCIL_TEST);

    gl.stencilFunc(
        gl.ALWAYS,    // the test
        1,            // reference value
        0xFF,         // mask
     );
    gl.stencilOp(
        gl.KEEP,     // what to do if the stencil test fails
        gl.KEEP,     // what to do if the depth test fails
        gl.REPLACE,  // what to do if both tests pass
    );

    renderGround();
    
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    gl.stencilFunc(
        gl.EQUAL,     // the test
        1,            // reference value
        0xFF,         // mask
     );
     gl.stencilOp(
        gl.KEEP,     // what to do if the stencil test fails
        gl.KEEP,     // what to do if the depth test fails
        gl.KEEP,     // what to do if both tests pass
     );

    renderReflectionTeapot();
    gl.disable(gl.STENCIL_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT)
    renderGround();
    renderShadow();
    renderRealTeapot();
}


function renderRealTeapot(){
    gl.useProgram( teapotProgram );
    gl.depthFunc(gl.LESS);
    initAttributeVariable(gl, teapotProgram.a_Position, modelTeapot.vertexBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Normal, modelTeapot.normalBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Color, modelTeapot.colorBuffer, 4, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);

    gl.uniformMatrix4fv(gl.getUniformLocation(teapotProgram, "P"), false, flatten(P));
    var MLoc = gl.getUniformLocation(teapotProgram, "M");
    modelTeapot.M = translate(0, -1, -3);
    var teapotHeight = 0.5;
    modelTeapot.M = mult(translate(0, 2*teapotHeight*Math.sin(teapotHeightAngle)+teapotHeight, 0), modelTeapot.M);
    gl.uniformMatrix4fv(MLoc, false, flatten(modelTeapot.M));

    gl.uniform4fv(gl.getUniformLocation(teapotProgram, "colorScaler"), vec4(1.0, 1.0, 1.0, 1.0));

    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, modelTeapot, g_objDoc);
    }
    if (!g_drawingInfo) return;
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderReflectionTeapot(){
    gl.useProgram( teapotProgram );
    gl.depthFunc(gl.LESS);
    initAttributeVariable(gl, teapotProgram.a_Position, modelTeapot.vertexBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Normal, modelTeapot.normalBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Color, modelTeapot.colorBuffer, 4, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);

    var eye_up = vec4(0.0, 1.0, 0.0 ,1.0);
    var eye_plane = vec4(0.0, -1.0, -3.0, 1.0);
    // var eye_up = mult(V,vec4(0.0, 1.0, 0.0 ,1.0));
    // var eye_plane = mult(V,vec4(0.0, -1.0, -3.0, 1.0));
    var Plane = vec4(eye_up[0], eye_up[1], eye_up[2], eye_up[0]*eye_plane[0]+eye_up[1]*eye_plane[1]+eye_up[2]*eye_plane[2]);
    var P_refl = modifyProjectionMatrix(mult(V,Plane), P);
    gl.uniformMatrix4fv(gl.getUniformLocation(teapotProgram, "P"), false, flatten(P_refl));


    var MLoc = gl.getUniformLocation(teapotProgram, "M");
    modelTeapot.M = translate(0, -1, -3);
    var teapotHeight = 0.5;
    modelTeapot.M = mult(translate(0, 2*teapotHeight*Math.sin(teapotHeightAngle)+teapotHeight, 0), modelTeapot.M);
    var V_vec = vec3(0, 1, 0);
    var P_vec = vec3(0, -1, -3);
    var R = mat4(1-2*V_vec[0]*V_vec[0], -2*V_vec[0]*V_vec[1], -2*V_vec[0]*V_vec[2], 2*dot(V_vec, P_vec)*V_vec[0],
                -2*V_vec[0]*V_vec[1], 1-2*V_vec[1]*V_vec[1], -2*V_vec[1]*V_vec[2], 2*dot(V_vec, P_vec)*V_vec[1],
                -2*V_vec[0]*V_vec[2], -2*V_vec[1]*V_vec[2], 1-2*V_vec[2]*V_vec[2], 2*dot(V_vec, P_vec)*V_vec[2],
                0, 0, 0, 1);
    
    modelTeapot.M = mult(R, modelTeapot.M);
    gl.uniformMatrix4fv(MLoc, false, flatten(modelTeapot.M));
    gl.uniform4fv(gl.getUniformLocation(teapotProgram, "colorScaler"), vec4(1.0, 1.0, 1.0, 1.0));
    
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, modelTeapot, g_objDoc);
    }
    if (!g_drawingInfo) return;
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderGround(){
    gl.useProgram( groundProgram );
    gl.depthFunc(gl.LESS);
    initAttributeVariable(gl, groundProgram.vPosition, modelGround.vBuffer, 4, gl.FLOAT);
    initAttributeVariable(gl, groundProgram.vTexCoord, modelGround.texBuffer, 2, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelGround.iBuffer);

    gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "P"), false, flatten(P));
    var MLoc = gl.getUniformLocation(groundProgram, "M");
    var M = mat4();
    gl.uniformMatrix4fv(MLoc, false, flatten(M));

    gl.uniform4fv(gl.getUniformLocation(groundProgram, "colorScaler"), vec4(1.0, 1.0, 1.0, 0.8));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(gl.getUniformLocation(groundProgram, "texture"), 0);
    gl.drawElements(gl.TRIANGLES, num_indices_ground, gl.UNSIGNED_INT, 0);
}

function renderShadow(){
    gl.useProgram( teapotProgram );
    gl.depthFunc(gl.GREATER);
    initAttributeVariable(gl, teapotProgram.a_Position, modelTeapot.vertexBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Normal, modelTeapot.normalBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Color, modelTeapot.colorBuffer, 4, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);

    gl.uniformMatrix4fv(gl.getUniformLocation(teapotProgram, "P"), false, flatten(P));
    var d = -(lightPos[1] - (-1.02));
    Mp = mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 1/d, 0, 0
    )

    var T = translate(lightPos[0], lightPos[1], lightPos[2]);
    var M = mult(mult(T, Mp), mult(inverse(T), modelTeapot.M))
    var MLoc = gl.getUniformLocation(teapotProgram, "M");
    gl.uniformMatrix4fv(MLoc, false, flatten(M));

    gl.uniform4fv(gl.getUniformLocation(teapotProgram, "colorScaler"), vec4(0.0, 0.0, 0.0, 1.0));
    if (!g_drawingInfo) return;
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

function animate() {
    viewAngle = viewAngle + 0.01*ligtSpin;
    teapotHeightAngle = teapotHeightAngle + 0.02*motion;
    render();
    requestAnimationFrame(animate);
}
function initAttributeVariable(gl, attribute, buffer, num, type){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}
function updateGlobals(){
    gl.useProgram( teapotProgram );
    var lightPosLoc = gl.getUniformLocation(teapotProgram, "lightPos");
    lightPos = vec4(2*Math.sin(viewAngle) - 0.0, 3.0, 2*Math.cos(viewAngle)-1, -0.0);
    gl.uniform4fv(lightPosLoc, lightPos);

    var MLoc = gl.getUniformLocation(teapotProgram, "M");
    modelTeapot.M = translate(0, -1, -3);
    var teapotHeight = 0.5;
    modelTeapot.M = mult(translate(0, teapotHeight*Math.sin(teapotHeightAngle)+teapotHeight, 0), modelTeapot.M);
    gl.uniformMatrix4fv(MLoc, false, flatten(modelTeapot.M));
}
function modifyProjectionMatrix(clipplane, projection) {
    // MV.js has no copy constructor for matrices
    var oblique = mult(mat4(), projection);
    var q = vec4((Math.sign(clipplane[0]) + projection[0][2])/projection[0][0],
    (Math.sign(clipplane[1]) + projection[1][2])/projection[1][1],
    -1.0,
    (1.0 + projection[2][2])/projection[2][3]);
    var s = 2.0/dot(clipplane, q);
    oblique[2] = vec4(clipplane[0]*s, clipplane[1]*s,
    clipplane[2]*s + 1.0, clipplane[3]*s);
    return oblique;
}