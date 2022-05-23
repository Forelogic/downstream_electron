"use strict";

const translation = require('../../translation/index');

module.exports = function (api, onSuccess, onFailure) {
  api.offlineController.getManifestsListWithInfo(function (err, manifests) {
      console.log('downstream remove-all getManifestsList');
    if (err) {
        console.log('downstream getManifestsList err : ', err);
      onFailure(translation.getError(translation.e.downloads.REMOVING_ALL_FAILED), err);
    } else {
      const manifestIds = manifests.map(function (manifest) {
        return manifest.manifestInfo.id;
      });
      let promises = [];
      for (let i = 0, j = manifestIds.length; i < j; i++) {
        promises.push(api.downloadsController.removePromise(manifestIds[i]));
      }
      Promise.all(promises)
          .then(function () {
            api.offlineController.removeAllPromise()
                .then(function () {
                  api.subscribersController.unsubscribeAll();
                  api.manifestController.removeFromCacheAll();
                  onSuccess(manifests);
                }, function (err) {
                    console.log('downstream Promise.all(promises) err : ', err);
                  onFailure(translation.getError(translation.e.downloads.REMOVING_ALL_FAILED), err);
                });
          }, function (err) {
              console.log('downstream Promise.all(promises)_2 err : ', err);
            onFailure(translation.getError(translation.e.downloads.REMOVING_ALL_FAILED), err);
          });
    }
  });
};
