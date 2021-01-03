'use strict';

const { Controller } = require('egg');

class IssuesController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.status = 202;
    ctx.body = {
      requestId: ctx.requestId,
    };
  }
}

module.exports = IssuesController;
