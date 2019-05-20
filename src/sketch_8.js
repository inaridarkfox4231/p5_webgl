// テクスチャ？
'use strict';
let img;
let myShader;

// テクスチャ読み込みの基本。

let vs =
"precision mediump float;\
 varying vec2 vPos;\
 attribute vec3 aPosition;\
 varying vec2 vTextureCoord;\
 void main(){\
   gl_Position = vec4(aPosition, 1.0);\
   vTextureCoord = vec2(aPosition.x, 1.0 - aPosition.y);\
 }";
 // aPositionのx, yについて(x, y)→(x, 1-y)という変換を行っている。
 // これは、texture座標ではy軸の上下が異なることによるものらしいよ。
 // 流れ。
 // まずaPositionのxとyを渡すときに、この(x, y)の色が決まるんだけど、
 // 渡すのは(x, 1-y)にしてある。こうすることで、
 // rectでの(x, y)に相当するピクセルの色情報がテクスチャの(x, 1-y)の色情報として登録される。
 // ゆえに、上下そのままでrectに図形が貼り付けられるとかそんな感じみたいね。

let fs =
"precision mediump float;\
 uniform sampler2D uSampler;\
 varying vec2 vPos;\
 varying vec2 vTextureCoord;\
 void main(){\
   gl_FragColor = texture2D(uSampler, vTextureCoord);\
 }";

function preload(){
  img = loadImage('./assets/GLSL_3.PNG');
}

function setup(){
  createCanvas(640, 480, WEBGL);
  colorMode(HSB, 100);
  myShader = createShader(vs, fs);
  shader(myShader);
  noStroke();
  noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('uSampler', img);
  //rect(0, 0, 0, 0);
  quad(0, 0, 1, 0, 1, 1, 0, 1);
}
