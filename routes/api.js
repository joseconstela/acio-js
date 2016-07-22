"use strict"

let express = require('express'),
    db = require('../db/_db')

module.exports = (dbs) => {

  let api = express.Router();

  api.get('/jobs', (req, res) => {
    res.send('some json');
  });

  api.get('/jobs/:jobId', (req, res) => {
    res.send(req.params.jobId);
  });

  api.get('/jobs/:jobId/results', (req, res) => {
    res.send(req.params.jobId);
  });

  api.get('/jobs/:jobId/results/all', (req, res) => {
    res.send(req.params.jobId);
  });

  return api;

}
