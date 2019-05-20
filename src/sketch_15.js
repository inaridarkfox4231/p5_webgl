// 正多角形作る
'use strict';

let myShader;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// とりあえず正4角形（正方形という概念はないので）。

let fs =
"precision mediump float;" +
"uniform vec2 resolution;" +
"uniform float fc;" +
"uniform vec3 color_1;" +
"uniform vec3 color_2;" +
"const float ITERATIONS = 64.0;" +
"const float PI = 3.14159;" +
"vec2 inversion(vec2 q, float r, float c){" +
"  float factor = pow(r, 2.0) / (pow(q.x - c, 2.0) + pow(q.y, 2.0));" +
"  return vec2(c, 0.0) + (vec2(q.x - c, q.y) * factor);" +
"}" +
"vec2 poincare_to_half(vec2 p){" +
"  float norm = pow(p.x, 2.0) + pow(p.y, 2.0);" +
"  return vec2(-2.0 * p.y, (1.0 - norm)) / (1.0 - 2.0 * p.x + norm);" +
"}" +
"float reflection(){" +
"  float time = 300.0 - abs(300.0 - mod(fc, 600.0));" +
"  float r = 0.5 + (time * time / 300.0);" +
"}" +
"void main(){" +
"  float ref = reflection_3();" +
"  gl_FragColor = vec4((1.0 - ref) * color_1 + ref * color_2, 1.0);" +
"}";

function setup(){
  createCanvas(768, 384, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  angleMode(DEGREES);
  myShader = createShader(vs, fs);
  shader(myShader);
}

function draw(){
  background(70, 30, 100);
}
