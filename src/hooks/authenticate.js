const errors = require('@feathersjs/errors');
const _ = require('lodash');
const config = require('../core/config');
const User = require('../models/user');
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = (options) => {
  return hook => {
    let session = hook.params.session;
    let token = session.req.headers['authorization'];
    let userFindPromise = Promise.resolve(undefined);
    let decoded = undefined;
    let model = User;

    console.log('options is: ' + JSON.stringify(options));
    if (options) {
      if (!options.hasOwnProperty('exist')) {
        options.exist = true;
      }
      options.types = options.types || ['user'];
    } else {
      options = {
        exist: true,
        types: ['user']
      };
    }

    // verify token
    if (token) {
      try {
        decoded = jwt.verify(token,  config.get('authentication').secret);
        if (!_.includes(options.types, decoded.type)) {
          session.logWarning('Authentication error. Not enough permissions');
          return Promise.reject(new errors.Forbidden('Authentication error', ['Not enough permissions']));
        }
      } catch(err) {
        session.logWarning(`Authentication error. ${JSON.stringify(err)}`);
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid token']));
      }
    } else {
      session.logWarning('Authentication error. Token is missing');
      return Promise.reject(new errors.Forbidden('Authentication error', ['Token is missing']));
    }
    switch (decoded.type) {
    case 'admin':
      model = Admin;
      break;
    default:
      model = User;
      break;
    }

    if (options.exist) {
      // existing user (we can search it by phone or by id)
      if (!decoded.phone && !decoded.userId) {
        session.logWarning('Authentication error. Missing token userId');
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid token']));
      }
      if (decoded.userId) {
        userFindPromise = model.find({_id: ObjectId(decoded.userId)});
      }
      if (decoded.phone) {
        userFindPromise = model.find({phone: decoded.phone});
      }
    } else {
      // new user (we need phone number)
      if (!decoded.phone) {
        session.logWarning('Authentication error. Missing token phone');
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid token']));
      }
      userFindPromise = model.find({phone: decoded.phone});
    }
    return userFindPromise.then(user => {
      if (options.exist && _.isEmpty(user)) {
        session.logWarning('Authentication error. User not found');
        return Promise.reject(new errors.Forbidden('Authentication error', ['User not found']));
      }
      if (!options.exist && !_.isEmpty(user)) {
        session.logWarning(`Authentication error. User already exist. ${JSON.stringify(user)}`);
        return Promise.reject(new errors.Forbidden('Authentication error', ['User already exist']));
      }
      hook.params.user = user;
      hook.params.authentication = {
        decoded: decoded,
        token: token
      };
      return Promise.resolve(hook);
    });
  };
};
