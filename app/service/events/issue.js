'use strict';

const { Service } = require('egg');

class IssueService extends Service {
  async index() {
    const { ctx } = this;
    if (await ctx.service.utilities.checkBotBanned()) {
      return;
    }
    ctx.runInBackground(async ctx => {
      const { app } = this;
      const { username } = await app.gitbeaker.Users.current();
      const { action, iid: issueId } = ctx.request.body.object_attributes;
      const projectId = ctx.request.body.project.id;
      const senderUsername = ctx.request.body.user.username;
      if (action === 'open' || action === 'update') {
        const { title, description } = ctx.request.body.object_attributes;
        const regex = new RegExp(`@${username}`);
        if (title.match(regex) || description.match(regex)) {
          app.gitbeaker.IssueNotes.create(projectId, issueId, `@${senderUsername} 你吼那么大声干吗嘛`);
        }
      }
    });
  }
}

module.exports = IssueService;
