const { DriverPool, getLayersTask } = require('./lib/morphling')

;(async () => {
  const driverPool = await new DriverPool()
  // TODO
  const result = await driverPool.queue(getLayersTask, './test/resources/get-layers.html')
  await driverPool.clear()
})()
