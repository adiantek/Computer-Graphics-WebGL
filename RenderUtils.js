function drawVertexArray(gl, vertexArray, numVertices, elementSize) {
    if (!(gl instanceof WebGL2RenderingContext) && !(gl instanceof WebGLRenderingContext)) {
        throw new Error(`invalid gl object - must be webgl2`);
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, elementSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    gl.deleteBuffer(vbo);
}

function drawVertexArrayIndexed(gl, vertexArray, indexArray, numVertices, elementSize) {
    if (!(gl instanceof WebGL2RenderingContext) && !(gl instanceof WebGLRenderingContext)) {
        throw new Error(`invalid gl object - must be webgl2`);
    }
    if (!(indexArray instanceof Uint32Array)) {
        throw new Error('invalid indexArray - must be Uint32Array');
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, elementSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_INT, 0);
    gl.deleteBuffer(vbo);
    gl.deleteBuffer(indexBuffer);
}