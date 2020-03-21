// sketch_37.jsの修正。平行光線を使ってみる。
// これにより球がきちんと正円で表現される。

// このテンプレ使えるな・・とりあえずしばらくは平行光線でいいでしょう。
// カメラの位置をぐるぐるする場合イテレーションは使えないので注意。

// イメージ的には半径1の球の中ですべてが展開されていて、それをどこから見るかをcDirが決める。
// cDirと反対方向に1.0だけ中心から戻った場所がcPosになる。上と右をy,xとしてこれも定めておく。これをいじると見える世界が回転する。

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
"const float val = 20.0;" + // セグメント当たりの輪っかを成す球の個数
"const float baum = 8.0;" + // バウムクーヘンの周回数（最終的に8で）
// 回転角
"const float rotateAngle = 2.0 * pi / val;" +
// z軸周りの回転を行う2次行列
"const mat2 rotate = mat2(cos(rotateAngle), -sin(rotateAngle), sin(rotateAngle), cos(rotateAngle));" +
// z軸周りの回転を行う3次行列(rotateと逆にしてある)
"const mat3 rotateZ = mat3(cos(rotateAngle), sin(rotateAngle), 0.0, -sin(rotateAngle), cos(rotateAngle), 0.0, 0.0, 0.0, 1.0);" +
// 半径方向のイテレーションに使う比例乗数
"const float radiusRatio = (1.0 + sin(pi / val)) / (1.0 - sin(pi / val));" +
// イテレーション終了条件となるしきい値
"const float threshold = 0.001;" +
// 光
"const vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));" + // 光を当てる方向の逆ベクトル
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
// 距離関数を拡張する感じ。
// baseCenterから比率を掛けながらチェックしていき、一番小さいものを返す感じ。
// cとsizeは基底のあれ。
"float distWithSphereMulti(vec3 c, vec3 p, float size){" +
"  float minDist = -1.0;" +
"  for(float i = 0.0; i < baum; i += 1.0){" +
"    float d = distWithSphere(c, p, size);" +
"    if(minDist < 0.0){ minDist = d; }else{ minDist = min(minDist, d); }" +
"    c *= radiusRatio;" +
"    size *= radiusRatio;" +
"  }" +
"  return minDist;" +
"}" +
// 法線ベクトルの取得。当たった点のrPosに対してそこから突き出ているやつを取る感じ。距離関数の勾配ベクトル。
"vec3 getNormalOfSphere(vec3 c, vec3 p, float size){" +
// 各方向の距離関数の変分を取る。ほんとはこれらをdeltaで割るんだけどnormalizeするので省略している。みんな一緒なのも簡略化のため。
"  float nx = distWithSphere(c, p + dx, size) - distWithSphere(c, p - dx, size);" +
"  float ny = distWithSphere(c, p + dy, size) - distWithSphere(c, p - dy, size);" +
"  float nz = distWithSphere(c, p + dz, size) - distWithSphere(c, p - dz, size);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
// もうひとつ、最終的にどの球に最接近したかを調べないといけないんですね・・
// その球の中心と半径は数（0,1,2,...）が分かればその分だけradiusRatioを掛ければ出るけど・・
// それだったらそれを直接返した方がエコだからvec4形式で与えちゃいましょう。
"float getClosestSphereIndex(vec3 c, vec3 p, float size){" +
"  for(float i = 0.0; i < baum; i += 1.0){" +
"    if(distWithSphere(c, p, size) < threshold){ return i; }" +
"    c *= radiusRatio;" +
"    size *= radiusRatio;" +
"  }" +
"  return baum - 1.0;" +
"}" +
"void main(void){" +
// fragment position.
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
// radius, size, center.
// 半径をradiusRatioで1.0を割った値にしてみる感じで。
"  float radius = 1.0 / pow(radiusRatio, baum);" +
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
// 平行光線なので先にcDirとcUpを決める。cross(cDir, cUp)でcSideを出す。
// rayはcDirそのもの。cPosはcSide * p.x + cUp * p.y - cDirで与えられる感じ。
// 平行なので球の半径が1.0で、だからdepthには意味がないのでこれでいいですね。
"  vec3 cDir = vec3(0.0, 0.0, -1.0);" +
"  vec3 cUp = vec3(0.0, 1.0, 0.0);" +
"  vec3 cSide = cross(cDir, cUp);" +
"  vec3 ray = cDir;" +
"  vec3 cPos = cSide * p.x + cUp * p.y - cDir;" + // 視点はcSideとcUpが定める平面をcDirと逆方向に1.0だけ戻った場所。
// marching loop. （進行処理）
"  float distance = 0.0;" + // レイとオブジェクト間の最短距離
"  float rLen = 0.0;" + // レイに継ぎ足す長さ
"  vec3 rPos = cPos;" + // レイの先端位置（あっちのプログラムにおけるcurに当たる）
"  for(int i = 0; i < 16; i++){" +
"    distance = distWithSphereMulti(center, rPos, size);" +
"    rLen += distance;" +
"    rPos = cPos + ray * rLen;" + // ray方向にrLenだけ進む
"    if(abs(distance) < threshold){ break; }" + // この1行追加しただけでぶつぶつが消えた・・不必要に近付きすぎて丸め誤差が起きたみたい。
"  }" +
// hit check. （衝突判定）
"  if(abs(distance) < threshold){" +
// getNormalをrPosに適用して突き出す矢印を取り、lightDirとの内積を取って明るさとする感じ。
// 先にどの位置の球に当たったか調べる。
"    float sizeIndex = getClosestSphereIndex(center, rPos, size);" +
"    vec3 properCenter = center * pow(radiusRatio, sizeIndex);" +
"    float properSize = size * pow(radiusRatio, sizeIndex);" +
"    float blightness = dot(getNormalOfSphere(properCenter, rPos, properSize), lightDir);" +
"    float hue = repeatCount / val;" +
"    float saturation = sizeIndex / baum;" +
"    gl_FragColor = vec4(hsb2rgb(vec3(hue, saturation + 0.2, blightness + 0.2)), 1.0);" +
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
