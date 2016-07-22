"use strict"

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

  dbs.mongo.collection(collectionName).find(opts.query, opts.proj, opts.opts, (err, cursor) => {
    if (err) return _cb(err, cursor)

    if (opts.transform.indexOf('array') > -1) {
      cursor.toArray((err, res) => {
        _cb(err, res)
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
module.exports.findOne = (dbs, opts, _cb) => {

  dbs.mongo.collection(collectionName).findOne(opts.query, opts.proj, () => {
    console.log(arguments);
    _cb(err, result)
  })

}
