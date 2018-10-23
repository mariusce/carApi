const errors = require('@feathersjs/errors');
const authenticate = require('../../hooks/authenticate');
const hashPassword = require('../../hooks/hash-password');
const validateBody = require('../../hooks/validate-body');
const config = require('../../core/config');
const jwt = require('jsonwebtoken');

const createSchema = {
  type: 'object',
  properties: {
    carNumber : {
      type: 'string',
      minLength: 6
    },
    password : {
      type: 'string',
      minLength: 4
    },
    firstName : {
      type: 'string',
      minLength: 0
    },
    lastName : {
      type: 'string',
      minLength: 0
    },
    email: {
      type: 'string',
      minLength: 0
    }
  },
  required: ['carNumber', 'password']
};

module.exports = {
  before: {
    all: [],
    find: [authenticate({types: ['admin', 'user']})],
    get: [authenticate({types: ['admin', 'user']})],
    create: [
      authenticate({exist: false, types: ['admin', 'user']}),
      hashPassword(),
      hook => {
        if (!hook.data.phone && hook.params.authentication) {
          hook.data.phone = hook.params.authentication.decoded.phone;
        }
        return Promise.resolve(hook);
      },
      validateBody(createSchema)
    ],
    update: [() => {return Promise.reject(new errors.MethodNotAllowed());}],
    patch: [
      authenticate({types: ['admin', 'user']}),
      hashPassword()
    ],
    remove: [authenticate({types: ['admin', 'user']})]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      hook => {
        let payload = {
          exist: true,
          userId: hook.result._id
        };
        hook.result.accessToken = jwt.sign(payload, config.get('authentication').secret, config.get('authentication').jwt);
        return Promise.resolve(hook);
      }
    ],
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
