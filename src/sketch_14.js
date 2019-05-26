// キューブの取り扱いに関する実験
'use strict';

let myShader;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"uniform mat3 rotate_x;" +
"uniform mat3 rotate_y;" +
"uniform mat3 rotate_z;" +
"varying vec3 v;" +
"void main(){" +
"  gl_Position = vec4(rotate_z * rotate_y * rotate_x * aPosition, 1.0);" +
"  v = aPosition + vec3(0.5, 0.5, 0.5);" +
"}";

// あーーーこういうことね。varying使わないと彩色どころじゃないってわけか。なるぅ。varying前提。わかりました。ヨシ！
// あとはテクスチャ座標使えばサイコロ出来そうね。

let fs =
"precision mediump float;" +
"varying vec3 v;" +
"void main(){" +
"  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  angleMode(DEGREES);
  myShader = createShader(vs, fs);
  shader(myShader);
  colorMode(HSB, 100);
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform("rotate_x", make_rotate(0, frameCount * 0.8 - 40));
  myShader.setUniform("rotate_y", make_rotate(1, frameCount * 1.5 + 60));
  myShader.setUniform("rotate_z", make_rotate(2, frameCount));
  box();
  //sphere();
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
  // 拡大縮小
  return [sx, 0, 0, 0, sy, 0, 0, 0, sz];
}
