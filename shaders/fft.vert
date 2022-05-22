#version 300 es

in vec4 vertexPosition;

out vec4 fragPos;

void main()
{
	gl_Position = vertexPosition;
	fragPos = vertexPosition;
}
