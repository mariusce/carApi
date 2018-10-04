const roleValues = {
  user: 'user',
  admin: 'admin',
};

const osValues = {
  ios: 'ios',
  android: 'android',
  web: 'web'
};
const osEnum = Object.keys(osValues).map((k) => osValues[k]);

const densityValues = {
  x2:      '2X',
  x3:      '3X',
  xhdpi:   'xhdpi',
  xxhdpi:  'xxhdpi',
  xxxhdpi: 'xxxhdpi'
};
const densityEnum = Object.keys(densityValues).map((k) => densityValues[k]);

let UserCommonSchema = {
  phone: {type: String, unique: true, required:true},
  email: {type: String, unique: true},
  password: {type: String},
  firstName: {type: String, required: false},
  lastName: {type: String, required: false},
  roles: [String],
  device:             {
    deviceId:      String,
    os:            {type: String, enum: osEnum},
    osVersion:     String,
    brand:         String,
    model:         String,
    density:       {type: String, enum: densityEnum},
    pushKey:       String,
    sdkVersion:    String,
    appVersion:    String,
    appIdentifier: String
  },
  location:           {
    lat:      Number,
    lng:      Number,
    accuracy: Number
  },
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
};

module.exports = UserCommonSchema;
