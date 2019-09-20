const genericPool = require('generic-pool')
const { Driver } = require('./driver')
const { Task, TaskResourcePool } = require('./task')
const { DEFAULT_DRIVER_TASK_POOL_OPTION } = require('./constants')
const { Logger } = require('./logger')

class DriverPool extends TaskResourcePool {
  constructor (option = DEFAULT_DRIVER_TASK_POOL_OPTION) {
    super(async () => {
      const { maxUseCount, browserOption } = option
      const factory = {
        create: async () => {
          const driverInstance = await new Driver(browserOption)
          driverInstance.useCount = 0
          return driverInstance
        },
        destroy: (driverInstance) => {
          return driverInstance.close()
        },
        validate: (driverInstance) => {
          return Promise.resolve(driverInstance.useCount < maxUseCount)
        }
      }
      delete option.maxUseCount
      delete option.browserOption
      const pool = await genericPool.createPool(factory, option)
      this._pool = pool
    })
  }
}

const layerTask = new Task(async (driver, url) => {
  // TODO
  const logger = new Logger(process.stdout)
  const { page } = await driver.startURL(url)
  logger.log(page.url())
})

module.exports = {
  DriverPool: DriverPool,
  layerTask: layerTask
}
