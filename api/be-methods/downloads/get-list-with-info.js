"use strict";

const translation = require('../../translation/index');
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, full) {
  api.offlineController.getManifestsListWithInfo(function (err, list) {
    log.info('downstream get-list-with-info getManifestsList');
    if (err) {
      log.info('downstream getManifestsList err : ', err);
      onFailure(translation.getError(translation.e.manifests.LIST_LOADING_FAILED), err);
    } else {
      onSuccess(list);
    }
  }, full);
};
