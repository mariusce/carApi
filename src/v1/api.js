const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const services = require('./services/index');
const apiHooks = require('./api.hooks');
const middleware = require('../middleware');
const configuration = require('@feathersjs/configuration');
const api = express(feathers());

api.configure(configuration());
api.configure(express.rest());
api.configure(middleware);
api.configure(services);
api.hooks(apiHooks);

module.exports = api;
