// これで通るみたい。理由が謎だな・・・・
'use strict';

let varying = 'precision highp float;';
let isLoop = true;
let startTime;
let time = 0.0;
let tempTime = 0.0;

// the vertex shader is called for each vertex
let vs =
  varying +
  'attribute vec3 aPosition;' +
	'mat3 m = mat3(' +
	' 1.0, 0.0, 0.0,' +
	' 0.0, 1.0, 0.0,' +
	' 0.0, 0.0, 1.0' +
	');' +
  'void main(){' +
  'gl_Position = vec4(m * aPosition, 1.0);' +
  '}';

// the fragment shader is called for each pixel
let fs =
  varying +
  'uniform vec2  u_resolution;' +
  'uniform float u_time;' +
  'const float ITERATIONS = 32.0;' +
	'const float PI = 3.14159;' +
  'float reflection_2(){' +
  'vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);' +
  'mat2 ref0 = mat2(1.0, 0.0, 0.0, -1.0);' + // 反射に使う行列を用意する
  'mat2 ref1 = mat2(-0.5, 1.732 / 2.0, 1.732 / 2.0, 0.5);' +
  'vec2 diff = vec2(0.3, 0.1732);' +
  'mat2 ref2 = mat2(-0.5, -1.732 / 2.0, -1.732 / 2.0, 0.5);' +
	'float diffAngle = u_time * PI / 3.0;' +
	'mat2 rotationMat = mat2(cos(diffAngle), -sin(diffAngle), sin(diffAngle), cos(diffAngle));' +
	'p = rotationMat * p;' +  // pを回転させる
  'float count = 0.0;' +
  'bool b = false;' +
  'for(float i = 0.0; i < ITERATIONS; i += 1.0){' +
    'if(p.y < 0.0){' +
      'p = ref0 * p;' +
      'count += 1.0;' +
    '}else if(p.y > 1.732 * p.x){' +
      'p = ref1 * p;' +
      'count += 1.0;' +
    '}else if(p.y > 0.2 * 1.732 - 1.732 * p.x){' +
      'p = diff + ref2 * p;' +
      'count += 1.0;' +
    '}else{' +
      'b = true;' + // 基本領域に属した時の位置によって色を変えたりしたら面白いかもしれない
    '}' +
    'if(b){ break; }' +
  '}' +
  'return mod(count, 6.0) / 8.0;' +
'}' +

'void main(void){' +
  'float ref = reflection_2();' +
	'float diff = 0.55 + 0.25 * sin(u_time * PI / 3.0);' +
  'gl_FragColor = vec4(ref * 0.3 + diff, ref * 0.8 - diff, ref + 0.25, 1.0);' +
'}';

let program;

function setup() {
  createCanvas(640, 480, WEBGL);
  colorMode(HSB, 100);
  program = createShader(vs, fs);
  shader(program);
  noStroke();
  startTime = new Date().getTime();
}

function draw() {
  if(!isLoop){ return; } // これがないと面倒なことになるよ。
  background(70, 30, 100);
  program.setUniform('u_resolution', [width, height]);
  // 時間管理
  time = (new Date().getTime() - startTime) * 0.001; // ミリ秒だと大きすぎるので1秒に1ずつ増えるように修正
	program.setUniform('u_time', time + tempTime);
  // このquadで1以下の数字を指定することと、あっちのバーテックスでの処理の仕方が
  // どうもリンクしてるみたいで、それが原因でこっちで1以下の数値を入れることになるみたい。
  // でなきゃめっちゃちっさくなっちゃうから絶対そこらへんに原因があるんだろう。
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
  //rect(0, 0, 1, 1);
}

function mouseClicked(){
  // クリックで止めたり動かしたり
  if(isLoop){
    noLoop();
    isLoop = false;
    tempTime += time;
  }else{
    loop();
    isLoop = true;
    startTime = new Date().getTime();
  }
}
