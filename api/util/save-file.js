"use strict";
const mkdirp = require("mkdirp");
const fs = require("fs");
const path = require("path");
const log = require('electron-log');

function saveFile (filePath, fileName, value, callback) {
  log.info('save-file saveFile')
  mkdirp(filePath).then(() => {
    const fileUrl = path.resolve(filePath + "/" + fileName);
    fs.writeFile(fileUrl, value, "utf-8", callback);
  }, function (error) {
    log.info('save-file saveFile err : ', error)
    callback(error);
  });
}

module.exports = saveFile;
