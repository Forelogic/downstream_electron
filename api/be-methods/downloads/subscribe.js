"use strict";

const translation = require('../../translation/index');
const Subscriber = require("../../util/subscriber");
const log = require('electron-log');

module.exports = function (api, onSuccess, onFailure, target, manifestIds, timeout) {
  if (typeof manifestIds === 'string') {
    subscribeSingle(api, onSuccess, onFailure, target, manifestIds, timeout);
  } else {
    subscribeMany(api, onSuccess, onFailure, target, manifestIds, timeout);
  }
};

function subscribeMany (api, onSuccess, onFailure, target, manifestIds, timeout) {
  log.info('subscribe.js subscribeMany')
  let subscriber1, subscriber2, subscribersId;
  const manifestId = manifestIds.sort().join(',');

  subscribersId = [];
  // callbackOnProgress
  subscriber1 = new Subscriber(function () {
    return api.downloadsController.downloadStats.getStats(manifestIds);
  }, api.processSubscriber, target, manifestId, timeout);
  subscribersId.push(api.subscribersController.addSubscriber(subscriber1));

  // callbackOnFinish
  subscriber2 = new Subscriber(function () {
    let result = true;
    for (let i = 0, j = manifestIds.length; i < j; i++) {
      result = result && api.downloadsController.isDownloadFinishedAndSynced(manifestIds[i]);
    }
    return result;
  }, api.processSubscriber, target, manifestId, timeout, true);

  subscriber2.onFinish(function (callback) {
    log.info('subscribe.js subscribeMany onFinish')
    subscriber1.remove();
    let items = [];
    for (let i = 0, j = manifestIds.length; i < j; i++) {
      items.push(api.offlineController.getManifestInfoPromise(manifestIds[i]));
    }
    Promise.all(items).then(function (results) {
      log.info('subscribe.js subscribeMany success')
      callback(null, results);
    }, function (err) {
      log.info('subscribe.js subscribeMany err : ', err)
      callback(err);
    });
  });
  subscribersId.push(api.subscribersController.addSubscriber(subscriber2));

  onSuccess(null, subscribersId);
}

function subscribeSingle (api, onSuccess, onFailure, target, manifestId, timeout) {
  log.info('subscribe.js subscribeSingle')
  const manifest = api.manifestController.getManifestById(manifestId);
  let subscriber1, subscriber2, subscribersId;
  if (manifest) {
    subscribersId = [];

    // callbackOnProgress
    subscriber1 = new Subscriber(function () {
      return api.downloadsController.downloadStats.getStats(manifestId);
    }, api.processSubscriber, target, manifestId, timeout);
    subscribersId.push(api.subscribersController.addSubscriber(subscriber1));

    // callbackOnFinish
    subscriber2 = new Subscriber(function () {
      return api.downloadsController.isDownloadFinishedAndSynced(manifestId);
    }, api.processSubscriber, target, manifestId, timeout, true);

    subscriber2.onFinish(function (callback) {
      log.info('subscribe.js subscribeSingle onFinish')
      subscriber1.remove();
      api.offlineController.getManifestInfo(manifestId, function (err, result) {
        callback(err, result);
      });
    });
    subscribersId.push(api.subscribersController.addSubscriber(subscriber2));

    log.info('subscribe.js subscribeSingle success')
    onSuccess(manifest.getJsonInfo(), subscribersId);
  } else {
    log.info('subscribe.js subscribeMany onFailure')
    onFailure(translation.getError(translation.e.manifests.NOT_FOUND, manifestId));
  }
}
