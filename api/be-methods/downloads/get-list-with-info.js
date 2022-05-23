"use strict";

const translation = require('../../translation/index');

module.exports = function (api, onSuccess, onFailure, target, full) {
  api.offlineController.getManifestsListWithInfo(function (err, list) {
    console.log('downstream get-list-with-info getManifestsList');
    if (err) {
      console.log('downstream getManifestsList err : ', err);
      onFailure(translation.getError(translation.e.manifests.LIST_LOADING_FAILED), err);
    } else {
      onSuccess(list);
    }
  }, full);
};
