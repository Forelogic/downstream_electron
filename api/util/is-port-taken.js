"use strict";

const net = require('net');
const log = require('electron-log');

module.exports = function (port, fn) {
  const tester = net.createServer().once('error', function (err) {
    log.info('is-port-taken err', err);
    if (err) {
      return fn(err);
    }
    fn(null, true);
  }).once('listening', function () {
    log.info('is-port-taken listening');
    tester.once('close', function () {
      log.info('is-port-taken close');
      fn(null, false);
    }).close();
  }).listen(port);
};
