const express = require('express');
const cors = require('cors');
const log = require('electron-log');

(function () {
  log.info('startServer.js');

  process.send({cmd: 'log',
                log: 'Starting HTTP server C'});
  log.info('Starting HTTP server A');
  let server = express();
  server.use(cors());

  // listen for messages
  process.on('message', function (data) {

    // handles init message
    if (data.cmd === 'init') {
      // add content route
      require('./contentRoute')(server, data.routeName);
      // start http server
      server.listen(data.port, function () {
        log.info('listening on port A:', data.port);
        // http server is listening => send back listening port
        process.send({cmd: 'listening_port A', port: data.port});
      });
    }
  });
}());
