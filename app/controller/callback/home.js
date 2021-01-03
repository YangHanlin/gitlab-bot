'use strict';

const { Controller } = require('egg');

const CONTROLLERS_PER_EVENT = {};

class CallbackController extends Controller {
  async index() {
    const { ctx, app } = this;
    const expectedToken = app.config.webhookSecretToken;
    if (expectedToken) {
      const token = ctx.get('X-Gitlab-Token');
      if (token !== expectedToken) {
        ctx.body = {
          error: 'Incorrect webhook secret token',
        };
        ctx.status = 403;
        return;
      }
    }
    const eventType = ctx.get('X-Gitlab-Event');
    if (!eventType) {
      ctx.body = {
        error: 'Missing event type',
      };
      ctx.status = 400;
      return;
    }
    const SpecificController = CONTROLLERS_PER_EVENT[eventType];
    if (!SpecificController) {
      ctx.body = {
        error: `Handler for event type '${eventType}' is not found`,
      };
      ctx.status = 404;
    } else {
      console.log('found');
      return new SpecificController().index();
    }
  }
}

module.exports = CallbackController;
