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

let bitreverse;
let post;
let bitreverseHorizontally;
let bitreverseScale;
let fft;
let fftS;
let fftHorizontally;
let framebufferName = [];
let renderedTexture = [];
let cameraTex;

let size = 512;

async function init() {
    if (gl.getExtension("EXT_color_buffer_float") === null) {
        alert("Missing EXT_color_buffer_float");
        throw new Error("Missing EXT_color_buffer_float");
    }
    post = await createProgram(gl, 'post.vert', 'post.frag');
    bitreverse = await createProgram(gl, 'bitreverse.vert', 'bitreverse.frag');
    fft = await createProgram(gl, 'fft.vert', 'fft.frag');
    gl.useProgram(post);
    gl.uniform1i(gl.getUniformLocation(post, "tex"), 0);
    gl.useProgram(bitreverse);
    bitreverseHorizontally = gl.getUniformLocation(bitreverse, "horizontally");
    bitreverseScale = gl.getUniformLocation(bitreverse, "scale");
    gl.uniform1i(gl.getUniformLocation(bitreverse, "tex"), 0);
    gl.uniform1i(gl.getUniformLocation(bitreverse, "size"), size);
    gl.uniform1i(gl.getUniformLocation(bitreverse, "bits"), Math.clz32(size - 1));
    gl.useProgram(fft);
    fftS = gl.getUniformLocation(fft, "s");
    fftHorizontally = gl.getUniformLocation(fft, "horizontally");
    gl.uniform1i(gl.getUniformLocation(fft, "tex"), 0);
    gl.uniform1i(gl.getUniformLocation(fft, "size"), size);

    {
        const vertexArray = new Float32Array([
            -1, -1, 0, 1,
            1, -1, 0, 1,
            -1, 1, 0, 1,
            1, 1, 0, 1
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
    }
    for (let i = 0; i < 2; i++) {
        framebufferName[i] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferName[i]);
        renderedTexture[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, renderedTexture[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, size, size, 0, gl.RG, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderedTexture[i], 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    cameraTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, cameraTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.activeTexture(gl.TEXTURE0);
    requestAnimationFrame(renderScene);
}
function swapBuffers() {
    [framebufferName[0], framebufferName[1]] = [framebufferName[1], framebufferName[0]];
    [renderedTexture[0], renderedTexture[1]] = [renderedTexture[1], renderedTexture[0]];
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferName[0]);
    gl.bindTexture(gl.TEXTURE_2D, renderedTexture[1]);
    gl.viewport(0, 0, size, size);
}

const u = new Float32Array(size * size * 2);
let copyVideo = false;
function setupVideo() {
    const video = document.createElement('video');
    var playing = false;
    var timeupdate = false;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.addEventListener('playing', function () {
        playing = true;
        videoWidth = this.videoWidth;
        videoHeight = this.videoHeight;
        gl.useProgram(bitreverse);
        console.log(this.videoHeight);
        gl.uniform2f(bitreverseScale, 512.0 / this.videoWidth, 512.0 / this.videoHeight);
        checkReady();
    }, true);
    video.addEventListener('timeupdate', function () {
        timeupdate = true;
        checkReady();
    }, true);
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                console.log(stream);
                video.srcObject = stream;
            })
            .catch(function (err0r) {
                console.log("Something went wrong!");
            });
    }
    video.play();
    function checkReady() {
        if (playing && timeupdate) {
            copyVideo = true;
        }
    }
    return video;
}

let video = setupVideo();


function renderScene() {
    if (!copyVideo) {
        requestAnimationFrame(renderScene);
        return;
    }
    swapBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, cameraTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.useProgram(bitreverse);
    gl.uniform1i(bitreverseHorizontally, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(fft);
    gl.uniform1i(fftHorizontally, 0);
    let bits = 32 - Math.clz32(size - 1);
    for (let s = 1; s <= bits; s++) {
        swapBuffers();
        gl.uniform1i(fftS, s);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.readPixels(0, 0, size, size, gl.RG, gl.FLOAT, u);
    swapBuffers();

    gl.useProgram(bitreverse);
    gl.uniform1i(bitreverseHorizontally, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(fft);
    gl.uniform1i(fftHorizontally, 1);
    for (let s = 1; s <= bits; s++) {
        swapBuffers();
        gl.uniform1i(fftS, s);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.readPixels(0, 0, size, size, gl.RG, gl.FLOAT, u);

    swapBuffers();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(post);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.viewport(0, 512, 512, 512);
    gl.bindTexture(gl.TEXTURE_2D, cameraTex);
    gl.useProgram(bitreverse);
    gl.uniform1i(bitreverseHorizontally, 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(renderScene);

}
