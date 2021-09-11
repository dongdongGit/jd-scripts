const PNG = require('png-js');

module.exports = class PNGDecoder extends PNG {
  constructor(args) {
    super(args);
    this.pixels = [];
  }

  decodeToPixels() {
    return new Promise((resolve) => {
      try {
        this.decode((pixels) => {
          this.pixels = pixels;
          resolve();
        });
      } catch (e) {
        console.info(e);
      }
    });
  }

  getImageData(x, y, w, h) {
    const { pixels } = this;
    const len = w * h * 4;
    const startIndex = x * 4 + y * (w * 4);

    return { data: pixels.slice(startIndex, startIndex + len) };
  }
};
