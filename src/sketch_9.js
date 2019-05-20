//　双曲タイリングやる
// hsbをrgbに変換する関数についてはこちらを参考にした：
//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
'use strict';
let myShader;
let isLoop = true;

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
 const float ITERATIONS = 64.0;\
 const float PI = 3.14159;\
 float calc_ratio(float theta, float phi){\
   return (cos(phi) + sqrt(pow(cos(phi), 2.0) - pow(sin(theta), 2.0))) / pow(sin(theta), 2.0);\
 }\
 vec2 inversion(vec2 q, float r, float c){\
   float factor = pow(r, 2.0) / (pow(q.x - c, 2.0) + pow(q.y, 2.0));\
   return vec2(c, 0.0) + (vec2(q.x - c, q.y) * factor);\
 }\
 vec2 sltf(vec2 z, float a, float b, float c, float d){\
   vec2 w = vec2((a * d + b * c) * z.x + (a * c) * (z.x * z.x + z.y * z.y) + b * d, z.y);\
   return w / (pow(c * z.x + d, 2.0) + pow(c * z.y, 2.0));\
 }\
 float reflection_3(){\
   mat2 ref0 = mat2(-1.0, 0.0, 0.0, 1.0);\
   float t = 300.0 - abs(300.0 - mod(fc, 600.0));\
   float r = 0.3 + (t * t / 300.0);\
   float m = 8.0;\
   float n = 9.0;\
   float theta = PI / m;\
   float phi = PI / n;\
   float count = 0.0;\
   bool arrived = false;\
   float s = calc_ratio(theta, phi) * r;\
   float a = -s * cos(theta);\
   vec2 p = vec2(0.0, 1.0) + (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);\
   float diff = t * PI / 300.0;\
   p = sltf(p, cos(diff), sin(diff), -sin(diff), cos(diff));\
   for(float i = 0.0; i < ITERATIONS; i += 1.0){\
     if(p.x < 0.0){\
       p = ref0 * p;\
       count += 1.0;\
     }else if(length(p) < r){\
       p = inversion(p, r, 0.0);\
       count += 1.0;\
     }else if(length(p - vec2(a, 0.0)) > s){\
       p = inversion(p, s, a);\
       count += 1.0;\
     }else{\
       arrived = true;\
     }\
     if(arrived){ break; }\
   }\
   return mod(count, 2.0);\
 }\
 vec3 hsb2rgb(vec3 c){\
     vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0 );\
     rgb = rgb * rgb * (3.0 - 2.0 * rgb);\
     return c.z * mix(vec3(1.0), rgb, c.y);\
 }\
 void main(){\
   float ref = reflection_3();\
   gl_FragColor = vec4(hsb2rgb(vec3(0.70, 0.3 + 0.7 * ref, 1.0)), 1.0);\
 }\
";

// 0.00, 0.10, 0.17, 0.35, 0.52, 0.64, 0.70, 0.80; ですね。

function setup(){
  createCanvas(768, 384, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  myShader.setUniform('resolution', [width, height]);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform('fc', frameCount);
  quad(-1, 1, 1, 1, 1, -1, -1, -1);
}

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
