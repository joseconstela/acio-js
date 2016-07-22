"use strict"

let collection = 'CappedJobs'

module.exports.stream = (dbs) => {
  return dbs.mongo.collection(collection).find({}, {
    tailable: true,
    awaitData: true
  }).stream()
}
