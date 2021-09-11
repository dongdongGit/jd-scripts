module.exports = class MousePosFaker {
  constructor(puzzleX) {
    const HZ = 5;
    this.x = parseInt(Math.random() * 20 + 20, 10);
    this.y = parseInt(Math.random() * 80 + 80, 10);
    this.t = Date.now();
    this.pos = [[this.x, this.y, this.t]];
    this.minDuration = parseInt(1000 / HZ, 10);
    // this.puzzleX = puzzleX;
    this.puzzleX = puzzleX + parseInt(Math.random() * 2 - 1, 10);

    this.STEP = parseInt(Math.random() * 6 + 5, 10);
    this.DURATION = parseInt(Math.random() * 7 + 14, 10) * 100;
    // [9,1600] [10,1400]
    this.STEP = 9;
    // this.DURATION = 2000;
    // console.log(this.STEP, this.DURATION);
  }

  run() {
    const perX = this.puzzleX / this.STEP;
    const perDuration = this.DURATION / this.STEP;
    const firstPos = [this.x - parseInt(Math.random() * 6, 10), this.y + parseInt(Math.random() * 11, 10), this.t];

    this.pos.unshift(firstPos);
    this.stepPos(perX, perDuration);
    this.fixPos();

    const reactTime = parseInt(60 + Math.random() * 100, 10);
    const lastIdx = this.pos.length - 1;
    const lastPos = [this.pos[lastIdx][0], this.pos[lastIdx][1], this.pos[lastIdx][2] + reactTime];

    this.pos.push(lastPos);
    return this.pos;
  }

  stepPos(x, duration) {
    let n = 0;
    const sqrt2 = Math.sqrt(2);
    for (let i = 1; i <= this.STEP; i++) {
      n += 1 / i;
    }
    for (let i = 0; i < this.STEP; i++) {
      x = this.puzzleX / (n * (i + 1));
      const currX = parseInt(Math.random() * 30 - 15 + x, 10);
      const currY = parseInt(Math.random() * 7 - 3, 10);
      const currDuration = parseInt((Math.random() * 0.4 + 0.8) * duration, 10);

      this.moveToAndCollect({
        x: currX,
        y: currY,
        duration: currDuration,
      });
    }
  }

  fixPos() {
    const actualX = this.pos[this.pos.length - 1][0] - this.pos[1][0];
    const deviation = this.puzzleX - actualX;

    if (Math.abs(deviation) > 4) {
      this.moveToAndCollect({
        x: deviation,
        y: parseInt(Math.random() * 8 - 3, 10),
        duration: 250,
      });
    }
  }

  moveToAndCollect({ x, y, duration }) {
    let movedX = 0;
    let movedY = 0;
    let movedT = 0;
    const times = duration / this.minDuration;
    let perX = x / times;
    let perY = y / times;
    let padDuration = 0;

    if (Math.abs(perX) < 1) {
      padDuration = duration / Math.abs(x) - this.minDuration;
      perX = 1;
      perY = y / Math.abs(x);
    }

    while (Math.abs(movedX) < Math.abs(x)) {
      const rDuration = parseInt(padDuration + Math.random() * 16 - 4, 10);

      movedX += perX + Math.random() * 2 - 1;
      movedY += perY;
      movedT += this.minDuration + rDuration;

      const currX = parseInt(this.x + movedX, 10);
      const currY = parseInt(this.y + movedY, 10);
      const currT = this.t + movedT;

      this.pos.push([currX, currY, currT]);
    }

    this.x += x;
    this.y += y;
    this.t += Math.max(duration, movedT);
  }
};
