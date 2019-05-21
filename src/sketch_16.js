// ちょっとたくさん計算しないといろいろ厳しそうだ。
// その前に・・ね。

// スフィアの取り扱いに関する実験
// やめよ
'use strict';

let myShader;

// 色の配列
let ci = 0; // colorIndex.
let hArray = [0.65, 0.00, 0.38, 0.05, 0.55, 0.83, 0.06, 0.59, 0.20, 0.00, 0.94];
let sArray = [0.69, 1.00, 0.80, 0.58, 1.00, 0.55, 0.91, 0.40, 0.88, 0.00, 0.73];
let vArray = [0.80, 1.00, 0.69, 0.67, 0.90, 0.64, 1.00, 0.74, 0.80, 0.49, 1.00];
let sDiffArray = [-0.32, -0.51, -0.41, -0.34, -0.59, -0.35, -0.41, -0.26, -0.37, 0.00, -0.33];
let vDiffArray = [0.07, 0.00, 0.22, 0.18, 0.10, 0.21, 0.00, 0.16, 0.14, 0.30, 0.00];

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"uniform mat3 rotate_x;" +
"uniform mat3 rotate_y;" +
"uniform mat3 rotate_z;" +
"uniform mat3 scale;" +
"varying vec3 vPosition;" +
"void main(){" +
"  gl_Position = vec4(scale * rotate_z * rotate_y * rotate_x * aPosition + vec3(0.0, 0.2, 0.0), 1.0);" +
"  vPosition = aPosition;" +
"}";

// aPositionに-1～1が入ってるからこれ使って円板に落として上半平面に持って行ってあとは好きに。
// 今回は複雑な事は無しで。クリックするたびにパターンが変わればそれでいいでしょう。
// とはいえcanvasのサイズに対してスフィアを小さく取って下のスペースでクリックでとかも出来なくはないのよね・・
// 500x500にして上に250x0.2だけずらして、つまり100のスペースを作りました。
// vの情報をfsで加工していろいろできますね。とりあえず上半平面に落とすべ・・

// 今回、回転や拡大縮小は行わないのでfcは渡しません。モードチェンジも無し。ただタイリングするだけ。
// パターンは変えたいけどね。
// いつものようにcolor_1, color_2とcenter, radiusの情報を提供。
// rが0.5で固定なのでa, b, s, tをいじる必要もないね。
// 細かいけどreflection_3の"_3"ってもう要らないんよ。
// あとresolution要らない。
let fs =
"precision mediump float;" +
"uniform float fc;" +
"uniform vec3 color_1;" +
"uniform vec3 color_2;" +
"uniform float center[2];" +
"uniform float radius[2];" +
"const int ITERATIONS = 64;" +
"const float PI = 3.14159;" +
"varying vec3 vPosition;" +
"vec2 sphere_to_poincare(vec3 v){" +
"  v.z = max(v.z, -0.999);" +
"  float norm = length(v);" +
"  float k = norm / (1.0 + v.z);" +
"  if(norm < 0.001){ if(v.z > 0.0){ return vec2(0.0); } }" +
"  return ((1.0 - 2.0 / (exp(k) + 1.0)) / norm) * v.xy;" +
"}" +
"vec2 poincare_to_half(vec2 p){" +
"  return vec2(-2.0 * p.y, (1.0 - pow(p.x, 2.0) - pow(p.y, 2.0))) / (pow(p.x - 1.0, 2.0) + pow(p.y, 2.0));" +
"}" +
"vec2 inversion(vec2 q, float r, float c){" +
"  float factor = pow(r, 2.0) / (pow(q.x - c, 2.0) + pow(q.y, 2.0));" +
"  return vec2(c, 0.0) + (vec2(q.x - c, q.y) * factor);" +
"}" +
"float getNorm(vec2 q){ return pow(q.x, 2.0) + pow(q.y, 2.0); }" +
"float reflection(vec2 q){" +
"  float time = 300.0 - abs(300.0 - mod(fc, 600.0));" +
"  float r = 0.5 + (time * time / 300.0);" +
"  float a = center[0] * r;" +
"  float b = center[1] * r;" +
"  float s = radius[0] * r;" +
"  float t = radius[1] * r;" +
"  float count = 0.0;" +
"  bool arrived = false;" +
"  float norm;" +
"  float border_0 = pow(r, 2.0), border_1 = (s - a) * (s + a), border_2 = (t - b) * (t + b);" +
"  for(int i = 0; i < ITERATIONS; i++){" +
"    norm = getNorm(q);" +
"    if(norm < border_0){" +
"      q = inversion(q, r, 0.0);" +
"      count += 1.0;" +
"    }else if(norm - 2.0 * q.x * a > border_1){" +
"      q = inversion(q, s, a);" +
"      count += 1.0;" +
"    }else if(norm - 2.0 * q.x * b > border_2){" +
"      q = inversion(q, t, b);" +
"      count += 1.0;" +
"    }else{" +
"      arrived = true;" +
"    }" +
"    if(arrived){ break; }" +
"  }" +
"  return mod(count, 2.0);" +
"}" +
"void main(){" +
"  vec2 p = sphere_to_poincare(vPosition);" +
"  vec2 q = poincare_to_half(p);" +
"  float ref = reflection(q);" +
"  gl_FragColor = vec4((1.0 - step(2.0, ref)) * ((1.0 - ref) * color_1 + ref * color_2), 1.0);" +
"}";
/*
"void main(){" +
"  vec2 p = sphere_to_poincare(vPosition);" +
"  vec2 q = poincare_to_half(p);" +
"  float ref = reflection(q);" +
"  gl_FragColor = vec4((1.0 - step(2.0, ref)) * ((1.0 - ref) * color_1 + ref * color_2), 1.0);" +
"}";*/

