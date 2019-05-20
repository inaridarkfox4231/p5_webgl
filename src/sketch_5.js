'use strict';
// マンデルブロに倣ってattribute変数を使ってみるとかそういう。
let myShader;
// precision宣言がないとコンパイルエラーになる
let vs =
  "precision highp float;\
   varying vec2 vPos;\
   attribute vec3 aPosition;\
   uniform float count;\
   float diffAngle = count * 3.14159 / 120.0;\
   mat3 m = mat3(\
     cos(diffAngle), -sin(diffAngle), 0.0,\
     sin(diffAngle), cos(diffAngle), 0.0,\
     0.0, 0.0, 1.0\
   );\
   void main(){\
     vPos = aPosition.xy;\
     gl_Position = vec4(m * aPosition, 1.0);\
   }";

// バーテックスシェーダで頂点の情報（gl_Position）に回転を加えると。
// そうすると、図形の方も回転する（この場合は45°回転）。
// gl_FragColorは頂点ごとに呼び出される・・というか頂点以外のピクセルは補間で色が決まる。
// fsはピクセルごとに呼び出される。そのピクセルの色の値を直接決めることもできるし、・・んー？

// うまくいったぞ。
// どういうことかというと、fsに送るのはaPosition, つまりもともとのquadにおける相対座標（-1～1, -1～1）で、
// その座標で色を決めてもらう。その一方で、gl_Positionの方には回転を掛けて、描画の際に
// 然るべき位置に描画されるようにする。これで、色配置が変わらないまま図形を回転させることができる
// とかそんなような意味。はい。
let fs =
   "precision highp float;\
    varying vec2 vPos;\
    void main(){\
      gl_FragColor = vec4((vPos.x + 1.0) / 2.0, (vPos.y + 1.0) / 2.0, 1.0, 1.0);\
    }";

function setup(){
  createCanvas(400, 400, 'webgl');
  colorMode(HSB, 100);
  rectMode(CENTER);
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  // ここの-0.5とか0.5っていうのが座標になってるみたい。
  // vPosに頂点の情報が入る、今回fsでは頂点の色を決めていて、それ以外の、このquadの上の
  // ピクセルの色に関しては補間で決まっているみたい。
  myShader.setUniform('count', frameCount);
  quad(0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5);
}
