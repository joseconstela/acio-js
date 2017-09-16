"use strict"

const assert = require('assert');
const async = require('async');
let collection = 'CappedJobs'

module.exports.stream = (dbs) => {
  return dbs.mongo.collection(collection).find({}, {
    tailable: true,
    awaitData: true,
    timeout: false,
    numberOfRetries: Number.MAX_VALUE
  }).stream()
}

module.exports.restart = (dbs, cb) => {

  async.waterfall([
    function drop(cb) {
      dbs.mongo.collection(collection).drop(cb);
    },

    function create(data, cb) {
      dbs.mongo.createCollection(collection, {
        capped: true,
        size: 100000
      }, cb);
    },

    function insert(data, cb) {
      dbs.mongo.collection(collection).insert({
        a: 1
      }, cb)
    }

  ], (error, result) => {
    assert.equal(null, error);
    cb(error, result)
  })
}