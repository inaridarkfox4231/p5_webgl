// 今回はちょっと趣向を変えて
// たくさんのボールが色とか大きさとか位置とか変えながらぐるぐる回る感じ
// 飽きた　疲れた　もういや　しにたい
// 色で遊ぶ
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
"uniform vec2 resolution;" +
"const float PI = 3.14159;" +
"float atan2(float y, float x){" +
"  if(x == 0.0){ if(y > 0.0){ return PI / 2.0; }else if(y < 0.0){ return -PI / 2.0; }else{ return 0.0; } }" +
"  return atan(y, x);" +
"}" +
"void main(){" +
"  vec2 pos = ((gl_FragCoord.xy * 2.0) - resolution) / min(resolution.x, resolution.y);" +
"  float c = (atan2(pos.y, pos.x) / PI + 1.0) / 2.0;" +
"  float r = sqrt(pos.x * pos.x + pos.y * pos.y) / 1.4142;" +
"  gl_FragColor = vec4((c + r) / 2.0, c * r, r, 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  angleMode(DEGREES);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  myShader.setUniform("resolution", [width, height]);
  noLoop();
}

function draw(){
  background(70, 30, 100);
  quad(1, 1, -1, 1, -1, -1, 1, -1);
}
