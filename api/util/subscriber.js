"use strict";
const Snowflake = require("./snowflake-id");
const _ = require("underscore");
const log = require('electron-log');

/**
 *
 * @param {function} process - function to get the result from
 * @param {function} callback - callback to be invoked when "process" function returns anything
 * @param {number} target - window target id
 * @param {string} manifestId - manifest identifier
 * @param {number} time - time in miliseconds how often the callback should be invoked
 * @param {boolean} onceOnly - if set to true the callback will be invoked once only and subsriber will be removed
 * @constructor
 */
function Subscriber (process, callback, target, manifestId, time, onceOnly) {
  this._process = process;
  this._callback = callback;
  this._manifestId = manifestId;
  this._id = String(Snowflake.SnowflakeId.getUUID());
  this._onceOnly = onceOnly;
  this._target = target;
  this.onInterval = function () {
    const result = this._process();
    const self = this;
    log.info('subscriber result', result)
    if (result) {
      log.info('subscriber this._onceOnly', this._onceOnly)
      if (this._onceOnly) {
        this.remove();
        log.info('subscriber typeof this._callbackOnFinish === "function"', typeof this._callbackOnFinish === "function")
        if (typeof this._callbackOnFinish === "function") {
          this._callbackOnFinish(function (err, result) {
            self._callback(self._id, err, result, self._target, true);
          });
        } else {
          this._callback(this._id, null, result, self._target);
        }
      } else {
        this._callback(this._id, null, result, self._target);
      }
    }
  };
  _.bindAll(this, "onInterval");
  this._intervalTimer = setInterval(this.onInterval, time);
}

/**
 *
 * @returns {string} - subscriber identifier
 */
Subscriber.prototype.getId = function () {
  return this._id;
};

/**
 *
 * @returns {string} - manifest identifier
 */
Subscriber.prototype.getManifestId = function () {
  return this._manifestId;
};

/**
 * @param {function} callback - function to be invoked when "process" function returns anything
 * and when "onceOnly" is set to true
 * @returns {void}
 */
Subscriber.prototype.onFinish = function (callback) {
  log.info('subscriber onFinish')
  this._callbackOnFinish = callback;
};

/**
 * @returns {void}
 */
Subscriber.prototype.remove = function () {
  log.info('subscriber remove')
  clearInterval(this._intervalTimer);
};

module.exports = Subscriber;
