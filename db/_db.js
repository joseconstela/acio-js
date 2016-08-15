"use strict"

module.exports.jobs = require('./jobs')
module.exports.clients = require('./clients')
module.exports.cappedJobs = require('./cappedJobs')
module.exports.jobsResults = require('./jobsResults')
module.exports.hash = require('./hash')

/**
 * [description]
 * @param  {[type]} _cb [description]
 * @return {[type]}     [description]
 */
module.exports.connect = (_cb) => {
  mongoClient.connect(mongoConfig.url, (err, result) => {
    _cb(err, result)
  })
}

/**
 * [description]
 * @param  {[type]} dbs [description]
 * @return {[type]}     [description]
 */
module.exports.startup = (dbs) => {
  if (process.env.NODE_ENV === 'development') {
    dbs.mongo.collection('Clients').drop()
    dbs.mongo.collection('JobsResults').drop()
  }

  dbs.mongo.createCollection('CappedJobs', {
    capped: true,
    size: 5 * 1048576,
    max: 100
  })
}
