'use strict';

const knox    = require('knox');

const client = knox.createClient({
  key:    process.env.S3AccessKey,
  secret: process.env.S3Secret,
  bucket: process.env.S3Bucket
});

module.exports = {
  client
}