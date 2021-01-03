'use strict';

const { Service } = require('egg');

class UtilityService extends Service {
  async checkBotBanned(labels) {
    const { ctx, app } = this;
    if (labels === undefined) {
      labels = ctx.request.body.labels;
    }
    if (!labels) {
      throw new Error('Label list is empty or undefined; it must be passed as an argument when not included in request body');
    }
    for (const label of labels) {
      if (label.title === app.config.bot.banLabel) {
        ctx.status = 200;
        ctx.body.message = `This entity is labeled '${label.title}' and will be ignored by the bot`;
        return true;
      }
    }
    return false;
  }
}

module.exports = UtilityService;
