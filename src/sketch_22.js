// 今回はちょっと趣向を変えて
// たくさんのボールが色とか大きさとか位置とか変えながらぐるぐる回る感じ
// 飽きた　疲れた　もういや　しにたい
'use strict';

let myShader;
let cxArray = new Array(20);
let cyArray = new Array(20);
let radius = new Array(20);

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision mediump float;" +
"const int N = 20;" +
"uniform float cx[N];" +
"uniform float cy[N];" +
"uniform float r[N];" +
"void main(){" +
"  float x = gl_FragCoord.x;" +
"  float y = gl_FragCoord.y;" +
"  for(int i = 0; i < N; i++){" +
"    if((cx[i] - x) * (cx[i] - x) + (cy[i] - y) * (cy[i] - y) < r[i] * r[i]){" +
"      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); break;" +
"    }else{" +
"      gl_FragColor = vec4(0.8, 0.8, 1.0, 1.0);" +
"    }" +
"  }" +
"}";
/*
"  for(int i = 0; i < 3; i++){" +
"    if((cx[i] - x) * (cx[i] - x) + (cy[i] - y) * (cy[i] - y) < 400.0){" +
"      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); break;" +
"    }else{" +
"      gl_FragColor = vec4(0.8, 0.8, 1.0, 1.0);" +
"    }" +
"  }" +
*/

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  angleMode(DEGREES);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  _initialize();
  noLoop();
}

function draw(){
  background(70, 30, 100);
  _diff();
  quad(1, 1, -1, 1, -1, -1, 1, -1);
}
