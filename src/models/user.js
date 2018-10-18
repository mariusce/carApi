
const _             = require('lodash');
const mongoose      = require('mongoose');
const userCommon    = require('./userCommon');
const Schema        = mongoose.Schema;


let UserSchema = new Schema(_.extend({
  carNumber: {type: String, unique: true, required: true, index: true},
  contacts: [Schema.ObjectId]
}, userCommon));

let UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
