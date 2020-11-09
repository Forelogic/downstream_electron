"use strict";

const Manifest = require("../../manifest/loader/manifest").Manifest;
const translation = require("../../translation/index");
const canCreateManifest = require("../../util/can-create-manifest");
const getInvalidDiff = require("../../util/get-invalid-diff");
const appSettings = require("../../app-settings");
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, manifestUrl, customManifestId, manifestStr) {
  var useCustomId = true;

  log.info('create customManifestId', customManifestId)
  if (typeof customManifestId === "undefined" ||
    customManifestId === "" ||
    customManifestId === null) {
    useCustomId = false;
  }

  log.info('create useCustomId', useCustomId)
  if (useCustomId) {
    if (typeof customManifestId !== "undefined" &&
      typeof customManifestId !== "number" &&
      typeof customManifestId !== "string") {
      onFailure(translation.getError(translation.e.manifests.INVALID_ID, customManifestId));
      return;
    }
    const customManifestIdFolderRegex = appSettings.getSettings().customManifestIdFolderRegex;
    log.info('create customManifestIdFolderRegex', customManifestIdFolderRegex)

    if (!customManifestId.match(customManifestIdFolderRegex)) {
      const invalid = getInvalidDiff(
        customManifestId,
        customManifestIdFolderRegex,
        appSettings.getSettings().openingTagForInvalidCustomManifestIdCharacter,
        appSettings.getSettings().closingTagForInvalidCustomManifestIdCharacter);
      onFailure(translation.getError(translation.e.manifests.INVALID_ID, invalid));
      return;
    }
  }

  let manifest = new Manifest(customManifestId);
  let promise;
  log.info('create manifestStr', manifestStr)
  if (manifestStr) {
    promise = manifest.loadWithManifest(manifestUrl, manifestStr)
  } else {
    promise = manifest.load(manifestUrl);
  }

  promise.then(() => {
    log.info('create useCustomId', useCustomId)
    if (useCustomId) {
      canCreateManifest(customManifestId).then(function () {
        api.manifestController.cacheManifest(manifest);
        onSuccess(manifest.getJsonInfo());
      }, function (err) {
        onFailure(translation.getError(translation.e.manifests.FOLDER_ALREADY_EXISTS, customManifestId), err);
      });
    } else {
      api.manifestController.cacheManifest(manifest);
      onSuccess(manifest.getJsonInfo());
    }
  }, (err) => {
    log.info('create err', err)
    onFailure(translation.getError(translation.e.manifests.LOADING_FAILED, manifestUrl), err);
  });
};
