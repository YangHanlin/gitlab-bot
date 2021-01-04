'use strict';

const { Service } = require('egg');

class MergeRequestService extends Service {
  async index() {
    const { ctx } = this;
    ctx.status = 501;
    ctx.body.error = 'Features related to merge request are not implemented yet';
    delete ctx.body.message;
  }
}

module.exports = MergeRequestService;
