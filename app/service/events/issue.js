'use strict';

const { Service } = require('egg');

class IssueService extends Service {
  async index() {
    const { ctx, app } = this;
    app.logger.info(`Request ${ctx.requestId} is being processed by the issue service`);
    if (await ctx.service.utilities.checkBotBanned()) {
      return;
    }

    const { iid: issueIid } = ctx.request.body.object_attributes;
    const projectId = ctx.request.body.project.id;

    // Perform convention check
    const taskId = `issue-convention-check:${projectId}#${issueIid}`;
    if (app.registerOngoingTask(taskId)) {
      const timeout = app.config.issue.conventionCheckTimeout;
      app.logger.info(`Going to perform issue convention check of ${projectId}#${issueIid} in ${timeout} second(s)`);
      ctx.runInBackground(async () => {
        await ctx.helper.wait(timeout * 1000);
        await this.checkIssueConventions(projectId, issueIid);
        app.removeOngoingTask(taskId);
      });
    } else {
      app.logger.info('An issue convention check is ongoing; skipping this time');
    }
  }

  async filterMetadata(metadata, projectId, issueIid) {
    const { app } = this;
    const { username: botUsername } = await app.gitbeaker.Users.current();
    const comments = await app.gitbeaker.IssueNotes.all(projectId, issueIid);
    let existentTipIds = [];
    comments.forEach(comment => {
      if (comment.author.username === botUsername) {
        // Try extracting metadata from commented section in previous comments
        const metadataMatch = comment.body.match(/<!--\s*GITLAB-BOT-METADATA\s*(.*?)\s*GITLAB-BOT-METADATA\s*-->/);
        if (metadataMatch) {
          const { notifiedUsername, tipIds } = JSON.parse(metadataMatch[1]);
          if (notifiedUsername === metadata.notifiedUsername) {
            existentTipIds = existentTipIds.concat(tipIds);
          }
        }
      }
    });
    metadata.tipIds = metadata.tipIds.filter(tipId => !existentTipIds.includes(tipId));
  }

  async checkIssueConventions(projectId, issueIid) {
    const { app } = this;
    app.logger.info(`Performing issue convention check of ${projectId}#${issueIid}`);

    // Acquire basic information

    const issue = await app.gitbeaker.Issues.show(projectId, issueIid);

    const notifiedUsername = issue.assignees.length > 0 ? issue.assignees[0].username : issue.author.username;
    const tips = {};

    // Check whether the issue has been "touched"
    const { labels, milestone, assignees, merge_requests_count } = issue;
    const { time_estimate, total_time_spent } = issue.time_stats;
    const touchedConditions = [
      () => labels.includes('Doing'),
      () => assignees.length > 0,
      () => merge_requests_count > 0,
      () => total_time_spent > 0,
      () => issue.state === 'closed',
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
        tips['missing-milestone'] = '当前 Issue 没有关联 Milestone，请注意关联相关的 Milestone';
      }
      // Check whether time estimate is missing
      if (time_estimate === 0) {
        tips['missing-estimate'] = '当前 Issue 似乎还没有预估时间，请通过 `/estimate` 预估时间';
      }
      // Check whether assignees are missing
      if (issue.assignees.length === 0) {
        tips['missing-assignees'] = '当前 Issue 似乎还没有负责人 (Assignee)，请指定负责人';
      }
    }

    if (issue.state === 'closed') {
      app.logger.info('This issue has been closed; checking if it conforms to the convention');

      // Check whether spent time is missing
      if (total_time_spent === 0) {
        tips['missing-spent'] = '当前 Issue 还没有记录花费的时间，请通过 `/spend` 记录时间';
      }
    }

    const metadata = {
      version: 1,
      notifiedUsername,
      tipIds: Object.keys(tips),
    };

    app.logger.info(`Procedures above have produced ${metadata.tipIds.length} tip(s)`);
    app.logger.debug('Metadata being filtered =', metadata);

    await this.filterMetadata(metadata, projectId, issueIid);

    app.logger.info(`Filters have left out ${metadata.tipIds.length} tip(s)`);
    app.logger.debug('Metadata filtered =', metadata);

    if (metadata.tipIds.length > 0) {
      app.logger.info('Sending tips');
      const messages = [];
      messages.push('<!-- GITLAB-BOT-METADATA\n' + JSON.stringify(metadata) + '\n     GITLAB-BOT-METADATA -->');
      messages.push('@' + metadata.notifiedUsername);
      messages.push(metadata.tipIds.map(tipId => '- ' + tips[tipId]).join('\n'));
      const messageText = messages.join('\n\n');
      await app.gitbeaker.IssueNotes.create(projectId, issueIid, messageText);
    } else {
      app.logger.info('There are no tips to be sent');
    }
  }
}

module.exports = IssueService;
