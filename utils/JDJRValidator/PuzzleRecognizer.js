let PNGDecoder = require('./PNGDecoder');

module.exports = class PuzzleRecognizer {
  constructor(bg, patch, y) {
    const PUZZLE_GAP = 8;
    const PUZZLE_PAD = 10;

    const imgBg = new PNGDecoder(Buffer.from(bg, 'base64'));
    const imgPatch = new PNGDecoder(Buffer.from(patch, 'base64'));

    // console.log(imgBg);
    this.PUZZLE_GAP = PUZZLE_GAP;
    this.PUZZLE_PAD = PUZZLE_PAD;
    this.bg = imgBg;
    this.patch = imgPatch;
    this.rawBg = bg;
    this.rawPatch = patch;
    this.y = y;
    this.w = imgBg.width;
    this.h = imgBg.height;
  }

  async run() {
    try {
      await this.bg.decodeToPixels();
      await this.patch.decodeToPixels();

      return this.recognize();
    } catch (e) {
      console.info(e);
    }
  }

  recognize() {
    const { ctx, w: width, bg } = this;
    const { width: patchWidth, height: patchHeight } = this.patch;
    const posY = this.y + this.PUZZLE_PAD + (patchHeight - this.PUZZLE_PAD) / 2 - this.PUZZLE_GAP / 2;
    // const cData = ctx.getImageData(0, a.y + 10 + 20 - 4, 360, 8).data;
    const cData = bg.getImageData(0, posY, width, this.PUZZLE_GAP).data;
    const lumas = [];

    for (let x = 0; x < width; x++) {
      var sum = 0;

      // y xais
      for (let y = 0; y < this.PUZZLE_GAP; y++) {
        var idx = x * 4 + y * (width * 4);
        var r = cData[idx];
        var g = cData[idx + 1];
        var b = cData[idx + 2];
        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        sum += luma;
      }

      lumas.push(sum / this.PUZZLE_GAP);
    }

    const n = 2; // minium macroscopic image width (px)
    const margin = patchWidth - this.PUZZLE_PAD;
    const diff = 20; // macroscopic brightness difference
    const radius = this.PUZZLE_PAD;
    for (let i = 0, len = lumas.length - 2 * 4; i < len; i++) {
      const left = (lumas[i] + lumas[i + 1]) / n;
      const right = (lumas[i + 2] + lumas[i + 3]) / n;
      const mi = margin + i;
      const mLeft = (lumas[mi] + lumas[mi + 1]) / n;
      const mRigth = (lumas[mi + 2] + lumas[mi + 3]) / n;

      if (left - right > diff && mLeft - mRigth < -diff) {
        const pieces = lumas.slice(i + 2, margin + i + 2);
        const median = pieces.sort((x1, x2) => x1 - x2)[20];
        const avg = Math.avg(pieces);

        // noise reducation
        if (median > left || median > mRigth) return;
        if (avg > 100) return;
        // console.table({left,right,mLeft,mRigth,median});
        // ctx.fillRect(i+n-radius, 0, 1, 360);
        // console.log(i+n-radius);
        return i + n - radius;
      }
    }

    // not found
    return -1;
  }

  runWithCanvas() {
    const { createCanvas, Image } = require('canvas');
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');
    const imgBg = new Image();
    const imgPatch = new Image();
    const prefix = 'data:image/png;base64,';

    imgBg.src = prefix + this.rawBg;
    imgPatch.src = prefix + this.rawPatch;
    const { naturalWidth: w, naturalHeight: h } = imgBg;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgBg, 0, 0, w, h);

    const width = w;
    const { naturalWidth, naturalHeight } = imgPatch;
    const posY = this.y + this.PUZZLE_PAD + (naturalHeight - this.PUZZLE_PAD) / 2 - this.PUZZLE_GAP / 2;
    // const cData = ctx.getImageData(0, a.y + 10 + 20 - 4, 360, 8).data;
    const cData = ctx.getImageData(0, posY, width, this.PUZZLE_GAP).data;
    const lumas = [];

    for (let x = 0; x < width; x++) {
      var sum = 0;

      // y xais
      for (let y = 0; y < this.PUZZLE_GAP; y++) {
        var idx = x * 4 + y * (width * 4);
        var r = cData[idx];
        var g = cData[idx + 1];
        var b = cData[idx + 2];
        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        sum += luma;
      }

      lumas.push(sum / this.PUZZLE_GAP);
    }

    const n = 2; // minium macroscopic image width (px)
    const margin = naturalWidth - this.PUZZLE_PAD;
    const diff = 20; // macroscopic brightness difference
    const radius = this.PUZZLE_PAD;
    for (let i = 0, len = lumas.length - 2 * 4; i < len; i++) {
      const left = (lumas[i] + lumas[i + 1]) / n;
      const right = (lumas[i + 2] + lumas[i + 3]) / n;
      const mi = margin + i;
      const mLeft = (lumas[mi] + lumas[mi + 1]) / n;
      const mRigth = (lumas[mi + 2] + lumas[mi + 3]) / n;

      if (left - right > diff && mLeft - mRigth < -diff) {
        const pieces = lumas.slice(i + 2, margin + i + 2);
        const median = pieces.sort((x1, x2) => x1 - x2)[20];
        const avg = Math.avg(pieces);

        // noise reducation
        if (median > left || median > mRigth) return;
        if (avg > 100) return;
        // console.table({left,right,mLeft,mRigth,median});
        // ctx.fillRect(i+n-radius, 0, 1, 360);
        // console.log(i+n-radius);
        return i + n - radius;
      }
    }

    // not found
    return -1;
  }
};
