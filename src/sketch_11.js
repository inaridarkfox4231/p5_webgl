// ボタン表示の実験
// 画面を二つに区切ってgl_FragCoord.yの値で処理を分けて、
// ある値より上の場合は双曲タイリングの計算、
// ある値より下の場合はクワドを表示みたいにするべき？
// uniform変数でモード切替すればいけそう。
'use strict';
let myShader;
let img = [];

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"varying vec2 vTextureCoord;" +
"uniform vec2 loc;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"  vTextureCoord = vec2((aPosition.x - loc.x) * 2.0, (0.25 - (aPosition.y - loc.y)) * 4.0);" +
"}";

let fs =
"precision mediump float;" +
"uniform sampler2D text;" +
"varying vec2 vTextureCoord;" +
"void main(){" +
"  gl_FragColor = texture2D(text, vTextureCoord);" +
"}";

function preload(){
  img.push(loadImage("./assets/hello.png"));
  img.push(loadImage("./assets/poincare.png"));
  img.push(loadImage("./assets/quit.png"));
}

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  angleMode(DEGREES);
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  drawButton(0, 0, 0);
  drawButton(1, 0.5, 0.5);
  drawButton(2, -0.5, -0.75);
}

function drawButton(index, a, b){
  // indexはテキスト番号、(a, b)は画像の左下の座標。
  myShader.setUniform('text', img[index]);
  myShader.setUniform('loc', [a, b]);
  quad(a, b, a, b + 0.25, a + 0.5, b + 0.25, a + 0.5, b);
  // 0.5とか0.25は元画像の大きさに由来するのでそこも変数化できそう？
}
