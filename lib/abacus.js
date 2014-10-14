module.exports = {
  log2: function (x) {
    return Math.log(x) / Math.LN2;
  },

  entropy: function (yays, nays) {
    var sum = yays + nays;
    var y = yays / sum;
    var n = nays / sum;
    return - (y * this.log2(y)) - (n * this.log2(n));
  }
};