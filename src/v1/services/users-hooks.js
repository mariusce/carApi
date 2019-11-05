const errors = require('@feathersjs/errors');
const authenticate = require('../../hooks/authenticate');
const hashPassword = require('../../hooks/hash-password');
const validateBody = require('../../hooks/validate-body');
const registerToXmppServer = require('../../hooks/register-to-xmpp-server');
const config = require('../../core/config');
const jwt = require('jsonwebtoken');
const pushNotification = require('../../core/notification');

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
    passwordCheck : {
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
    phone: {
      type: 'string',
      minLength: 0,
    },
    email: {
      type: 'string',
      minLength: 3
    }
  },
  required: ['carNumber', 'password', 'passwordCheck', 'email']
};

const getOfflineMsgFromEjabberd = () => {
  return hook => {
    let session = hook.params.session;
    session.logInfo(`Got offline message "${hook.data.body}" from ${hook.data.from} to ${hook.data.to}, vhost ${hook.data.vhost}`);
    pushNotification(hook.data);
    return Promise.resolve(hook);
  }
};

module.exports = {
  before: {
    all: [],
    find: [authenticate({types: ['admin', 'user']})],
    get: [authenticate({types: ['admin', 'user']})],
    create: [
      getOfflineMsgFromEjabberd(),
      validateBody(createSchema),
      authenticate({exist: false, types: ['admin', 'user']}),
      hashPassword(),
      hook => {
        if (!hook.data.carNumber && hook.params.authentication) {
          hook.data.carNumber = hook.params.authentication.decoded.carNumber;
        }
        return Promise.resolve(hook);
      },
    ],
    update: [() => {return Promise.reject(new errors.MethodNotAllowed());}],
    patch: [
      authenticate({types: ['admin', 'user']}),
      hashPassword(),
      hook => {
        return Promise.resolve(hook);
      },
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
          exist:  true,
          userId: hook.result._id,
          type:   hook.params.authentication.decoded.type
        };
        hook.result.accessToken = jwt.sign(payload, config.get('authentication').secret, config.get('authentication').jwt);
        return Promise.resolve(hook);
      },
      registerToXmppServer(),
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
