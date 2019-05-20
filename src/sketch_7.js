'use strict';
// マンデルブロに倣ってattribute変数を使ってみるとかそういう。
let myShader;
let img;
let isLoop = true;
// precision宣言がないとコンパイルエラーになる
let vs =
  "precision mediump float;\
   varying vec2 vPos;\
   attribute vec3 aPosition;\
   vec3 to_center = vec3(-0.5, -0.5, 0.0);\
   uniform float count;\
   float diffAngle = count * 3.14159 / 120.0;\
   mat3 m_rotate = mat3(\
     cos(diffAngle), -sin(diffAngle), 0.0,\
     sin(diffAngle), cos(diffAngle), 0.0,\
     0.0, 0.0, 1.0\
   );\
   uniform mat3 m_scale;\
   uniform vec3 parallel;\
   varying vec2 vTextureCoord;\
   void main(){\
     vPos = aPosition.xy;\
     gl_Position = vec4(parallel + (m_rotate * m_scale * (aPosition + to_center)), 1.0);\
     vTextureCoord = vec2(aPosition.x, 1.0 - aPosition.y);\
   }";

// まず、countを受け取り、それに応じてdiffAngleが決まる、回転行列が決まる。
// vPosはfsに送って色を決めてもらう。
// 描画位置について。rectのデフォルトは(0, 0)～(1, 1)のようである。デフォルトとはいえ、
// 引数がないとconsoleがエラーで埋まりエライことになるのでなんか入れておく。
// これをまずto_centerで中心に持ってきて、m_scaleで大きさを半分にして、m_rotateで回転させる。
// そのあとはparallelをとっかえひっかえしつつ5つ描画すれば完成。
// countに応じて色を変えたら面白いかも。その場合はvarying変数を増やせばよろしい。多分。
// その際にcountを使えばよろしい。

// torusやconeにもデフォルトがあってそれをいじる形なのでしょう。
// あと、boxやtorusを描画する際のへんなぐりぐりはnoStroke()で消せるのも
// 覚えておいた方がいいかもしれない。
let fs =
   "precision mediump float;\
    varying vec2 vPos;\
    varying vec2 vTextureCoord;\
    uniform sampler2D uSampler;\
    void main(){\
      gl_FragColor = texture2D(uSampler, vTextureCoord);\
    }";

// gl_FragColor = vec4(vPos.x, vPos.y, 1.0, 1.0);\

function preload(){
  img = loadImage('./assets/GLSL_3.PNG');
}

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
  myShader.setUniform('uSampler', img);
  myShader.setUniform('count', frameCount);
  myShader.setUniform('m_scale', [0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5]);
  myShader.setUniform('parallel', [0.0, 0.0, 0.0]);
  rect(0, 0, 0, 0);
  myShader.setUniform('parallel', [0.5, 0.5, 0.0]);
  rect(0, 0, 0, 0);
  myShader.setUniform('parallel', [-0.5, 0.5, 0.0]);
  rect(0, 0, 0, 0);
  myShader.setUniform('parallel', [0.5, -0.5, 0.0]);
  rect(0, 0, 0, 0);
  myShader.setUniform('parallel', [-0.5, -0.5, 0.0]);
  rect(0, 0, 0, 0);
}

function mouseClicked(){
  // クリックで止めたり動かしたり
  if(isLoop){
    noLoop();
    isLoop = false;
  }else{
    loop();
    isLoop = true;
  }
}
