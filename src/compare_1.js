// 比較用
'use strict';

function setup(){
  createCanvas(400, 400);
  colorMode(HSB, 100);
  angleMode(DEGREES);
}

function draw(){
  background(70, 30, 100);
  translate(200, 200);
  noStroke();
  fill(70, 100, 100);
  rotate(frameCount * 2);
  rect(-30, -30, 60, 60);
}
