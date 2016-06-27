(function(global) {

  /**
  * @summary Client's version
  * @type {String}
  */
  var version = '0.0.1';

  /**
  * @summary Flag whenever the a 'ready' message is received to start working.
  * True if all requirements are satisfied.
  * @type {Boolean}
  */
  var readyMessage = false;

  /**
  * @summary Flag whenever the client's requirements are satified to start working.
  * True if all requirements are satisfied.
  * @type {Boolean}
  */
  var coreReady = false;

  /**
  * @summary Object containing all configuration parameters
  * @type {Object}
  */
  var config = {
    storage: {          // Caching system to use
      name: 'wqData',   // Name/prefix for the cache (or database name)
      version: 3,       // Cache structure version
      system: '',       // Cache solution's name
      instance: null    // Instance for the cache's solution (i.e. IDBDatabase)
    }
  };

  /**
  * @summary Socketio's interface
  * @type {Object}
  */
  var socket = null;

  /**
  * @summary Stores the project's code we want to work with
  * @type {String}
  */
  var projectCode = '';

  /**
  * @summary Stores the project's endpoint
  * @type {String}
  */
  var endpoint = '';

  /**
  * @summary Holds the current job information
  * @type {Object}
  */
  var currentJob = {
    jobId: '',
    type: '',
    code: ''
  };

  /**
  * @summary Sends a postMessage to WQ debugger
  * @param {String[]} msg Array containing the messages to be logged
  */
  wqLog = function (arr) {
    postMessage( JSON.stringify ( arr ) );
  }

  /**
  * @summary Initialise WQ's core system (import libraries, detect storage system, etc)
  */
  wqInit = function () {

    // Import necesary scripts
    //importScripts('https://cdn.socket.io/socket.io-1.4.5.js');
    importScripts('/socket.io-1.4.5.js');

    // GPU Accelerated JavaScript - not available for Web Workers
    // importScripts('http://gpu.rocks/js/gpu.js?nocache');

    // Detect the storage system to use as cache
    wqStoreSystem(function(err, result) {
      if (err) {
        throw "Can't detect storage system";
      } else {
        wqLog(['Storage system:', result]);
        wqLog(['Core ready']);
        coreReady = true;

        // Check if all requirements to start working are fullfilled.
        wqReadySteady();
      }
    });
  }

  /**
  * @summary Check if WQ can start working
  * Called via worker.postMessage('start');
  */
  wqReady = function () {
    readyMessage = true;
    wqReadySteady();
  }

  /**
  * @summary Store the project's endpoint and check if WQ can start working
  * Called via worker.postMessage('endpoint.https...');
  *
  * @param  {string} pEndpoint Project's endpoint
  */
  wqEndpoint = function (pEndpoint) {
    endpoint = pEndpoint;
    wqLog(['Endpoint:', pEndpoint]);

    // Check if all requirements to start working are fullfilled.
    wqReadySteady();
  }

  /**
  * @summary Check if all requirements to start working are fullfilled. If so,
  * loads the job to do and executes it.
  */
  wqReadySteady = function() {
    if (!coreReady || !readyMessage || !endpoint) { return false; }

    wqInitSocket(function() {

      wqLoadJob(function(error, loaded) {
        if (error) { return false; }

        if (loaded) {
          wqExe();
        } else {
          wqEmit('status', 'ready');
        }
      });
      
    });

  }

  /**
  * @summary Executes the currentJob's code.
  * Such code must return the results via ```wqEmit('result', getPrimes(15));```
  */
  wqExe = function () {
    wqEmit('status', 'working');
    var code = decodeURIComponent(escape( currentJob.code ));
    eval(code);
  }

  /**
   * @summary [wqInitSocket description]
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  wqInitSocket = function (cb) {
    socket = io(endpoint);

    wqLog(['Socket conected']);
    wqLog([]);

    socket.on('error', function() {
      wqLog(['ERROR!']);
    });

    socket.on('work', function(job){
      wqLog(['~>', 'work', job]);
      wqStore('save', 'jobs', job, function(error, result) {
        if (error) return false;
        currentJob = job;
        wqLog(currentJob);
        wqExe();
      });
    });

    cb();
  }

  /**
  * @summary [function description]
  * @param  {[type]} data [description]
  */
  wqResult = function(data) {
    wqEmit('result', {
      jobId: currentJob.jobId,
      data: data
    });
  }

  /**
  * @summary [wqEmit description]
  * @param  {string} type [description]
  * @param  {string} data [description]
  */
  wqEmit = function (type, data) {
    wqLog(['<~', type, data]);
    socket.emit(type, data);
  }

  /**
  * @summary [function description]
  * @return {function} [description]
  */
  wqStoreSystem = function(cb) {
    [
      // 'Storage', // https://www.w3.org/TR/webstorage/#the-storage-interface
      'webkitIndexedDB', // deprecated
      'indexedDB' // https://www.w3.org/TR/IndexedDB/
    ].forEach(function(s){
      if (typeof global[s] !== 'undefined') {
        config.storage.system = s;
      }
    });

    if (config.storage.system === 'indexedDB') {

      var bs = {
        jobs: {
          options: {
            keyPath: 'id',
            autoIncrement: true
          }/*,
          indexes: [
            {
              name: 'jobId',
              field: 'jobId',
              options: {
                unique: true
              }
            }
          ]*/
        }
      };

      indexedDB.deleteDatabase(config.storage.name);
      var db = indexedDB.open(config.storage.name, config.storage.version);
      db.onerror = function(ev) {
        cb(ev, null);
      };
      db.onupgradeneeded = function(ev) {
        wqLog(['indexedDB','onupgradeneeded']);
        config.storage.instance = db.result;

        for(var b in bs) {
          var ob = config.storage.instance.createObjectStore(b, bs[b].options);
          if (!!bs[b].indexes) {
            bs[b].indexes.forEach(function(i) {
              ob.createIndex(i.name, i.field, i.options);
            })
          }
        }
      };
      db.onsuccess = function(ev) {
        config.storage.instance = db.result;
        cb(null, config.storage.system);
      };
    } else {
      cb(null, config.storage.system);
    }
  },

  /**
  * @summary [wqStore description]
  * @param  {string} action [description]
  * @param  {string} name   [description]
  * @param  {object} object [description]
  * @return {function}        [description]
  */
  wqStore = function (action, bucket, object, cb) {

    if (config.storage.system === 'indexedDB') {
      if (action === 'save') {
        var tr = config.storage.instance.transaction([bucket], 'readwrite');
        var op = tr.objectStore(bucket).put(object);
        op.onerror = function(ev) {
          cb(op.error, null);
        }
        tr.oncomplete = function(ev) {
          cb(null, null);
        }
      } else if (action === 'get') {
        var tr = config.storage.instance.transaction([bucket], 'readonly');
        var ob = tr.objectStore(bucket);
        var els = [];
        ob.openCursor().onsuccess = function (e) {
          var result = e.target.result;
          if (result === null) {
            return;
          }
          els.push(result.value);
          result.continue();
        };
        tr.oncomplete = function(ev) {
          cb(null, els.length ? els : null);
        }
      }
    }
  }

  /**
  * @summary [wqLoadJob description]
  * @param  {Function} cb [description]
  * @return {function}      [description]
  */
  wqLoadJob = function (cb) {
    wqStore('get', 'jobs', null, function(error, result) {
      if (result) {
        currentJob = result[0];
      }
      cb(error, !!result);
    });
  }

  /**
  * @summary [onmessage description]
  * @param  {object} ev [description]
  */
  onmessage = function (ev) {
    var d = ev.data.split('.');
    if (d[0] === 'start') {
      wqReady();
    } else if (d[0] === 'endpoint') {
      wqEndpoint(d[1]);
    } else {
      if (!wq) {
        postMessage('[LIBRARY] error - not wqInitialised');
      }
    }
  };

  wqLog(['WebQueue', version]);
  wqInit();

})(this);
