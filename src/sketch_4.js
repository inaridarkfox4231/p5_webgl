// the 'varying's are shared between both vertex & fragment shaders

// ほぼ同じことをやってるp5.js本家のサンプルコード（マンデルブロ集合）
// こっちはOpenProcessingで通るんだよね、何が違うんだ・・・・

  var varying = 'precision highp float; varying vec2 vPos;';
  // varying変数はどちらでも同じものを使える。

  // the vertex shader is called for each vertex
  var vs =
    varying +
   'attribute vec3 aPosition;' +
     'void main() { vPos = (gl_Position = vec4(aPosition,1.0)).xy; }';

   // the fragment shader is called for each pixel
   var fs =
     varying +
     'uniform vec2 p;' +
     'uniform float r;' +
     'const int I = 500;' +
     'void main() {' +
     '  vec2 c = p + vPos * r, z = c;' +
     '  float n = 0.0;' +
     '  for (int i = I; i > 0; i --) {' +
     '    if(z.x*z.x+z.y*z.y > 4.0) {' +
     '      n = float(i)/float(I);' +
     '      break;' +
     '    }' +
     '    z = vec2(z.x*z.x-z.y*z.y, 2.0*z.x*z.y) + c;' +
     '  }' +
     '  gl_FragColor = vec4(0.5-cos(n*17.0)/2.0,0.5-cos(n*13.0)/2.0,0.5-cos(n*23.0)/2.0,1.0);' +
     '}';

   var mandel;
   function setup() {
     createCanvas(400, 400, WEBGL);

     // create and initialize the shader
     mandel = createShader(vs, fs);
     shader(mandel);
     noStroke();

     // 'p' is the center point of the Mandelbrot image
     mandel.setUniform('p', [-0.74364388703, 0.13182590421]);
   }

   function draw() {
     // 'r' is the size of the image in Mandelbrot-space
     mandel.setUniform('r', 1.5 * exp(-6.5 * (1 + sin(millis() / 2000))));
     quad(-1, -1, 1, -1, 1, 1, -1, 1);
   }
