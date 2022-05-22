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
let fft;
let fftS;
let fftInverseFFT;
let fftHorizontally;
let framebufferName = [];
let renderedTexture = [];
let cameraTex;
let nopTexture;

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
    gl.uniform1i(gl.getUniformLocation(bitreverse, "tex"), 0);
    gl.uniform1i(gl.getUniformLocation(bitreverse, "tex2"), 1);
    gl.uniform1i(gl.getUniformLocation(bitreverse, "size"), size);
    gl.uniform1i(gl.getUniformLocation(bitreverse, "bits"), Math.clz32(size - 1));
    gl.useProgram(fft);
    fftS = gl.getUniformLocation(fft, "s");
    fftHorizontally = gl.getUniformLocation(fft, "horizontally");
    fftInverseFFT = gl.getUniformLocation(fft, "inverseFFT");
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

    gl.activeTexture(gl.TEXTURE1);
    nopTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, nopTexture);
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
        gl.useProgram(bitreverse);
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
                console.log(`Something went wrong: ${err0r}!`);
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
function runBitreverse(n) {
    swapBuffers();
    gl.useProgram(bitreverse);
    gl.uniform1i(bitreverseHorizontally, n);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function invokeFFT(bits, inverse, horizontally, debug) {
    gl.useProgram(fft);
    gl.uniform1i(fftInverseFFT, inverse);
    gl.uniform1i(fftHorizontally, horizontally);
    for (let s = 1; s <= bits; s++) {
        swapBuffers();
        gl.uniform1i(fftS, s);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    // gl.readPixels(0, 0, size, size, gl.RG, gl.FLOAT, u);
    // console.log(debug);
    // console.log(u);
}
function renderScene() {
    if (!copyVideo) {
        requestAnimationFrame(renderScene);
        return;
    }
    swapBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, cameraTex);
    // {
    //     let dane = new Float32Array(32);
    //     for (let i = 0; i < 32; i++) {
    //         if (i % 2 == 0) {
    //             dane[i] = i / 2;
    //         } else {
    //             dane[i] = 0;
    //         }
    //     }
    //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 4, 4, 0, gl.RG, gl.FLOAT, dane);
    // }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    let bits = 32 - Math.clz32(size - 1);

    {
        gl.useProgram(bitreverse);
        gl.uniform1i(bitreverseHorizontally, -1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    runBitreverse(0);
    invokeFFT(bits, 0, 0, "after FFT vert");
    runBitreverse(1);
    invokeFFT(bits, 0, 1, "after FFT horizontally");
    {
        // draw
        swapBuffers();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(post);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        swapBuffers();
    }
    runBitreverse(2);
    {
        gl.readPixels(0, 0, size, size, gl.RG, gl.FLOAT, u);
        let a = 0;
        for (let i = 0; i < u.length; i++) {
            if (u[i] == 0.0) {
                a++;
            }
        }
        console.log(`${Math.round(a * 100.0 / u.length * 10.0) / 10.0}%`);
    }
    invokeFFT(bits, 1, 1, "after iFFT horizontally");
    runBitreverse(3);
    invokeFFT(bits, 1, 0, "after iFFT vert");
    {
        swapBuffers();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(512, 512, 512, 512);
        gl.useProgram(bitreverse);
        gl.uniform1i(bitreverseHorizontally, 4);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // gl.readPixels(0, 0, size, size, gl.RG, gl.FLOAT, u);
        // console.log("after ifft vert");
        // console.log(u);
    }
    {
        gl.bindTexture(gl.TEXTURE_2D, cameraTex);
        gl.viewport(0, 512, 512, 512);
        gl.useProgram(bitreverse);
        gl.uniform1i(bitreverseHorizontally, -1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    {
        gl.viewport(512, 0, 512, 512);
        gl.useProgram(bitreverse);
        gl.uniform1i(bitreverseHorizontally, 5);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, renderedTexture[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindTexture(gl.TEXTURE_2D, nopTexture);
        gl.activeTexture(gl.TEXTURE0);
    }
    requestAnimationFrame(renderScene);
}
