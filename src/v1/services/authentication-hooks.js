const validateQuery = require('../../hooks/validate-query');
const validateBody = require('../../hooks/validate-body');

const createSchema = {
  type: 'object',
  properties: {
    id : {
      type: 'string',
      minLength: 6
    },
    secret : {
      type: 'string',
      maxLength: 256,
      minLength: 4
    },
    method : { enum: ['phone', 'password'] },
    strategy : { enum: ['local'] },
  },
  required: ['id', 'secret', 'method']
};

const findSchema = {
  type: 'object',
  properties: {
    carNumber : {
      type: 'string',
      minLength: 6
    },
  },
  required: ['carNumber']
};

module.exports = {
  before: {
    all: [],
    find: [validateQuery(findSchema)],
    get: [],
    create: [validateBody(createSchema)],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
