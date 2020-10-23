"use strict";
const appSettings = require('../../app-settings');
const translation = require('../../translation/index');
const FlushItem = require("../../downloads/flush-item");

module.exports = function (api, onSuccess, onFailure, target, manifestId, persistent) {
    console.log('save-persistent start');
  api.offlineController.getManifestInfo(manifestId, function (err) {
      console.log('save-persistent err = ', err);
    if (err) {
      onFailure(translation.getError(translation.e.manifests.NOT_FOUND, manifestId), err);
    } else {
      const flushItem = new FlushItem(manifestId, appSettings.getSettings().stores.PERSISTENT, persistent);
      flushItem.save()
          .then(function () {
              console.log('save-persistent Success');
            onSuccess();
          }, function (err) {
              console.log('save-persistent Failure');
            onFailure(translation.getError(translation.e.downloads.SAVING_PERSISTENT_FAILED, manifestId), err);
          });
    }
  });

};
