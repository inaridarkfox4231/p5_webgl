// 面倒なのでテンプレート作りました
p5.DisableFriendlyErrors = true;
'use strict';

let myShader;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision mediump float;" +
"uniform float fc;" +
"uniform vec2 resolution;" +
"uniform vec2 mouse;" +
"void main(){" +
"  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  noLoop();
}

function draw(){
  clear();
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  myShader.setUniform("mouse", [mouseX, mouseY]);
  box();
}
