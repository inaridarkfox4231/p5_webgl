// カスタムシェーダーでテキスト表示という暴挙に打って出る
'use strict';

let myShader;
let img;

let currentTextIndex = 0;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"varying vec2 textureCoord;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"  textureCoord = vec2(aPosition.x * 2.0, 1.0 - 4.0 * aPosition.y);" +
"}";

let fs =
"precision mediump float;" +
"uniform sampler2D text;" +
"varying vec2 textureCoord;" +
"uniform float mode;" +
"void main(){" +
"  if(mode < 0.5){" +
"    gl_FragColor = texture2D(text, textureCoord);" +
"  }else{" +
"    gl_FragColor = vec4(0.5, 1.0, 0.7, 1.0);" +
"  }" +
"}"

function setup(){
  createCanvas(400, 400, WEBGL);
  colorMode(HSB, 100);
  noStroke();
  myShader = createShader(vs, fs);
  shader(myShader);
  img = createGraphics(100, 50);
  img.background(0, 0, 255);
  img.fill(255);
  img.textSize(20);
  img.text("(2, 3, 4)", 0, 25);
  myShader.setUniform("text", img);
  //noLoop();
}

function draw(){
  background(70, 30, 100);
  myShader.setUniform("mode", 1.0);
  quad(0, 0, 1, 0, 1, 1, 0, 1);
  myShader.setUniform("mode", 0.0);
  quad(0, 0, 0.5, 0, 0.5, 0.25, 0, 0.25);
}

function mouseClicked(){
  let f = Math.floor(random(4)) + 1;
  currentTextIndex = (currentTextIndex + f) % 5;
  f = currentTextIndex;
  img.background(0, 0, 255);
  img.fill(255);
  img.textSize(20);
  if(f === 0){
    img.text("Hello!", 0, 25);
  }else if(f === 1){
    img.text("Fox!!", 0, 25);
  }else if(f === 2){
    img.text("Wolf!!", 0, 25);
  }else if(f === 3){
    img.text("Cat!!!", 0, 25);
  }else{
    img.text("Mouse!", 0, 25);
  }
}
