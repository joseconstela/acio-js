"use strict"

var uuid = require('uuid'),
    crypto = require('crypto')

/**
 * [collectionName description]
 * @type {String}
 */
var collectionName = 'JobsResults'

/**
 * [description]
 * @param  {[type]} dbs [description]
 * @param  {[type]} doc [description]
 * @param  {[type]} _cb [description]
 * @return {[type]}     [description]
 */
module.exports.insert = (dbs, doc, _cb) => {

  doc._id = uuid.v4()
  doc.createdAt = new Date()
  doc.hashedResult = crypto.createHash('md5').update(JSON.stringify(doc.data)).digest('hex')

  dbs.mongo.collection(collectionName).insert(doc, (err, result) => {
    _cb(err, result)
  })

}
