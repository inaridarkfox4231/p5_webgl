// とりあえず角柱やるか。
// 三角柱は、3つの頂点と、それを底面に見た時の方向ベクトル。全部で4つの情報からなる。
//

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
// 三角柱との距離. a0, a1, a2を反時計回りに配置した場合の上方向（右ねじ方向）にhだけ伸びる形で三角柱を生成する感じ。
"float distWithTriColumn(vec3 a0, vec3 a1, vec3 a2, float h, vec3 p){" +
"  vec3 e0 = normalize(a1 - a0);" +
"  vec3 e1 = normalize((a2 - a0) - dot(a2 - a0, e0) * e0);" +
"  vec3 e2 = cross(e0, e1);" +
"  vec3 u = p - a0;" +
"  float tmp = dot(u, e2);" +
"  float dz = max(0.0, max(-tmp, tmp - h));" +
"  vec2 v = vec2(dot(u, e0), dot(u, e1));" +
"  float a = length(a1 - a0);" +
"  float b = dot(a2 - a0, e0);" +
"  float c = dot(a2 - a0, e1);" +
"  float dWithT = distanceWithTriangle2D(vec2(0.0, 0.0), vec2(a, 0.0), vec2(b, c), v);" +
"  return sqrt(dz * dz + dWithT * dWithT);" +
"}" +
// 三角柱版の法線情報
"vec3 getNormalOfTriColumn(vec3 a0, vec3 a1, vec3 a2, float h, vec3 p){" +
"  float nx = distWithTriColumn(a0, a1, a2, h, p + dx) - distWithTriColumn(a0, a1, a2, h, p - dx);" +
"  float ny = distWithTriColumn(a0, a1, a2, h, p + dy) - distWithTriColumn(a0, a1, a2, h, p - dy);" +
"  float nz = distWithTriColumn(a0, a1, a2, h, p + dz) - distWithTriColumn(a0, a1, a2, h, p - dz);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
"void main(void){" +
// fragment position.
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
// 図形の情報
"  vec3 a0 = vec3(-0.5, 0.0, 0.0);" +
"  vec3 a1 = vec3(0.3, -0.3, 0.0);" +
"  vec3 a2 = vec3(0.3, 0.4, 0.0);" +
"  float h = 0.6;" +
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
// ここで距離関数を適用する
"    distance = distWithTriColumn(a0, a1, a2, h, rPos);" +
"    rLen += distance;" +
"    rPos = cPos + ray * rLen;" + // ray方向にrLenだけ進む
"    if(abs(distance) < threshold){ break; }" + // この1行追加しただけでぶつぶつが消えた・・不必要に近付きすぎて丸め誤差が起きたみたい。
"  }" +
// hit check. （衝突判定）
"  if(abs(distance) < threshold){" +
// ここで法線情報を取得して明るさをいじる
"    float blightness = dot(getNormalOfTriColumn(a0, a1, a2, h, rPos), lightDir);" +
"    gl_FragColor = vec4(hsb2rgb(vec3(0.66, 1.0, blightness + 0.7)), 1.0);" +
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
