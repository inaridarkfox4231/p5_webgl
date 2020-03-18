// レイマーチングやり直し

// ライティングまで行きたい

// 対称性使って20個くらい回したい。できるかね。できそう？？
// とりあえず6個でしょ馬鹿

// アイデアとしては、与えられたpに対して、z軸周りに回転させて、angle = fc * 0.02があるんだけど、
// angle±PI/6のところにこれを回転で移して（行列掛ける）、移した回数を記録しておいて、
// 回数に応じてhueを決める。また、法線を取るためには・・んー。どうしよ？あー、cも回転させるんだ？

// 円環領域やってみるか（スピンオフ企画）
// 中心から広げていく。力技でやる。
// 半径が相似なので配列は要らない。内側からチェックしていくだけ。5回くらいできたらいいね。5x20で100個。そんな多くない。

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
"const float pi = 3.14159;" +
"const float val = 20.0;" + // 個数
"const float rotateAngle = 2.0 * pi / val;" + // 回転角
// z軸周りの回転を行う2次行列
"const mat2 rotate = mat2(cos(rotateAngle), -sin(rotateAngle), sin(rotateAngle), cos(rotateAngle));" +
// z軸周りの回転を行う3次行列(rotateと逆にしてある)
"const mat3 rotateZ = mat3(cos(rotateAngle), sin(rotateAngle), 0.0, -sin(rotateAngle), cos(rotateAngle), 0.0, 0.0, 0.0, 1.0);" +
// 光
"const vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.0));" + // 光を当てる方向の逆ベクトル
// 法線ベクトル関連
"const float delta = 0.0001;" + // 微小変分
"const vec3 dx = vec3(delta, 0.0, 0.0);" + // x方向の微小変位
"const vec3 dy = vec3(0.0, delta, 0.0);" + // y方向の微小変位
"const vec3 dz = vec3(0.0, 0.0, delta);" + // z方向の微小変位
// hsb型のvec3をrgbにする魔法のコード
"vec3 hsb2rgb(vec3 c){" +
"    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0)," +
"                             6.0)-3.0)-1.0," +
"                     0.0," +
"                     1.0 );" +
"    rgb = rgb*rgb*(3.0-2.0*rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
// 距離関数。原点中心、半径sphereSizeの球みたいな。
"float distWithSphere(vec3 c, vec3 p, float size){" +
"  return length(p - c) - size;" +
"}" +
// 法線ベクトルの取得。当たった点のrPosに対してそこから突き出ているやつを取る感じ。距離関数の勾配ベクトル。
"vec3 getNormalOfSphere(vec3 c, vec3 p, float size){" +
// 各方向の距離関数の変分を取る。ほんとはこれらをdeltaで割るんだけどnormalizeするので省略している。みんな一緒なのも簡略化のため。
"  float nx = distWithSphere(c, p + dx, size) - distWithSphere(c, p - dx, size);" +
"  float ny = distWithSphere(c, p + dy, size) - distWithSphere(c, p - dy, size);" +
"  float nz = distWithSphere(c, p + dz, size) - distWithSphere(c, p - dz, size);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
"void main(void){" +
// fragment position.
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
// radius, size, center.
"  float radius = 1.5;" +
"  float size = 0.9 * radius * sin(pi / val);" +
"  float angle = fc * 0.02;" +
"  vec3 center = vec3(radius * cos(angle), radius * sin(angle), 0.0);" +
// イテレーション
// centerはpのコピーとは逆に回転させる（pの属する領域に持ってくる）（pは動かない）
"  float repeatCount = 0.0;" + // 繰り返し回数
"  vec2 q = vec2(p.x, p.y);" + // pのコピー
"  float len = length(q);" +
"  vec2 u = vec2(cos(angle), sin(angle));" +
"  for(float i = 0.0; i < val; i += 1.0){" +
"    if(dot(q, u) > len * cos(pi / val)){ break; }" +
"    q *= rotate;" +
"    center *= rotateZ;" + // 中心は逆に回転させる（pの領域に持ってくるイメージで）（ライティングの関係で）
"    repeatCount += 1.0;" +
"  }" +
// camera.
"  vec3 cPos = vec3(0.0, 0.0, 3.0);" +  // カメラの位置
"  vec3 cDir = vec3(0.0, 0.0, -1.0);" +  // 見つめる方向（z軸負方向）
"  vec3 cUp = vec3(0.0, 1.0, 0.0);" +  // 前を向いていると考えた時の天井（y軸正方向）
"  vec3 cSide = cross(cDir, cUp);" + // cDirとcUpに直交するベクトルを取る（横方向）
"  float targetDepth = 1.0;" + // 深度
// ray.つまり目線。図示するとわかるが（上にy,右にx,手前にzみたいに描く）これはカメラ位置からz負に1だけ進んだところの
// -1～1ｘ-1～1の正方形（x=2の中）をスクリーンとしてその上の点に向かう目線みたいなやつ。
"  vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * targetDepth);" +
// marching loop. （進行処理）
"  float distance = 0.0;" + // レイとオブジェクト間の最短距離
"  float rLen = 0.0;" + // レイに継ぎ足す長さ
"  vec3 rPos = cPos;" + // レイの先端位置（あっちのプログラムにおけるcurに当たる）
"  for(int i = 0; i < 16; i++){" +
"    distance = distWithSphere(center, rPos, size);" +
"    rLen += distance;" +
"    rPos = cPos + ray * rLen;" + // ray方向にrLenだけ進む
"  }" +
// hit check. （衝突判定）
"  if(abs(distance) < 0.001){" +
// getNormalをrPosに適用して突き出す矢印を取り、lightDirとの内積を取って明るさとする感じ。
"    float bl = dot(getNormalOfSphere(center, rPos, size), lightDir);" +
"    float hue = repeatCount / val;" +
"    gl_FragColor = vec4(hsb2rgb(vec3(hue, 1.0, bl + 0.1)), 1.0);" +
"  }else{" +
"    gl_FragColor = vec4(vec3(0.0), 1.0);" +
"  }" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  clear();
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  const ms = getCenteringMouseValue(); // -1～1に正規化
  myShader.setUniform("mouse", ms);
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

function getNormalizeMouseValue(){
  // 0～1の範囲に正規化
  const x = constrain(mouseX / width, 0.0, 1.0);
  const y = constrain(mouseY / height, 0.0, 1.0);
  return [x, y];
}

function getCenteringMouseValue(){
  // -1～1の範囲に正規化
  const x = constrain(2.0 * (mouseX / width) - 1.0, -1.0, 1.0);
  const y = constrain(2.0 * (mouseY / height) - 1.0, -1.0, 1.0);
  return [x, y];
}
