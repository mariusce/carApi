const errors = require('@feathersjs/errors');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const hooks = require('./authentication-hooks');
const sms = require('../../core/sms');
const crypto = require('../../core/crypto');
const {hasher} = require('../../core/crypto');
const User = require('../../models/user');
const Admin = require('../../models/admin');
const config = require('../../core/config');
const sgMail = require('@sendgrid/mail');
const stropheChangePassword = require('../../hooks/strophe-change-password');

sgMail.setApiKey(config.get('sendgrid').apiKey);

//TODO: Move next to redis
let Cache = {};
const setObj = (key, obj) => {
  if (obj === undefined) {
    delete Cache[key];
  } else {
    Cache[key] = obj;
  }
};
const getObj = (key) => {
  return Cache[key];
};

const generateAuthenticationCode = (params) => {
  let session = params.session;
  let phone = params.query.phone;
  let exist = JSON.parse(params.query.exist);
  let now = moment();
//  let code = Math.floor(1000 + Math.random() * 9000).toString();
  let code = '1234';
  let model = undefined;
  session.logWarning('called generateAuthenticationCode');
  switch (params.query.type) {
    case 'admin':
      model = Admin;
      break;
    default:
      model = User;
      break;
  }
  return model.findOne({phone: phone}).then(user => {
    if (exist && !user) {
      session.logWarning('User not found');
      return Promise.reject(new errors.NotFound('User not found'));
    } else if (!exist && user) {
      session.logWarning('User already exist');
      return Promise.reject(new errors.BadRequest('User already exist'));
    } else {
      let entry = getObj(phone);
      if (entry) {
        let end = entry.timestamp.add(2, 'minutes');
        if (now.isAfter(end)) {
          setObj(phone, {code: code, timestamp: now, exist: exist});
          entry = {code: code, timestamp: now, exist: exist };
        }
      } else {
        entry = { code: code, timestamp: now, exist: exist};
        setObj(phone, entry);
      }
      return sms.send(phone, entry.code, session).then( ()=> {
        return Promise.resolve({});
      });
    }
  });
};

const authenticatePhone = (data, params) => {
  let session = params.session;
  let phone = data.id;
  let code = data.secret;
  let now = moment();
  let entry = getObj(phone);
  session.logWarning('called authenticatePhone');
  if (entry) {
    let end = entry.timestamp.add(5, 'minutes');
    if (now.isBefore(end) && (entry.code === code)) {
      setObj(phone, undefined);
      let model = undefined;
      switch (params.query.type) {
        case 'admin':
          model = Admin;
          break;
        default:
          model = User;
          break;
      }
      return model.findOne({phone: phone}).then(user => {
        if (entry.exist && !user) {
          session.logWarning('User not found');
          return Promise.reject(new errors.NotFound('User not found'));
        }
        if (!entry.exist && user) {
          session.logWarning('User already exist');
          return Promise.reject(new errors.BadRequest('User already exist'));
        }
        let payload = {
          exist: entry.exist,
          type:  params.query.type || 'user'
        };
        if (entry.exist) {
          payload.userId = user._id.toString();
        } else {
          payload.phone = phone;
        }
        let token = jwt.sign(payload, config.get('authentication').secret, config.get('authentication').jwt);
        return Promise.resolve({accessToken:token});
      });
    } else {
      session.logWarning('Authentication error, Invalid code');
      return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid code']));
    }
  } else {
    return Promise.reject(new errors.NotFound({}));
  }
};

const authenticatePassword = (data, params) => {
  let session = params.session;
  let password = data.secret;
  let carNumber = data.id;
  let now = moment();
  let entry = getObj(carNumber);
  session.logWarning('called authenticatePassword');
  if (!password) {
    return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid id/secret']));
  }
  let model = undefined;
  let query = {email: data.id};
  switch (params.query.type) {
  case 'admin':
    model = Admin;
    break;
  default:
    query = {carNumber : data.id};
    model = User;
    break;
  }

  return model.findOne(query).then(user => {
    if (!user) {
      session.logWarning('User not found');
      // return Promise.reject(new errors.NotFound('User not found'));
      let payload = {
        exist: false,
        type:  params.query.type || 'user',
        carNumber: carNumber
      };
      let token = jwt.sign(payload, config.get('authentication').secret, config.get('authentication').jwt);
      return Promise.resolve({accessToken:token, exists: false});
    } else {
      return crypto.compare(password, user.password).then(ok => {
        if (ok) {
          let payload = {
            exist: true,
            type:  params.query.type || 'user'
          };
          payload.userId = user._id.toString();
          let token = jwt.sign(payload, config.get('authentication').secret, config.get('authentication').jwt);
          return Promise.resolve({accessToken:token, exists: true});
        } else {
          return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid id/secret']));
        }
      }).catch(() => {
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid id/secret']));
      });
    }
  });
};

const doesUserExist = (params) => {
  let carNumber = params.query.carNumber;
  let session = params.session;

  return User.findOne({carNumber: carNumber}).then(user => {
    if (!user) {
      session.logInfo('User does not exist');
      let payload = {
        exist: false,
        type:  'user',
        carNumber: carNumber
      };
      let token = jwt.sign(payload, config.get('authentication').secret, config.get('authentication').jwt);
      return Promise.resolve({accessToken:token, exists: false});
    } else {
      return Promise.resolve({exists: true});
    }
  }).catch(() => {
    return Promise.reject(new errors.GeneralError('Failed to get user'));
  });
};

const sendPasswordRecoveryMail = (params) => {
  let carNumber = params.query.carNumber;
  let session = params.session;

  return User.findOne({carNumber: carNumber}).then(user => {
    if (!user) {
      session.logWarning('User not found');
      return Promise.reject(new errors.NotFound('User not found'));
    } else {
      if (!user.email) {
        session.logWarning('User has no email');
        return Promise.reject(new errors.NotFound('User has no email'));
      }
      const newPass = Math.random().toString(36).substr(2, 6);

      return hasher(newPass).then((hashedNewPass) => {
        console.log('new pass is: ' + newPass);
        console.log('hashed new pass is: ' + hashedNewPass);

        user.password = hashedNewPass;
        user.save();
        const plainText = `Your new password is: ${newPass} \n`;
        const html      = `<b>Your new password is: ${newPass} </b>`;
        return sgMail.send({
          from:    '"Car Mate" <recover@carmate.com>', // sender address
          to:      user.email, // list of receivers
          subject: 'Car Mate password recovery', // Subject line
          text:    plainText, // plain text body
          html:    html // html body
        }).catch(() => {
          return Promise.reject(new errors.GeneralError('Failed to send password recovery email'));
        });
      });
    }
  });
};

const AuthenticationService = {
  find(params) {
    console.log('get auth, params: ' + JSON.stringify(params.query));
    if (params.query && params.query.forgotPassword) {
      return sendPasswordRecoveryMail(params);
    } else {
      return doesUserExist(params);
    }
    // return Promise.resolve({});
    //return generateAuthenticationCode(params);
  },
  create(data, params) {
    if (data.method === 'phone') {
      return authenticatePhone(data, params);
    } else if (data.method === 'password') {
      return authenticatePassword(data, params);
    }
  }
};

module.exports = function () {
  const app = this;
  app.use('/authentication', AuthenticationService);
  // Get our initialized service so that we can register hooks and filters
  const service = app.service('authentication');
  service.hooks(hooks);
};
