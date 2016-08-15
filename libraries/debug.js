'use strict'

const colors = require('colors')

/**
 * Logs debugging's section title
 * @param  {String} str The section's title
 */
module.exports.title = (str) => {
  console.log('')
  console.log(str.blue)
  console.log('============================================================'.blue)
}

/**
 * Logs a success message
 * @param  {String} str The message to log
 */
module.exports.success = (str) => {
  console.log(`✔︎ ${new Date} ${str}`.green)
}

/**
 * Logs an error message
 * @param  {String} str The message to log
 */
module.exports.error = (str, err) => {
  console.log(`❌ ${new Date} ${str}`.red)
  if(err) {
    console.log(err)
  }
}

/**
 * Logs an info message
 * @param  {String} str The message to log
 */
module.exports.info = (str) => {
  console.log(`ℹ︎ ${new Date} ${str}`.yellow)
}
