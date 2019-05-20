// reference: https://codepen.io/dollee/pen/XEdqyM (p5.js shader template.)

'use strict';
let program;
let isLoop = true;

function setup(){
  createCanvas(640, 480, 'webgl');
  let gl = this.canvas.getContext('webgl');
  colorMode(HSB, 100);
  rectMode(CENTER);
  angleMode(DEGREES);
  stroke(0);
  program = createShader(vert, frag);
  noLoop();
  console.log(program);
}

function draw(){
  shader(program);
  background(70, 30, 100);
  program.setUniform('u_resolution', [width, height]);
  program.setUniform('u_time', millis() / 1000);
  rect(0, 0, width, height);
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
precision mediump float;
#endif

uniform float u_time;
uniform vec2  u_resolution;

const float ITERATIONS = 32.0; // 繰り返し回数の上限

float reflection_2(){
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  // 反射行列の計算（三角形）
  mat2 ref0 = mat2(1.0, 0.0, 0.0, -1.0);
  mat2 ref1 = mat2(-0.5, 1.732 / 2.0, 1.732 / 2.0, 0.5);
  vec2 diff = vec2(0.3, 0.1732);
  mat2 ref2 = mat2(-0.5, -1.732 / 2.0, -1.732 / 2.0, 0.5);
  float count = 0.0;
  bool b = false;
  for(float i = 0.0; i < ITERATIONS; i += 1.0){
    if(p.y < 0.0){
      p = ref0 * p;
      count += 1.0;
    }else if(p.y > 1.732 * p.x){
      p = ref1 * p;
      count += 1.0;
    }else if(p.y > 0.2 * 1.732 - 1.732 * p.x){
      p = diff + ref2 * p;
      count += 1.0;
    }else{
      b = true;
    }
    if(b){ break; }
  }
  return mod(count, 6.0) / 8.0;
}

void main(void){
  float ref = reflection_2();
  gl_FragColor = vec4(ref * 0.3, ref * 0.3, ref + 0.25, 1.0);
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
