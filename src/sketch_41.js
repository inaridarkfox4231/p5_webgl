// しばらくinigoさんのページで距離関数勉強する
// それ終わったら海とか雲とか調べたい感じで
// cf:http://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm

// 円

"use strict";

let myShader;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision mediump float;" +
"uniform float fc;" +
"uniform vec2 resolution;" +
"uniform vec2 mouse;" +
"const float pi = 3.14159;" +
// hsb型のvec3をrgbにする魔法のコード
"vec3 hsb2rgb(vec3 c){" +
"    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0)," +
"                             6.0)-3.0)-1.0," +
"                     0.0," +
"                     1.0 );" +
"    rgb = rgb*rgb*(3.0-2.0*rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
// 円。
"float sdCircle(vec2 p, float r){" +
"  return length(p) - r;" +
"}" +
// 線分。
"float sdSegment(vec2 p, vec2 a, vec2 b){" +
"  vec2 pa = p - a;" +
"  vec2 ba = b - a;" +
"  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);" +
"  return length(pa - ba * h);" +
"}" +
// 箱（内側で距離が負にならないのであれと同じ見た目にならないから若干アレンジしてある）
// 具体的にはdの成分がどちらも負の場合に負の値を返すように符号をいじってる
"float sdBox(vec2 p, vec2 b){" +
"  vec2 d = abs(p) - b;" +
"  return sign(max(d.x, d.y)) * length(max(d, vec2(0.0)) + min(max(d.x, d.y), 0.0));" +
"}" +
// 5角星型。一般的なのもあるけどとりあえず、ね。対称性使って簡単に計算してある。
"void main(void){" +
// gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" +
"  vec2 b = vec2(0.6, 0.4);" +
"  float d = sdBox(p, b);" +
"  vec3 col = vec3(1.0) - sign(d) * vec3(0.4, 0.7, 0.1);" +
"  col *= 1.0 - exp(-3.0 * abs(d));" +
"  col *= 0.8 + 0.2 * cos(120.0 * d);" +
"  col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.015, abs(d)));" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
}

function draw(){
  clear();
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  const ms = getNormalizeMouseValue();
  myShader.setUniform("mouse", ms); // 正規化
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

function getNormalizeMouseValue(){
  // 0～1の範囲に正規化
  const x = constrain(mouseX / width, 0.0, 1.0);
  const y = constrain(mouseY / height, 0.0, 1.0);
  return [x, y];
}

function getCenteringMouseValue(){
  // -1～1の範囲に正規化
  const x = constrain(2.0 * (mouseX / width) - 1.0, -1.0, 1.0);
  const y = constrain(2.0 * (mouseY / height) - 1.0, -1.0, 1.0);
  return [x, y];
}

/*

円の場合
"void main(void){" +
// gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" +
// 原点中心、半径rの円
"  float d = sdCircle(p, 0.5);" +
// coloring.
"  vec3 col = vec3(1.0) - sign(d) * vec3(0.4, 0.7, 0.1);" +
"  col *= 1.0 - exp(-3.0 * abs(d));" +
"  col *= 0.8 + 0.2 * cos(180.0 * d);" +
"  col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.01, abs(d)));" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

線分の場合
"void main(void){" +
// gl_FragCoordの値がなぜか2倍になってしまうので普通に引いてる
"  vec2 p = (gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);" +
"  p *= 1.4;" +
"  float iTime = fc * 0.02;" +
"  vec2 v1 = cos(iTime + vec2(0.0, 2.0) + 0.0);" +
"  vec2 v2 = cos(iTime + vec2(0.0, 1.5) + 1.5);" +
"  float th = 0.1 * (0.5 + 0.5 * sin(iTime * 1.1));" + // 線の太さをいじってる。thickの略だと思う。
"  float d = sdSegment(p, v1, v2) - th;" + // thを引くことで線に厚みが出るわけね。
"  vec3 col = vec3(1.0) - sign(d) * vec3(0.4, 0.7, 0.1);" +
"  col *= 1.0 - exp(-3.0 * abs(d));" +
"  col *= 0.8 + 0.2 * cos(120.0 * d);" +
"  col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.015, abs(d)));" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

*/
