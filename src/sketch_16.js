// ちょっとたくさん計算しないといろいろ厳しそうだ。
// その前に・・ね。

// スフィアの取り扱いに関する実験
'use strict';

let myShader;

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

let fs =
"precision mediump float;" +
"varying vec3 vPosition;" +
"vec2 sphere_to_poincare(vec3 v){" +
"  v.z = max(v.z, -0.999);" +
"  float k = 2.0 * sqrt((1.0 - v.z) / (1.0 + v.z));" +
"  float norm = length(v);" +
"  if(norm < 0.001){ if(v.z > 0.0){ return vec2(0.0); } }" +
"  return ((1.0 - 2.0 / (exp(k) + 1.0)) / norm) * v.xy;" +
"}" +
"vec2 poincare_to_half(vec2 p){" +
"  return vec2(-2.0 * p.y, (1.0 - pow(p.x, 2.0) - pow(p.y, 2.0))) / (pow(p.x - 1.0, 2.0) + pow(p.y, 2.0));" +
"}" +
"void main(){" +
"  vec2 p = sphere_to_poincare(vPosition);" +
"  vec2 q = poincare_to_half(p);" +
"  gl_FragColor = vec4(0.0, 0.0, step(0.0, q.x), 1.0);" +
"}";

function setup(){
  createCanvas(500, 500, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  colorMode(HSB, 100);
  myShader.setUniform("scale", make_scale(0.8, 0.8, 1.0));
}

function draw(){
  background(70, 30, 100);
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
