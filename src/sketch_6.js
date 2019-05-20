'use strict';
// バーテックスシェーダで点を動かしてみるとかそういうの。
let myShader;
// precision宣言がないとコンパイルエラーになる
let vs =
  "precision highp float;\
   varying vec3 vPos;\
   attribute vec3 aPosition;\
   uniform float count;\
   float diffAngle = count * 3.14159 / 120.0;\
   mat3 m = mat3(\
     cos(diffAngle), -sin(diffAngle), 0.0,\
     0.0, 1.0, 0.0,\
     sin(diffAngle), 0.0, cos(diffAngle)\
   );\
   mat3 s = mat3(\
     0.8, 0.0, 0.0,\
     0.0, 0.8, 0.0,\
     0.0, 0.0, 0.8\
   );\
   void main(){\
     vPos = aPosition;\
     gl_Position = vec4(s * m * aPosition, 1.0);\
   }";

// バーテックスシェーダで頂点の情報（gl_Position）に回転を加えると。
// mでy軸周りの回転、さらにsでスケール変換。長さを自由に変えられる。
// つまりdraw内でboxに色々指定するのではなくて、こっちのシェーダーを使って直接いじると。
// カスタムシェーダーってそういうことみたいだな・・・

let fs =
   "precision highp float;\
    varying vec3 vPos;\
    void main(){\
      gl_FragColor = vec4((vPos.x + 1.0) / 2.0, (vPos.y + 1.0) / 2.0, (vPos.z + 1.0) / 2.0, 1.0);\
    }";

function setup(){
  createCanvas(400, 400, 'webgl');
  colorMode(HSB, 100);
  rectMode(CENTER);
  myShader = createShader(vs, fs);
  shader(myShader);
  noStroke(); // これがないと中央付近にへんな黒いぐりぐりが出現する。
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('count', frameCount);
  box();
  // こっちにいろいろ書くのではないということね。
  // 多分rectにしてもそうなんだろ。デフォルトだけあって、あとはそれをバーテックスシェーダでいじってねみたいな。
}

// Uniformをいじりながらboxを複数用意することで複数のオブジェクトを作り出せる？平行移動とかして。んー。
// たとえば複数の位置で回転しているオブジェクトを作るとか・・みたいな。
