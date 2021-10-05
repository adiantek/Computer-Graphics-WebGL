#version 300 es

layout(location = 0) in vec4 vertexPosition;
layout(location = 1) in float vertexHue;

uniform mat4 transformation;

out float hue;
void main()
{
	hue = vertexHue;
	gl_Position = transformation * vertexPosition;
}
