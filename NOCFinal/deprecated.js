/*start with the simplest version, two chemicals reaction
 A + B = 2B, and palette is full with B
*/
//this is for a 3*3 convolution
//for this, I need (N + 1) * (N+ 1) canvas, or (N-1) * (N-1) rendering space
//from karl sims
const reactionFactors = {
  core: [0.05, 0.2, 0.05, 0.2, -1, 0.2, 0.05, 0.2, 0.05],
  feedRate: 0.055,
  killRate: 0.062,
  dA: 1.0,
  dB: 0.5,
};
let capture;
let previousFrame;
let motionArray;
//edges
// const reactionFactors = {
//   core: [0.05, 0.2, 0.05, 0.2, -1, 0.2, 0.05, 0.2, 0.05],
//   feedRate: 0.023,
//   killRate: 0.052,
//   dA: 0.5,
//   dB: 0.5,
// };
let reactionCanvas;
let lastReactionCanvas;
let palette = {
  w: 200,
  h: 200,
};
//using objects causing the NAN, reason unknown
// let chemicals = {
//   a: 0,
//   b: 0,
//   setValueA(index){
//     this.a = index;
//     return this;
//   },
//   setValueB(index){
//     this.b = index;
//     return this;
//   }
// };
function setup() {
  createCanvas(palette.w, palette.h);
  pixelDensity(1);
  background(0);
  capture = createCapture({
    audio: false,
    video: { width: palette.w, height: palette.h },
  });
  capture.size(palette.w, palette.h);
  capture.elt.setAttribute("playsineline", "");
  createCanvas(palette.w, palette.h);
  // capture.hide();
  //now we have 2 reactants, so multiplies by two
  //fill reference to the same memory location, do the for loop
  // reactionCanvas = new Array(palette.w * palette.h * 2);
  // let i = reactionCanvas.length;
  // while (i--) reactionCanvas[i] = 0.2;
  // console.log(Number.isNaN(reactionCanvas[0]));
  // console.log('in setup', reactionCanvas);
  //routine check
  // console.log(reactionCanvas.length, lastReactionCanvas.length);
  // console.log(reactionCanvas[0].a);
  // console.log(reactionCanvas.length);
  //resolution of 1
  reactionCanvas = new Array();
  for(let x = 0; x < palette.w; x++){
    reactionCanvas[x] = []
    for(let y = 0; y < palette.h; y++){
      reactionCanvas[x][y] = {a:1, b: .1};
    }
  }
}
function draw() {
  capture.loadPixels();
  motionArray = motionDetection();
  loadPixels();
  let timeStep = 1;
  //i is the index of pixel, can add some offset based on the use condition
  if (reactionCanvas.length > 0) {
    if (
      // !Array.isArray(lastReactionCanvas) ||
      // lastReactionCanvas.length != reactionCanvas.length
      !lastReactionCanvas
    ) {
      // console.log('reactionCanvas', reactionCanvas);
      lastReactionCanvas = copyImage(reactionCanvas, lastReactionCanvas);
    } else {
      // console.log("start to react");
      console.log(lastReactionCanvas, reactionCanvas);
      noLoop();
      let i = 0;
      for (let x = 1; x < palette.w - 1; x++) {
        for (let y = 1; y < palette.h - 1; y++) {
          //calculate the current reactionCanvas based on the last one
        // console.log(reactionCanvas[x][y].a)
          reactionCanvas[x][y].a =
            lastReactionCanvas[x][y].a +
            (reactionFactors.dA * laplacianA(x, y) -
              lastReactionCanvas[x][y].a * Math.pow(lastReactionCanvas[x][y].b) +
              reactionFactors.feedRate * (1 - lastReactionCanvas[x][y].a)) *
              timeStep;
          reactionCanvas[x][y].b =
            lastReactionCanvas[x][y].b +
            (reactionFactors.dB * laplacianB(x, y) +
              lastReactionCanvas[x][y].a * Math.pow(lastReactionCanvas[x][y].b) -
              (reactionFactors.killRate + reactionFactors.feedRate) *
                lastReactionCanvas[x][y].b) *
              timeStep;
          //draw the current based on the chemical concentration
          
          pixels[i++] = Math.floor(reactionCanvas[x][y].a * 255); //r
          pixels[i++] = Math.floor(reactionCanvas[x][y].b * 255); //g
          pixels[i++] = 255; //b
          pixels[i++] = 255; //skip the alpha channel
          //update the current to be the last
          lastReactionCanvas[x][y] = reactionCanvas[x][y];
          // console.log('finished');
          // console.log(i)
          /*-------------------------------------------test---------------------------------------------*/
          // let offset = (y * palette.w + x) * 4;
          // let offset2 = y * palette.w + x;
          //   reactionCanvas[offset2].a = Math.random();
          //   reactionCanvas[offset2].b = Math.random();
          //   pixels[offset + 0] = Math.floor(reactionCanvas[offset2].a * 255);
          //   pixels[offset + 1] = 112;
          //   pixels[offset + 2] = Math.floor(reactionCanvas[offset2].b * 255);
          //   pixels[offset + 3] = 255;
          //skip the alpha channel
        }
      }
    }
  }
  updatePixels(0, 0, palette.w, palette.h);
}

