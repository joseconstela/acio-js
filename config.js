"use strict"

let Confidence = require('confidence')

let settings = {
  mongodb: {
    $filter: 'env',
    development: {
      url: 'mongodb://localhost:3001/meteor'
    },
    production: {
      url: 'mongodb://localhost:27017/aciojs'
    },
    $default: {
      url: 'mongodb://localhost:27017/aciojs'
    }
  },
  server: {
    $filter: 'env',
    development: {
      port: 8000
    },
    production: {
      port: 8000
    },
    $default: {
      port: 8000
    }
  }
}

//Init Confidence
let store = new Confidence.Store(settings)

exports.get = (key) => {
  return store.get(key, {
    env: process.env.NODE_ENV
  })
}
