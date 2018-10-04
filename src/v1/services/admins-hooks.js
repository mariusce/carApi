const errors = require('@feathersjs/errors');
const authenticate = require('../../hooks/authenticate');

module.exports = {
  before: {
    all: [authenticate({types: ['admin']})],
    find: [],
    get: [],
    create: [],
    update: [() => {return Promise.reject(new errors.MethodNotAllowed());}],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
