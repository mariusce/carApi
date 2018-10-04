const setSession = require('./set-session');

module.exports = function (app) {
  app.use(setSession);
};
