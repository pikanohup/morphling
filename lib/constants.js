module.exports = {
  DEFAULT_STABILIZE_NAMES: [
    'id', 'nodeId', 'objectId', 'scriptId', 'timestamp', 'backendNodeId', 'parentId', 'frameId', 'loaderId', 'baseURL', 'documentURL', 'styleSheetId', 'executionContextId', 'targetId', 'browserContextId', 'sessionId', 'ownerNode'
  ],
  DEFAULT_BROWSER_OPTIONS: {
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
  DEBUG_BROWSER_OPTIONS: {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-gpu'
    ]
  }
}
