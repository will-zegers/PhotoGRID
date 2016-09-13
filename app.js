'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const express = require('express'),
      path    = require('path'),
      app     = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || '3000');
app.set('host', process.env.HOST);

const server = require('http').createServer(app),
      io     = require('socket.io')(server);

require('./routes')(express, app, io);

server.listen(app.get('port'), () => {
  console.log('PhotoGRID running on port: ' + app.get('port'));
});