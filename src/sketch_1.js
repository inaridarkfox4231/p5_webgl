'use strict';
// webGLのテスト
let isLoop = true;;
let img, pg;

function preload(){
  //img = loadImage('./assets/GLSL_3.PNG');
}

function setup(){
  createCanvas(512, 512, 'webgl');
  pg = createGraphics(400, 400);
  colorMode(HSB, 100);
  angleMode(DEGREES);
}

function draw(){
  background(70, 30, 100);
  /*
  rotate(frameCount / 60, [1, 1, 1]);
  rect(-100, -100, -100, 200, 200, 200);
  for(let i = 0; i < 500; i+=100){
    push();
    fill(i * 0.1, 100, 100);

    //line
    translate(0, 100, 0);
    line(-100, 0, i, 100, 0, i);

    //triangles
    translate(0, 100, 0);
    triangle(
      0, sin( i + frameCount * 0.1) * 10, i,
      60, 60, i,
      -60, 60, i);

    //quad
    translate(0, 200, 0);
    quad(
      -100, i, 0,
      100, i, 0,
      -100, 100, i,
      100, 100, i
      );
    pop();
  }*/
  //texture(img); // ロードした画像をテクスチャとして用いることができる
  //rect(-150, -100, 300, 200); // rectに貼り付ける。
  //rect(0, 150, 120, 80);
  pg.background(100, 100, 100); // 別のグラフィックにテキストを書いて・・
  pg.fill(255, 255, 255);
  pg.textSize(40);
  pg.text('Hello, world!', 50, 50);
  texture(pg); // それをテクスチャとして使うことができる
  plane(400);
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
