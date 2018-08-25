/**
* @summary Holds the current job information
* @type {Object}
*/
var currentJob = {
  _id: '',
  type: '',
  code: '',
  libraries: []
};

var process = {
  env: [],
  argv: []
};

var workerId = null;

/**
* @summary Sends a message to aciojs library
* @param {String[]} msg Array containing the messages to be logged
*/
function log(message) {
  postMessage(JSON.stringify(Object.assign(
    {workerId:workerId},
    message
  )));
}

/**
* @summary [function description]
* @param  {[type]} data [description]
*/
function result(data, opts) {
  log({
    type: 'result',
    jobId: currentJob._id,
    result: Object.assign({data:data}, opts)
  });
}

/**
* @summary Executes the currentJob's code.
*/
function execute() {
  
  try {
    if (!!currentJob.libraries) {
      currentJob.libraries.forEach(function(l) {
        importScripts(l);
      })
    }
    var code = decodeURIComponent(escape( currentJob.code ));
    eval(code);
  } catch (ex) {
    // TODO error handling
    log({
      status: 'error',
      error: ex.message
    });
  }
}

/**
* @summary [onmessage description]
* @param  {object} ev [description]
*/
onmessage = function (ev) {
  var d = ev.data;
  workerId = d.workerId;
  if(d.type === 'job') {
    currentJob = d.job;

    if (!!currentJob.env) {
      // TODO trim and validate
      currentJob.env.forEach(function(v,k) {
        process.env[k] = v;
      });
    }

    if (!!currentJob.argv) {
      // TODO trim and validate
      currentJob.argv.forEach(function(v) {
        process.argv.push(v);
      });
    }

    execute();
  }
};
