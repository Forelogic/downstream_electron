"use strict";
const log = require('electron-log')

module.exports = function (api, onSuccess, onFailure, target, manifestId, representations) {
  api.downloadsController.resume(manifestId, representations, onSuccess, onFailure);
};
