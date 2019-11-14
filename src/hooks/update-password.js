const User = require('../models/user');
const Admin = require('../models/admin');
const crypto = require('../core/crypto');
const {hasher} = require('../core/crypto');

module.exports = (hook) => {
  let session = hook.params.session;
  let oldPassword = hook.data.password;
  let newPassword = hook.data.newPassword;
  let type = 'user';
  if (!oldPassword) {
    return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid id/secret']));
  }
  let model = undefined;
  let query = {email: hook.data.id};
  switch (type) {
    case 'admin':
      model = Admin;
      break;
    default:
      query = {carNumber : hook.data.carNumber};
      model = User;
      break;
  }

  return User.findOne(query).then(user => {
    if (!user) {
      session.logError('User not found!');
      return Promise.reject(new errors.NotFound('User not found'));
    } else {
      return crypto.compare(oldPassword, user.password).then(ok => {
        if (ok) {
          hasher(newPassword).then((hashedPassword) => {
            user.password = hashedPassword;
            user.save();
            return Promise.resolve(hook);
          });
        } else {
          return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid id/secret']));
        }
      }).catch(() => {
        return Promise.reject(new errors.Forbidden('Authentication error', ['Invalid id/secret']));
      });
    }
  });
};
