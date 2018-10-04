const errors = require('@feathersjs/errors');
const Ajv = require('ajv');
module.exports = (schema) => {
  return hook => {
    let query = hook && hook.params && hook.params.query || {};
    let ajv = new Ajv();
    let validate = ajv.compile(schema);
    let valid = validate(query);
    if (!valid) {
      return Promise.reject(new errors.BadRequest('Data does not match schema', {errors: validate.errors.map(error => error.message)}));
    } else {
      return Promise.resolve(hook);
    }
  };
};
