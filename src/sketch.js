
// P5.js Shader
//inspired by Pierre MARZIN. Check his stuff out here https://www.openprocessing.org/user/19666

var program;

function setup() {
 pixelDensity(1); // ？？
  createCanvas(500, 500,WEBGL);

    //createCanvas(windowWidth, windowHeight,WEBGL);
    gl=this.canvas.getContext('webgl');
	rectMode(CENTER); // rect(x, y, w, h)とすると(x, y)中心で横幅w, 縦幅hのrectを敷く。
  // ただしwebGLモードなので(0, 0)はcanvasの中央にくることに注意する。
  noStroke();
  fill(1);
  program = createShader(vert,frag);
	}

function draw() {
  shader(program);
  background(0);
	program.setUniform('resolution',[width,height]);
	program.setUniform('time',millis()/20);
  rect(0,0,width,height);
  /*
  rect(125, 125, 250, 250); // こっちにも
  rect(-125, -125, 250, 250); // こっちにも？
  ellipse(125, -125, 250, 250); // わぁ面白い。
  quad(-250, 0, -125, 0, 0, 250, -125, 250); // だから何？？
  */
}


var vert=`
#ifdef GL_ES
      precision highp float;
      precision highp int;
    #endif
		#extension GL_OES_standard_derivatives : enable

    // attributes, in
    attribute vec3 aPosition;
    //attribute vec3 aNormal;
    //attribute vec2 aTexCoord;
    //attribute vec4 aVertexColor;

    // attributes, out
    //varying vec3 var_vertPos;
    //varying vec4 var_vertCol;
    //varying vec3 var_vertNormal;
    //varying vec2 var_vertTexCoord;

    // matrices
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    //uniform mat3 uNormalMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);

      // just passing things through
      // var_vertPos      = aPosition;
      // var_vertCol      = aVertexColor;
      // var_vertNormal   = aNormal;
      // var_vertTexCoord = aTexCoord;
    }
`;
var frag=`

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time;

void main(void)
{
    vec2 p = -1.0 + 4.0 * gl_FragCoord.xy / resolution.xy;
    float a = time*1.0;
    float d,e,f,g=1.0/40.0,h,i,r,q;
    e=40.0*(p.x*0.5+0.5);
    f=400.0*(p.y*0.5+0.5);
    i=20.0+sin(e*g+a/150.0)*20.0;
  //  d=200.0+sin(f*g/2.0)*18.0+cos(e*g)*7.0;
    r=sqrt(pow(i-e,2.0)+pow(d-f,2.0));
    q=f/r;
    e=(r*sin(q))-a/2.0;f=(r*atan(q))-a/2.0;
    d=cos(e*g)*1.0+cos(e*g)*1.0+r;
    h=((f+d)+a/2.0)*g;
    i=cos(h+r*p.x/1.3)*(e+e+a)+cos(q*g*6.0)*(r+h/3.0);
    h=sin(f*g)*144.0-sin(e*g)*212.0*p.x;
    h=(h+(f-e)*q+sin(r-(a+h)/7.0)*10.0+i/4.0)*g;
    i+=cos(h*2.3*sin(a/350.0-q))*184.0*sin(q-(r*4.3+a/12.0)*g)+tan(r*g+h)*184.0*cos(r*g+h);
    i=mod(i/5.6,256.0)/64.0;
    if(i<0.0) i+=4.0;
    if(i>=2.0) i=4.0-i;
    d=r/850.0;
    d+=sin(d*d*8.0)*0.52;
    f=(sin(a*g)+1.0)/2.0;
    gl_FragColor=vec4(vec3(f*i/1.6,i/2.0+d/13.0,i)*d*p.x+vec3(i/1.3+d/8.0,i/2.0+d/18.0,i)*d*(1.0-p.x),1.0);
}`
