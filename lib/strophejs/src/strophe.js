/*global global*/

const Strophe = require('core').Strophe;
// import * as bosh from 'bosh';
// import * as websocket from 'websocket';

global.Strophe = Strophe.default.Strophe;
global.$build = Strophe.default.$build;
global.$iq = Strophe.default.$iq;
global.$msg = Strophe.default.$msg;
global.$pres = Strophe.default.$pres;

// export { default } from 'core';
module.exports = Strophe;
