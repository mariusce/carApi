const PushNotifications = require('node-pushnotifications');
// const gcm = require('node-gcm');
const User = require('../models/user');
const logger = require('../core/logger');
const { _ } = require('lodash');


const settings = {
  gcm: {
    id: 'AAAA-K2NUgY:APA91bFM1_AMXFiZgQK1hSqQNzfR7FEXywlD6Bvoz8bQW1-uC41XnGvHrnGDRUP0dK9jg8WUMZXlDCjCX9_xaIuIGIgT-XUlq4rbZPlH9cBzR-gFWFoX1HR0bNbS-CYRbZFNi6MDhU2r', //GCM Server API key
    phonegap: false, // phonegap compatibility mode, see below (defaults to false)
  },
  // isAlwaysUseFCM: true, // true all messages will be sent through node-gcm (which actually uses FCM)
};
const push = new PushNotifications(settings);


module.exports = (params) => {
  if (!params.to) {
    logger.error(`Missing offline message destination user`);
    return Promise.resolve({});
  }

  User.findOne({ carNumber: _.toUpper(params.to) }, function (err, user) {
    if (err) {
      logger.error(`Failed to send push notification. User ${params.to} not found`);
      return Promise.resolve({});
    }
    if (user) { console.dir(user); }
    if (!user || !user.fcmToken) {
      logger.error(`Failed to send push notification. User ${params.to} has no FCM token`);
      return Promise.resolve({});
    }

    const registrationIds = user.fcmToken;

    logger.info(`FCM token to send to is: ${user.fcmToken}`);

    const data = {
      title: _.toUpper(params.from), // REQUIRED for Android
      topic: 'new message', // REQUIRED for iOS (apn and gcm)
      /* The topic of the notification. When using token-based authentication, specify the bundle ID of the app.
       * When using certificate-based authentication, the topic is usually your app's bundle ID.
       * More details can be found under https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
       */
      body:  params.body,
      custom: {
        sender: params.from,
      },
      priority: 'high', // gcm, apn. Supported values are 'high' or 'normal' (gcm). Will be translated to 10 and 5 for apn. Defaults to 'high'
    };

    push.send([registrationIds], data)
      .then((results) =>
      {

        logger.info(`Successfully sent push notification to ${params.to}, body "${params.body}"`);
        logger.info("Results is: " + JSON.stringify(results));
        // add the new message in the database
        let contactIndex = _.findIndex(user.contacts, {carNumber: _.toUpper(params.from)});
        console.log('contact index is: ' + contactIndex);
        if (contactIndex > -1) {
          user.contacts[contactIndex].messages.unshift({
            _id: Math.round(Math.random() * 1000000),
            text: params.body,
            createdAt: new Date(),
            user: {
              _id: _.toUpper(params.from),
              name: _.toUpper(params.from)
            },
            sent: true,
            received: false,
          });
        } else { //this is the first message sent to this contact
          user.contacts.push({
            carNumber: _.toUpper(params.from),
            messages : [{
              _id: Math.round(Math.random() * 1000000),
              text: params.body,
              createdAt: new Date(),
              user: {
                _id: _.toUpper(params.from),
                name: _.toUpper(params.from)
              },
              sent: true,
              received: false,
            }]
          });
        }
        user.save();
        return Promise.resolve({});
      })
      .catch((err) => {
        logger.error(`Failed to send push notification to ${params.to}, body "${params.body}": ${err}`);
        return Promise.resolve({});
      });
    return Promise.resolve({});
  })
};
