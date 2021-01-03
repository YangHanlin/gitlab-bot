/* eslint valid-jsdoc: "off" */

'use strict';

const process = require('process');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1609654761717_8076';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  userConfig.gitlab = {
    host: process.env.GITLAB_HOST,
    token: process.env.GITLAB_PERSONAL_ACCESS_TOKEN,
    oauthToken: process.env.GITLAB_OAUTH_TOKEN,
    requestTimeout: process.env.GITLAB_REQUEST_TIMEOUT,
  };

  return {
    ...config,
    ...userConfig,
  };
};
