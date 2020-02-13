// 面倒なのでテンプレート作りました
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
"void main(){" +
"  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  box();
}
