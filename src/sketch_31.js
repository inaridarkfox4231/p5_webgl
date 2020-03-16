// レイマーチングで球体書いてみようー
// さっきの落書きは冗談でした。

// 書けたよ
// なんかnoLoopになってたのとマウスの値がおかしかった。

// カメラ位置も固定されてるからなぁ。いじってみる？

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
"vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));" + // 光を当てる方向
"float dist_func(vec3 pos, float size){" +
"  return length(pos) - size;" + // 球の中心からposに出ている線分の長さから半径を引いて球までの距離としているってわけね。
//"  return pos.z - size * 0.5 + sqrt(pos.x * pos.x + pos.y * pos.y);" +
"}" +
"vec3 getNormal(vec3 pos, float size){" +
"  float h = 0.0001;" +
"  float nx = dist_func(pos + vec3(h, 0, 0), size) - dist_func(pos, size);" +
"  float ny = dist_func(pos + vec3(0, h, 0), size) - dist_func(pos, size);" +
"  float nz = dist_func(pos + vec3(0, 0, h), size) - dist_func(pos, size);" +
"  return normalize(vec3(nx, ny, nz));" +
"}" +
"void main(){" +
// キャンバスは(-1, 1)×(-1, 1)のところにする（正規化）
"  vec2 pos = (gl_FragCoord.xy - resolution.xy) / min(resolution.x, resolution.y);" + // gl_FragCoordがおかしいので2倍しません
"  vec3 col = vec3(0.0);" + // 0.0のままだったらそこは黒（光が当たらない）
"  vec3 cameraPos = vec3(0.0, 0.0, 10.0);" + // カメラの位置（10だけ上方みたいな感じ？）
"  vec3 ray = normalize(vec3(pos, 0.0) - cameraPos);" + // カメラ位置からキャンバス上の描画位置に向かって伸びるベクトルの正規化
"  vec3 cur = cameraPos;" + // カメラ位置をスタートにして走査開始
// マウスの値・・0.1から1.0くらいで動かしたい感じ。
"  float size = 0.1 + 0.9 * mouse.x;" + // マウスが右に行くほど大でよくね？
// これより走査を開始する。回数はとりあえず16回（それで突き当らなければそこには何もないとみなす）。
// 距離関数でcurとの距離を調べて0に近いのでなければその距離だけrayに沿って進む。
// 進んだらその位置からまた距離関数を調べてrayに沿って進む。
// 距離関数がしきい値(今回は0.0001)を下回り0とみなされたらぶち当たったということなので光の強さを計算して明るさを指定する。
// 具体的には光がそこに当たっているので法線ベクトルと内積を取って（双方単位ベクトルなので結局なす角のcosで・・）
// この場合だったら(1, 1, 1)がその場所から突き出している感じで0～1の値が決まって1に近いほど明るいって感じなんかな・・うん。多分。HSBのがいい？
"  for(int i = 0; i < 16; i++){" +
"    float d = dist_func(cur, size);" +
"    if(d < 0.0001){" +  // このときcurは表面上にいるという設定なのね。
"      vec3 normal = getNormal(cur, size);" +
"      float diff = dot(normal, lightDir);" +
"      col = vec3(0.1) + vec3(diff);" +
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
  const ms = getNormalizeMouseValue();
  myShader.setUniform("mouse", ms); // 正規化
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

function getNormalizeMouseValue(){
  const x = constrain(mouseX / width, 0.0, 1.0);
  const y = constrain(mouseY / height, 0.0, 1.0);
  return [x, y];
}
