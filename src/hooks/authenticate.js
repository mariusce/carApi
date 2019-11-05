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
      // existing user (we can search it by car number or by id)
      if (!decoded.carNumber && !decoded.userId) {
        session.logWarning('Authentication error. Missing token userId');
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid token']));
      }
      if (decoded.userId) {
        userFindPromise = model.find({_id: ObjectId(decoded.userId)});
      }
      if (decoded.carNumber) {
        userFindPromise = model.find({carNumber: decoded.carNumber});
      }
    } else {
      // new user (we need car number)
      if (!decoded.carNumber) {
        session.logWarning('Authentication error. Missing token car number');
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid token']));
      }
      userFindPromise = model.find({carNumber: decoded.carNumber});
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
