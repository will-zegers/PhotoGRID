'use strict';

const mongoose = require('mongoose').connect(process.env.dbURI);

mongoose.connection
  .on('error', err => {
    console.log('error', '[-] Mongoose connection error: ' + err);
  })
  .on('connected', () => {
    console.log('info', '[+] Mongoose connected to ' + process.env.dbURI);
  })
  .on('disconnected', () => {
    console.log('info', '[!] Mongoose disconnected');
  });

let gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log('info', '[i] Mongoose disconnected through ' + msg);
    callback();
  });
}

process
  .once('SIGUSR2', () => {
    gracefulShutdown('nodemon restart', () => {
      process.kill(process.pid, 'SIGUSR2');
    })
  })
  .on('SIGINT', () => {
    gracefulShutdown('app termination', () => {
      process.exit(0);
    });
  })
  .on('SIGTERM', () => {
    gracefulShutdown('Heroku shutdown', () => {
      process.exit(0);
    })
  });

let singleImage = new mongoose.Schema({
  filename: String,
  votes: Number,
});

let singleImageModel = mongoose.model('singleImage', singleImage);

module.exports = {
  mongoose,
  singleImageModel
}