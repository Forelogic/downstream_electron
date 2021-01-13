"use strict";
const log = require('electron-log');

module.exports = function (api, onSuccess /*, onFailure, target, manifestId */) {
  log.info('/be-methods/downloads/createPersistent.js')
  onSuccess();
};
