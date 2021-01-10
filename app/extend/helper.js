'use strict';

module.exports = {
  wait(milliseconds) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  },
};
