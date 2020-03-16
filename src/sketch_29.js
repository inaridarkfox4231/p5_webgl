// Cross.

// 十字架くるくる。
// boxが謎・・・
'use strict';

let myShader;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision mediump float;" +
"const float PI = 3.1415926;" +
"uniform float fc;" +
"uniform vec2 resolution;" +
"float box(in vec2 _st, in vec2 _size){" +
"  _size = vec2(0.5) - _size * 0.5;" +
"  vec2 uv = smoothstep(_size, _size + vec2(0.001), _st);" +
"  uv *= smoothstep(_size, _size + vec2(0.001), vec2(1.0) - _st);" +
"  return uv.x * uv.y;" +
"}" +
"float cross(in vec2 _st, float _size){" +
"  return box(_st, vec2(_size, _size / 4.0)) + box(_st, vec2(_size / 4.0, _size));" +
"}" +
"void main(){" +
"  vec2 st = gl_FragCoord.xy * 0.5 / resolution.xy;" + // なんか知らんけどgl_FragCoordの値が2倍になってるんよね。
"  vec3 color = vec3(0.0);" +
"  float t = fc * 0.05;" +
"  vec2 translate = vec2(cos(t), sin(t));" +
"  st += translate * 0.35;" +
"  color = vec3(st.x, st.y, 0.0);" +
"  color += vec3(cross(st, 0.25));" +
"  gl_FragColor = vec4(color, 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}
