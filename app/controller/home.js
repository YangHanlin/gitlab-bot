'use strict';

const Controller = require('egg').Controller;
const fetch = require('node-fetch');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const greetings = [];
    const name = ctx.query.name || 'Misaka Mikoto';
    greetings.push(`Welcome, ${name}`);
    return fetch('https://ip.tdirc.workers.dev', {
      headers: {
        Accept: 'application/json',
      },
    })
      .then(resp => resp.json())
      .then(data => {
        const { ip, region } = data;
        greetings.push(`The server is deployed with IP ${ip} located in ${region}`);
        ctx.status = 200;
        ctx.body = { greetings };
      })
      .catch(err => {
        ctx.status = 200;
        ctx.body = {
          greetings,
          err,
        };
      });
  }
}

module.exports = HomeController;
