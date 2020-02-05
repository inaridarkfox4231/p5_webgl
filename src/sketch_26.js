// 面倒なのでテンプレート作りました
// gl_FragCoordはピクセル単位で座標を指定する
// 左下が(0, 0)で右に行くとxが増えて上に行くとyが増える。
// resolutionで割って0以上1以下に正規化することが多い。

// 海(sea)。2019年の海の日に公開。
'use strict';

let myShader;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

 // v.yがborderより大きい時0.7~1.0, 小さい時0.3~0.0にする
let fs =
"precision mediump float;" +
"const float PI = 3.14159;" +
"uniform float fc;" +
"uniform vec2 resolution;" +
"void main(){" +
"  float rx = resolution.x / 2.0;" +
"  float ry = resolution.y / 2.0;" +
"  float mxy = min(rx, ry);" +
"  vec2 v = gl_FragCoord.xy + vec2(0, -mxy);" +
"  float border = 20.0 * sin(PI * (v.x - fc * 2.0) / 50.0);" +
"  float deepNess = step(border, v.y);" +
"  float r;" +
"  float g;" +
"  float b;" +
"  if(deepNess > 0.5){" +
"    r = (110.0 + 140.0 * smoothstep(-mxy * 0.1, mxy, v.y)) / 250.0;" +
"    g = (120.0 + 130.0 * smoothstep(-mxy * 0.1, mxy, v.y)) / 250.0;" +
"    b = (210.0 + 40.0 * smoothstep(-mxy * 0.1, mxy, v.y)) / 250.0;" +
"  }else{" +
"    r = (50.0 * smoothstep(-mxy, mxy * 0.1, v.y)) / 250.0;" +
"    g = (60.0 * smoothstep(-mxy, mxy * 0.1, v.y)) / 250.0;" +
"    b = (190.0 * smoothstep(-mxy, mxy * 0.1, v.y)) / 250.0;" +
"  }" +
"  gl_FragColor = vec4(r, g, b, 1.0);" +
"}";

function setup(){
  createCanvas(window.innerWidth, window.innerHeight, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width * 1.0, height * 1.0]);
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}
