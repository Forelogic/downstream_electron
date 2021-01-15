"use strict";
const appSettings = require('../../app-settings');
const translation = require('../../translation/index');
const removeDir = require("../../util/remove-dir");
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, manifestId) {
  api.offlineController.getManifestInfo(manifestId, function (err, info) {
    log.info('remove-persistent')
    if (err) {
      onFailure(translation.getError(translation.e.manifests.NOT_FOUND, manifestId), err);
    } else {
      const file = appSettings.getSettings().settingsFolder + manifestId + "/" + appSettings.getSettings().stores.PERSISTENT + ".json";

      removeDir(file, function (err) {
        if (err && err.code !== "ENOENT") {
          log.info('remove-persistent err', err)
          onFailure(translation.getError(translation.e.downloads.REMOVING_PERSISTENT_FAILED, manifestId), err);
        } else {
          onSuccess(info);
        }
      });
    }
  });

};
