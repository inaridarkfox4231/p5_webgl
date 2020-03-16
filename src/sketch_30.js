// レイマーチングちょっとやってみるー。

// レイマーチングだっつってんだろなに作ってんだよまあいいか
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
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" +
"  float r = length(p);" +
"  float angle = atan(p.y, p.x);" +
"  float radius = 0.5 + 0.3 * mouse.x;" +
"  float value1 = r - radius * sin(6.0 * angle + fc * 0.1);" +
"  float value2 = r - radius * sin((-6.0) * angle + fc * 0.1);" +
"  float col1 = smoothstep(-0.1, 0.0, value1) - smoothstep(0.0, 0.1, value1);" +
"  float col2 = smoothstep(-0.1, 0.0, value2) - smoothstep(0.0, 0.1, value2);" +
"  gl_FragColor = vec4(col2, 0.0, col1, 1.0);" +
"}";

function setup(){
  createCanvas(600, 600, WEBGL);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  clear();
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  // mouseの値は0～1に正規化しておく。
  myShader.setUniform("mouse", [mouseX / min(width, height), mouseY / min(width, height)]);
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}
