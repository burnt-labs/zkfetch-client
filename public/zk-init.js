// Browser initialization for zkFetch
(function() {
  // Mock worker_threads module
  if (!window.worker_threads) {
    window.worker_threads = {
      Worker: class MockWorker {
        constructor() {
          this.onmessage = null;
          this.onerror = null;
        }
        postMessage(data) {
          // Mock implementation
          if (this.onmessage) {
            setTimeout(() => {
              this.onmessage({ data: { type: 'ready' } });
            }, 0);
          }
        }
        terminate() {}
      },
      parentPort: null,
      workerData: {
        module: 'zk-symmetric-crypto',
        type: 'browser'
      },
      isMainThread: true
    };
  }

  // Mock module if needed
  if (typeof module === 'undefined') {
    window.module = { exports: {} };
  }

  // Ensure global is defined
  if (typeof global === 'undefined') {
    window.global = window;
  }

  // Mock require for worker threads
  if (!window.require) {
    window.require = function(name) {
      if (name === 'worker_threads') {
        return window.worker_threads;
      }
      throw new Error(`Cannot find module '${name}'`);
    };
  }

  console.log('zkFetch browser initialization complete');
})();