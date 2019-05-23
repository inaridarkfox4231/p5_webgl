// きつねー

'use strict';
let myShader;
let isLoop = true;
let poincare = false; // trueのときポアンカレモード

// 色の配列
let ci = 0; // colorIndex.
let hArray = [0.65, 0.00, 0.38, 0.05, 0.55, 0.83, 0.06, 0.59, 0.20, 0.00, 0.94];
let sArray = [0.69, 1.00, 0.80, 0.58, 1.00, 0.55, 0.91, 0.40, 0.88, 0.00, 0.73];
let vArray = [0.80, 1.00, 0.69, 0.67, 0.90, 0.64, 1.00, 0.74, 0.80, 0.49, 1.00];
let sDiffArray = [-0.32, -0.51, -0.41, -0.34, -0.59, -0.35, -0.41, -0.26, -0.37, 0.00, -0.33];
let vDiffArray = [0.07, 0.00, 0.22, 0.18, 0.10, 0.21, 0.00, 0.16, 0.14, 0.30, 0.00];

let allImg = new Array(5);
let img = new Array(3);
let foxImg;

// バーテックスシェーダ
let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"varying vec2 vTextureCoord;" +
"uniform vec2 loc;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"  vTextureCoord = vec2((aPosition.x - loc.x) * (384.0 / 200.0), 1.0 - (aPosition.y - loc.y) * (240.0 / 80.0));" +
"}";

// フラグメントシェーダ

// 狐アイコンのやつをuniformで送っておいて、それに対してtextureであれこれみたいな感じ。
let fs =
"precision mediump float;" +
"uniform vec2 resolution;" +
"uniform float fc;" +
"uniform vec3 color_1;" +
"uniform vec3 color_2;" +
"uniform float center[2];" +
"uniform float radius[2];" +
"uniform float dists[3];" +
"uniform sampler2D button;" +
"uniform sampler2D foxImg;" +
"varying vec2 vTextureCoord;" +
"uniform float mode;" +
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
"  return vec2(-2.0 * p.y, (1.0 - pow(p.x, 2.0) - pow(p.y, 2.0))) / (pow(p.x - 1.0, 2.0) + pow(p.y, 2.0));" +
"}" +
"float calc_dist(float x, float y, float c, float r){" +
"  vec3 temp = vec3(pow(x - c, 2.0), pow(y, 2.0), pow(r, 2.0));" +
"  float g = sqrt(pow(temp[0] - temp[1] - temp[2], 2.0) + 4.0 * temp[0] * temp[1]) - abs(temp[0] + temp[1] - temp[2]);" +
"  return log(2.0 * r * y / g);" +
"}" +
"float getNorm(vec2 p){ return pow(p.x, 2.0) + pow(p.y, 2.0); }" +
"vec3 reflection_3(){" +
"  float time = 300.0 - abs(300.0 - mod(fc, 600.0));" +
"  float r = 0.5 + (time * time / 300.0);" +
"  float a = center[0] * r;" +
"  float b = center[1] * r;" +
"  float s = radius[0] * r;" +
"  float t = radius[1] * r;" +
"  float count = 0.0;" +
"  bool arrived = false;" +
"  vec2 p = ((gl_FragCoord.xy + vec2(0.0, -96.0)) * 2.0 - resolution) / min(resolution.x, resolution.y);" +
"  float norm = getNorm(p);" +
"  if(mode < 0.5){" +
"    p = p + vec2(0.0, 1.0);" +
"  }else{" +
"    if(norm > 0.999){ return vec3(-1.0, -1.0, 0.0); }" +
"    p = poincare_to_half(p);" +
"  }" +
"  float diff = time * PI / 300.0;" +
"  p = sltf(p, cos(diff), sin(diff), -sin(diff), cos(diff));" +
"  float border_0 = pow(r, 2.0), border_1 = (s - a) * (s + a), border_2 = (t - b) * (t + b);" +
"  for(int i = 0; i < ITERATIONS; i++){" +
"    norm = getNorm(p);" +
"    if(norm < border_0){" +
"      p = inversion(p, r, 0.0);" +
"      count += 1.0;" +
"    }else if(norm - 2.0 * p.x * a > border_1){" +
"      p = inversion(p, s, a);" +
"      count += 1.0;" +
"    }else if(norm - 2.0 * p.x * b > border_2){" +
"      p = inversion(p, t, b);" +
"      count += 1.0;" +
"    }else{" +
"      arrived = true;" +
"    }" +
"    if(arrived){ break; }" +
"  }" +
"  p = p / r;" +
"  float e_0 = calc_dist(p.x, p.y, center[1], radius[1]) / dists[0];" +
"  float e_1 = calc_dist(p.x, p.y, center[0], radius[0]) / dists[1];" +
"  float e_2 = calc_dist(p.x, p.y, 0.0, 1.0) / dists[2];" +
"  return vec3((2.0 * e_0 + e_2 * (e_1 - e_0)) / (2.0 * (e_0 + e_1)), 1.0 - e_2, mod(count, 2.0));" +
"}" +
"void main(){" +
"  if(mode < 1.0){" +
"    vec3 vPos = reflection_3();" +
"    if(vPos.x < 0.0){" +
"      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);" +
"    }else{" +
"      vec4 color = texture2D(foxImg, vPos.xy);" +
"      if(color.w < 1.0){" +
"        gl_FragColor = vec4(((1.0 - vPos.z) * color_1 + vPos.z * color_2), 1.0);" +
"      }else{" +
"        gl_FragColor = color;" +
"      }" +
"    }" +
"  }else{" +
"    gl_FragColor = texture2D(button, vTextureCoord);" +
"  }" +
"}";

