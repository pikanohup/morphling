module.exports = {
  DEFAULT_STABILIZE_NAMES: [
    'id', 'nodeId', 'objectId', 'scriptId', 'timestamp', 'backendNodeId', 'parentId', 'frameId', 'loaderId', 'baseURL', 'documentURL', 'styleSheetId', 'executionContextId', 'targetId', 'browserContextId', 'sessionId', 'ownerNode'
  ],
  DEFAULT_BROWSER_OPTION: {
    headless: true,
    defaultViewport: {
      width: 1366,
      height: 768,
      isMobile: false
    },
    args: [
      '--no-sandbox',
      '--disable-gpu'
    ]
  },
  DEBUG_BROWSER_OPTION: {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-gpu'
    ]
  },
  DEFAULT_TASK_TIMEOUT: 90000,
  DEFAULT_DRIVER_TASK_POOL_OPTION: {
    max: 5,
    min: 2,
    maxUseCount: 1024,
    testOnBorrow: true,
    autoStart: false,
    idleTimeoutMillis: 1800000, // 30 min
    evictionRunIntervalMillis: 180000, // 3min
    browserOption: this.DEFAULT_BROWSER_OPTION
  },
  DEBUG_DRIVER_TASK_POOL_OPTION: {
    max: 2,
    min: 1,
    maxUseCount: 2,
    testOnBorrow: true,
    autoStart: false,
    idleTimeoutMillis: 1800000, // 30 min
    evictionRunIntervalMillis: 60000, // 1min
    browserOption: this.DEBUG_BROWSER_OPTION
  }
}
