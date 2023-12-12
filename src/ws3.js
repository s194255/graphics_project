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
    initTeapot();
    InitGround();
    animate();
}

function render(){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    updateGlobals();
    gl.enable(gl.STENCIL_TEST);
    renderReflectionTeapot();
    renderGround();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.STENCIL_TEST);
    renderShadow();
    renderRealTeapot();
}


function renderRealTeapot(){
    gl.useProgram( teapotProgram );
    gl.depthFunc(gl.LESS);
    gl.disable(gl.STENCIL_TEST);
    initAttributeVariable(gl, teapotProgram.a_Position, modelTeapot.vertexBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Normal, modelTeapot.normalBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Color, modelTeapot.colorBuffer, 4, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);


    var MLoc = gl.getUniformLocation(teapotProgram, "M");
    modelTeapot.M = translate(0, -1, -3);
    var teapotHeight = 0.5;
    modelTeapot.M = mult(translate(0, teapotHeight*Math.sin(teapotHeightAngle)+teapotHeight, 0), modelTeapot.M);
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
    // gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(
        gl.EQUAL,     // the test
        0,            // reference value
        0xFF,         // mask
     );
     gl.stencilOp(
        gl.KEEP,     // what to do if the stencil test fails
        gl.KEEP,     // what to do if the depth test fails
        gl.KEEP,     // what to do if both tests pass
     );
    initAttributeVariable(gl, teapotProgram.a_Position, modelTeapot.vertexBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Normal, modelTeapot.normalBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Color, modelTeapot.colorBuffer, 4, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);


    var MLoc = gl.getUniformLocation(teapotProgram, "M");
    modelTeapot.M = translate(0, -1, -3);
    var teapotHeight = 0.5;
    modelTeapot.M = mult(translate(0, teapotHeight*Math.sin(teapotHeightAngle)+teapotHeight, 0), modelTeapot.M);
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
    // gl.enable(gl.STENCIL_TEST);
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
    initAttributeVariable(gl, groundProgram.vPosition, modelGround.vBuffer, 4, gl.FLOAT);
    initAttributeVariable(gl, groundProgram.vTexCoord, modelGround.texBuffer, 2, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelGround.iBuffer);

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
    gl.disable(gl.STENCIL_TEST);
    initAttributeVariable(gl, teapotProgram.a_Position, modelTeapot.vertexBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Normal, modelTeapot.normalBuffer, 3, gl.FLOAT);
    initAttributeVariable(gl, teapotProgram.a_Color, modelTeapot.colorBuffer, 4, gl.FLOAT);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);

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