const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./core/logger');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const v1 = require('./v1/api');
const channels = require('./channels');
const pushNotification = require('./core/notification');

const mongoose = require('mongoose');
const morgan = require('morgan');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/car',  { useNewUrlParser: true });


const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.set('trust proxy', true);
app.use(morgan('combined', { stream: logger.stream }));
app.use(favicon('./public/favicon.ico'));
// Host the public folder
app.use('/', express.static('./public'));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.use('/api/v1', v1);

// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

module.exports = app;
