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

async function init() {
    requestAnimationFrame(renderScene);
}

function renderScene() {
    gl.clearColor(0.0, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    requestAnimationFrame(renderScene);
}