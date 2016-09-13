'use strict';

let ioServer = app => {
  const server = require('http').createServer(app);
        io     = require('socket.io')(server);

  ioServer.listen(app.get('port'), () => {
    console.log('PhotoGRID running on port: ' + app.get('port'));
  });

  return io;
}

module.exports {
  ioServer
}