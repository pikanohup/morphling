const { DriverPool, layerTask } = require('./lib/morphling')

;(async () => {
  const driverPool = await new DriverPool()
  // TODO
  driverPool.queue(layerTask, 'http://baidu.com')
  driverPool.queue(layerTask, 'http://jd.com')
  await driverPool.clear()
})()
