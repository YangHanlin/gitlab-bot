'use strict';

const { Controller } = require('egg');
const { v4: uuid } = require('uuid');

const IssuesController = require('./issues');

const CONTROLLERS_PER_EVENT = {
  'Issue Hook': IssuesController,
};

class CallbackController extends Controller {
  async index() {
    const { ctx, app } = this;
    const requestId = uuid();
    ctx.requestId = requestId;
    const expectedToken = app.config.webhookSecretToken;
    if (expectedToken) {
      const token = ctx.get('X-Gitlab-Token');
      if (token !== expectedToken) {
        ctx.body = {
          error: 'Incorrect webhook secret token',
          requestId,
        };
        ctx.status = 403;
        return;
      }
    }
    const eventType = ctx.get('X-Gitlab-Event');
    if (!eventType) {
      ctx.body = {
        error: 'Missing event type',
        requestId,
      };
      ctx.status = 400;
      return;
    }
    const SpecificController = CONTROLLERS_PER_EVENT[eventType];
    if (!SpecificController) {
      ctx.body = {
        error: `Handler for event type '${eventType}' is not found`,
        requestId,
      };
      ctx.status = 404;
    } else {
      console.log('found');
      return new SpecificController().index();
    }
  }
}

module.exports = CallbackController;
