// the 'varying's are shared between both vertex & fragment shaders

// ほぼ同じことをやってるp5.js本家のサンプルコード（マンデルブロ集合）
// こっちはOpenProcessingで通るんだよね、何が違うんだ・・・・

  var varying = 'precision highp float;';

  // the vertex shader is called for each vertex
  var vs =
    varying +
   'attribute vec3 aPosition;' +
   'void main() {' +
	 'gl_Position = vec4(aPosition, 1.0);' +
	 '}';
   // the fragment shader is called for each pixel
   var fs =
     varying +
		 'uniform vec2 u_resolution;' +
     'void main() {' +
     '  gl_FragColor = vec4(0.3, 0.3, 1.0, 0.8);' +
     '}';

   var program;
   function setup() {
     createCanvas(400, 400, WEBGL);

     // create and initialize the shader
     program = createShader(vs, fs);
     shader(program);
     noStroke();

   }

   function draw() {
     // 'r' is the size of the image in Mandelbrot-space
		 //rect(-1, -1, 0.1, 0.2);
		 program.setUniform('u_resolution', [width, height]);
     quad(-0.5, -0.5, 1, -1, 1, 1, -1, 0.5);
   }
