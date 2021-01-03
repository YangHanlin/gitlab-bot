'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // Test endpoint to confirm the server is up and running
  router.get('/', controller.home.index);

  // GitLab webhook callbacks
  router.post('/callback', controller.callback.home.index);
  router.post('/callback/event/all', controller.callback.home.index);
};
