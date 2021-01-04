'use strict';

const { Service } = require('egg');

class IssueService extends Service {
  async index() {
    const { ctx, app } = this;
    app.logger.info(`Request ${ctx.requestId} is being processed by the issue service`);
    if (await ctx.service.utilities.checkBotBanned()) {
      return;
    }
    ctx.runInBackground(async ctx => {
      // Acquire basic information
      // const { username } = await app.gitbeaker.Users.current();
      const { action, iid: issueIid } = ctx.request.body.object_attributes;
      const projectId = ctx.request.body.project.id;
      // const changes = ctx.request.body.changes;
      const issue = await app.gitbeaker.Issues.show(projectId, issueIid);

      const notifiedUsername = issue.assignees.length > 0 ? issue.assignees[0].username : issue.author.username;
      const tips = {};

      if (action === 'open' || action === 'update') {
        app.logger.info('This issue is recently opened or updated');

        // Check whether the issue has been "touched"
        const { labels, milestone, assignees, merge_requests_count } = issue;
        const { time_estimate } = issue.time_stats;
        const touchedConditions = [
          () => labels.includes('Doing'),
          () => assignees.length > 0,
          () => merge_requests_count > 0,
        ];
        let touched = false;

        for (const condition of touchedConditions) {
          if (condition()) {
            touched = true;
            break;
          }
        }
        if (touched) {
          app.logger.info('This issue seems to be "touched"; checking if it conforms to the convention');

          // Check whether priority labels are correct
          const priorityLabels = labels.filter(label => label.startsWith('优先级：'));
          if (priorityLabels.length === 0) {
            tips['missing-priority-label'] = '当前 Issue 没有优先级相关 Label，请注意设定优先级';
          } else if (priorityLabels.length > 1) {
            tips['too-many-priority-label'] = '当前 Issue 优先级 Label 相互冲突，请注意设定优先级';
          }
          // Check whether milestone is missing
          if (!milestone) {
            tips['missing-milestone'] = '当前 Issue 没有关联 Milestone，请尽快关联相关的 Milestone';
          }
          // Check whether time estimate is missing
          if (time_estimate === 0) {
            tips['missing-estimate'] = '当前 Issue 似乎还没有预估时间，请尽快通过 `/estimate` 预估时间';
          }
        }
      }

      const metadata = {
        version: 1,
        notifiedUsername,
        tipIds: Object.keys(tips),
      };

      app.logger.info(`Procedures above have produced ${metadata.tipIds.length} tip(s)`);
      app.logger.debug('Metadata being filtered =', metadata);

      // TODO Add some filter to avoid repeated notifications

      app.logger.debug('Metadata filtered =', metadata);

      if (metadata.tipIds.length > 0) {
        app.logger.info('Sending tips');
        const messages = [];
        messages.push('@' + metadata.notifiedUsername);
        messages.push(metadata.tipIds.map(tipId => '- ' + tips[tipId]).join('\n'));
        messages.push('<!-- GITLAB-BOT-METADATA\n' + JSON.stringify(metadata) + '\nGITLAB-BOT-METADATA -->');
        const messageText = messages.join('\n\n');
        await app.gitbeaker.IssueNotes.create(projectId, issueIid, messageText);
      } else {
        app.logger.info('There are no tips to be sent');
      }
    });
  }
}

module.exports = IssueService;
