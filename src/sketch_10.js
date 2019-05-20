//　双曲タイリング全角版
// y軸上で交わる条件を付けつつ、
// θ+Φ+ψ<πをみたすすべての
// hsbをrgbに変換する関数についてはこちらを参考にした：
// https://www.peko-step.com/tool/hsvrgb.html#ppick3
'use strict';
let myShader;
let isLoop = true;

let colorIndex = 0;
let hArray = [0.65, 0.00, 0.38, 0.05, 0.55, 0.83, 0.06, 0.59, 0.20, 0.00, 0.94];
let sArray = [0.69, 1.00, 0.80, 0.58, 1.00, 0.55, 0.91, 0.40, 0.88, 0.00, 0.73];
let vArray = [0.80, 1.00, 0.69, 0.67, 0.90, 0.64, 1.00, 0.74, 0.80, 0.49, 1.00];
let sDiffArray = [-0.32, -0.51, -0.41, -0.34, -0.59, -0.35, -0.41, -0.26, -0.37, 0.00, -0.33];
let vDiffArray = [0.07, 0.00, 0.22, 0.18, 0.10, 0.21, 0.00, 0.16, 0.14, 0.30, 0.00];

// バーテックスシェーダ
// 普通に情報を渡すだけでいい
let vs =
"precision mediump float;\
 attribute vec3 aPosition;\
 void main(){\
   gl_Position = vec4(aPosition, 1.0);\
}\
";

// フラグメントシェーダ
// 今回はこっちだけいじる。
// pはx:-1.0～1.0,y:0.0～2.0の範囲で。

// sltfはSL2(R)による一次分数変換で、行列[a, b;c, d]によるもの。
// あとは3つの角度とか色とかクリックで変更できるようにしたいわね
let fs =
"precision mediump float;\
 uniform vec2 resolution;\
 uniform float fc;\
 uniform vec3 color_1;\
 uniform vec3 color_2;\
 uniform vec3 patternArray;\
 const float ITERATIONS = 64.0;\
 const float PI = 3.14159;\
 float calc_ratio(float theta, float phi, float psi){\
   return sqrt(pow(cos(theta), 2.0) + pow(cos(phi), 2.0) + 2.0 * cos(theta) * cos(phi) * cos(psi)) / sin(psi);\
 }\
 vec2 inversion(vec2 q, float r, float c){\
   float factor = pow(r, 2.0) / (pow(q.x - c, 2.0) + pow(q.y, 2.0));\
   return vec2(c, 0.0) + (vec2(q.x - c, q.y) * factor);\
 }\
 vec2 sltf(vec2 z, float a, float b, float c, float d){\
   vec2 w = vec2((a * d + b * c) * z.x + (a * c) * (z.x * z.x + z.y * z.y) + b * d, z.y);\
   return w / (pow(c * z.x + d, 2.0) + pow(c * z.y, 2.0));\
 }\
 vec3 hsv_to_rgb(vec3 c){\
   float border = 6.0 * c.x;\
   if(border < 1.0){\
     return vec3(1.0, border * c.y + 1.0 - c.y, 1.0 - c.y) * c.z;\
   }else if(border < 2.0){\
     return vec3((2.0 - border) * c.y + 1.0 - c.y, 1.0, 1.0 - c.y) * c.z;\
   }else if(border < 3.0){\
     return vec3(1.0 - c.y, 1.0, (border - 2.0) * c.y + 1.0 - c.y) * c.z;\
   }else if(border < 4.0){\
     return vec3(1.0 - c.y, (4.0 - border) * c.y + 1.0 - c.y, 1.0) * c.z;\
   }else if(border < 5.0){\
     return vec3((border - 4.0) * c.y + 1.0 - c.y, 1.0 - c.y, 1.0) * c.z;\
   }else{\
     return vec3(1.0, 1.0 - c.y, (6.0 - border) * c.y + 1.0 - c.y) * c.z;\
   }\
 }\
 float reflection_3(){\
   mat2 ref0 = mat2(-1.0, 0.0, 0.0, 1.0);\
   float time = 300.0 - abs(300.0 - mod(fc, 600.0));\
   float r = 0.5 + (time * time / 300.0);\
   float m = patternArray.x;\
   float n = patternArray.y;\
   float l = patternArray.z;\
   float theta = PI / m;\
   float phi = PI / n;\
   float psi = PI / l;\
   float k = calc_ratio(theta, phi, psi);\
   float y = (k + sqrt(k * k - 1.0)) * r;\
   float s = k * y / cos(theta);\
   float t = k * y / cos(phi);\
   float a = -(cos(phi) + cos(theta) * cos(psi)) / (cos(theta) * sin(psi)) * y;\
   float b = (cos(theta) + cos(phi) * cos(psi)) / (cos(phi) * sin(psi)) * y;\
   float count = 0.0;\
   bool arrived = false;\
   vec2 p = vec2(0.0, 1.0) + (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);\
   float diff = time * PI / 300.0;\
   p = sltf(p, cos(diff), sin(diff), -sin(diff), cos(diff));\
   for(float i = 0.0; i < ITERATIONS; i += 1.0){\
     if(length(p) < r){\
       p = inversion(p, r, 0.0);\
       count += 1.0;\
     }else if(length(p - vec2(a, 0.0)) > s){\
       p = inversion(p, s, a);\
       count += 1.0;\
     }else if(length(p - vec2(b, 0.0)) > t){\
       p = inversion(p, t, b);\
       count += 1.0;\
     }else{\
       arrived = true;\
     }\
     if(arrived){ break; }\
   }\
   return mod(count, 2.0);\
 }\
 void main(){\
   float ref = reflection_3();\
   if(ref < 0.5){\
     gl_FragColor = vec4(color_1, 1.0);\
   }else{\
     gl_FragColor = vec4(color_2, 1.0);\
   }\
 }\
";

