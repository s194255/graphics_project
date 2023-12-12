function InitGround(){
    gl.useProgram( groundProgram );
    modelGround = new Object();
    CreateMVPTeapotGround();
    InitGroundTexture(gl);
    createRectangle();
}

function InitGroundTexture(gl){
    imageTexture = gl.createTexture();
    var TextureImage = document.createElement('img');
    TextureImage.crossorigin = 'anonymous';
    TextureImage.onload = function() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, TextureImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        modelGround.texCoordsPerm4 = [
            vec2(1, 0), vec2(0, 0), vec2(0, 1), vec2(1, 1)
        ];                                                                                                                                                      
        modelGround.texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelGround.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(modelGround.texCoordsPerm4), gl.STATIC_DRAW);
        groundProgram.vTexCoord = gl.getAttribLocation(groundProgram, "vTexCoord");
        gl.vertexAttribPointer(groundProgram.vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(groundProgram.vTexCoord);

    };
    TextureImage.src = "xamp23.png";
    gl.uniform1i(gl.getUniformLocation(groundProgram, "texture"), 0);
}

function createRectangle(){
    modelGround.vertices = [
        vec4(-2, -1, -1, 1.0), vec4(2, -1, -1, 1.0), vec4(2, -1, -5, 1.0), vec4(-2, -1, -5, 1.0)
    ]
    modelGround.indices = new Uint32Array(
        [
            0, 1, 2, 0, 2, 3
        ]);

    modelGround.iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelGround.iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(modelGround.indices), gl.STATIC_DRAW);

    modelGround.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelGround.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(modelGround.vertices), gl.STATIC_DRAW);
    groundProgram.vPosition = gl.getAttribLocation(groundProgram, "a_Position");
    gl.vertexAttribPointer(groundProgram.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(groundProgram.vPosition);

    num_indices_ground = 6;
}

function CreateMVPTeapotGround(){
    var PLoc = gl.getUniformLocation(groundProgram, "P");
    var P = perspective(65, 1, 1, 10);
    gl.uniformMatrix4fv(PLoc, false, flatten(P));

    var VLoc = gl.getUniformLocation(groundProgram, "V");
    var eyeLoc = gl.getUniformLocation(groundProgram, "eye");
    var at = vec3(0, 0, -3.0);
    var eye = vec3(0, 0, 1.0);
    var up = vec3(0.0, 1.0, 0.0);
    // var V = lookAt(eye, at, up);
    var V = mat4();
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    gl.uniform3fv(eyeLoc, eye);
}