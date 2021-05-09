// Reference:
//Daniel Shiffman
// https://youtu.be/BV9ny785UNc
// http://www.karlsims.com/rd.html
// http://hg.postspectacular.com/toxiclibs/src/44d9932dbc9f9c69a170643e2d459f449562b750/src.sim/toxi/sim/grayscott/GrayScott.java?at=default

var grid;
var next;
var dA = 1;
var dB = 1;
var feed = 0.055;
var k = 0.062;
let capture;
let previousFrame;
let dASlider, dBSlider, feedSlider, killSlider;
function setup() {
  createCanvas(200, 200);
  capture = createCapture({
    audio: false,
    video: { width: width, height: height },
  });
  capture.size(width, height);
  capture.elt.setAttribute("playsineline", "");
  // capture.hide();

  pixelDensity(1);
  grid = [];
  next = [];
  for (var x = 0; x < width; x++) {
    grid[x] = [];
    next[x] = [];
    for (var y = 0; y < height; y++) {
      grid[x][y] = {
        a: 0.1,
        b: 0,
      };
      next[x][y] = {
        a: 0.1,
        b: 0,
      };
    }
  }
  for (var i = 100; i < 110; i++) {
    for (var j = 100; j < 110; j++) {
      grid[i][j].b = 1;
    }
  }
  //doms
//   dASlider = createSlider(0, 1, 1, 0.01);
//   dBSlider = createSlider(0, 1, 0.5, 0.01);
  createP('feedRate');
  feedSlider = createSlider(0, 1, 0.055, 0.001);
  createP('killRate')
  killSlider = createSlider(0, 1, 0.062, 0.001);
}

function draw() {
//   dA = dASlider.value();
//   dB = dBSlider.value();
  feed = feedSlider.value();
  k = killSlider.value();
  background(51);
  capture.loadPixels();
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
      for (let y = 0; y < width; y++) {
        for (let x = 0; x < height; x++) {
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

          //   console.log(pixel);
        }
      }
    }
    // if (total > 0) {
    //   // capture.updatePixels();
    //   // image(capture, 0, 0, palette.w, palette.h);
    //   console.log(total);
    // }
  }

  for (var x = 1; x < width - 1; x++) {
    for (var y = 1; y < height - 1; y++) {
      var a = grid[x][y].a;
      var b = grid[x][y].b;
      next[x][y].a = a + dA * laplaceA(x, y) - a * b * b + feed * (1 - a) * 2;
      next[x][y].b = b + dB * laplaceB(x, y) + a * b * b - (k + feed) * b * 2;
      next[x][y].a = constrain(next[x][y].a, 0, 1);
      next[x][y].b = constrain(next[x][y].b, 0, 1);
    }
  }
  //fill with B when there is motion
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (capture.pixels[(x + y * width) * 4] === 255) {
        next[x][y].b = 1;
        // next[x][y].a = 1;
      }
    }
  }
  loadPixels();
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var pix = (x + y * width) * 4;
      var a = Math.floor(next[x][y].a * 255);
      //   console.log(a);
      var b = Math.floor(next[x][y].b * 255);
      var c = floor((a - b) * 255);
      c = constrain(c, 0, 255);
      pixels[pix + 0] = a;
      pixels[pix + 1] = b;
      pixels[pix + 2] = c;
      pixels[pix + 3] = 255;
    }
  }
  updatePixels();
  swap();
}

function laplaceA(x, y) {
  var sumA = 0;
  sumA += grid[x][y].a * -1;
  sumA += grid[x - 1][y].a * 0.2;
  sumA += grid[x + 1][y].a * 0.2;
  sumA += grid[x][y + 1].a * 0.2;
  sumA += grid[x][y - 1].a * 0.2;
  sumA += grid[x - 1][y - 1].a * 0.05;
  sumA += grid[x + 1][y - 1].a * 0.05;
  sumA += grid[x + 1][y + 1].a * 0.05;
  sumA += grid[x - 1][y + 1].a * 0.05;
  return sumA;
}

function laplaceB(x, y) {
  var sumB = 0;
  sumB += grid[x][y].b * -1;
  sumB += grid[x - 1][y].b * 0.2;
  sumB += grid[x + 1][y].b * 0.2;
  sumB += grid[x][y + 1].b * 0.2;
  sumB += grid[x][y - 1].b * 0.2;
  sumB += grid[x - 1][y - 1].b * 0.05;
  sumB += grid[x + 1][y - 1].b * 0.05;
  sumB += grid[x + 1][y + 1].b * 0.05;
  sumB += grid[x - 1][y + 1].b * 0.05;
  return sumB;
}

function swap() {
  var temp = grid;
  grid = next;
  next = temp;
}

function motionDetection() {}
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
