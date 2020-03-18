// 三角形の距離関数を書き直したいんです。
// あと配列渡しの実験とか。

// とりあえず線分との距離。
// 距離を使って描画する練習。
// 複数の線にするとか？カラフルな三角形とか？

// たとえば線を7本にするなら・・

// とりあえずバーのテストは成功。

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
"const float val = 25.0;" + // 色の種類数
"const mat2 rotate = mat2(cos(pi * 2.0 / val), -sin(pi * 2.0 / val), sin(pi * 2.0 / val), cos(pi * 2.0 / val));" + // 回転。
"const float rotateSpeedFactor = 0.03;" + // 回転スピードの係数
// 直線との距離を計算する関数
// 垂直距離dを法線ベクトルとの内積で出して、足と線分との距離を別に求めてから平方和の根を取ってる。
"float distanceWithLine(vec2 a0, vec2 a1, vec2 p){" +
"  vec2 u = normalize(a1 - a0);" +
"  vec2 v = normalize((a1 - a0).yx * vec2(-1.0, 1.0));" +
"  float d = abs(dot(v, p - a0));" +
"  float tmp = dot(u, p - a0);" +
"  float len = length(a1 - a0);" +
"  if(tmp > 0.0 && tmp < len){ return d; }" +
"  return sqrt(pow(d, 2.0) + pow(max(-tmp, tmp - len), 2.0));" +
"}" +
// 凸多角形描画用のチェック関数。具体的にはa0, a1に対しベクトルa0→a1を反時計回りに90°回転させた側の半平面にpがあればtrueを返す。
"bool areaCheck(vec2 a0, vec2 a1, vec2 p){" +
"  return dot(p - a0, (a1 - a0).yx * vec2(-1.0, 1.0)) > 0.0;" +
"}" +
// 三角形判定。a0, a1, a2はこの順で上から見て時計回りに配置されているとする。
"float distanceWithTriangle(vec2 a0, vec2 a1, vec2 a2, vec2 p){" +
"  if(areaCheck(a0, a1, p)){ return distanceWithLine(a0, a1, p); }" +
"  if(areaCheck(a1, a2, p)){ return distanceWithLine(a1, a2, p); }" +
"  if(areaCheck(a2, a0, p)){ return distanceWithLine(a2, a0, p); }" +
"  return 0.0;" +
"}" +
// hsb型のvec3をrgbにする魔法のコード
"vec3 hsb2rgb(vec3 c){" +
"    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0)," +
"                             6.0)-3.0)-1.0," +
"                     0.0," +
"                     1.0 );" +
"    rgb = rgb*rgb*(3.0-2.0*rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
// メイン関数
"void main(void){" +
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
"  float minRadius = 0.4 - mouse.x * 0.3;" +
"  float maxRadius = 0.5 + mouse.x * 0.4;" +
// まず基本となる扇型の方向ベクトルを作る
"  float angle = fc * rotateSpeedFactor;" +
"  vec2 a0 = vec2(minRadius * cos(angle), minRadius * sin(angle));" +
"  vec2 a1 = vec2(maxRadius * cos(angle), maxRadius * sin(angle));" +
// pを回転させて基本領域に入れる。回転の回数で色を分ける。
"  vec2 u = normalize(a1 - a0);" +
"  float colorId = 0.0;" +
"  for(float i = 0.0; i < val; i += 1.0){" +
"    if(dot(p, u) > length(p) * cos(pi / val)){ break; }" +
"    p *= rotate;" +
"    colorId += 1.0;" +
"  }" +
"  float d = distanceWithLine(a0, a1, p);" +
"  if(d < 0.01){" +
// 単純にhueを出して色分け。
"    float bl = 0.3 + 0.7 * (length(p) - minRadius) / (maxRadius - minRadius);" +
"    gl_FragColor = vec4(hsb2rgb(vec3(colorId / val, bl, 1.0)), 1.0);" +
"  }else{" +
"    gl_FragColor = vec4(vec3(0.3), 1.0);" +
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
  const ms = getNormalizeMouseValue();
  myShader.setUniform("mouse", ms); // 正規化
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
