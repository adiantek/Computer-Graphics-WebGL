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

let programs = [];
let scaleX = 0;
let scaleY = 0;

async function init() {
    const layers = 4;
    let d1 = Math.pow(2, layers) * 2;
    let d2 = 1.0 / (Math.pow(2, layers) - 1);
    for (let i = 0; i < layers; i++) {
        programs[i] = await createProgram(gl, 'simplex.vert', 'simplex.frag');
        const p = [];
        for (let i = 0; i < 256; p[i] = i++);
        for (let l = 0; l < 256; ++l) {
            let j = Math.floor(Math.random() * (256 - l));
            let k = p[l];
            p[l] = p[j + l];
            p[j + l] = k;
        }
    
        gl.useProgram(programs[i]);
        gl.uniform1iv(gl.getUniformLocation(programs[i], "p"), p);
    
        const grads =[1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 1, 1, 0, 0, -1, 1, -1, 1, 0, 0, -1, -1];
        gl.uniform1fv(gl.getUniformLocation(programs[i], "grads"), grads);

        gl.uniform1f(gl.getUniformLocation(programs[i], "scale"), d1);
        gl.uniform1f(gl.getUniformLocation(programs[i], "alpha"), d2);

        d1 /= 2.0;
        d2 *= 2.0;
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
    {
        const vertexArray = new Float32Array([
            -1, -1, 0, 1,
            1, -1, 0, 1,
            -1, 1, 0, 1,
            1, 1, 0, 1
        ]);
        const indexArray = new Uint32Array([
            0, 1, 2, 1, 2, 3
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    }
    requestAnimationFrame(renderScene);
}

function renderScene() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (let i = 0; i < programs.length; i++) {
        gl.useProgram(programs[i]);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
    }
    requestAnimationFrame(renderScene);
}