// 0.00, 0.10, 0.17, 0.35, 0.52, 0.64, 0.70, 0.80; ですね。
// 色についてはもうちょっと研究したい。
// 最終的にはクリックするたびに色とパターンがランダムで変わるようにしたい
// さらにそのポアンカレ円板バージョンを作りたい
// さらに正多角形にも挑戦してみたい
// とりあえず以上です～

function setup(){
  createCanvas(768, 384, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  myShader.setUniform('resolution', [width, height]);
  let ci = colorIndex;
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  myShader.setUniform('patternArray', [13.0, 10.0, 4.0]);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('fc', frameCount);
  quad(-1, 1, 1, 1, 1, -1, -1, -1);
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

// 0～n-1のどれかを出す
function randomInt(n){
  return Math.floor(random(n));
}

function mouseClicked(){
  // クリックで止めたり動かしたり
  /*if(isLoop){
    noLoop();
    isLoop = false;
  }else{
    loop();
    isLoop = true;
  }*/
  // クリックで色が変わるよ
  let ci_diff = randomInt(10) + 1; // colorIndexの変化(1～10).
  colorIndex = (colorIndex + ci_diff) % 11;
  let ci = colorIndex;
  myShader.setUniform('color_1', hsv_to_rgb(hArray[ci], sArray[ci], vArray[ci]));
  myShader.setUniform('color_2', hsv_to_rgb(hArray[ci], sArray[ci] + sDiffArray[ci], vArray[ci] + vDiffArray[ci]));
  // パターンも、変わるよ(mが最大にする)
  // 2になるのはたかだか1つだけ。mやnが2にならないようにこの条件を付ける。
  // mやnが2になると円弧が直線になってしまう0割りのバグが発生する。よって2になる可能性のあるものをlのみとする。
  let l = randomInt(12) + 2; // 2～13のどれか
  let n = randomInt(11) + 3; // 3～13のどれか
  let roof = max((l * n) / (l * n - l - n), 3);
  let m = randomInt(14 - roof) + roof; // roof～13のどれか
  myShader.setUniform('patternArray', [m, n, l]);
  console.log([m, n, l]);
}

function keyTyped(){
  if(key === 'q'){ noLoop(); }
  else if(key === 'p'){ loop(); }
}
