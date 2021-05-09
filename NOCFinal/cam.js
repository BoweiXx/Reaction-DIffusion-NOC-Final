//reference: https://kylemcdonald.github.io/cv-examples/FrameDifference/
//note here it is drawing the data set, but I only need to export as a module
// let capture;
// let previousFrame;
// let w;
// let h;
// function setup() {
//   w = window.innerWidth;
//   h = window.innerHeight;
//   capture = createCapture({
//     audio: false,
//     video: { width: w, height: h },
//   });
//   capture.size(w, h);
//   capture.elt.setAttribute("playsineline", "");
//   createCanvas(w, h);
//   capture.hide();
// }
// //also rememeber the drawing canvas is 
// function draw() {
//   capture.loadPixels();
//   // console.log(autoCalibration())
//   motionDetection();
// //   console.log(motionDetection());   
// }
//take the previous frame's RGB value's sum and take diff with the current frame, if the diff surplus the thres, draw the bin image
//this is working!
 function motionDetection() {
  let total = 0;
  //store the previousFrame in an array to compare
  if (capture.pixels.length > 0) {
    if (!previousFrame) {
      previousFrame = copyImage(capture.pixels, previousFrame);
      //got it
      console.log(previousFrame);
    } else {
      let i = 0;
      //for rgb channels
      let pixel = capture.pixels;
      let thres = autoCalibration() * 3;
      // console.log('yay')
      for (let y = 0; y < w; y++) {
        for (let x = 0; x < h; x++) {
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
      capture.updatePixels();
      image(capture, 0, 0, w, h);
      console.log(total);
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

export {motionDetection}