// 0.00, 0.10, 0.17, 0.35, 0.52, 0.64, 0.70, 0.80; ですね。

function preload(){
  for(let i = 0; i < 5; i++){
    allImg[i] = loadImage("./assets/text" + i + ".png");
  }
  for(let i = 0; i < 3; i++){ img[i] = allImg[i]; }
  foxImg = loadImage("./assets/kitune.PNG");
}

function setup(){
  createCanvas(768, 480, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  myShader.setUniform('resolution', [768, 384]);
  ci = randomInt(11);
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  setParameter(); // こんなかんじで。
  myShader.setUniform('foxImg', foxImg); // 狐アイコン画像の登録
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('fc', frameCount);
  // タイリング描画モード(0.0で通常、0.5でポアンカレ、的な？)
  if(!poincare){
    myShader.setUniform('mode', 0.0); // 上半平面モード
  }else{
    myShader.setUniform('mode', 0.5); // ポアンカレモデルモード
  }
  quad(-1, 1, -1, -0.6, 1, -0.6, 1, 1);
  // ボタン描画モード
  myShader.setUniform('mode', 1.0);
  createButton(-360.0, -232.0, 200.0, 80.0, 0);
  createButton(-100.0, -232.0, 200.0, 80.0, 1);
  createButton(160.0, -232.0, 200.0, 80.0, 2);
}

// dx, dy: ピクセルベースでの中心からのボタンの左下位置のずれ（右、上が正方向）
// button_x, button_y: ボタンのよこはばとたてはば
function createButton(dx, dy, button_x, button_y, index){
  // 中心からピクセルで(dx, dy)の位置を右下とするrect状の横幅button_x, 縦幅button_yのボタンを描画する
  let loc_x = 2 * dx / width;
  let loc_y = 2 * dy / height;
  myShader.setUniform('loc', [loc_x, loc_y]);
  myShader.setUniform('button', img[index]);
  quad(loc_x,                        loc_y,
       loc_x + 2 * button_x / width, loc_y,
       loc_x + 2 * button_x / width, 2 * button_y / height + loc_y,
       loc_x,                        2 * button_y / height + loc_y
     );
}

// m, n, lを与えてそれに応じてfs側の中心や半径のパラメータを用意する関数
// 2になりうるのはlのみ（mが最大という設定）なので、（というのもmやnが2になるとまずいので、）
// roofはmax(n, l)とのmaxを取っている。
function setParameter(){
  let l = 2 + randomInt(5); // lは2~6のどれか
  let n = 3 + randomInt(4); // nは3~6のどれか
  let roof = max(Math.floor((l * n) / (l * n - l - n)) + 1, max(n, l)); // roofはmのとりうる値の最小値
  let m = roof + randomInt(7 - roof); // roof~6のどれか
  // ・・・
  //l = 4, n = 4, m = 4;
  // ・・・・・・
  let theta = PI / m, phi = PI / n, psi = PI / l;
  let k = calc_ratio(theta, phi, psi); // あっちのcalc_ratioを移植したもの
  let r = 1.0; // rは固定する。
  let y = (k + sqrt(k * k - 1.0)) * r; // r倍する。
  let a = -(cos(phi) + cos(theta) * cos(psi)) / (cos(theta) * sin(psi)) * y;
  let b = (cos(theta) + cos(phi) * cos(psi)) / (cos(phi) * sin(psi)) * y;
  myShader.setUniform("center", [a, b]);
  let s = k * y / cos(theta);
  let t = k * y / cos(phi);
  myShader.setUniform("radius", [s, t]);
  // 3つの頂点座標を計算
  let verts = calc_vert(a, s, b, t, r, y); // 6つの成分を取得。(ax, ay, bx, by, cx, cy)
  // 対辺との距離を計算
  let dists = [calc_dist(verts[0], verts[1], b, t), calc_dist(verts[2], verts[3], a, s), calc_dist(verts[4], verts[5], 0, r)];
  // vec3形式で送る
  myShader.setUniform("dists", dists);
  console.log("(%d, %d, %d)", m, n, l);
  console.log("(%f, %f, %f)", dists[0], dists[1], dists[2]);
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

// theta, phi, psiに対応する頂点の座標を計算します
function calc_vert(a, s, b, t, r, y){
  let x1 = (r * r + (a - s) * (a + s)) / (2 * a);
  let y1 = Math.sqrt((r - x1) * (r + x1));
  let x2 = (r * r + (b - t) * (b + t)) / (2 * b);
  let y2 = Math.sqrt((r - x2) * (r + x2));
  let x3 = 0;
  let y3 = y;
  return [x1, y1, x2, y2, x3, y3];
}

// (x, y)と円（というか直線）(c, r)の双曲距離を計算します
function calc_dist(x, y, c, r){
  let temp1 = (x - c) * (x - c);
  let temp2 = y * y;
  let temp3 = r * r;
  let g = Math.sqrt(Math.pow(temp1 - temp2 - temp3, 2) + 4 * temp1 * temp2) - abs(temp1 + temp2 - temp3);
  return Math.log(2 * r * y / g);
}

function mouseClicked(){
  // ボタンごとに挙動を変える
  if(mouseY < 392 || mouseY > 472){ return; }
  if(mouseX > 24 && mouseX < 224){
    // ストップ/スタート
    if(isLoop){ noLoop(); isLoop = false; img[0] = allImg[3]; }
    else{ loop(); isLoop = true; img[0] = allImg[0]; }
  }else if(mouseX > 284 && mouseX < 484){
    // ポーズ中はパターン変更禁止
    if(!isLoop){ return; }
    // クリックで色が変わるよ
    let ci_diff = randomInt(10) + 1; // colorIndexの変化(1～10).
    ci = (ci + ci_diff) % 11;
    myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
    myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
    // パターンも、変わるよ(mが最大にする)
    // 2になるのはたかだか1つだけ。mやnが2にならないようにこの条件を付ける。
    setParameter();
  }else if(mouseX > 544 && mouseX < 744){
    // ポーズ中はパターン変更禁止
    if(!isLoop){ return; }
    // ポアンカレ円板に移行する。また今度。
    if(!poincare){ poincare = true; img[2] = allImg[4]; }
    else{ poincare = false; img[2] = allImg[2]; }
    return;
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
