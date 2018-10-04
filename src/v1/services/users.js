const mongooseService = require('feathers-mongoose-advanced');
const User = require('../../models/user');
const hooks = require('./users-hooks');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  app.use('/users', mongooseService({
    name: 'users',
    Model: User,
    paginate: paginate
  }));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('users');
  service.hooks(hooks);
};
