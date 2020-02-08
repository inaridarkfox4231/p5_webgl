// glslでオリジナルのノイズ関数を実装するチャレンジ企画
// チャレンジ失敗です。OK!

// 面倒なのでテンプレート作りました
'use strict';

let myShader;
let mySeed;
let factorArray = []; // 計算用の長さ12の配列。
// 具体的には、a=1664525, m=42949667296として、a, a^2, a^4, ..., a^2048のmod mでの整数値が入っている。
// で、i+1を2進数で展開して、対応するaのベキに対してそれらの積のmod mを取って・・
// a^(i+1) * seed + (a^(i+1) - 1) * c / (a - 1) のmod mを計算する感じ。

let vs =
"precision highp float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision highp float;" +
"uniform float fc;" +
"uniform vec2 resolution;" +
"uniform float seed;" +
"uniform float factorArray[12];" +
"uniform vec2 mouse[2];" +
"const float PI = 3.14159265358;" +
"const float c = 1013904223.0;" +
"const float m = 4294967296.0;" +
"const float a = 1664525.0;" +
"const float perlin_amp_falloff = 0.5;" +
"const float noiseScale = 0.02;" +
"float scaled_cosine(float x){" +
"  return 0.5 * (1.0 - cos(x * PI));" +
"}" +
"float getPerlin(float i){" + // i+1の2進数展開
"  float factor = 1.0;" +
"  float k = i + 1.0;" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[0], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[1], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[2], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[3], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[4], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[5], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[6], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[7], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[8], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[9], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[10], m); }" +
"  k = floor(k / 2.0);" +
"  if(mod(k, 2.0) > 0.5){ factor = mod(factor * factorArray[11], m); }" +
"  float result;" +
"  result = mod(factor * seed, m) + mod(floor((factor - 1.0) / (a - 1.0)) * c, m);" +
"  return mod(result, m) / m;" +
"}" +
"float noise(float x, float y, float z){" +
"  if(x < 0.0){ x *= -1.0; }" +
"  if(y < 0.0){ y *= -1.0; }" +
"  if(z < 0.0){ z *= -1.0; }" +
"  float xi = floor(x);" +
"  float yi = floor(y);" +
"  float zi = floor(z);" +
"  float xf = x - xi;" +
"  float yf = y - yi;" +
"  float zf = z - zi;" +
"  float rxf, ryf;" +
"  float r = 0.0;" +
"  float ampl = 0.5;" +
"  float n1, n2, n3;" +
"  for(int o = 0; o < 4; o++){" +
"    float of = xi + yi * 16.0 + zi * 256.0;" +
"    rxf = scaled_cosine(xf);" +
"    ryf = scaled_cosine(yf);" +
"    n1 = getPerlin(mod(of, 4096.0));" +
"    n1 += rxf * (getPerlin(mod(of + 1.0, 4096.0)) - n1);" +
"    n2 = getPerlin(mod(of + 16.0, 4096.0));" +
"    n2 += rxf * (getPerlin(mod(of + 17.0, 4096.0)) - n2);" +
"    n1 += ryf * (n2 - n1);" +
"    of += 256.0;" +
"    n2 = getPerlin(mod(of, 4096.0));" +
"    n2 += rxf * (getPerlin(mod(of + 1.0, 4096.0)) - n2);" +
"    n3 = getPerlin(mod(of + 16.0, 4096.0));" +
"    n3 += rxf * (getPerlin(mod(of + 17.0, 4096.0)) - n3);" +
"    n2 += ryf * (n3 - n2);" +
"    n1 += scaled_cosine(zf) * (n2 - n1);" +
"    r += n1 * ampl;" +
"    ampl *= perlin_amp_falloff;" +
"    xi *= 2.0;" +
"    xf *= 2.0;" +
"    yi *= 2.0;" +
"    yf *= 2.0;" +
"    zi *= 2.0;" +
"    zf *= 2.0;" +
"    if(xf >= 1.0){ xi++; xf--; }" +
"    if(yf >= 1.0){ yi++; yf--; }" +
"    if(zf >= 1.0){ zi++; zf--; }" +
"  }" +
"  return r;" +
"}" +
"void main(){" +
"  float b = noise(fc * 0.005, 0.0, 0.0);" +
"  if(gl_FragCoord.y / resolution.y < b){" +
"    gl_FragColor = vec4(1.0);" +
"  }else{" +
"    gl_FragColor = vec4(vec3(noise(fc * 0.09, 0.0, 0.0)), 1.0);" +
"  }" +
"}";

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  //noLoop();
  setMySeed(0); // mySeedとfactorArrayを用意する。
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  myShader.setUniform("seed", mySeed);
  myShader.setUniform("factorArray", factorArray);
  myShader.setUniform("mouse", [mouseX, mouseY]);
  quad(-1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0);
}

function setMySeed(seed){
  mySeed = seed;
  const m = 4294967296n; // 2の32乗。BigIntにしないと計算で不具合が出るっぽい。
  const a = 1664525;
  factorArray[0] = a;
  for(let i = 1; i < 12; i++){
    console.log(factorArray[i - 1]);
    factorArray[i] = Number((BigInt(factorArray[i - 1]) * BigInt(factorArray[i - 1])) % m);
  }
  console.log(factorArray);
  // 正確になったけど・・まずいねなんか。
}

// mod(i+1, 2)のintを取って0か1か見て1ならfactorArray[0]を掛けてmod mを取る。スタートは1.
// i+1の方は2で割ってintを取る。これを12回やる。
