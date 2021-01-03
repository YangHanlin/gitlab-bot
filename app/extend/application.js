'use strict';

const { Gitlab } = require('@gitbeaker/node');

const GITBEAKER = Symbol('Application#gitbeaker');

module.exports = {
  get gitbeaker() {
    if (!this[GITBEAKER]) {
      this[GITBEAKER] = new Gitlab({
        ...this.config.gitlab,
      });
    }
    return this[GITBEAKER];
  },
};
