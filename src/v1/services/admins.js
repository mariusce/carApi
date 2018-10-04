const mongooseService = require('feathers-mongoose-advanced');
const Admin = require('../../models/admin');
const hooks = require('./admins-hooks');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  app.use('/admins', mongooseService({
    name: 'admins',
    Model: Admin,
    paginate: paginate
  }));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('admins');
  service.hooks(hooks);
};
