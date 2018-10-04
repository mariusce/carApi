const { validateSchema } = require('feathers-hooks-common');
const Ajv = require('ajv');

module.exports = (schema) => {
  return validateSchema(schema, Ajv);
};
