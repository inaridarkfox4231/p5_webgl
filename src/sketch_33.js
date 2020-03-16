// レイマーチングやり直し

// ライティングまで行きたい
// てかもうやってるよね・・自分で書いちゃおうかな
// そのあとで答え合わせすればいいでしょ。

// できたかな・・

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
"const float sphereSize = 1.0;" + // 球の半径
"const vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));" + // 光を当てる方向の逆ベクトル
// 距離関数。原点中心、半径sphereSizeの球みたいな。
"float distanceFunc(vec3 p){" +
"  return length(p) - sphereSize;" +
"}" +
// 法線ベクトルの取得。当たった点のrPosに対してそこから突き出ているやつを取る感じ。距離関数の勾配ベクトル。
"vec3 getNormal(vec3 p){" +
"  float h = 0.0001;" + // 微小変位
// 各方向の距離関数の変分を取る。ほんとはこれらをhで割るんだけどnormalizeするので省略している。みんな一緒なのも簡略化のため。
"  float nx = distanceFunc(p) - distanceFunc(p - vec3(h, 0.0, 0.0));" +
"  float ny = distanceFunc(p) - distanceFunc(p - vec3(0.0, h, 0.0));" +
"  float nz = distanceFunc(p) - distanceFunc(p - vec3(0.0, 0.0, h));" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
"void main(void){" +
// fragment position.
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
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
"    distance = distanceFunc(rPos);" +
"    rLen += distance;" +
"    rPos = cPos + ray * rLen;" + // ray方向にrLenだけ進む
"  }" +
// hit check. （衝突判定）
"  if(abs(distance) < 0.001){" +
// getNormalをrPosに適用して突き出す矢印を取り、lightDirとの内積を取って明るさとする感じ。
"    float blightNess = dot(getNormal(rPos), lightDir);" +
"    gl_FragColor = vec4(vec3(0.1 + blightNess), 1.0);" +
"  }else{" +
"    gl_FragColor = vec4(vec3(0.0), 1.0);" +
"  }" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  noLoop();
}

function draw(){
  clear();
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  const ms = getNormalizeMouseValue();
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
