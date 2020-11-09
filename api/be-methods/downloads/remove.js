"use strict";

const translation = require('../../translation/index');
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, manifestId) {
  api.offlineController.getManifestInfo(manifestId, function (err, info) {
      log.info('getManifestInfo', manifestId);
    api.downloadsController.removePromise(manifestId)
        .then(function () {
            log.info('removePromise1');
          api.offlineController.removePromise(manifestId)
              .then(function () {
                  log.info('removePromise2');
                api.subscribersController.unsubscribe(manifestId);
                api.manifestController.removeFromCache(manifestId);
                onSuccess(info);
              }, function (err) {
                onFailure(translation.getError(translation.e.downloads.REMOVING_FAILED, manifestId), err);
              });
        }, function (err) {
          onFailure(translation.getError(translation.e.downloads.REMOVING_FAILED, manifestId), err);
        });
  });
};
