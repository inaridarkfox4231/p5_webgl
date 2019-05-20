'use strict';
let program;
let custom_width;
let custom_height;
let isLoop = true;

// R,G,Bの配列（色で長さを表現するのに使う）（立方体の辺の上を移動する感じ）
// 使い方：iに0~120を入れるとそれに応じたRGBが返ってくる。
let col_R = new Array(), col_G = new Array(), col_B = new Array();
for(let i = 0; i <= 100; i++){
  col_R.push(0), col_G.push(0), col_B.push(0);
}
col_R[0] = 215, col_G[0] = 15, col_B[0] = 205;
for(let i = 1; i <= 20; i++){
  col_R[i] = 225 - 10 * i,    col_G[i] = 15,                col_B[i] = 215;
  col_R[i + 20] = 15,         col_G[i + 20] = 5 + 10 * i,   col_B[i + 20] = 215;
  col_R[i + 40] = 15,         col_G[i + 40] = 215,          col_B[i + 40] = 225 - 10 * i;
  col_R[i + 60] = 5 + 10 * i, col_G[i + 60] = 215,          col_B[i + 60] = 15;
  col_R[i + 80] = 215,        col_G[i + 80] = 225 - 10 * i, col_B[i + 80] = 15;
  col_R[i + 100] = 215,       col_G[i + 100] = 15,          col_B[i + 100] = 5 + 10 * i;
}

function setup(){
  createCanvas(640, 480, 'webgl');
  colorMode(HSB, 100);
  rectMode(CENTER);
  angleMode(DEGREES);
  noStroke();
  program = createShader(vert, frag);
}

function draw(){
  shader(program);
  background(70, 30, 100);
  custom_width = 200 + 100 * sin(frameCount);
  custom_height = 200 + 100 * cos(frameCount);
  program.setUniform('resolution', [custom_width, custom_height]);
  program.setUniform('u_time', millis() / 20);
  program.setUniform('u_mouse', [mouseX, mouseY]);
  let i = Math.floor((frameCount % 600) / 5);
  let r = col_R[i] / 255;
  let g = col_G[i] / 255;
  let b = col_B[i] / 255;
  program.setUniform('myColor', [r, g, b]);
  rect(0, 0, custom_width, custom_height);
}

let vert = `
    #ifdef GL_ES
      precision highp float;
      precision highp int;
    #endif
    attribute vec3 aPosition;
    uniform mat4 uModelViewMatrix; // これは・・
    uniform mat4 uProjectionMatrix; // これがないと、rectの中に入らないみたい。
    // なぜだ・・・
    // よくわからないが、これらの行列を掛けることにより、きちんと全画面になるようだな・・
    void main(void){
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
      //gl_Position = mvpMatrix * vec4(aPosition, 1.0);
    }
`;

let frag = `
    #ifdef GL_ES
    precision highp float;
    #endif
    uniform vec2 resolution; // 表示する幅
    uniform float u_time; // 時間
    uniform vec2 u_mouse; // マウスの位置
    uniform vec3 myColor; // 色情報（独自）
    // jsの方で色々変数とか定義したものをこっちに送れるみたいだ？？
    void main(void){
      vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / resolution;
      gl_FragColor = vec4(myColor, 1.0);
    }
`;

function mouseClicked(){
  // クリックで止めたり動かしたり
  if(isLoop){
    noLoop();
    isLoop = false;
  }else{
    loop();
    isLoop = true;
  }
}
