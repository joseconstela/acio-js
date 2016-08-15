"use strict"

let collection = 'Hash'

/**
 * [description]
 * @param  {[type]} dbs        [description]
 * @param  {[type]} query      [description]
 * @param  {[type]} projection [description]
 * @param  {[type]} _cb        [description]
 * @return {[type]}            [description]
 */
module.exports.find = (dbs, query, projection, _cb) => {
  dbs.mongo.collection(collection).find(query, projection, (error, result) => {
    return _cb(error, result)
  })
}

/**
 * [description]
 * @param  {[type]} dbs [description]
 * @param  {[type]} doc [description]
 * @param  {[type]} _cb [description]
 * @return {[type]}     [description]
 */
module.exports.insert = (dbs, doc, _cb) => {
  dbs.mongo.collection(collection).insert(doc, (error, result) => {
    return _cb(error, result)
  })
}

/**
 * [description]
 * @param  {[type]} dbs [description]
 * @param  {[type]} doc [description]
 * @param  {[type]} _cb [description]
 * @return {[type]}     [description]
 */
module.exports.remove = (dbs, doc, _cb) => {
  dbs.mongo.collection(collection).remove(doc, (error, result) => {
    return _cb(error, result)
  })
}
