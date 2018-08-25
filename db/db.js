
/**
 * [description]
 * @param  {[type]} _cb [description]
 * @return {[type]}     [description]
 */
module.exports.connect = (_cb) => {
    return new Promise((resolve, reject) => {
        mongoClient.connect(mongoConfig.url, (err, result) => {
        return err ? reject(err) : resolve(result)
    })
})

}

/**
 * [description]
 * @param  {[type]} dbs [description]
 * @return {[type]}     [description]
 */
module.exports.startup = (dbs, cb) => {
    if (process.env.NODE_ENV === 'development') {
        try {
        dbs.mongo.collection('Clients').drop()
        } catch (ex) {}

        try {
        dbs.mongo.collection('JobsResults').drop()
        } catch (ex) {}
    }

    return new Promise((resolve, reject) => {
        dbs.mongo.createCollection('CappedJobs', {
            capped: true,
            size: 5 * 1048576,
            max: 100
        }, (error, result) => {
            return error ? reject(error) : resolve(result)
        })
    })
    
}
