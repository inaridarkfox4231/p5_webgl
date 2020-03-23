// テンプレートから脱却して自由にいろいろ書けるようになりたい

let myShader;

let vs =
"precision mediump float;" + // 扱う小数の範囲らしい
"attribute vec3 aPosition;" + // シェーダーなら特にいじる必要はない
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision mediump float;" +
"uniform vec2 resolution;" +
"void main(){" +
"  gl_FragColor = vec4(0.6, 0.5, 0.97, 1.0);" + // gl_FragColorはピクセルごとの色。
"}"

// gl_FragCoordで値を取得できるんだけど、なぜか値が0.0～2.0になってるので、
// 普通にresolutionというか(width, height)を引いてmin(width, height)で割ると小さい方で揃えて正方形ができる感じ。

function setup(){
  createCanvas(400, 400, WEBGL);
  myShader = createShader(vs, fs); // シェーダーを作る
  shader(myShader); // シェーダーを適用する
  noLoop();
}

function draw(){
  myShader.setUniform("resolution", [width, height]);
  quad(-1, -1, -1, 1, 1, 1, 1, -1);
}

// この流れを頭に叩き込んで
// マウスとかフレームカウントとかそういった装飾はまた別でいいから
// あとはmillisかな・・uTimeみたいなやつ。millis()でミリ単位で取得できるからそれを1000倍して秒数が出る感じ。
