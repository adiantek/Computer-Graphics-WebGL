#version 300 es

precision highp float;
precision highp int;

const float PI = 3.14159265358979323846;

in vec4 fragPos;

uniform sampler2D tex;
uniform int s;
uniform int size;
uniform int horizontally;

out vec4 FragColor;

void main()
{
    vec2 texPos = (vec2(fragPos) + 1.0) * 0.5;
    ivec2 pos = ivec2(texPos.x * float(size), texPos.y * float(size));
    int mask = 1 << (s - 1);

    int numA = pos.x;
    if (horizontally != 0) {
        numA = pos.y;
    }
    int numB = numA | mask;
    if (numA == numB) {
        numA ^= mask;
    }
    vec2 inA;
    vec2 inB;
    if (horizontally != 0) {
        inA = vec2(texelFetch(tex, ivec2(pos.x, numA), 0));
        inB = vec2(texelFetch(tex, ivec2(pos.x, numB), 0));
    } else {
        inA = vec2(texelFetch(tex, ivec2(numA, pos.y), 0));
        inB = vec2(texelFetch(tex, ivec2(numB, pos.y), 0));
    }
    float val = float(numA & ((1 << s) - 1)) / float(1 << s);
    vec2 w = vec2(
        cos(2.0 * PI * val),
        -sin(2.0 * PI * val)
    );
    vec2 t = vec2(
        inB[0] * w[0] - inB[1] * w[1],
        inB[0] * w[1] + inB[1] * w[0]
    );
    vec2 u = inA;
    if (numA == (horizontally == 0 ? pos.x : pos.y)) {
        FragColor = vec4((u + t), 0.0, 0.0);
    } else {
        FragColor = vec4((u - t), 0.0, 0.0);
    }
}