function setup(){
  createCanvas(500, 500, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  myShader.setUniform("scale", make_scale(0.8, 0.8, 1.0));
  ci = randomInt(11);
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  setParameter();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('fc', frameCount);
  myShader.setUniform("rotate_x", make_rotate(0, frameCount / 60 - PI / 6));
  myShader.setUniform("rotate_y", make_rotate(1, frameCount / 80 + PI / 8));
  myShader.setUniform("rotate_z", make_rotate(2, frameCount / 70));
  sphere();
}

function make_rotate(index, angle){
  // angleは0～360.
  if(index === 2){
    return [cos(angle), sin(angle), 0, -sin(angle), cos(angle), 0, 0, 0, 1]; // z軸周り、xをyに重ねる回転
  }else if(index === 1){
    return [cos(angle), 0, -sin(angle), 0, 1, 0, sin(angle), 0, cos(angle)]; // y軸周りの回転
  }else if(index === 0){
    return [1, 0, 0, 0, cos(angle), sin(angle), 0, -sin(angle), cos(angle)]; // x軸周りの回転
  }
}

function make_scale(sx, sy, sz){
  return [sx, 0, 0, 0, sy, 0, 0, 0, sz];
}

// m, n, lを与えてそれに応じてfs側の中心や半径のパラメータを用意する関数
// 2になりうるのはlのみ（mが最大という設定）なので、（というのもmやnが2になるとまずいので、）
// roofはmax(n, l)とのmaxを取っている。
function setParameter(){
  let l = 2 + randomInt(7); // lは2~13のどれか
  let n = 3 + randomInt(6); // nは3~13のどれか
  let roof = max(Math.floor((l * n) / (l * n - l - n)) + 1, max(n, l)); // roofはmのとりうる値の最小値
  let m = roof + randomInt(9 - roof); // roof~13のどれか
  let theta = PI / m, phi = PI / n, psi = PI / l;
  let k = calc_ratio(theta, phi, psi); // あっちのcalc_ratioを移植したもの
  let y = k + sqrt(k * k - 1.0); // r倍はfs側で行う
  let a = -(cos(phi) + cos(theta) * cos(psi)) / (cos(theta) * sin(psi)) * y;
  let b = (cos(theta) + cos(phi) * cos(psi)) / (cos(phi) * sin(psi)) * y;
  myShader.setUniform("center", [a, b]);
  let s = k * y / cos(theta);
  let t = k * y / cos(phi);
  myShader.setUniform("radius", [s, t]);
  console.log("(%d, %d, %d)", m, n, l);
}

function mouseClicked(){
  // クリックで色が変わるよ
  let ci_diff = randomInt(10) + 1; // colorIndexの変化(1～10).
  ci = (ci + ci_diff) % 11;
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  // パターンも、変わるよ(mが最大にする)
  // 2になるのはたかだか1つだけ。mやnが2にならないようにこの条件を付ける。
  setParameter();
}

// hsv形式の各パラメータが0～1の配列をrgbのそれに変換する。
// クリックの度にこれが呼び出される感じ。
function hsv_to_rgb(h, s, v){
  let border = 6.0 * h;
  if(border < 1.0){
    return [v, border * s * v + (1.0 - s) * v, (1.0 - s) * v];
  }else if(border < 2.0){
    return [(2.0 - border) * s * v + (1.0 - s) * v, v, (1.0 - s) * v];
  }else if(border < 3.0){
    return [(1.0 - s) * v, v, (border - 2.0) * s * v + (1.0 - s) * v];
  }else if(border < 4.0){
    return [(1.0 - s) * v, (4.0 - border) * s * v + (1.0 - s) * v, v];
  }else if(border < 5.0){
    return [(border - 4.0) * s * v + (1.0 - s) * v, (1.0 - s) * v, v];
  }else{
    return [v, (1.0 - s) * v, (6.0 - border) * s * v + (1.0 - s) * v];
  }
}

// fs内のcalc_ratioを移植
function calc_ratio(theta, phi, psi){
  let x = Math.pow(cos(theta), 2) + Math.pow(cos(phi), 2) + 2 * cos(theta) * cos(phi) * cos(psi);
  return Math.sqrt(x) / sin(psi);
}

// 0～n-1のどれかを出す
function randomInt(n){
  return Math.floor(random(n));
}
