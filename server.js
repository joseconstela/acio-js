'use strict'

const queue = require('bull')
const async = require('async')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const assert = require('assert')
const mongoClient = require('mongodb').MongoClient

const db = require('./db')
const debug = require('debug')('acio')
const jobsTools = require('./libraries/jobs')

let dbs = { mongo: null };

debug('Acio-js');

require('async').waterfall([

  (cb) => {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost'
    debug('Connecting to DB...')
    const attemps = 30
    let attempsLeft = attemps
    let connect = (_cb) => {
      debug(`  retry ${attempsLeft} of ${attemps}`)
      attempsLeft--;
      mongoClient.connect(mongoUrl, (error, client) => {
        if (error) { return _cb(error, result) }
        debug(`  connected to ${mongoUrl}`)
        dbs.mongo = client.db('acio')
        _cb(null, null)
      })
    }

    async.retry({times: attemps, interval: 300}, connect, function(error, result) {
      cb(error, result)
    })
  },

  (result, cb) => {
    debug('Preparing DB...')

    db.db.startup(dbs, (error, result) => {
      if (error) { return cb(error, result) }
      debug('  Startup complete')
      db.cappedJobs.restart(dbs, (error, result) => {
        if (error) { return cb(error, result) }
        debug('  Capped collection restarted')
        cb(error, result)
      })
    })
  },

  (result, cb) => {
    debug('Start server')

    app.use('/api', require('./routes/api')(dbs))
    app.use('/', require('./routes/server')(dbs))
    app.use(express.static(__dirname + '/public'));

    http.listen(process.env.PORT || 3000, (error, result) => {
      assert.equal(null, error)
      debug(`  Listening on *:${(process.env.PORT || 3000)}`)
      cb(null, null)
    })
  },

  (result, cb) => {
    debug('Data stream')

    let stream = db.cappedJobs.stream(dbs)

    stream.on('error', (e) => {
      debug('  Tailable cursor error'.red)
      console.error(e)
    })

    stream.on('data', (result) => {
      debug('  DATA!')
      if (!result.action) {
        return
      }
      if (result.action === 'working') {
        debug(`  Start ${result.jobId}`)
        // Sends the job to clients in available queue
        jobsTools.emitJobAvailables(dbs, {
          _id: result.jobId,
          status: 'working'
        }, io, 1, false, (error, result) => {})
      } else {
        debug(`  Stop ${result.jobId}`)
        io.to(result.jobId).emit('stop', result.jobId);
      }
    })

    debug('  Started')
  }

], (error, result) => {
  assert.equal(null, error);
  console.log(result)
})

io.on('connection', (socket) => {
  db.clients.insert(dbs, {_id: socket.id }, () => {})

  socket.on('disconnect', () => {
    db.hash.remove(dbs, { socket: socket.id }, () => {})
    db.clients.remove(dbs, { _id: socket.id }, () => {})
  }) 

  socket.on('error', (err) => {
    debug('Socket error', err)
  })

  socket.on('result', (data) => {
    data.socket = socket.id
    db.jobsResults.insert(dbs, data, (error, result) => {
      if (error) return false
      if (!data.reqNewJob) return false
      jobsTools.emitJob(dbs, 'null', io, socket, 1, false, () => {})
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