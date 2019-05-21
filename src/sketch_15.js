// 正多角形作る
'use strict';

let myShader;
let ci = 0;

let hArray = [0.65, 0.00, 0.38, 0.05, 0.55, 0.83, 0.06, 0.59, 0.20, 0.00, 0.94];
let sArray = [0.69, 1.00, 0.80, 0.58, 1.00, 0.55, 0.91, 0.40, 0.88, 0.00, 0.73];
let vArray = [0.80, 1.00, 0.69, 0.67, 0.90, 0.64, 1.00, 0.74, 0.80, 0.49, 1.00];
let sDiffArray = [-0.32, -0.51, -0.41, -0.34, -0.59, -0.35, -0.41, -0.26, -0.37, 0.00, -0.33];
let vDiffArray = [0.07, 0.00, 0.22, 0.18, 0.10, 0.21, 0.00, 0.16, 0.14, 0.30, 0.00];

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// とりあえず正4角形（正方形という概念はないので）。
// 定数長の配列が使えるらしいので使わせていただくことにする。
// 双曲空間の正多角形は内角と角の個数で一意に決まる（互いに合同）。

// nは4とか5とか（最小は3だけど）最初に決めておく感じ。
// alphaだけ送る。あとは適当に。
// とりあえずn=4なので0, PI/2, PI, 3PI/2 に対して±αを取って2で割ってコタンジェントでマイナスで半径中心inversion.

// r倍したらうまくいった・・？なんかおかしい。
// これでいいんですよ。5角形とかでも・・

// 定数の仕様が独特なので、疑似的に定数を使うプログラムにしてある（forループ内で別の変数を増やすなど）。
// breakとcontinueを駆使した若干いびつな形になってるのだけど。

// 例によってlengthではなくpow(, 2.0)を使った方がいいかも。平方根を取る必要性がないので。
let fs =
"precision mediump float;" +
"uniform vec2 resolution;" +
"uniform float fc;" +
"uniform vec3 color_1;" +
"uniform vec3 color_2;" +
"uniform float alpha;" +
"uniform float angle_n;" +
"const int ITERATIONS = 64;" +
"const float PI = 3.14159;" +
"vec2 inversion(vec2 q, float r, float c){" +
"  float factor = pow(r, 2.0) / (pow(q.x - c, 2.0) + pow(q.y, 2.0));" +
"  return vec2(c, 0.0) + (vec2(q.x - c, q.y) * factor);" +
"}" +
"vec2 sltf(vec2 z, float a, float b, float c, float d){" +
"  vec2 w = vec2((a * d + b * c) * z.x + (a * c) * (z.x * z.x + z.y * z.y) + b * d, z.y);" +
"  return w / (pow(c * z.x + d, 2.0) + pow(c * z.y, 2.0));" +
"}" +
"vec2 poincare_to_half(vec2 p){" +
"  float norm = pow(p.x, 2.0) + pow(p.y, 2.0);" +
"  return vec2(-2.0 * p.y, (1.0 - norm)) / (1.0 - 2.0 * p.x + norm);" +
"}" +
"float reflection(){" +
"  float time = 300.0 - abs(300.0 - mod(fc, 600.0));" +
"  float scale = 0.5 + (time * time / 300.0);" +
"  float psi_plus;" +
"  float psi_minus;" +
"  float b1, b2;" +
"  float c[9];" +
"  float radius[9];" +
"  float k = 0.0;" +
"  for(int index = 0; index < 9; index++){" +
"    psi_plus = ((2.0 * PI * k / angle_n) + alpha) / 2.0;" +
"    psi_minus = ((2.0 * PI * k / angle_n) - alpha) / 2.0;" +
"    b1 = -1.0 / tan(psi_plus);" +
"    b2 = -1.0 / tan(psi_minus);" +
"    c[index] = ((b1 + b2) / 2.0) * scale;" +
"    radius[index] = (abs(b1 - b2) / 2.0) * scale;" +
"    k += 1.0;" +
"    if(k == angle_n){ break; }" +
"  }" +
"  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);" +
"  if(pow(p.x, 2.0) + pow(p.y, 2.0) > 0.999){ return 2.0; }" +
"  p = poincare_to_half(p);" +
"  float count = 0.0;" +
"  bool arrived = false;" +
"  float diff = time * PI / 300.0;" +
"  p = sltf(p, cos(diff), sin(diff), -sin(diff), cos(diff));" +
"  for(int i = 0; i < ITERATIONS; i++){" +
"    if(length(p - vec2(c[0], 0.0)) > radius[0]){" +
"      p = inversion(p, radius[0], c[0]);" +
"      count += 1.0;" +
"    }else{" +
"      k = 0.0;" +
"      for(int j = 1; j < 9; j++){" +
"        if(length(p - vec2(c[j], 0.0)) < radius[j]){" +
"          p = inversion(p, radius[j], c[j]);" +
"          count += 1.0;" +
"          break;" +
"        }" +
"        k += 1.0;" +
"        if(k == angle_n - 1.0){ break; }" +
"      }" +
"      if(k < angle_n - 1.0){ continue; }else{ arrived = true; }" +
"    }" +
"    if(arrived){ break; }" +
"  }" +
"  return mod(count, 2.0);" +
"}" +
"void main(){" +
"  float ref = reflection();" +
"  gl_FragColor = vec4((1.0 - step(2.0, ref)) * ((1.0 - ref) * color_1 + ref * color_2), 1.0);" +
"}";

// DEGREESじゃうまくいくわけないやんなーーーーー（こらっ）
function setup(){
  createCanvas(768, 384, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  myShader.setUniform('resolution', [width, height]);
  let ci = randomInt(11);
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  // 位置計算に必要なalphaの値を放り込む
  // ここの値mは1/m + 2/n < 1を満たすように決まる（nは角の数）
  // getAlpha(n:角の数, m:内角がPI/m)という形
  myShader.setUniform('alpha', getAlpha(3, 4));
  myShader.setUniform('angle_n', 3); // 正5角形
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('fc', frameCount);
  quad(-1, 1, 1, 1, 1, -1, -1, -1);
}

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

function mouseClicked(){
  // クリックで色が変わるよ
  let ci_diff = randomInt(10) + 1; // colorIndexの変化(1～10).
  ci = (ci + ci_diff) % 11;
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  // パターンも、変わるよ
  let n = 3 + randomInt(4);
  let min_m = Math.floor(n / (n - 2)) + 1;
  let new_m = min_m + randomInt(14 - min_m);
  myShader.setUniform('alpha', getAlpha(n, new_m));
  myShader.setUniform('angle_n', n);
}

// alphaを出す
function getAlpha(n, m){
  let cosine_alpha = Math.sqrt((cos(2 * PI / n) + cos(PI / m)) / (1 + cos(PI / m)));
  return acos(cosine_alpha);
}

// 0～n-1のどれかを出す
function randomInt(n){
  return Math.floor(random(n));
}

function keyTyped(){
  if(key === 'q'){ noLoop(); }
  else if(key === 'p'){ loop(); }
}
