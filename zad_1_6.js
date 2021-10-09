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

async function init() {
    program = await createProgram(gl, 'shader_1_2.vert', 'shader_1_2.frag');
    requestAnimationFrame(renderScene);
}

function renderScene() {
    gl.clearColor(0.0, 0.0, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const time = Date.now() / 1000.0;

    gl.useProgram(program);


    const matrix = mat4.create();
    mat4.identity(matrix);
    mat4.translate(matrix, matrix, [0, Math.sin(time) * 0.5, 0]);
    mat4.rotateZ(matrix, matrix, time);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "transformation"), false, matrix);

    const v = new Float32Array([
        -0.5, -0.5, 0, 1,
        0.5, -0.5, 0, 1,
        -0.5, 0.5, 0, 1,
        0.5, 0.5, 0, 1,
        
    ]);
    const index = new Uint32Array([
        0, 1, 2, 1, 2, 3
    ]);
    drawVertexArrayIndexed(gl, v, index, 6, 4);
    gl.useProgram(null);
    requestAnimationFrame(renderScene);
}
