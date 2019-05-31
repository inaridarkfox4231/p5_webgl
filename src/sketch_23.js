// 点とか線とかいろいろ
// 何がしたいんだっけ・・・・・？
'use strict';

let myShader;
let dft;
let rot;
let move;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"uniform mat4 dft;" +
"uniform mat4 rot;" +
"uniform mat4 move;" +
"varying vec3 vPos;" +
"void main(){" +
"  gl_Position = move * rot * dft * vec4(aPosition, 1.0);" +
"  vPos = aPosition;" +
"}";

let fs =
"precision mediump float;" +
"varying vec3 vPos;" +
"uniform vec3 color;" +
"void main(){" +
"  gl_FragColor = vec4(color, 1.0);" +
"}";

function setup(){
  createCanvas(600, 600, WEBGL);
  colorMode(HSB, 100);
  angleMode(DEGREES);
  myShader = createShader(vs, fs);
  shader(myShader);
  dft = new mat4();
  rot = new m4();
  move = new m4();
  dft.par(-0.5, -0.5, 0.0); // 平行移動して中心に持ってくる
  dft.scl(0.05, 0.05, 1.0); // 大きさを1/10にする
  myShader.setUniform("dft", dft.e);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  rot.rot_z(frameCount * 2);
  myShader.setUniform("rot", rot.e);
  let dx, dy;
  for(let i = 0; i < 4; i++){
    for(let k = (frameCount % 20) / 200; k < 1.5; k += 0.1){
      dx = cos(90 * i + 360 * k);
      dy = sin(90 * i + 360 * k);
      move.par(dx * k, dy * k, 0.0);
      myShader.setUniform("move", move.e);
      myShader.setUniform("color", [i * 0.15, i * 0.15, 1.0]);
      rect(0, 0, 0, 0);
    }
  }
  for(let i = 0; i < 4; i++){
    for(let k = (frameCount % 20) / 200; k < 1.5; k += 0.1){
      dx = cos(90 * i - 360 * k);
      dy = sin(90 * i - 360 * k);
      move.par(dx * k, dy * k, 0.0);
      myShader.setUniform("move", move.e);
      myShader.setUniform("color", [1.0, i * 0.15, i * 0.15]);
      rect(0, 0, 0, 0);
    }
  }
}
/*
for(let i = -6; i <= 6; i++){
  for(let k = -6; k <= 6; k++){
    move.par(i * 0.15, k * 0.15, 0);
    myShader.setUniform("move", move.e);
    rect(0, 0, 0, 0);
  }
}

let dx, dy;
for(let i = 0; i < 24; i++){
  dx = cos(15 * i);
  dy = sin(15 * i);
  move.par(dx * 0.4 * (1 - cos(frameCount * 4)), dy * 0.4 * (1 - cos(frameCount * 4)), 0);
  myShader.setUniform("move", move.e);
  rect(0, 0, 0, 0);
}
*/

// まず平行移動して原点中心にする
// サイズを1/10にする
// ここまでがデフォルトなので行列の形で保持しておく
// moveに使うのは別の行列でこれに加工してたとえば回転とかさせる感じ（回転部分を毎フレーム更新）
// 回転した後上方向に平行移動とか？それも組み合わせて・・

