// 平面距離関数で遊んでみたい。双曲線とか三角形とか放物線とかそういうので。
// 多角形とか。

// 線分、点、三角形の距離関数。

// で、おそらく凸多角形なら順番に頂点を指定すれば同じ感じで出来るでしょうね。おそらく・・まあ。
// 逐一書かないといけないから面倒だけど。

// これだけだと面白くないからなんかしたいね・・

// たとえば三角形との距離を取って、それが0.02以下の時は1.0で、それより大きい時は逆数を取るとか。

// 寄り道おわり。

// まあ距離関数きちんとできたので合格！！（何が？？？）

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
"const vec2 p0 = vec2(0.0);" +
"const float pi = 3.14159;" +
// hsb型のvec3をrgbにする魔法のコード
"vec3 hsb2rgb(vec3 c){" +
"    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0)," +
"                             6.0)-3.0)-1.0," +
"                     0.0," +
"                     1.0 );" +
"    rgb = rgb*rgb*(3.0-2.0*rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
// 点aとの距離
"float distWithPoint(vec2 a, vec2 p){" +
"  return length(p - a);" +
"}" +
// 線分a0a1との距離
"float distWithLine(vec2 a0, vec2 a1, vec2 p){" +
"  float t = dot(p - a0, a1 - a0) / dot(a1 - a0, a1 - a0);" +
"  vec2 x = (1.0 - t) * a0 + t * a1;" +
"  float d0 = distWithPoint(a0, p);" +
"  float d1 = distWithPoint(a1, p);" +
"  float d2 = length(x - p);" +
"  return d0 * (1.0 - step(0.0, t)) + d1 * step(1.0, t) + d2 * (step(0.0, t) - step(1.0, t));" +
"}" +
// 三角形との距離を調べるにあたり、どの線分を使うかを判定するための数を調べる感じ。
"float areaValue(vec2 a, vec2 b, vec2 p){" +
"  float dtm = dot(a, a) * dot(b, b) - dot(a, b) * dot(a, b);" +
"  float u = dot(a, a) * dot(p, b) + dot(b, b) * dot(p, a) - dot(a, b) * dot(p, a + b);" +
"  return u / dtm;" +
"}" +
// 三角形a0a1a2との距離。内部にある場合は0.0を返すようになっている。
"float distWithTriangle(vec2 a0, vec2 a1, vec2 a2, vec2 p){" +
"  float v01 = areaValue(a0 - a2, a1 - a2, p - a2);" +
"  float v12 = areaValue(a1 - a0, a2 - a0, p - a0);" +
"  float v20 = areaValue(a2 - a1, a0 - a1, p - a1);" +
"  if(v01 > 1.0){ return distWithLine(a0, a1, p); }" +
"  if(v12 > 1.0){ return distWithLine(a1, a2, p); }" +
"  if(v20 > 1.0){ return distWithLine(a2, a0, p); }" +
"  return 0.0;" +
"}" +
// 300倍したときに3分の1になるようにべき関数の指数を調整する
"const float alpha = -1.0 * log(2.5) / log(300.0);" +
"const float coeff = pow(0.001, -alpha);" +
"void main(void){" +
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" + // gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
//"  float col1 = step(0.02, distWithPoint(p0, p)) * 0.5;" +
//"  float col2 = step(0.02, distWithLine(q0, q1, p)) * 0.5;" +
//"  float col3 = step(0.02, distWithTriangle(q0, q1, q2, p)) * 0.5;" +
"  float size = 0.1 + 0.8 * mouse.x;" + // 三角形のサイズはマウスの横移動で実現。
"  vec2 q0 = vec2(size * cos(fc * 0.02), size * sin(fc * 0.02));" +
"  vec2 q1 = vec2(size * cos(fc * 0.02 + pi * 1.0 / 3.0), size * sin(fc * 0.02 + pi * 1.0 / 3.0));" +
"  vec2 q2 = vec2(size * cos(fc * 0.02 + pi * 2.0 / 3.0), size * sin(fc * 0.02 + pi * 2.0 / 3.0));" +
"  vec2 q3 = vec2(size * cos(fc * 0.02 + pi), size * sin(fc * 0.02 + pi));" +
"  vec2 q4 = vec2(size * cos(fc * 0.02 + pi * 4.0 / 3.0), size * sin(fc * 0.02 + pi * 4.0 / 3.0));" +
"  vec2 q5 = vec2(size * cos(fc * 0.02 + pi * 5.0 / 3.0), size * sin(fc * 0.02 + pi * 5.0 / 3.0));" +
"  float d = distWithTriangle(q0, q2, q4, p);" +
"  float d_inv = distWithTriangle(q1, q3, q5, p);" +
"  float col = 1.0;" +
"  float col_inv = 1.0;" +
"  if(d > 0.001){ col = coeff * pow(d, alpha); }" + // べき関数(coeff * x^(-alpha))を使って明るさを調整する
"  if(d_inv > 0.001){ col_inv = coeff * pow(d_inv, alpha); }" +
"  gl_FragColor = vec4(col, mouse.y, col_inv, 1.0);" +
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
