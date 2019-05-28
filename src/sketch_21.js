// カスタムシェーダーによる描画の基本
// triangleのデフォルトは(0, 0), (0, 1), (1, 0)を頂点とするもの。
// 今回は行列で遊んでみましょう的な。
'use strict';
let myShader;
let m;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"uniform mat4 mat;" +
"varying vec3 vPos;" +
"void main(){" +
"  gl_Position = mat * vec4(aPosition, 1.0);" +
"  vPos = aPosition;" +
"}";


let fs =
"precision mediump float;" +
"varying vec3 vPos;" +
"void main(){" +
"  gl_FragColor = vec4(vPos.y, 0.0, 1.0, 1.0);" +
"}"

function setup(){
  createCanvas(512, 512, WEBGL);
  colorMode(HSB, 100);
  angleMode(DEGREES);
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
  m = new m4();
}

function draw(){
  background(70, 30, 100);
  //m.rot_z(60);
  //m.mul(scl(0.5, 1, 1));
  m.par(sin(frameCount * 2), cos(frameCount * 3), sin(frameCount));
  myShader.setUniform("mat", m.e);
  triangle(0, 0, 0, 0, 0, 0);
}

// 行列の成分から行列を作る操作が0, 1, 2, 3が縦の一列目、4, 5, 6, 7が縦の二列目、という感じなので、
// それに応じた掛け算の処理にしないとバグる。
// あ・・行列の掛け算、逆の方がよさそうな・・んー。A.mul(B)がABになる操作だとBが作用してからAが作用するの。
// BAを作る操作にすればAが先に作用するんだけど。ここら辺は難しいね。
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
    if(a === 0 && b === 0){
      if(c < 0){ angle = -angle; }
      this.rot_z(angle); return;
    }
  }
  par(dx, dy, dz){
    // 行列の内容を平行移動(dx, dy, dz)にする
    this.init();
    this.e[12] = dx, this.e[13] = dy, this.e[14] = dz;
  }
}
function rot_x(angle){
  // x軸周りの回転
  let m = new m4();
  m.e[5] = cos(angle), m.e[9] = -sin(angle);
  m.e[6] = sin(angle), m.e[10] = cos(angle);
  return m;
}
function rot_y(angle){
  // y軸周りの回転
  let m = new m4();
  m.e[0] = cos(angle), m.e[8] = sin(angle);
  m.e[2] = -sin(angle), m.e[10] = cos(angle);
  return m;
}
function rot_z(angle){
  // z軸周りの回転
  let m = new m4();
  m.e[0] = cos(angle), m.e[4] = -sin(angle);
  m.e[1] = sin(angle), m.e[5] = cos(angle);
  return m;
}
function scl(sx, sy, sz){
  // 拡大縮小
  let m = new m4();
  m.e[0] = sx, m.e[5] = sy, m.e[10] = sz;
  return m;
}

// 軸周りの回転の原理。
// v = (a, b, c), p = (x, y, z)とする。
// まずR_zを使ってvをxz平面内のx軸正方向に持っていく。
// 次にR_yを使ってvをz軸正方向にする。
// いっしょに回してきたpをz軸正方向の回転で動かす。
// 施したR_yとR_zの逆回転を施して完了させる。
function rot(a, b, c, angle){
  // (x, y, z)周りにangle回転する行列・・
  let m = new m4();
  if(a === 0 && b === 0){
    if(c < 0){ return rot_z(-angle); }
    return rot_z(angle);
  }
  let phi = acos(c / Math.sqrt(a * a + b * b + c * c));
  let psi = atan2(b, a);
  m.mul(rot_z(psi));
  m.mul(rot_y(-phi));
  m.mul(rot_z(angle));
  m.mul(rot_y(phi));
  m.mul(rot_z(-psi));
  return m;
}
function par(dx, dy, dz){
  // (dx, dy, dz)平行移動
  let m = new m4();
  m.e[12] = dx, m.e[13] = dy, m.e[14] = dz;
  return m;
}

function keyTyped(){
  if(key === 'q'){
    noLoop();
  }else if(key === 'w'){
    loop();
  }
}
