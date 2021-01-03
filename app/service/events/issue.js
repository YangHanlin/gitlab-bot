'use strict';

const { Service } = require('egg');

class IssueService extends Service {
  async index() {
    const { ctx } = this;
    if (await ctx.service.utilities.checkBotBanned()) {
      return;
    }
  }
}

module.exports = IssueService;
