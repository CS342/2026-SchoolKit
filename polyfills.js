// Polyfill for Array.prototype.toReversed (ES2023)
// Required for Node.js < 20
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return this.slice().reverse();
  };
}

// Polyfill for Array.prototype.toSorted (ES2023)
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return this.slice().sort(compareFn);
  };
}

// Polyfill for Array.prototype.toSpliced (ES2023)
if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function(start, deleteCount, ...items) {
    const copy = this.slice();
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}

// Polyfill for Array.prototype.with (ES2023)
if (!Array.prototype.with) {
  Array.prototype.with = function(index, value) {
    const copy = this.slice();
    copy[index] = value;
    return copy;
  };
}
