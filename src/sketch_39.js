// 平行光線の枠組みで球を描いてみる。

// 立方体描いてみた。

// 円柱できた。あと円錐と台柱やりたいわね。まずは台柱。
// 昨日作った多角形の判定を使わないといけないのよね。

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
// 立方体。
// cは中心、簡単のためx軸、y軸、z軸に平行な方向にsizeだけ動いた場所に面がある感じ。
// つまり一般的な正六面体ではないわけ。正六面体でやりたいけどね・・
// p-cの各成分、たとえばxについて、max(0.0, |x| - size)を作って3つをそれぞれ平方して足して根を取る。
"float distWithCube(vec3 c, vec3 p, float size){" +
"  return length(max(vec3(0.0), abs(p - c) - vec3(size)));" +
"}" +
// シリンダー. cは2つの円の中心を結ぶ線分の中点、uは軸方向単位ベクトル、hは高さの半分。rは円の半径。
// cからpへのベクトルを取ればあとは長方形との距離で出るので上の理論がそのまま使える。
"float distWithCylinder(vec3 c, vec3 u, vec3 p, float h, float r){" +
"  vec3 v = p - c;" +
"  float y = abs(dot(v, u));" +
"  float x = sqrt(dot(v, v) - y * y);" +
"  return sqrt(pow(max(0.0, x - r), 2.0) + pow(max(0.0, y - h), 2.0));" +
"}" +
// 多角形の距離関数の準備
// 2次元での線分との距離
"float distanceWithSegment2D(vec2 a, vec2 b, vec2 p){" +
"  float len = length(b - a);" +
"  vec2 e0 = normalize(b - a);" +
"  vec2 e1 = e0.yx * vec2(-1.0, 1.0);" +
"  float tmp = dot(p - a, e0);" +
"  float dx = max(0.0, max(-tmp, tmp - len));" +
"  float dy = dot(p - a, e1);" +
"  return sqrt(dx * dx + dy * dy);" +
"}" +
// GLSLではx, y軸が順方向なので頂点は反時計回りに配置した方が具合がいい。そこで右側判定の関数を用意する。
"bool existOnRightSide(vec2 a, vec2 b, vec2 p){" +
"  vec2 n = normalize(vec2(b.y - a.y, -(b.x - a.x)));" +
"  return dot(p - a, n) > 0.0;" +
"}" +
// 距離更新のための補助関数も同じように用意する。
"float updateDistance2D(vec2 a, vec2 b, vec2 p, float d){" +
"  if(!existOnRightSide(a, b, p)){ return d; }" +
"  float distWithSeg = distanceWithSegment2D(a, b, p);" +
"  if(d < 0.0){ return distWithSeg; }" +
"  return min(d, distWithSeg);" +
"}" +
// 三角形版。頂点は反時計回りに配置すること。
"float distanceWithTriangle2D(vec2 a0, vec2 a1, vec2 a2, vec2 p){" +
"  float d = -1.0;" +
"  d = updateDistance2D(a0, a1, p, d);" +
"  d = updateDistance2D(a1, a2, p, d);" +
"  d = updateDistance2D(a2, a0, p, d);" +
"  return d;" +
"}" +
// 四角形。
"float distanceWithQuad2D(vec2 a0, vec2 a1, vec2 a2, vec2 a3, vec2 p){" +
"  float d = -1.0;" +
"  d = updateDistance2D(a0, a1, p, d);" +
"  d = updateDistance2D(a1, a2, p, d);" +
"  d = updateDistance2D(a2, a3, p, d);" +
"  d = updateDistance2D(a3, a0, p, d);" +
"  return d;" +
"}" +
// 先に円錐。
"float distWithCorn(vec3 c, vec3 u, vec3 p, float h, float r){" +
"  vec3 v = p - c;" +
"  float y = dot(v, u);" +
"  float x = sqrt(dot(v, v) - y * y);" +
"  return distanceWithTriangle2D(vec2(0, 0), vec2(r, 0), vec2(0, h), vec2(x, y));" +
"}" +
// pudding？台柱との距離関数。c, u, p, h, r0, r1. uは単位ベクトル、bは底面の円の中心、hは高さ、r0は底面円の半径、r1は反対側。
"float distWithPudding(vec3 c, vec3 u, vec3 p, float h, float r0, float r1){" +
"  vec3 v = p - c;" +
"  float y = dot(v, u);" +
"  float x = sqrt(dot(v, v) - y * y);" +
"  return distanceWithQuad2D(vec2(0, 0), vec2(r0, 0), vec2(r1, h), vec2(0, h), vec2(x, y));" +
"}" +
// 法線ベクトルの取得（球）。当たった点のrPosに対してそこから突き出ているやつを取る感じ。距離関数の勾配ベクトル。
"vec3 getNormalOfSphere(vec3 c, vec3 p, float size){" +
// 各方向の距離関数の変分を取る。ほんとはこれらをdeltaで割るんだけどnormalizeするので省略している。みんな一緒なのも簡略化のため。
"  float nx = distWithSphere(c, p + dx, size) - distWithSphere(c, p - dx, size);" +
"  float ny = distWithSphere(c, p + dy, size) - distWithSphere(c, p - dy, size);" +
"  float nz = distWithSphere(c, p + dz, size) - distWithSphere(c, p - dz, size);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
// 法線ベクトルの取得（立方体）
"vec3 getNormalOfCube(vec3 c, vec3 p, float size){" +
"  float nx = distWithCube(c, p + dx, size) - distWithCube(c, p - dx, size);" +
"  float ny = distWithCube(c, p + dy, size) - distWithCube(c, p - dy, size);" +
"  float nz = distWithCube(c, p + dz, size) - distWithCube(c, p - dz, size);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
// 法線ベクトルの取得（シリンダー）
"vec3 getNormalOfCylinder(vec3 c, vec3 u, vec3 p, float h, float r){" +
"  float nx = distWithCylinder(c, u, p + dx, h, r) - distWithCylinder(c, u, p - dx, h, r);" +
"  float ny = distWithCylinder(c, u, p + dy, h, r) - distWithCylinder(c, u, p - dy, h, r);" +
"  float nz = distWithCylinder(c, u, p + dz, h, r) - distWithCylinder(c, u, p - dz, h, r);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
// 法線ベクトルの取得（円錐）
"vec3 getNormalOfCorn(vec3 c, vec3 u, vec3 p, float h, float r){" +
"  float nx = distWithCorn(c, u, p + dx, h, r) - distWithCorn(c, u, p - dx, h, r);" +
"  float ny = distWithCorn(c, u, p + dy, h, r) - distWithCorn(c, u, p - dy, h, r);" +
"  float nz = distWithCorn(c, u, p + dz, h, r) - distWithCorn(c, u, p - dz, h, r);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
// 法線ベクトルの取得（プリン）
"vec3 getNormalOfPudding(vec3 c, vec3 u, vec3 p, float h, float r0, float r1){" +
"  float nx = distWithPudding(c, u, p + dx, h, r0, r1) - distWithPudding(c, u, p - dx, h, r0, r1);" +
"  float ny = distWithPudding(c, u, p + dy, h, r0, r1) - distWithPudding(c, u, p - dy, h, r0, r1);" +
"  float nz = distWithPudding(c, u, p + dz, h, r0, r1) - distWithPudding(c, u, p - dz, h, r0, r1);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
"void main(void){" +
// fragment position.
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
// 図形の情報
"  float size = 0.3;" +
"  vec3 center = vec3(0.0, 0.0, 0.0);" +
"  vec3 center2 = vec3(0.0, 0.0, -0.4);" +
"  vec3 center3 = vec3(0.0, 0.7, -0.4);" +
"  vec3 u = vec3(0.0, 0.0, 1.0);" +
"  float h = 0.8;" +
"  float r = 0.2;" +
"  float r0 = 0.3;" +
"  float r1 = 0.5;" +
// camera.
// 平行光線なので先にcDirとcUpを決める。cross(cDir, cUp)でcSideを出す。
// rayはcDirそのもの。cPosはcSide * p.x + cUp * p.y - cDirで与えられる感じ。
// 平行なので球の半径が1.0で、だからdepthには意味がないのでこれでいいですね。
// マウス使おうね。
"  float theta = -mouse.y * pi * 1.0;" +
"  float phi = mouse.x * pi * 2.0;" +
"  vec3 cDir = -vec3(cos(theta) * cos(phi), cos(theta) * sin(phi), sin(theta));" +
"  vec3 cUp = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), -cos(theta));" +
"  vec3 cSide = cross(cDir, cUp);" +
"  vec3 ray = cDir;" +
"  vec3 cPos = cSide * p.x + cUp * p.y - cDir;" + // 視点はcSideとcUpが定める平面をcDirと逆方向に1.0だけ戻った場所。
// marching loop. （進行処理）
"  float distance = 0.0;" + // レイとオブジェクト間の最短距離
"  float rLen = 0.0;" + // レイに継ぎ足す長さ
"  vec3 rPos = cPos;" + // レイの先端位置（あっちのプログラムにおけるcurに当たる）
"  for(int i = 0; i < 64; i++){" +
//"    distance = distWithCube(center, rPos, size);" +
//"    distance = distWithCylinder(center, u, rPos, h, r);" +
"    distance = distWithCorn(center2, u, rPos, h, r0);" +
//"    distance = distWithPudding(center2, u, rPos, h, r0, r1);" +
"    rLen += distance;" +
"    rPos = cPos + ray * rLen;" + // ray方向にrLenだけ進む
"    if(abs(distance) < threshold){ break; }" + // この1行追加しただけでぶつぶつが消えた・・不必要に近付きすぎて丸め誤差が起きたみたい。
"  }" +
// hit check. （衝突判定）
"  if(abs(distance) < threshold){" +
//"    float blightness = dot(getNormalOfCube(center, rPos, size), lightDir);" +
//"    float blightness = dot(getNormalOfCylinder(center, u, rPos, h, r), lightDir);" +
"    float blightness = dot(getNormalOfCorn(center2, u, rPos, h, r0), lightDir);" +
//"    float blightness = dot(getNormalOfPudding(center2, u, rPos, h, r0, r1), lightDir);" +
"    gl_FragColor = vec4(hsb2rgb(vec3(0.66, 1.0, blightness + 0.8)), 1.0);" +
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
