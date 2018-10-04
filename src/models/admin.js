/*
 * An admin is someone who looks like a god
 */

const _             = require('lodash');
const mongoose      = require('mongoose');
const userCommon    = require('./userCommon');
const Schema        = mongoose.Schema;

let AdminSchema = new Schema(_.extend({}, userCommon));

let AdminModel = mongoose.model('Admin', AdminSchema);

module.exports = AdminModel;
