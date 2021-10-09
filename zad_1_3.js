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
    program = await createProgram(gl, 'shader_1_1.vert', 'shader_1_1.frag');
    requestAnimationFrame(renderScene);
}

function renderScene() {
    gl.clearColor(0.0, 0.0, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
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
