const uuidv1 = require('uuid/v1');
const moment = require('moment');

const logger = require('../core/logger');

module.exports = function (req, res, next) {
  let id = uuidv1();
  let now = moment();
  let session = {
    id: id,
    timestamp: now,
    req: req,
    res: res,
    log: function (level, message) {
      logger[level](`${this.timestamp.toISOString()} ${this.id} ${message}`);
    },
    logError: function (message) {
      this.log('error', message);
    },
    logWarning: function (message) {
      this.log('warn', message);
    },
    logInfo: function (message) {
      this.log('info', message);
    },
    logVerbose: function (message) {
      this.log('verbose', message);
    },
    logDebug: function (message) {
      this.log('debug', message);
    },
    logSilly: function (message) {
      this.log('silly', message);
    }
  };
  session.log.bind(session);
  session.logError.bind(session);
  session.logWarning.bind(session);
  session.logInfo.bind(session);
  session.logVerbose.bind(session);
  session.logDebug.bind(session);
  session.logSilly.bind(session);

  req.feathers.session = session;
  res.set('X-Session-Id', id);
  next();
};
