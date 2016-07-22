"use strict"

let Confidence = require('confidence')

let settings = {
  mongodb: {
    $filter: 'env',
    development: {
      url: 'mongodb://localhost:27017/aciojs'
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
      port: process.env.PORT || 3000
    },
    production: {
      port: process.env.PORT || 3000
    },
    $default: {
      port: process.env.PORT || 3000
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
