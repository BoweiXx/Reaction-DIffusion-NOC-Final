"use strict";

/*start with the simplest version, two chemicals reaction
 A + B = 2B, and palette is full with B
*/
//this is for a 3*3 convolution
//for this, I need (N + 1) * (N+ 1) canvas, or (N-1) * (N-1) rendering space
//from karl sims
var reactionFactors = {
  core: [0.05, 0.2, 0.05, 0.2, -1, 0.2, 0.05, 0.2, 0.05],
  feedRate: 0.055,
  killRate: 0.062,
  dA: 1.0,
  dB: 0.5
}; //edges
// const reactionFactors = {
//   core: [0.05, 0.2, 0.05, 0.2, -1, 0.2, 0.05, 0.2, 0.05],
//   feedRate: 0.023,
//   killRate: 0.052,
//   dA: 0.5,
//   dB: 0.5,
// };

var reactionCanvas;
var lastReactionCanvas;
var palette = {
  w: 200,
  h: 200
}; //using objects causing the NAN, reason unknown
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
    video: {
      width: palette.w,
      height: palette.h
    }
  });
  capture.size(palette.w, palette.h);
  capture.elt.setAttribute("playsineline", "");
  createCanvas(palette.w, palette.h); // capture.hide();
  //now we have 2 reactants, so multiplies by two
  //fill reference to the same memory location, do the for loop

  reactionCanvas = new Array(palette.w * palette.h * 2);
  var i = reactionCanvas.length;

  while (i--) {
    reactionCanvas[i] = 0.2;
  } // console.log(Number.isNaN(reactionCanvas[0]));
  // console.log('in setup', reactionCanvas);
  //routine check
  // console.log(reactionCanvas.length, lastReactionCanvas.length);
  // console.log(reactionCanvas[0].a);
  // console.log(reactionCanvas.length);

}

function draw() {
  capture.loadPixels();
  motionDetection();
  loadPixels();
  var timeStep = 1; //i is the index of pixel, can add some offset based on the use condition

  if (reactionCanvas.length > 0) {
    if ( // !Array.isArray(lastReactionCanvas) ||
    // lastReactionCanvas.length != reactionCanvas.length
    !lastReactionCanvas) {
      // console.log('reactionCanvas', reactionCanvas);
      lastReactionCanvas = copyFrame(reactionCanvas, lastReactionCanvas);
      console.log(lastReactionCanvas);
    } else {
      console.log("start to react");
      var i = 0;

      for (var y = 1; y < palette.h - 1; y++) {
        for (var x = 1; x < palette.w - 1; x++) {
          //calculate the current reactionCanvas based on the last one
          reactionCanvas[i] = lastReactionCanvas[i] + (reactionFactors.dA * laplacianA(x, y) - lastReactionCanvas[i] * Math.pow(lastReactionCanvas[i + 1]) + reactionFactors.feedRate * (1 - lastReactionCanvas[i])) * timeStep;
          reactionCanvas[i + 1] = lastReactionCanvas[i + 1] + (reactionFactors.dB * laplacianB(x, y) + lastReactionCanvas[i] * Math.pow(lastReactionCanvas[i + 1]) - (reactionFactors.killRate + reactionFactors.feedRate) * lastReactionCanvas[i + 1]) * timeStep; //draw the current based on the chemical concentration

          pixels[i++] = Math.floor(reactionCanvas[i] * 255); //r

          pixels[i++] = Math.floor(reactionCanvas[i + 1] * 255); //g

          pixels[i++] = 0; //b

          i++; //skip the alpha channel
          //update the current to be the last

          lastReactionCanvas[i] = reactionCanvas[i]; // console.log(i)

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

function copyFrame(from, to) {
  var n = from.length; // console.log('from', from)

  if (!to || to.length != n) {
    to = new from.constructor(from.length);

    while (n--) {
      to[n] = from[n];
    }
  } // console.log(to)


  return to;
}

var positioning = function positioning(x, y, w) {
  //top left, top middle, top right
  var kernelArray = new Array();
  kernelArray.push(x + (y - 1) * w - 1);
  kernelArray.push(x + (y - 1) * w);
  kernelArray.push(x + (y - 1) * w + 1); //middle layer

  kernelArray.push(x + y * w - 1);
  kernelArray.push(x + y * w);
  kernelArray.push(x + y * w + 1); //buttom layer

  kernelArray.push(x + (y + 1) * w - 1);
  kernelArray.push(x + (y + 1) * w);
  kernelArray.push(x + (y + 1) * w + 1);
  return kernelArray;
}; //I want this to return the calculated value after laplace oepration


function laplacianA(x, y) {
  var sum = 0;
  var Positions = positioning(x, y, palette.w); // console.log(Positions)
  //3*3 convolution

  for (var i = 0; i < 9; i++) {
    var thisTimeChemical = reactionCanvas[Positions[i]]; // console.log(thisTimePosition);

    var weight = reactionFactors.core[i];
    sum += thisTimeChemical * weight;
  }

  return sum;
}

function laplacianB(x, y) {
  var sum = 0;
  var Positions = positioning(x, y, palette.w); //3*3 convolution

  for (var i = 0; i < 9; i++) {
    var thisTimeChemical = reactionCanvas[Positions[i + 1]]; // console.log(thisTimePosition);

    var weight = reactionFactors.core[i];
    sum += thisTimeChemical * weight;
  }

  return sum;
}

function motionDetection() {
  var total = 0; //store the previousFrame in an array to compare

  if (capture.pixels.length > 0) {
    if (!previousFrame) {
      previousFrame = copyImage(capture.pixels, previousFrame); //got it

      console.log(previousFrame);
    } else {
      var i = 0; //for rgb channels

      var pixel = capture.pixels;
      var thres = autoCalibration() * 3; // console.log('yay')

      for (var y = 0; y < w; y++) {
        for (var x = 0; x < h; x++) {
          //do not use offset = ((y * width) + x) * 4 here, try to eliminate in loop calcs as much as possible to bring up the performance
          var rDiff = Math.abs(pixel[i] - previousFrame[i]);
          var gDiff = Math.abs(pixel[i + 1] - previousFrame[i + 1]);
          var bDiff = Math.abs(pixel[i + 2] - previousFrame[i + 2]); //update the current frame to the prev

          previousFrame[i] = pixel[i];
          previousFrame[i + 1] = pixel[i + 1];
          previousFrame[i + 2] = pixel[i + 2];
          var diffs = rDiff + gDiff + bDiff;
          var output = 0;

          if (diffs > thres) {
            output = 255;
            total += diffs;
          }

          pixel[i++] = output;
          pixel[i++] = output;
          pixel[i++] = output;
          i++; //negative image: 
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
      capture.updatePixels();
      image(capture, 0, 0, w, h);
      console.log(total);
      return capture.pixels;
    }
  }
} //duplicate the current image frame data


function copyImage(from, to) {
  var n = from.length;

  if (!to || to.length != n) {
    to = new from.constructor(n);

    while (n--) {
      to[n] = from[n];
    }
  }

  return to;
} //detect overall grey scale average to calibrate, not applicable for high contrast


function autoCalibration() {
  var sum = 0;
  var pixel = capture.pixels;

  for (var y = 0; y < capture.height; y++) {
    for (var x = 0; x < capture.width; x++) {
      var offset = (y * capture.width + x) * 4;
      sum = sum + pixel[offset] + pixel[offset + 1] + pixel[offset + 2];
    }
  }

  sum = sum / pixel.length / 4;
  return sum;
}