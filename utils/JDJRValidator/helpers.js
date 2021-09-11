function getCoordinate(c) {
  function string10to64(d) {
    var c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-~'.split(''),
      b = c.length,
      e = +d,
      a = [];
    do {
      mod = e % b;
      e = (e - mod) / b;
      a.unshift(c[mod]);
    } while (e);
    return a.join('');
  }

  function prefixInteger(a, b) {
    return (Array(b).join(0) + a).slice(-b);
  }

  function pretreatment(d, c, b) {
    var e = string10to64(Math.abs(d));
    var a = '';
    if (!b) {
      a += d > 0 ? '1' : '0';
    }
    a += prefixInteger(e, c);
    return a;
  }

  var b = new Array();
  for (var e = 0; e < c.length; e++) {
    if (e == 0) {
      b.push(pretreatment(c[e][0] < 262143 ? c[e][0] : 262143, 3, true));
      b.push(pretreatment(c[e][1] < 16777215 ? c[e][1] : 16777215, 4, true));
      b.push(pretreatment(c[e][2] < 4398046511103 ? c[e][2] : 4398046511103, 7, true));
    } else {
      var a = c[e][0] - c[e - 1][0];
      var f = c[e][1] - c[e - 1][1];
      var d = c[e][2] - c[e - 1][2];
      b.push(pretreatment(a < 4095 ? a : 4095, 2, false));
      b.push(pretreatment(f < 4095 ? f : 4095, 2, false));
      b.push(pretreatment(d < 16777215 ? d : 16777215, 4, true));
    }
  }
  return b.join('');
}

module.exports = {
  getCoordinate,
};
