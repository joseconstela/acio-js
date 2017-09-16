"use strict"

const db = require('../db/_db'),
      defaultQuery = {status: 'working'},
      projection = {
    	    name: "$name",
    	    code: "$template.code",
    	    libraries: "$template.libraries",
    	    env: "$env",
    	    parameter: "$collection.parameters"

    	}

/**
 * [description]
 * @param  {[type]} dbs            [description]
 * @param  {Object} query          Mongo's query against jobs collection
 * @param  {[type]} io             [description]
 * @param  {[type]} socket         [description]
 * @param  {[type]} limit          [description]
 * @param  {[type]} allowLeaveAval [description]
 * @param  {[type]} _cb            [description]
 * @return {[type]}                [description]
 */
module.exports.emitJob = (dbs, query, io, socket, limit, allowLeaveAval, _cb) => {

  let dbQuery = query || defaultQuery;

  if (socket) {
    dbQuery._id = { $nin: Object.keys(socket.rooms).splice(1) }
  }

  dbs.mongo.collection('Jobs').aggregate([
  	{
      $match: dbQuery
    },
    {
      $limit: limit
    },
    {
      $project: projection
    }
  ], (error, result) => {
    if (error) {
      return _cb(error, null)
    }

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

    _cb(error, null);
  })

}

module.exports.emitJobAvailables = (dbs, query, io, limit, allowLeaveAval, _cb) => {

  let queryOpts = {
    query: query || defaultQuery,
    //proj: projectFields,
    opts: {limit: limit},
    transform: ['array']
  }

  db.jobs.get(dbs, queryOpts, (err, result) => {
    if (err) {
      return _cb(err, null)
    }

    if (result) {
      io.to('available').emit('jobs', result)
    }

    _cb(err, null);
  })

}
