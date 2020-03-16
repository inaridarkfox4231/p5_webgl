// レイマーチングで球体書いてみようー
// さっきの落書きは冗談でした。

// 書けたよ
// なんかnoLoopになってたのとマウスの値がおかしかった。

// カメラ位置も固定されてるからなぁ。いじってみる？
// HSB導入したいんですよね。

// 疲れたわ。
// 赤青緑の球をぐるぐるさせるだけでこんな疲れるのね・・てか配列わけわからん。どうやんのこれ。

// マウス位置で光を当てる方向変えてみた。
// ベクトル渡すときにひっくり返ってるからyだけ逆にしてある。

// あっちの記事より詳しいの見つけたから帰ったら読んでみよ

p5.DisableFriendlyErrors = true;
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
"uniform float fc;" +
"uniform vec2 resolution;" +
"uniform vec2 mouse;" +
"uniform vec3 c0;" +
"uniform vec3 c1;" +
"uniform vec3 c2;" +
"const float pi = 3.14159;" +
"vec3 lightDir = normalize(vec3(mouse.x * 5.0, -mouse.y * 5.0, 1.0));" + // 光を当てる方向
"float dist_func(vec3 pos){" +
"  return min(length(pos - c0) - 0.2, min(length(pos - c1) - 0.2, length(pos - c2) - 0.2));" +
"}" +
"vec3 getNormal(vec3 pos){" +
"  float h = 0.0001;" +
"  float nx = dist_func(pos + vec3(h, 0, 0)) - dist_func(pos);" +
"  float ny = dist_func(pos + vec3(0, h, 0)) - dist_func(pos);" +
"  float nz = dist_func(pos + vec3(0, 0, h)) - dist_func(pos);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
// hsb型のvec3をrgbにする魔法のコード
"vec3 hsb2rgb(vec3 c){" +
"    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0)," +
"                             6.0)-3.0)-1.0," +
"                     0.0," +
"                     1.0 );" +
"    rgb = rgb*rgb*(3.0-2.0*rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
"void main(){" +
// キャンバスは(-1, 1)×(-1, 1)のところにする（正規化）
"  vec2 pos = (gl_FragCoord.xy - resolution.xy) / min(resolution.x, resolution.y);" + // gl_FragCoordがおかしいので2倍しません
"  vec3 col = vec3(0.0);" + // 0.0のままだったらそこは黒（光が当たらない）
"  vec3 cameraPos = vec3(0.0, 0.0, 10.0);" + // カメラの位置（10だけ上方みたいな感じ？）
"  vec3 ray = normalize(vec3(pos, 0.0) - cameraPos);" + // カメラ位置からキャンバス上の描画位置に向かって伸びるベクトルの正規化
"  vec3 cur = cameraPos;" + // カメラ位置をスタートにして走査開始
// これより走査を開始する。回数はとりあえず16回（それで突き当らなければそこには何もないとみなす）。
// 距離関数でcurとの距離を調べて0に近いのでなければその距離だけrayに沿って進む。
// 進んだらその位置からまた距離関数を調べてrayに沿って進む。
// 距離関数がしきい値(今回は0.0001)を下回り0とみなされたらぶち当たったということなので光の強さを計算して明るさを指定する。
// 具体的には光がそこに当たっているので法線ベクトルと内積を取って（双方単位ベクトルなので結局なす角のcosで・・）
// この場合だったら(1, 1, 1)がその場所から突き出している感じで0～1の値が決まって1に近いほど明るいって感じなんかな・・うん。多分。HSBのがいい？
"  for(int i = 0; i < 16; i++){" +
"    float d = dist_func(cur);" +
"    if(d < 0.0001){" +  // このときcurは表面上にいるという設定なのね。
"      vec3 normal = getNormal(cur);" +
"      float diff = dot(normal, lightDir);" +
"      float a0 = 1.0 - step(0.0001, length(cur - c0) - 0.2);" +
"      float a1 = 1.0 - step(0.0001, length(cur - c1) - 0.2);" +
"      float a2 = 1.0 - step(0.0001, length(cur - c2) - 0.2);" +
"      float hue = 0.02 * a0 + 0.34 * a1 + 0.66 * a2;" +
"      col = hsb2rgb(vec3(hue, 1.0, diff + 0.1));" +
"      break;" +
"    }" +
"    cur += ray * d;" +
"  }" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

function setup(){
  createCanvas(600, 600, WEBGL);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
}

function draw(){
  clear();
  myShader.setUniform("fc", frameCount);
  myShader.setUniform("resolution", [width, height]);
  let vectors = getCenterVectors();
  myShader.setUniform("c0", vectors[0]);
  myShader.setUniform("c1", vectors[1]);
  myShader.setUniform("c2", vectors[2]);
  const ms = getNormalizeMouseValue();
  myShader.setUniform("mouse", ms); // 正規化
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

function getNormalizeMouseValue(){
  const x = constrain(2.0 * (mouseX / width) - 1.0, -1.0, 1.0);
  const y = constrain(2.0 * (mouseY / height) - 1.0, -1.0, 1.0);
  return [x, y];
}

function getCenterVectors(){
  const phase = frameCount * 0.02;
  let vectors = [];
  for(let i = 0; i < 3; i++){
    const angle = 2.0 * PI * i / 3.0 + phase;
    vectors.push([0.4 * cos(angle), 0.4 * sin(angle), 0.0]);
  }
  return vectors;
}
