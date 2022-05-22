#version 300 es

precision highp float;
precision highp int;

in vec4 fragPos;

uniform sampler2D tex;
uniform int bits;
uniform int size;
uniform int horizontally;
uniform vec2 scale;

out vec4 FragColor;

uint rev(uint i) {
    i = (i & 0x55555555u) << 1 | (i >> 1) & 0x55555555u;
    i = (i & 0x33333333u) << 2 | (i >> 2) & 0x33333333u;
    i = (i & 0x0f0f0f0fu) << 4 | (i >> 4) & 0x0f0f0f0fu;
    return (i << 24)            |
               ((i & 0xff00u) << 8)  |
               ((i >> 8) & 0xff00u) |
               (i >> 24);
}

void main()
{
    vec2 texPos = (vec2(fragPos) + 1.0) * 0.5;
    if (horizontally == 0 || horizontally == 2) {
        texPos.y = 1.0 - texPos.y;
        texPos /= scale;
    }
    ivec2 pos = ivec2(texPos.x * float(size), texPos.y * float(size));
    if (horizontally == 0) {
        pos.x = int(rev(uint(pos.x)) >> bits);
    } else if (horizontally == 1) {
        pos.y = int(rev(uint(pos.y)) >> bits);
    }
    FragColor = texelFetch(tex, pos, 0);
    float mixed = (FragColor.r + FragColor.g + FragColor.b) / 3.0;
    FragColor = vec4(mixed, mixed, mixed, 1.0);
}