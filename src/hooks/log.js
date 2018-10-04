
module.exports = function () {
  return context => {
    let session = context.params.session;
    session.log('debug', `${context.type} ${context.path} ${context.method}`);
  };
};
