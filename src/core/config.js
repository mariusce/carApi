const configuration = require('@feathersjs/configuration');

module.exports.get = (property) => {
  const get = configuration();
  if (property) {
    return get()[property];
  }
  return get();
};
