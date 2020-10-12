/*eslint no-console: ["error", { allow: ["warn", "error", "info", "log"] }] */
/*eslint no-sync: ["off"]*/
"use strict";

const isPortTaken = require('../util/is-port-taken');
const path = require('path');
const fs = require('fs');
var fork = require('child_process').fork;
const appSettings = require("../app-settings");
const {app} = require('electron');
const log = require('electron-log');
const cwd = path.join(__dirname, '..')

const CHILD_SCRIPT_FILENAME = 'startServer.js';

/**
 * Offline content server
 * @param {object} offlineController : offline controller
 * @param {object} downloadController : download controller
 * @param {string} maxOfflineContentPortRange - max range for offline port to on which content can be served
 * @param {string} offlineContentPort - on which port offline content should be served, default is 3010
 * @constructor
 */
function OfflineContentServer (offlineController, downloadController, maxOfflineContentPortRange, offlineContentPort) {
  this._offlineController = offlineController;
  this._downloadController = downloadController;
  this._maxOfflineContentPortRange = maxOfflineContentPortRange;
  this._offlineContentPort = offlineContentPort;
  this.childProcess = undefined;
}

/**
 * Start http server in a child_process
 * @param {object} port : on which port offline content should be served, default is 3010
 * @param {object} callback : a callback function to get listen port (if default is already taken)
 * @constructor
 */
OfflineContentServer.prototype._startServer = function (port, callback) {
  var self = this;

  // NOTE: this is so ugly FIXME
  let serverPath = path.join(app.getAppPath(), 'node_modules/downstream-electron');
  log.info(`1 serverPath = ${serverPath}`);
  if (!fs.existsSync(path.join(serverPath, CHILD_SCRIPT_FILENAME))) {
    serverPath = path.join(app.getAppPath(), 'node_modules/downstream-electron/api/server');
    log.info(`2 serverPath = ${serverPath}`);
    if (!fs.existsSync(path.join(serverPath, CHILD_SCRIPT_FILENAME))) {
      serverPath = app.getAppPath();
      log.info(`app.getAppPath() = ${serverPath}`);
      log.info(`__dirname = ${__dirname}`);
      if (!fs.existsSync(path.join(serverPath, CHILD_SCRIPT_FILENAME))) {
        serverPath = process.cwd()
        log.info(`process.cwd() = ${process.cwd()}`);
        if (!fs.existsSync(path.join(serverPath, CHILD_SCRIPT_FILENAME))) {
          serverPath = __dirname;
          console.log(`4 serverPath = ${serverPath}`);
        }
      }
    }
  }

  log.info('Server Path:', serverPath);
  // let script = path.join(serverPath, CHILD_SCRIPT_FILENAME);
  // let script = path.join(cwd, CHILD_SCRIPT_FILENAME);
  // let script = '/Applications/mgsplayer.app/Contents/Resources/app.asar/startServer.js';
  let script = path.join(app.getAppPath(), 'Contents/Resources/app/node_modules/downstream-electron', CHILD_SCRIPT_FILENAME)
  log.info('Script for server:', script);

  //  FOR DEBUG PURPOSE self.childProcess = fork(script ,[],{execArgv:['--inspect=5860']});
  log.info('fork前')
  log.info(`cwd = ${cwd}`)
  if (fs.existsSync(path.join(cwd, CHILD_SCRIPT_FILENAME))) {
    log.info('startServer.jsあり')
  }
  self.childProcess = fork("/Applications/mgsplayer.app/Contents/Resources/app/node_modules/downstream-electron/startServer.js", []);
  log.info('fork後')
  log.info(`self.childProcess = `, self.childProcess)
  let routeName = appSettings.getSettings().downloadsName;
  log.info('routeName = ', routeName)

  // send init data for http server
  let data = {
    cmd: 'init',
    routeName: routeName,
    port: port
  };
  let sendResult = self.childProcess.send(data, function (err) {
    log.info(`send error ${err}`)
  })
  log.info(`send result ${sendResult}`)

  self.childProcess.on('error', function (err) {
    console.error(err);
    log.info('err:', err);
  })
  // handles message from child process
  self.childProcess.on('message', function (data) {
    log.info('message = ', data);
    if (data.cmd === 'log') {
      // http server wants to log some data
      console.log(data.log);
      log.info('data.log:', data.log);
    }

    if (data.cmd === 'listening_port') {
      // http server is listening => notify application for listen port
      log.info('listening_port')
      callback(data.port);
    }

    if (data.cmd === 'get_info') {
      log.info('get_info = ', data)
      let requestId = data.requestId;
      // http server asks data folder for manifest id
      let manifestId = data.args.manifest;

      self._offlineController.getManifestInfo(manifestId, function (err, info) {
        if (err) {
          return self.childProcess.send({error: err,
                             requestId: requestId
                            });
        }
        let downloadFolder = info.manifest.folder;
        if (!downloadFolder) {
          // try to serve from default download folder
          downloadFolder = appSettings.getSettings().downloadsFolderPath
        }

        // send response back
        return self.childProcess.send({status: 'OK', requestId: requestId, result: {folder: downloadFolder, status: info.status}});
      })
    }

    if (data.cmd === 'is_downloading') {
      log.info('is_downloading = ', data)
      let requestId = data.requestId;
      let manifestId = data.args.manifest;
      let file = data.args.file;

      let download = self._downloadController.getDownloading(manifestId, file);
      let downloadedCallback = function (err) {
        if (err) {
          return self.childProcess.send({error: err, requestId: requestId});
        }
        return self.childProcess.send({status: 'OK', requestId: requestId});
      }
      if (download) {
        // file is created but being downloading => wait for download before sending result
        self._downloadController.waitForDownload(download, downloadedCallback);
      } else {
        return downloadedCallback();
      }
    }

    if (data.cmd === 'perform_seek') {
      log.info('perform_seek = ', data)
      let requestId = data.requestId;
      let manifestId = data.args.manifest;
      let file = data.args.file;
      let downloadedCallback = function (err) {
        if (err) {
          return self.childProcess.send({error: err, requestId: requestId});
        }
        return self.childProcess.send({status: 'OK', requestId: requestId});
      }
      self._downloadController.performSeek(manifestId, file, downloadedCallback)
    }
  });

  self.childProcess.on('close', function (code, signal) {
    log.info('close = ', code, signal)
    // child has closed
    if (code == null) {
      console.log('Child process closed with signal:', signal);
    } else {
      console.log('Child process closed with code:', code);
    }
  });
}
/**
 * @param {Function} callback - a callback function to get listen port (if default is taken)
 * @constructor
 */
OfflineContentServer.prototype.serveOfflineContent = function (callback) {
  const self = this;

  function startOnPort (port) {
    if (port > self._maxOfflineContentPortRange) {
      return;
    }
    isPortTaken(port, function (err) {
      if (err) {
        port++;
        startOnPort(port);
      } else {
        console.log('Port found:', port)
        log.info('Port found::', port);
        self._startServer(port, function () {
          self._offlineContentPort = port;
          callback(self._offlineContentPort);
          console.info('Offline content served on port:', port);
          log.info('Offline content served on port::', port);
        });
      }
    });
  }

  startOnPort(this._offlineContentPort);
}

/*
 * Stop server process
 * @returns
 */
OfflineContentServer.prototype.stop = function () {
  this.childProcess.kill('SIGTERM');
}

module.exports = OfflineContentServer;
