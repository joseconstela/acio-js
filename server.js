'use strict';

const async = require('async');
const colors = require('colors');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const assert = require('assert');
const mongoClient = require('mongodb').MongoClient;
const MongoOplog = require('mongo-oplog');
const mongoConfig = require('./config').get('/mongodb');
const serverConfig = require('./config').get('/server');

const db = require('./db/_db');
const debug = require('debug')('acio');
const jobsTools = require('./libraries/jobs');

let dbs = { mongo: null };

debug('Acio-js'.blue);

require('async').waterfall([

  function connectDb(cb) {
    debug('Connecting to DB...'.blue);
    const attemps = 30;
    let attempsLeft = attemps;
    let connect = (_cb) => {
      debug(`  retry ${attempsLeft} of ${attemps}`.yellow);
      attempsLeft--;
      mongoClient.connect(process.env.MONGO_URL ||  mongoConfig.url, (error, result) => {
        if (error) { return _cb(error, result); }
        debug(`  connected to ${process.env.MONGO_URL || mongoConfig.url}`.green);
        dbs.mongo = result;
        _cb(null, null)
      });
    };

    async.retry({times: attemps, interval: 300}, connect, function(error, result) {
      cb(error, result);
    });
  },

  function prepateCappedCollection(result, cb) {
    debug('Preparing DB...'.blue);

    db.startup(dbs, (error, result) => {
      if (error) { return cb(error, result); }
      debug('  Startup complete'.green)
      db.cappedJobs.restart(dbs, (error, result) => {
        if (error) { return cb(error, result); }
        debug('  Capped collection restarted'.green)
        cb(error, result);
      });
    });
  },

  function startServer(result, cb) {
    debug('Start server'.blue);

    var api = require('./routes/api')(dbs);
    app.use('/api', api);

    http.listen(process.env.PORT ||  serverConfig.port, (error, result) => {
      assert.equal(null, error);
      debug(`  Listening on *:${(process.env.PORT ||  serverConfig.port)}`.green);
      cb(null, null);
    })
  },

  function streamData(result, cb) {
    debug('Data stream'.blue);

    let stream = db.cappedJobs.stream(dbs);

    stream.on('error', (e) => {
      debug('  Tailable cursor error'.red);
      console.error(e);
    })

    stream.on('data', (result) => {
      debug('  DATA!'.green);
      if (!result.action) {
        return;
      }
      if (result.action === 'working') {
        debug(`  Start ${result.jobId}`.green);
        // Sends the job to clients in available queue
        jobsTools.emitJobAvailables(dbs, {
          _id: result.jobId,
          status: 'working'
        }, io, 1, false, (error, result) => {});
      } else {
        debug(`  Stop ${result.jobId}`.green);
        io.to(result.jobId).emit('stop', result.jobId);
      }
    });

    debug('  Started'.green);
  }

], (error, result) => {
  assert.equal(null, error);

  console.log({
    error,
    result
  })
})

io.on('connection', (socket) => {
  db.clients.insert(dbs, {
    _id: socket.id
  }, () => {})

  socket.on('disconnect', () => {
    db.hash.remove(dbs, {
      socket: socket.id
    }, () => {})

    db.clients.remove(dbs, {
      _id: socket.id
    }, () => {})
  }) 

  socket.on('error', (err) => {
    debug('Socket error', err)
  })

  socket.on('result', (data) => {
    data.socket = socket.id
    db.jobsResults.insert(dbs, data, (error, result) => {
      if (!error && result) {
        if (error) {
          return false
        }
        if (!data.reqNewJob) {
          return false
        }
        jobsTools.emitJob(dbs, 'null', io, socket, 1, false, () => {})
      }
    })
  })

  socket.on('full', (p) => {
    socket.leave('available')
  })

  socket.on('available', (p) => {
    socket.join('available')
  })

  socket.on('workingOn', (jobId) => {
    socket.join(jobId)
  })

  socket.on('getJobs', (p) => {
    jobsTools.emitJob(dbs, null, io, socket, p.limit, true, () => {})
  });
})