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
    max: 2
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
    mongoDb.collection('Jobs').findOne({
      _id: result.jobId,
      status: 'working'
    }, {
      jobId:1, code:1, type:1
    }, (err, result) => {
      // TODO error handling
      if (result) {
        io.to('available').emit('work', result)
      }
    })
  })

})

/**
* emitJob
* @param  {[type]} socket [description]
* @return {[type]}        [description]
*/
emitJob = (socket) => {
  mongoDb.collection('Jobs').findOne({
    status: 'working'
  }, {
    jobId:1, code:1, type:1
  }, (err, result) => {
    if (err) {
      // TODO error handling
      console.log('err', err)
    } else if (result) {
      socket.leave('available')
      socket.emit('work', result)
    } else {
      socket.join('available')
      console.log('joined available')
    }
  })
}

io.on('connection', (socket) => {

  var _id = socket.id.replace('/#', '')

  mongoDb.collection('Clients').insert({
    _id: _id,
    handshake: socket.handshake
  })

  socket.on('disconnect', () => {
    mongoDb.collection('Clients').remove({
      _id: _id
    })
  })

  socket.on('result', (jobResult) => {

    jobResult.socket = _id
    jobResult.resultId = uuid.v4()
    jobResult.createdAt = new Date()
    jobResult.hashedResult = crypto.createHash('md5').update(JSON.stringify(jobResult.data)).digest('hex')

    mongoDb.collection('JobsResults').insert(jobResult, (err, result) => {
      console.log('result', result);
      if (!err && result) {
        if (err) { return false }
        if (!!jobResult.reqNewJob)
          emitJob(socket)
      }
    })

  })

  socket.on('status', (status) => {
    if (status === 'working') {
      socket.leave('available')
    } else if (status === 'ready') {
      emitJob(socket)
    }
  })

})
