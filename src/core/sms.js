module.exports.send = (phone, message, session) => {
  session.logInfo(`Sending to: ${phone} message: ${message}`);
  return Promise.resolve({});
};
