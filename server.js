"use strict";

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    assert = require('assert'),
    mongoClient = require('mongodb').MongoClient,
    mongoConfig = require('./config').get('/mongodb'),
    serverConfig = require('./config').get('/server'),

    db = require('./db/_db'),
    jobsTools = require('./libraries/jobs'),

    dbs = { mongo: null }

mongoClient.connect(process.env.MONGO_URL || mongoConfig.url, (err, result) => {
  assert.equal(null, err)
  dbs.mongo = result

  // DB requirements
  db.startup(dbs)

  http.listen(process.env.PORT || serverConfig.port, () => {
    console.log('listening on *:' + (process.env.PORT || serverConfig.port))
  })

  var api = require('./routes/api')(dbs);
  app.use('/api', api);

  let stream = db.cappedJobs.stream(dbs)

  stream.on('error', (e) => {
    // TODO error handling
    // TODO prevent empty capped collection stopping streams
    console.log('Tailable cursor error', e);
  })

  stream.on('data', (result) => {

    if(result.action === 'working') {

      var queryOpts = {
        query: {_id: result.jobId, status: 'working'},
        proj: {code:1, type:1, name:1, libraries: 1}
      }

      db.jobs.findOne(dbs, queryOpts, (err, result) => {
        // TODO error handling
        if (result) {
          io.to('available').emit('jobs', [result])
        }
      })

    } else {
      io.to(result.jobId).emit('stop', result.jobId)
    }

  })

})

io.on('connection', (socket) => {

  db.clients.insert(dbs, {
    _id: socket.id,
    handshake: socket.handshake
  }, () => {})

  socket.on('disconnect', () => {
    db.clients.remove(dbs, {
      _id: socket.id
    }, () => {})
  })

  socket.on('error', () => {
    console.log(arguments)
  })

  socket.on('result', (data) => {

    data.socket = socket.id

    db.jobsResults.new(dbs, data, (error, result) => {
      if (!error && result) {
        if (error) { return false }
        if (!data.reqNewJob) { return false }
        jobsTools.emitJob(dbs, io, socket, 1, false, () => {})
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
    jobsTools.emitJob(dbs, io, socket, p.limit, true, () => {})
  });

})
