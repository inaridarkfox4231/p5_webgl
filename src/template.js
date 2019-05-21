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
"void main(){" +
"  float c[3];" +
"  float v = 0.0;" +
"  for(int i = 0; i < 3; i++){" +
"    v += 0.2;" +
"    c[i] = v;" +
"  }" +
"  gl_FragColor = vec4(c[0], c[1], c[2], 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
}

function draw(){
  background(70, 30, 100);
  box();
}
