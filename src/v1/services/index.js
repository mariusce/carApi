// const authentication = require('./authentication');
// const clients = require('./clients');
// const agents = require('./agents');
// const offers = require('./offers');
//
// const claims = require('./claims');
// const products = require('./products');
// const providers = require('./providers');
const admins = require('./admins');
const users = require('./users');
const authentication = require('./authentication');

module.exports = function (app) {
  app.configure(authentication);
  app.configure(users);
  app.configure(admins);
};
