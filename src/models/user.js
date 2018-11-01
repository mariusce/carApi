
const _             = require('lodash');
const mongoose      = require('mongoose');
const userCommon    = require('./userCommon');
const Schema        = mongoose.Schema;


let UserSchema = new Schema(_.extend({
  carNumber: {type: String, unique: true, required: true, index: true},
  contacts: [{
    carNumber: {type: String},
    messages: [{
      _id: {type: String},
      text: {type: String},
      createdAt: {type: Date},
      user: {
        _id: {type: String},
        name: {type: String}
      },
      sent: {type: Boolean, default: false},
      received: {type: Boolean, default: false},
    }]
  }]
}, userCommon));

let UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