const positioning = (x, y, w) => {
  //top left, top middle, top right
  let kernelArray = new Array();
  kernelArray.push(x + (y - 1) * w - 1);
  kernelArray.push(x + (y - 1) * w);
  kernelArray.push(x + (y - 1) * w + 1);
  //middle layer
  kernelArray.push(x + y * w - 1);
  kernelArray.push(x + y * w);
  kernelArray.push(x + y * w + 1);
  //buttom layer
  kernelArray.push(x + (y + 1) * w - 1);
  kernelArray.push(x + (y + 1) * w);
  kernelArray.push(x + (y + 1) * w + 1);
  return kernelArray;
};
//I want this to return the calculated value after laplace oepration
// this is 1D array version
function laplacianA(x, y) {
  let sum = 0;
  let Positions = positioning(x, y, palette.w);
  // console.log(Positions)
  //3*3 convolution
  for (let i = 0; i < 9; i++) {
    let thisTimeChemical = reactionCanvas[Positions[i]];
    // console.log(thisTimePosition);
    let weight = reactionFactors.core[i];
    sum += thisTimeChemical * weight;
  }
  // console.log(sum)
  return sum;
}
function laplacianB(x, y) {
  let sum = 0;
  let Positions = positioning(x, y, palette.w);
  //3*3 convolution
  for (let i = 0; i < 9; i++) {
    let thisTimeChemical = reactionCanvas[Positions[i + 1]];
    // console.log(thisTimePosition);
    let weight = reactionFactors.core[i];
    sum += thisTimeChemical * weight;
  }
  return sum;
}
function motionDetection() {
  let total = 0;
  //store the previousFrame in an array to compare
  if (capture.pixels.length > 0) {
    if (!previousFrame) {
      previousFrame = copyImage(capture.pixels, previousFrame);
      //got it
      // console.log(previousFrame);
    } else {
      let i = 0;
      //for rgb channels
      let pixel = capture.pixels;
      let thres = autoCalibration() * 3;
      // console.log('yay')
      for (let y = 0; y < palette.w; y++) {
        for (let x = 0; x < palette.h; x++) {
          //do not use offset = ((y * width) + x) * 4 here, try to eliminate in loop calcs as much as possible to bring up the performance
          let rDiff = Math.abs(pixel[i] - previousFrame[i]);
          let gDiff = Math.abs(pixel[i + 1] - previousFrame[i + 1]);
          let bDiff = Math.abs(pixel[i + 2] - previousFrame[i + 2]);
          //update the current frame to the prev
          previousFrame[i] = pixel[i];
          previousFrame[i + 1] = pixel[i + 1];
          previousFrame[i + 2] = pixel[i + 2];
          let diffs = rDiff + gDiff + bDiff;
          let output = 0;
          if (diffs > thres) {
            output = 255;
            total += diffs;
          }
          pixel[i++] = output;
          pixel[i++] = output;
          pixel[i++] = output;
          i++;
          //negative image:
          // pixel[i++] = rDiff;
          // pixel[i++] = gDiff;
          // pixel[i++] = bDiff;
          // i++;
          //normal image:
          // pixel[i++] = Math.abs(255 - rDiff);
          // pixel[i++] = Math.abs(255 - gDiff);
          // pixel[i++] = Math.abs(255 - bDiff);
          // i++;
          //psychdelic:
          //  pixel[i++] = Math.abs(255 - rDiff);
          // pixel[i++] = Math.abs(255 - gDiff);
          // pixel[i++] = Math.abs(255 - bDiff);
          // pixel[i++] = 50;

          // console.log(pixel);
        }
      }
    }
    if (total > 0) {
      // capture.updatePixels();
      // image(capture, 0, 0, palette.w, palette.h);
      // console.log(total);
      //this thing has 4 values for each pixel
      // console.log(capture.pixels);
      return capture.pixels;
    }
  }
}
//duplicate the current image frame data
function copyImage(from, to) {
  let n = from.length;
  if (!to || to.length != n) {
    to = new from.constructor(n);
    while (n--) to[n] = from[n];
  }
  return to;
}
//detect overall grey scale average to calibrate, not applicable for high contrast
function autoCalibration() {
  let sum = 0;
  let pixel = capture.pixels;
  for (let y = 0; y < capture.height; y++) {
    for (let x = 0; x < capture.width; x++) {
      let offset = (y * capture.width + x) * 4;
      sum = sum + pixel[offset] + pixel[offset + 1] + pixel[offset + 2];
    }
  }
  sum = sum / pixel.length / 4;
  return sum;
}
