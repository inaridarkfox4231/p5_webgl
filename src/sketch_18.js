// かねてからやりたかった、回転による敷き詰めを行う。
// 辺の中点を求め、それに対する回転。円を使って区切る。

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

// バーテックスシェーダ
// 普通に情報を渡すだけでいい
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
// 今回はこっちだけいじる。
// pはx:-1.0～1.0,y:0.0～2.0の範囲で。

// sltfはSL2(R)による一次分数変換で、行列[a, b;c, d]によるもの。
// あとは3つの角度とか色とかクリックで変更できるようにしたいわね

// uniform変数
// float fc: フレームカウンタ
// vec3 color_1: 基本領域に偶数回で移るエリアの色。基本的に濃い。
// vec3 color_2: 基本領域に奇数回で移るエリアの色。基本的に薄い。
// vec3 patternArray: 整数の3つ組[m, n, l]で、lが一番小さい。また、1/m + 1/n + 1/l < PIを満たす。
// sampler2D button: ボタンのイメージ。
// float mode: タイリングを描くか、描くとしたらどっちのモードか、あるいはボタンを描くか、の制御。

// mat2 ref0は使ってないので削除
// 必要なのはm, n, lではなくa, b, s, tなので、a, b, s, tをユニフォームにしてm, n, lは外に出す。
// m, n, lを決めるのはjs側で行う。
// さらにいうと、ポアンカレとの切り替えはバーテックスシェーダ側にもモードを用意することで対処できそう。
// varying使って渡す。その方が正統なんじゃないか。
// あと、int使った方が礼儀正しいんじゃないかという気もする。intもちゃんと使えるようにしないと。

// yの計算でr倍してる。rだけはuniform使えないので、送られてきたuniformのa, b, s, tを使う時にr倍すればOK.
// ITERATIONSは整数にしようね。
// p.x * p.x + p.y * p.yは計算を1回にしようね。
let fs =
"precision mediump float;" +
"uniform vec2 resolution;" +
"uniform float fc;" +
"uniform vec3 color_1;" +
"uniform vec3 color_2;" +
"uniform float center[2];" +
"uniform float radius[2];" +
"uniform float R_part[3];" +
"uniform float N_part[3];" +
"uniform sampler2D button;" +
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
"float getNorm(vec2 p){ return pow(p.x, 2.0) + pow(p.y, 2.0); }" +
"float reflection_3(){" +
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
"    if(norm > 0.999){ return 2.0; }" +
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
"  return mod(count, 2.0);" +
"}" +
"void main(){" +
"  if(mode < 1.0){" +
"    float ref = reflection_3();" +
"    gl_FragColor = vec4((1.0 - step(2.0, ref)) * ((1.0 - ref) * color_1 + ref * color_2), 1.0);" +
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
  // myShader.setUniform('patternArray', [4.0, 4.0, 4.0]);
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

// m, nを与えるだけ。
// 1/m + 1/n < 1で、θ+Φ=PI/m, ψ=1/n. θとΦは正なので、必然的にPI/2にはならない。
// 連続的に変化させたら面白そう。θ-Φの直線で回転させる。
// 二つの頂点の座標を計算して中点を求め、あっちの方で回転のメソッドというか関数を用意して、
// inversionの代わりに適用する。なお、円の情報は表と裏を判定するのに必要。
// 色分けに関しては同じ色になってしまうのを避けたいので・・どうするかな、グラデーションでやるか・・んー。それも難しそう。
// 「回数が違うならば隣接しない」の条件さえ満たしていればグラデーションで行ける
// 自由と言われてもピンとこないので下限をとりあえず0.1くらいに設定して0.1以上PI/m - 0.1以下で動かすことにする。
// (PI/3がおよそ1でPI/13がおよそ0.23くらいなので充分妥当な範囲)

function setParameter(){
  let n = 2 + randomInt(12); // 2～13.
  let roof = Math.floor(n / (n - 1)) + 1; // roofはmのとりうる値の最小値。
  let m = roof + randomInt(14 - roof); // roof~13のどれか
  let theta = 0.1 + random(PI / m - 0.2); // 0.1～PI - 0.1くらい
  let phi = PI / m - theta;
  let psi = PI / n;
  let k = calc_ratio(theta, phi, psi); // あっちのcalc_ratioを移植したもの
  let y = k + sqrt(k * k - 1.0); // r倍はfs側で行う
  let a = -(cos(phi) + cos(theta) * cos(psi)) / (cos(theta) * sin(psi)) * y;
  let b = (cos(theta) + cos(phi) * cos(psi)) / (cos(phi) * sin(psi)) * y;
  myShader.setUniform("center", [a, b]);
  let s = k * y / cos(theta);
  let t = k * y / cos(phi);
  myShader.setUniform("radius", [s, t]);
  // 3つの頂点座標を計算
  // A(ax, ay)がθ, B(bx, by)がΦ, C(cx, cy)がψの角に対応する頂点の座標になる。
  let verts = calc_vert(a, s, b, t, 1.0, y); // 6つの成分を取得。(ax, ay, bx, by, cx, cy)
  // 使うのは(ax, ay)と(bx, by)だけど(cx, cy)も計算して中点の座標はすべて送る、
  // いや、使うのは実部とノルムの2乗（x, x^2+y^2）だけだから3つの成分からなる配列2つでいいやね。
  let middle_array = get_middle_array(verts);
  myShader.setUniform("R_part", [middle_array[0], middle_array[2], middle_array[4]]);
  myShader.setUniform("N_part", [middle_array[1], middle_array[3], middle_array[5]]);
  console.log("angle:(%f, %f, %f)", theta, phi, psi);
  console.log("realpart:(%f, %f, %f)", middle_array[0], middle_array[2], middle_array[4]);
  console.log("norm^2(%f, %f, %f)", middle_array[1], middle_array[3], middle_array[5]);
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

function get_middle_array(verts){
  // 順にAB, BC, CAの中点の実部と、あとノルムの2乗を与える。
  let array = [];
  for(let i = 0; i < 5; i += 2){
    let x1 = verts[i];
    let y1 = verts[i + 1];
    let x2 = verts[(i + 2) % 6];
    let y2 = verts[(i + 3) % 6];
    array.push((x1 * y2 + x2 * y1) / (y1 + y2));
    array.push(((Math.pow(x1, 2) + Math.pow(y1, 2)) * y2 + (Math.pow(x2, 2) + Math.pow(y2, 2)) * y1) / (y1 + y2));
  }
  return array;
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
