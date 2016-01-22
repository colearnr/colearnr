var databaseURI = "mongodb://" + require('../../common/dbURI'),
  mongo = require('mongodb'),
  MongoClient = mongo.MongoClient,
  Grid = require('gridfs-stream'),
  fs = require('fs'),
  config = require('../config').config,
  ObjectID = require('mongodb').ObjectID,
  constants = require('../../common/constants'),
  log = require('../../common/log'),
  util = require('../../common/util'),
  path = require('path'),
  db = null,
  gfs = null;

(function (GridFS) {

  function init(callback) {
    if (!db || !gfs) {
      MongoClient.connect(databaseURI, function (err, dbObj) {
        if (err) {
          log.error('Error connecting to db', err);
          callback(err);
          return;
        }
        db = dbObj;
        gfs = new Grid(db, mongo);
        callback();
      });
    } else {
      callback();
    }
  }

  function storeFileFn(filename, options, callback) {
    if (!options) {
      options = {};
    }
    if (!options._id) {
      options._id = new ObjectID();
    }
    options.mode = 'w';
    if (!options.filename) {
      options.filename = path.basename(filename);
    }
    if (!options.metadata) {
      options.metadata = {};
    }
    options.metadata.fileSize = fs.statSync(filename).size;
    options.metadata.ext = path.extname(filename);
    options.metadata.addedDate = new Date();
    options.metadata.lbit_id = options.lbit_id || null;
    options.metadata.added_by = options.added_by || null;
    options.metadata.topic_id = options.topic_id || null;
    
    //log.debug('About to store', filename, options);

    var writeStream = gfs.createWriteStream(options);
    fs.createReadStream(filename).pipe(writeStream);

    /*
    writeStream.on('open', function () {
      log.debug('Gridfs opened successfully');
    });

    writeStream.on('finish', function () {
      log.debug('Gridfs finished successfully');
    });
    */

    writeStream.on('error', function () {
      callback("GridFS write failed for " + filename, null);
    });

    writeStream.on('close', function (file) {
      //log.debug('Gridfs closed successfully');
      callback(null, file);
    });
  }

  function readFileFn(id, filename, range, callback) {
    var options = {};
    if (filename && typeof filename === 'object') {
      options = filename;
    } else if (!util.empty(filename) && typeof filename !== 'object') {
      options.filename = filename;
    } 
    if (util.validOid(id)) {
      options._id = id;
    }
    if (!options._id && !options.filename) {
      callback("_id or filename expected", null);
      return;
    }
    if (range) {
      options.range = range;
    }

    //log.debug('About to read file', options);
    var readStream = gfs.createReadStream(options);
    callback(null, readStream);
  }

  function existsFn(id, filename, callback) {
    var options = {};
    if (util.validOid(id)) {
      options._id = id;
    } else if (!util.empty(filename)) {
      options.filename = filename;
    } else {
      callback("_id or filename expected", null);
      return;
    }
    gfs.exist(options, function (err, found) {
      callback(err, found);
    });
  }

  function removeFn(id, filename, callback) {
    var options = {};
    if (util.validOid(id)) {
      options._id = id;
    } else if (!util.empty(filename)) {
      options.filename = filename;
    } else {
      callback("_id or filename expected", null);
      return;
    }
    //log.debug('About to remove file', options);
    gfs.remove(options, function (err) {
      callback(err, options);
    });
  }

  GridFS.storeFile = function (filename, options, callback) {
    init(function (err) {
      if (err) {
        callback(err);
        return;
      }
      storeFileFn(filename, options, callback);
    });
  };

  GridFS.readFile = function (id, filename, range, callback) {
    init(function (err) {
      if (err) {
        callback(err);
        return;
      }
      readFileFn(id, filename, range, callback);
    });
  };

  GridFS.exists = function (id, filename, callback) {
    init(function (err) {
      if (err) {
        callback(err);
        return;
      }
      existsFn(id, filename, callback);
    });
  };

  GridFS.remove = function (id, filename, callback) {
    init(function (err) {
      if (err) {
        callback(err);
        return;
      }
      removeFn(id, filename, callback);
    });
  };

}(exports));
