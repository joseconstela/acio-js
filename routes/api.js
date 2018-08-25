"use strict"

let express = require('express'),
    db = require('../db')

module.exports = (dbs) => {

  let api = express.Router();

  api.get('/jobs', (req, res) => {

    let selectFields = {history: false}
    if (!!req.query.history) { delete selectFields['history'] }

    db.jobs.get(dbs, {
      query: {},
      fields: selectFields,
      transform: ['array']
    }, (err, result) => {
      res.send({
        data: result,
        totalCount: result.length
      });
    })
      
  });

  api.post('/jobs', (req, res) => {

    let job = _.assign({}, _.pick(req.params, [
      'name', 'description', 'env', 'template', 'collection'
    ]))

    db.jobs.insert(job, (err, result) => {
      res.send(result);
    })

  })

  api.get('/jobs/:jobId', (req, res) => {
    
    let selectFields = {history: false}
    if (!!req.query.history) { delete selectFields['history'] }

    db.jobs.getOne(dbs, {
      query: { _id: req.params.jobId },
      fields: selectFields,
    }, (err, result) => {
      res.send(result);
    })

  })

  api.get('/jobs/:jobId/results', (req, res) => {
    res.send(req.params.jobId)
  })

  api.get('/jobs/:jobId/results/all', (req, res) => {
    res.send(req.params.jobId)
  })

  return api

}
