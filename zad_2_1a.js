const canvas = document.querySelector("#canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("invalid");
}
const gl = canvas.getContext("webgl2");
if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
}
window.gl = gl;

let program = undefined;
let box = undefined;
let vao = undefined;

async function init() {
    let boxAsync = fetch("box.json").then((r) => r.json());;
    program = await createProgram(gl, 'shader_2_1.vert', 'shader_2_1.frag');
    box = await boxAsync;
    gl.enable(gl.DEPTH_TEST);
    {
        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, (box.boxColors.length + box.boxPositions.length) * 4, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(box.boxColors));
        gl.bufferSubData(gl.ARRAY_BUFFER, box.boxColors.length * 4, new Float32Array(box.boxPositions));
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "vertexColor"));
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "vertexPosition"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "vertexColor"), 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(gl.getAttribLocation(program, "vertexPosition"), 4, gl.FLOAT, false, 0, box.boxColors.length * 4);
        gl.bindVertexArray(null);
    }
    requestAnimationFrame(renderScene);
}

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.0, 0.0, 0.3, 1.0);

    const time = Date.now() / 1000.0;

    gl.useProgram(program);
    
    const matrix = mat4.create();
    mat4.identity(matrix);
    mat4.translate(matrix, matrix, [0.5, 0.5, -0.2]);
    mat4.rotateY(matrix, matrix, time);
    mat4.rotateZ(matrix, matrix, time);
    mat4.scale(matrix, matrix, [0.5, 0.5, 0.5]);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "transformation"), false, matrix);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, box.boxPositions.length / 4);
    gl.bindVertexArray(null);

    gl.useProgram(null);
    requestAnimationFrame(renderScene);
}
