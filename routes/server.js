"use strict"

const express = require('express')
const db = require('../db')

module.exports = (dbs) => {
  let api = express.Router()
  api.get('/', (req, res) => {
    res.send('')
  })
  return api
}
