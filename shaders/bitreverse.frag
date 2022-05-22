#version 300 es

precision highp float;
precision highp int;

in vec4 fragPos;

uniform sampler2D tex;
uniform sampler2D tex2;
uniform int bits;
uniform int size;

// -1 - scale input video
// 0 - inverse Y, mix RGB, bitreverse X
// 1 - bitreverse Y and scale
// 2 - bitreverse Y, scale and swap RE/IM
// 3 - bitreverse X
// 4 - swap RE/IM
uniform int horizontally;

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
    if (horizontally == -1) {
        texPos.y = 1.0 - texPos.y;
        FragColor = texture(tex, texPos);
        float mixed = (FragColor.r + FragColor.g + FragColor.b) / 3.0;
        FragColor = vec4(mixed, mixed, mixed, 1.0);
        return;
    }
    ivec2 pos = ivec2(texPos.x * float(size), texPos.y * float(size));
    if (horizontally == 0 || horizontally == 3) {
        pos.x = int(rev(uint(pos.x)) >> bits);
    } else if (horizontally == 1 || horizontally == 2) {
        pos.y = int(rev(uint(pos.y)) >> bits);
    }
    FragColor = texelFetch(tex, pos, 0);
    if (horizontally == 0) {
        FragColor = vec4(FragColor.r, 0.0, 0.0, 1.0);
    } else if (horizontally == 2) {
        FragColor = vec4(FragColor.g, FragColor.r, 0.0, 1.0);
        float b = 0.1;
        if (FragColor.g < b && FragColor.g > -b) {
            FragColor.g = 0.0;
        }
        if (FragColor.r < b && FragColor.r > -b) {
            FragColor.r = 0.0;
        }
        FragColor.r /= float(size);
        FragColor.g /= float(size);
    } else if (horizontally == 1) {
        FragColor.r /= float(size);
        FragColor.g /= float(size);
    }
    if (horizontally == 4) {
        FragColor = vec4(FragColor.g, FragColor.g, FragColor.g, 1.0);
    }
    if (horizontally == 5) {
        texPos.y = 1.0 - texPos.y;
        FragColor = texture(tex, texPos);
        float mixed = (FragColor.r + FragColor.g + FragColor.b) / 3.0;
        FragColor = texelFetch(tex2, pos, 0);
        float diff = abs(mixed - FragColor.g);
        FragColor = vec4(diff, diff, diff, 1.0);
    }
}