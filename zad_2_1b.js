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
let indices = undefined;

async function init() {
    let boxAsync = fetch("box.json").then((r) => r.json());;
    program = await createProgram(gl, 'shader_2_1b.vert', 'shader_2_1b.frag');
    box = await boxAsync;
    gl.enable(gl.DEPTH_TEST);

    const points = [];
    for (let i = 0; i < 8; i++) {
        points[i * 4 + 0] = Math.sin(i / 7 * 2 * Math.PI);
        points[i * 4 + 1] = Math.cos(i / 7 * 2 * Math.PI);
        points[i * 4 + 2] = 0;
        points[i * 4 + 3] = 1;
    }
    const hues = [
        0 / 7.0,
        5 / 7.0,
        3 / 7.0,
        1 / 7.0,
        6 / 7.0,
        4 / 7.0,
        2 / 7.0,
        7 / 7.0
    ];
    {
        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, (points.length + hues.length) * 4, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(hues));
        gl.bufferSubData(gl.ARRAY_BUFFER, hues.length * 4, new Float32Array(points));
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "vertexHue"));
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "vertexPosition"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "vertexHue"), 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(gl.getAttribLocation(program, "vertexPosition"), 4, gl.FLOAT, false, 0, hues.length * 4);
        gl.bindVertexArray(null);
    }
    {
        indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array([
            7, 4, 1, 5, 2, 6, 3, 0
        ]), gl.STATIC_DRAW);
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
    mat4.rotateY(matrix, matrix, Math.sin(time));
    mat4.rotateZ(matrix, matrix, time);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "transformation"), false, matrix);

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.drawElements(gl.LINE_STRIP, 8, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);

    gl.useProgram(null);
    requestAnimationFrame(renderScene);
}
