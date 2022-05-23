"use strict";

const translation = require("../../translation/index");
const canCreateManifest = require("../../util/can-create-manifest");
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, manifestId, representations, downloadFolder) {
  const manifest = api.manifestController.getManifestById(manifestId);
  if (!manifest) {
    onFailure(translation.getError(translation.e.manifests.NOT_FOUND, manifestId));
    return;
  }

  function start () {
    log.info('downstream start.js start')
    api.downloadsController.storage.getItem(manifestId).then(function (result) {
      if (result) {
        log.info('downstream start result : ', result)
        onFailure(translation.getError(translation.e.downloads.ALREADY_STARTED, manifestId));
      } else {
        api.downloadsController.start(manifestId, representations, downloadFolder, onSuccess, function (err) {
          log.info('downstream start err_1 : ', err)
          onFailure(translation.getError(translation.e.downloads._GENERAL), err);
        });
      }
    }, function (err) {
      log.info('downstream start err_2 : ', err)
      onFailure(translation.getError(translation.e.downloads._GENERAL), err);
    });
  }

  canCreateManifest(manifestId, downloadFolder).then(function () {
    start();
  }, function (errors) {
    errors = errors || [];
    var movieFolderError = errors[1];
    if (errors.length) {
      if (movieFolderError) {
        // if movie folder has been already created the we can't start as it might be either different folder
        // or simply the resume should be used
        onFailure(translation.getError(translation.e.manifests.FOLDER_ALREADY_EXISTS, manifestId));
        return;
      }
    }
    // if manifest exists physically on drive that means something is wrong and can't start the manifest
    // the manifest is saved in method start so this cannot be overwritten here
    api.offlineController.getManifestDataFile(manifestId, function (data) {
      if (data) {
        onFailure(translation.getError(translation.e.manifests.FOLDER_ALREADY_EXISTS, manifestId));
      } else {
        start();
      }
    });
  });

};
