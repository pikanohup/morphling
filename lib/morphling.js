const fs = require('fs')
const genericPool = require('generic-pool')
const { Driver } = require('./driver')
const { Task, TaskResourcePool } = require('./task')
const { DEFAULT_DRIVER_TASK_POOL_OPTION, DEFAULT_STABILIZE_NAMES } = require('./constants')
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

const getLayersTask = new Task(async (driver, html) => {
  const logger = new Logger(process.stdout, DEFAULT_STABILIZE_NAMES)
  const htmlStr = fs.readFileSync(html, 'utf8')
  const { page, dp } = await driver.startHTML(htmlStr)

  const layerMutations = (oldLayers, newLayers) => {
    const oldLayerIds = oldLayers.map(layer => layer.layerId)
    const newLayerIds = newLayers.map(layer => layer.layerId)
    return {
      additions: newLayers.filter(layer => oldLayerIds.indexOf(layer.layerId) === -1),
      removals: oldLayers.filter(layer => newLayerIds.indexOf(layer.layerId) === -1)
    }
  }

  const attributesFromArray = (attributes) => {
    const map = new Map()
    for (let i = 0, count = attributes.length; i < count; i += 2) {
      map.set(attributes[i], attributes[i + 1])
    }
    return map
  }

  const dumpLayers = (layers) => {
    // TODO
    const replacer = (key, value) => {
      if (['layerId', 'parentLayerId', 'backendNodeId', 'paintCount', 'nearestLayerShiftingContainingBlock'].indexOf(key) >= 0) {
        return typeof value
      }
      // some values differ based on port, but the ones we most
      // care about will always be less or equal 200.
      if ((key === 'width' || key === 'height') && value > 200) {
        return typeof value
      }
      return value
    }

    // Keep 'internal' layers out for better stability.
    layers = layers.filter(layer => !!layer.backendNodeId)
    logger.log('\n' + JSON.stringify(layers, replacer, '    '))
  }

  await dp.DOM.getDocument()
  dp.LayerTree.enable()
  const initialLayers = (await dp.LayerTree.onceLayerTreeDidChange()).layers

  // TODO
  dp.Runtime.evaluate({ expression: 'addCompositedLayer()' })
  const modifiedLayers = (await dp.LayerTree.onceLayerTreeDidChange()).layers

  const mutations = layerMutations(initialLayers, modifiedLayers)
  const newLayer = mutations.additions[0]

  const nodeResponse = await dp.DOM.pushNodesByBackendIdsToFrontend({ backendNodeIds: [newLayer.backendNodeId] })
  const attributesResponse = await dp.DOM.getAttributes({ nodeId: nodeResponse.nodeIds[0] })
  const attributes = attributesFromArray(attributesResponse.attributes)
  if (attributes.get('id') !== 'last-element') {
    logger.log('FAIL: Did not obtain the expected element for the last inserted layer.')
  }

  dumpLayers(initialLayers)
  dumpLayers(modifiedLayers)
})

module.exports = {
  DriverPool: DriverPool,
  getLayersTask: getLayersTask
}
