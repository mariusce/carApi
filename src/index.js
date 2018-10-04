/* eslint-disable no-console */
const logger = require('./core/logger');
const fs = require('fs');
const app = require('./app');
const port = app.get('port');
const npid = require('npid');
const process = require('process');
const server = (process.env.NODE_ENV === 'production') ? app.listen(port,'127.0.0.1') : app.listen(port);
const Admin = require('./models/admin');
const crypto = require('./core/crypto');
const initDonePath = __dirname + '/initDone';

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

if (process.env.NODE_ENV === 'production') {
  try {
    let pid = npid.create('/var/run/car-api.pid');
    pid.removeOnExit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

server.on('listening', () => {
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port);
  try {
    fs.accessSync(initDonePath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    const adminEmail = 'admin@admin.app';
    const adminPassord = 'admin';
    console.log(`Run initial application setup, adding user: ${adminEmail}:${adminPassord}`);
    crypto.hasher(adminPassord).then(adminHashPassword => {
      fs.appendFileSync(initDonePath, '');
      let admin = new Admin();
      admin.email = adminEmail;
      admin.password = adminHashPassword;
      admin.firstName = 'Super';
      admin.lastName = 'User';
      admin.roles = ['admin'];
      admin.phone = '00000000000';
      admin.save();
    });
  }
});
