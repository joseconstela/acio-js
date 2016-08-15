"use strict";

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    assert = require('assert'),
    mongoClient = require('mongodb').MongoClient,
    mongoConfig = require('./config').get('/mongodb'),
    serverConfig = require('./config').get('/server'),

    db = require('./db/_db'),
    debug = require('./libraries/debug'),
    jobsTools = require('./libraries/jobs'),

    dbs = { mongo: null }

debug.title('Acio-js')

mongoClient.connect(process.env.MONGO_URL || mongoConfig.url, (err, result) => {
  assert.equal(null, err)

  debug.success(`MongoDB connected to ${process.env.MONGO_URL}`)

  dbs.mongo = result

  // DB requirements
  db.startup(dbs)

  http.listen(process.env.PORT || serverConfig.port, () => {
    debug.info('listening on *:' + (process.env.PORT || serverConfig.port))
  })

  var api = require('./routes/api')(dbs);
  app.use('/api', api);

  let stream = db.cappedJobs.stream(dbs)

  stream.on('error', (e) => {
    // TODO error handling
    debug.error('Tailable cursor error');
  })

  stream.on('data', (result) => {

    if(result.action === 'working') {

      // Sends the job to clients in available queue
      jobsTools.emitJobAvailables(dbs, {
        _id: result.jobId,
        status: 'working'
      }, io, 1, false, (error, result) => {

      })

    } else {
      io.to(result.jobId).emit('stop', result.jobId)
    }

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
    debug.error('Socket error', err)
  })

  socket.on('result', (data) => {

    data.socket = socket.id

    db.jobsResults.new(dbs, data, (error, result) => {
      if (!error && result) {
        if (error) { return false }
        if (!data.reqNewJob) { return false }

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
