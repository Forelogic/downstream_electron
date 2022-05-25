"use strict";

const translation = require('../../translation/index');
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, full) {
  api.offlineController.getManifestsListWithInfo(function (err, list) {
    log.info('get-list-with-info getManifestsList');
    if (err) {
      log.info('getManifestsList err : ', err);
      onFailure(translation.getError(translation.e.manifests.LIST_LOADING_FAILED), err);
    } else {
      log.info('getManifestsList list : ', list);
      onSuccess(list);
    }
  }, full);
};
