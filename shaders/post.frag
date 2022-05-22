#version 300 es

precision highp float;
precision highp int;

in vec4 fragPos;
uniform sampler2D tex;

out vec4 FragColor;

void main()
{
    vec2 texPos = (vec2(fragPos) + 1.0) * 0.5;
    texPos += 0.5;
    texPos = mod(texPos, 1.0);

    vec2 val = vec2(texture(tex, texPos));
    float mag = sqrt(val.x * val.x + val.y * val.y);
    mag = log(1.0 + mag) / 10.0;
    FragColor = vec4(mag, mag, mag, 1.0);
}