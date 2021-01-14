"use strict";
const appSettings = require('../../app-settings');
const translation = require('../../translation/index');
const FlushItem = require("../../downloads/flush-item");
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, manifestId, data) {
  api.offlineController.getManifestInfo(manifestId, function (err) {
    if (err) {
      onFailure(translation.getError(translation.e.manifests.NOT_FOUND, manifestId), err);
    } else {
      const flushItem = new FlushItem(manifestId, appSettings.getSettings().stores.DATA, data);
      flushItem.save()
        .then(function () {
          onSuccess();
        }, function (err) {
          log.info('save-data.js onFailure', onFailure)
          log.info('save-data.js err', err)
          log.info('save-data.js getError', translation.getError(translation.e.downloads.SAVING_DATA_FAILED, manifestId))
          onFailure(translation.getError(translation.e.downloads.SAVING_DATA_FAILED, manifestId), err);
        });
    }
  });

};