// 改良して、たとえばrot_xなら左からrot_xに相当する行列を掛けるようにするとかした方がよさそう。
class m4{
  constructor(){
    this.e = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  init(){
    // 単位行列にする
    for(let i = 0; i < 16; i++){
      if(i % 4 === Math.floor(i / 4)){ this.e[i] = 1; }else{ this.e[i] = 0; };
    }
  }
  add(m){
    // 足し算
    for(let i = 0; i < 16; i++){ this.e[i] += m[i]; }
  }
  sub(m){
    // 引き算
    for(let i = 0; i < 16; i++){ this.e[i] -= m[i]; }
  }
  mul(m){
    // 掛け算
    for(let i = 0; i < 4; i++){
      // iは0行、1行・・（横の列）横の成分を記憶させて・・
      let a = this.e[0 + i], b = this.e[4 + i], c = this.e[8 + i], d = this.e[12 + i];
      for(let k = 0; k < 4; k++){
        // 上からi行目の成分を計算するパート
        this.e[4 * k + i] = a * m.e[4 * k] + b * m.e[4 * k + 1] + c * m.e[4 * k + 2] + d * m.e[4 * k + 3];
      }
    }
  }
  rot_x(angle){
    // 行列の内容をrot_x(angle)にする
    this.init();
    this.e[5] = cos(angle), this.e[9] = -sin(angle);
    this.e[6] = sin(angle), this.e[10] = cos(angle);
  }
  rot_y(angle){
    // 行列の内容をrot_y(angle)にする
    this.init();
    this.e[2] = cos(angle), this.e[10] = -sin(angle);
    this.e[0] = sin(angle), this.e[8] = cos(angle);
  }
  rot_z(angle){
    // 行列の内容をrot_z(angle)にする
    this.init();
    this.e[0] = cos(angle), this.e[4] = -sin(angle);
    this.e[1] = sin(angle), this.e[5] = cos(angle);
  }
  scl(sx, sy, sz){
    // 行列の内容をscl(sx, sy, sz)にする
    this.init();
    this.e[0] = sx, this.e[5] = sy, this.e[10] = sz;
  }
  rot(a, b, c, angle){
    // 行列の内容をrot(a, b, c, angle)にする((a, b, c) != (0, 0, 0)前提)
    this.init();
    let s1 = cos(angle), s2 = sin(angle);
    let norm = Math.sqrt(a * a + b * b + c * c);
    a = a / norm, b = b / norm, c = c / norm;
    this.e[0] = a * a * (1 - s1) + s1;
    this.e[1] = a * b * (1 - s1) + s2 * c;
    this.e[2] = a * c * (1 - s1) - s2 * b;
    this.e[4] = a * b * (1 - s1) - s2 * c;
    this.e[5] = b * b * (1 - s1) + s1;
    this.e[6] = b * c * (1 - s1) + s2 * a;
    this.e[8] = a * c * (1 - s1) + s2 * b;
    this.e[9] = b * c * (1 - s1) - s2 * a;
    this.e[10] = c * c * (1 - s1) + s1;
  }
  par(dx, dy, dz){
    // 行列の内容を平行移動(dx, dy, dz)にする
    this.init();
    this.e[12] = dx, this.e[13] = dy, this.e[14] = dz;
  }
}

class mat4{
  constructor(){
    this.e = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  init(){
    // 単位行列にする
    this.e[0] = 1, this.e[4] = 0, this.e[8] = 0, this.e[12] = 0;
    this.e[1] = 0, this.e[5] = 1, this.e[9] = 0, this.e[13] = 0;
    this.e[2] = 0, this.e[6] = 0, this.e[10] = 1, this.e[14] = 0;
    this.e[3] = 0, this.e[7] = 0, this.e[11] = 0, this.e[15] = 1;
  }
  par(dx, dy, dz){
    // 左から平行移動の行列を掛ける
    for(let i = 0; i < 4; i++){
      this.e[4 * i] += this.e[4 * i + 3] * dx;
      this.e[4 * i + 1] += this.e[4 * i + 3] * dy;
      this.e[4 * i + 2] += this.e[4 * i + 3] * dz;
    }
  }
  rot_x(angle){
    // 左からx軸周りangle回転の行列を掛ける
    let a, b;
    for(let i = 0; i < 4; i++){
      a = this.e[4 * i + 1], b = this.e[4 * i + 2];
      this.e[4 * i + 1] = a * cos(angle) - b * sin(angle);
      this.e[4 * i + 2] = a * sin(angle) + b * cos(angle);
    }
  }
  rot_y(angle){
    // 左からy軸周りangle回転の行列を掛ける
    let a, b;
    for(let i = 0; i < 4; i++){
      a = this.e[4 * i], b = this.e[4 * i + 2];
      this.e[4 * i] = a * cos(angle) + b * sin(angle);
      this.e[4 * i + 2] = -a * sin(angle) + b * cos(angle);
    }
  }
  rot_z(angle){
    // 左からz軸周りangle回転の行列を掛ける
    let a, b;
    for(let i = 0; i < 4; i++){
      a = this.e[4 * i], b = this.e[4 * i + 1];
      this.e[4 * i] = a * cos(angle) - b * sin(angle);
      this.e[4 * i + 1] = a * sin(angle) + b * cos(angle);
    }
  }
  rot(a, b, c, angle){
    // 左から(a, b, c)軸周りangle回転の行列を掛ける

  }
  scl(sx, sy, sz){
    for(let i = 0; i < 4; i++){
      this.e[4 * i] *= sx;
      this.e[4 * i + 1] *= sy;
      this.e[4 * i + 2] *= sz;
    }
  }
}

function keyTyped(){
  if(key === 'q'){
    noLoop();
  }else if(key === 'w'){
    loop();
  }
}
