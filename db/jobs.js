'use strict'

const _ = require('lodash')

/**
* [collectionName description]
* @type {String}
*/
var collectionName = 'Jobs'

/**
* [description]
* @param  {[type]} dbs  [description]
* @param  {[type]} opts [description]
* @param  {[type]} _cb  [description]
* @return {[type]}      [description]
*/
module.exports.get = (dbs, opts, _cb) => {

  dbs.mongo.collection(collectionName).find(opts.query || {}, opts.fields || {}, opts.opts || {}, (err, cursor) => {
    if (err) return _cb(err, cursor)

    if (!!opts.transform && opts.transform.indexOf('array') > -1) {
      cursor.toArray((err, res) => {
        _cb(err, _.map(res, (r) => {
          return {
            _id: r._id,
            name: r.name,
            code: r.template.code,
            libraries: r.template.libraries,
            parameter: r.collection.parameters
          }
        }))
      })
    } else {
      _cb(err, cursor)
    }
  })

}

/**
 * [description]
 * @param  {[type]} dbs  [description]
 * @param  {[type]} opts [description]
 * @param  {[type]} _cb  [description]
 * @return {[type]}      [description]
 */
module.exports.getOne = (dbs, opts, _cb) => {

  dbs.mongo.collection(collectionName).findOne(opts.query || {}, opts.fields || {}, (err, result) => {
    _cb(err, result)
  })

}
