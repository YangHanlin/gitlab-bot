'use strict';

const { Controller } = require('egg');
const { v4: uuid } = require('uuid');

const SERVICES = {
  'Issue Hook': 'issue',
  'Merge Request Hook': 'mr',
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
    const service = SERVICES[eventType];
    if (!service) {
      ctx.body = {
        error: `Handler for event type '${eventType}' is not found`,
        requestId,
      };
      ctx.status = 404;
    } else {
      ctx.body = {
        message: 'This request is being processed by the server',
        requestId,
      };
      ctx.status = 202;
      return ctx.service.events[service].index();
    }
  }
}

module.exports = CallbackController;
