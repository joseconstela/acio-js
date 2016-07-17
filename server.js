var app = require('express')(),
http = require('http').Server(app)
io = require('socket.io')(http)
uuid = require('uuid')
crypto = require('crypto')

MongoClient = require('mongodb').MongoClient
mongoDb = null
assert = require('assert')

var config = {
  port: process.env.PORT || 3001,
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/aciojs'
}

MongoClient.connect(config.mongoUrl, (err, db) => {
  assert.equal(null, err)
  mongoDb = db

  if (process.env.NODE_ENV === 'development') {
    mongoDb.collection('Clients').drop()
    mongoDb.collection('JobsResults').drop()
  }

  mongoDb.createCollection('CappedJobs', {
    capped: true,
    size: 5 * 1048576,
    max: 100
  })

  http.listen(config.port, () => {
    console.log('listening on *:' + config.port)
  })

  stream = mongoDb.collection('CappedJobs').find({}, {
    tailable: true,
    awaitData: true
  }).stream()

  stream.on('error', (e) => {
    // TODO error handling
    // TODO prevent empty capped collection stopping streams
    console.log('Tailable cursor error', e);
  })

  stream.on('data', (result) => {

    if(result.action === 'working') {
      mongoDb.collection('Jobs').findOne({
        _id: result.jobId,
        status: 'working'
      }, {
        jobId:1, code:1, type:1
      }, (err, result) => {
        // TODO error handling
        if (result) {
          io.to('available').emit('enabledJobs', [result])
        }
      })
    } else {
      io.to(result.jobId).emit('stop', result._id)
    }

  })

})

/**
* emitJob
* @param  {[type]} socket [description]
* @return {[type]}        [description]
*/
emitJob = (socket, limit, allowLeaveAval) => {
  mongoDb.collection('Jobs').find({
    status: 'working'
  }, {
    code:1, type:1, name:1
  }, {
    limit: limit
  }, (err, cursor) => {
    // TODO error handling
    if (err) return false;

    cursor.toArray((err, res) => {
      if(res.length) {
        if (socket) {

          res.forEach((r) => {
            socket.join(r._id)
          })

          socket.emit('jobs', res)

          if(allowLeaveAval)
          if (res.length === limit) {
            console.log('[AVAILABLE] - 1', {asked:limit, got:res.length});
            socket.leave('available');
          }

        } else {
          io.to('available').emit('jobs', result)
        }
      }

      if (socket && (!res.length || res.length < limit)) {
        console.log('[AVAILABLE] + 1', {asked:limit, got:res.length});
        if (socket) socket.join('available')
      }
    })
  })
}

io.on('connection', (socket) => {

  mongoDb.collection('Clients').insert({
    _id: socket.id,
    handshake: socket.handshake
  })

  socket.on('disconnect', () => {
    mongoDb.collection('Clients').remove({
      _id: socket.id
    })
  })

  socket.on('result', (jobResult) => {
    jobResult._id = uuid.v4()
    jobResult.socket = socket.id
    jobResult.createdAt = new Date()
    jobResult.hashedResult = crypto.createHash('md5').update(JSON.stringify(jobResult.data)).digest('hex')

    mongoDb.collection('JobsResults').insert(jobResult, (err, result) => {
      if (!err && result) {
        if (err) { return false }
        if (!!jobResult.reqNewJob)
        emitJob(socket, 1, false)
      }
    })

  })

  socket.on('full', (p) => {
    socket.leave('available')
  })

  socket.on('workingOn', (jobId) => {
    socket.join(jobId)
  })

  socket.on('getJobs', (p) => {
    emitJob(socket, p.limit, true)
  });

})
