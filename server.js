var app = require('express')()
    http = require('http').Server(app)
    io = require('socket.io')(http)
    uuid = require('uuid')
    crypto = require('crypto')

    MongoClient = require('mongodb').MongoClient
    mongoDb = null
    assert = require('assert')

var config = {
  port: process.env.PORT || 3000,
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/aciojs'
}

MongoClient.connect(config.mongoUrl, (err, db) => {
  assert.equal(null, err)
  mongoDb = db

  if (process.env.NODE_ENV === 'development') {
    mongoDb.collection('Clients').drop()
    mongoDb.collection('JobsResults').drop()
  }

  http.listen(config.port, () => {
    console.log('listening on *:' + config.port)
  })
})

emitJob = (socket) => {
  mongoDb.collection('Jobs').findOne({
    status: 'working'
  }, {
    jobId:1, code:1, type:1
  }, (err, result) => {
    if (!err && result) {
      socket.emit('work', result)
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

  socket.on('result', (result) => {

    result.socket = _id
    result.resultId = uuid.v4()
    result.createdAt = new Date()
    result.hashedResult = crypto.createHash('md5').update(JSON.stringify(result.data)).digest('hex')

    mongoDb.collection('JobsResults').insert(result, (err, result) => {
      if (!err && result) {
        if (err) { return false }
        emitJob(socket)
      }
    })

  })

  socket.on('status', (status) => {

    if (status === 'working') {

    } else if (status === 'ready') {
      emitJob(socket)
    }

  })

})
