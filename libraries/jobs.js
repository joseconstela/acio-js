"use strict"

var db = require('../db/_db')

/**
 * [description]
 * @param  {[type]} dbs            [description]
 * @param  {[type]} io             [description]
 * @param  {[type]} socket         [description]
 * @param  {[type]} limit          [description]
 * @param  {[type]} allowLeaveAval [description]
 * @param  {[type]} _cb            [description]
 * @return {[type]}                [description]
 */
module.exports.emitJob = (dbs, io, socket, limit, allowLeaveAval, _cb) => {

  let queryOpts = {
    query: {status: 'working'},
    proj: {code:1, type:1, name:1, libraries: 1},
    opts: {limit: limit},
    transform: ['array']
  }

  db.jobs.get(dbs, queryOpts, (err, result) => {
    if (err) return _cb(err, null)

    if(result.length) {
      if (socket) {

        result.forEach((r) => {
          socket.join(r._id)
        })

        socket.emit('jobs', result)

        if(allowLeaveAval) {
          if (result.length === limit) {
            socket.leave('available')
          }
        }

      } else {
        io.to('available').emit('jobs', result)
      }
    }

    if (socket && (!result.length || result.length < limit)) {
      if (socket) socket.join('available')
    }

    _cb(err, null);

  })

}
