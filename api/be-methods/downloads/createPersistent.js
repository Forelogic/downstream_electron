"use strict";
const log = require('electron-log');

module.exports = function (api, onSuccess /*, onFailure, target, manifestId */) {
  log.info('createPersistent.js onSuccess', onSuccess)
  log.info('createPersistent.js api', api)
  onSuccess();
};
