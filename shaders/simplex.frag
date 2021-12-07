#version 300 es
precision highp float;
precision highp int;

in vec4 fragPos;
out vec4 FragColor;

uniform float scale;
uniform float alpha;
uniform float grads[16 * 3];
uniform int p[256];

const float SQRT_3 = 1.7320508075688772; // sqrt(3);
const float F_2 = 0.5 * (SQRT_3 - 1.0);
const float G_2 = (3.0 - SQRT_3) / 6.0;

const vec2 F_22 = vec2(F_2, F_2);
const vec2 G_22 = vec2(G_2, G_2);

int getPermutValue(int permutIndex) {
    return p[permutIndex & 255];
}

float processGrad(int gradIndex, vec2 xy) {
    return
        grads[gradIndex * 3 + 0] * xy.x +
        grads[gradIndex * 3 + 1] * xy.y;
}

float getContrib(int gradIndex, vec2 xy, float offset) {
    float d1 = offset - xy.x * xy.x - xy.y * xy.y;
    float d0;
    if (d1 < 0.0) {
        d0 = 0.0;
    } else {
        d1 = d1 * d1;
        d0 = d1 * d1 * processGrad(gradIndex, xy);
    }
    return d0;
}

float getValue(vec2 v) {
    vec2 ij = floor(v + dot(v, F_22));
    float xy = dot(ij, G_22);
    vec2 d45 = v - ij + xy;
    vec2 kl = (d45.x > d45.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 d67 = d45 - kl + G_2;
    vec2 d89 = d45 - 1.0 + 2.0 * G_2;
    int i = int(ij.x);
    int j = int(ij.y);
    int i1 = i & 255;
    int j1 = j & 255;
    int k1 = getPermutValue(i1 + getPermutValue(j1)) % 12;
    int l1 = getPermutValue(i1 + int(kl.x) + getPermutValue(j1 + int(kl.y))) % 12;
    int i2 = getPermutValue(i1 + 1 + getPermutValue(j1 + 1)) % 12;
    float d10 = getContrib(k1, d45, 0.5);
    float d11 = getContrib(l1, d67, 0.5);
    float d12 = getContrib(i2, d89, 0.5);
    return 70.0 * (d10 + d11 + d12);
}

void main()
{
    float noise = getValue(fragPos.xy * scale);
    noise = (noise + 0.5) / 2.0;
    FragColor = vec4(noise, noise, noise, alpha);
}
