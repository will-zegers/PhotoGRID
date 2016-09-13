'use strict';
const fs         = require('fs'),
      os         = require('os'),
      gm         = require('gm'),
      crypto     = require('crypto'),
      formidable = require('formidable'),
      db         = require('../db'),
      knox       = require('../knox'),
      qs         = require('querystring');


module.exports = (express, app, io) => {

  let Socket;

  io
    .on('connection', socket => {
      Socket = socket;
    });
  const router = express.Router();

  router
    .get('/', (req, res, next) => {
      res.render('index', {
        host: app.get('host')
      });
    })

    .get('/getImages', (req, res, next) => {
      db.singleImageModel.find({}, null, {sort:{votes:-1}}, (err, result) => {
        res.send(JSON.stringify(result));
      });
    })

    .post('/voteup', (req, res, next) => {
      let body = '';
      req.on('data', data => {
        body += data;
      });

      req.on('end', () => {
        let id = qs.parse(body).id;
        db.singleImageModel.findByIdAndUpdate(
          id,
          {$inc:{votes:1}},
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.status(200);
              res.send({votes:result.votes});
            }
          }
        );
      });
    })

    .post('/upload', (req, res, next) => {

      let ext = '';

      let generateFileName = filename => {
        let date = new Date().getTime(); 
        let ext_regex = /(?:\.([^.]+))?$/;

        ext = ext_regex.exec(filename)[1];

        return date + crypto.randomBytes(8).toString('hex') + '.' + ext;
      }

      // File upload management
      let tmpFile,
          newFile,
          fname,
          newForm = new formidable.IncomingForm();
      newForm.keepExtensions = true;

      newForm.parse(req, (err, fields, files) => {
        tmpFile = files.upload.path;
        fname = generateFileName(files.upload.name);
        newFile = os.tmpDir() + '/' + fname;
        res.writeHead(200, {'Content-type': 'text/plain'});
        res.end();
      });

      newForm.on('end', () => {
        fs.rename(tmpFile, newFile, () => {
          //Resize the image and upload this file into the S3 bucket
          gm(newFile).resize(300).write(newFile, () => {
            // Upload to S3 Bucket
            console.log(newFile);
            fs.readFile(newFile, (err, buffer) => {
              let req = knox.client.put(fname, {
                'Content-Length': buffer.length,
                'Content-Type':   'image/' + ext
              });

              req.on('response', () => {
                if (res.statusCode === 200) {
                  // This means that the file is in the S3 Bucket!
                  let newImage = new db.singleImageModel({
                    filename: fname,
                    votes: 0
                  }).save((err, product, numAffected) => {
                    if (err) { console.log(err); }
                    else { console.log("No error"); }
                  });

                  Socket.emit('status', {
                    'msg': 'Saved!',
                    'delay': 3000
                  });
                  Socket.emit('doUpdate', {});
                  fs.unlink(newFile, () => {
                    console.log('Local file deleted');
                  })
                }
              });

              req.end(buffer);
            });
          });
        });
      });
    });

  app.use('/', router);  
}
