async function readShader(filename) {
    return await fetch(`shaders/${filename}`).then((resp) => resp.text());
}
function createShader(gl, shaderType, source, shaderName) {
    if (!(gl instanceof WebGL2RenderingContext)) {
        throw new Error(`invalid gl object`);
    }
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.getShaderInfoLog(shader);
    const compileResult = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (compileResult === false) {
        console.warn(`Error compiling shader ${shaderName}: ${gl.getShaderInfoLog(shader)}`);
        throw new Error(`Error compiling shader ${shaderName}`);
    }
    return shader;
}
async function createProgram(gl, vertexShaderFileName, fragmentShaderFileName) {
    if (!(gl instanceof WebGL2RenderingContext)) {
        throw new Error(`invalid gl object`);
    }

    const vertexShaderCode = await readShader(vertexShaderFileName);
    const fragmentShaderCode = await readShader(fragmentShaderFileName);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderCode, `vertex shader ${vertexShaderFileName}`);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode, `fragment shader ${fragmentShaderFileName}`);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    const linkResult = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (linkResult === false) {
        console.warn(`Link error ${vertexShaderFileName} / ${fragmentShaderFileName}: ${gl.getProgramInfoLog(program)}`);
        throw new Error(`Link error ${vertexShaderFileName} / ${fragmentShaderFileName}`);
    }
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
}