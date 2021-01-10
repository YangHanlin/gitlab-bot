'use strict';

const { Gitlab } = require('@gitbeaker/node');

const GITBEAKER = Symbol('Application#gitbeaker');
const STORE = Symbol('Application#store');

module.exports = {
  get gitbeaker() {
    if (!this[GITBEAKER]) {
      this[GITBEAKER] = new Gitlab({
        ...this.config.gitlab,
      });
    }
    return this[GITBEAKER];
  },

  get store() {
    if (!this[STORE]) {
      this[STORE] = {
        ongoing: [],
      };
    }
    return this[STORE];
  },

  registerOngoingTask(taskId) {
    if (this.store.ongoing.includes(taskId)) {
      return false;
    }
    this.store.ongoing.push(taskId);
    return true;
  },

  removeOngoingTask(taskId) {
    if (this.store.ongoing.includes(taskId)) {
      this.store.ongoing = this.store.ongoing.filter(id => id !== taskId);
      return true;
    }
    return false;
  },
};
