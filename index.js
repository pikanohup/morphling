const { DriverPool, getLayersTask } = require('./lib/morphling')

;(async () => {
  const driverPool = await new DriverPool()
  // TODO
  driverPool.queue(getLayersTask, './test/resources/get-layers.html')
  // driverPool.queue(getLayersTask, 'http://jd.com')
  await driverPool.clear()
})()
