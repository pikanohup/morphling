const { Session } = require('../lib/session')
const EventEmitter = require('events').EventEmitter

describe('class Session', () => {
  let CDP
  let cdp
  let dp

  before(() => {
    CDP = class extends EventEmitter {}
    CDP.prototype.send = td.function()
  })

  beforeEach(() => {
    cdp = new CDP()
    dp = (new Session(null, cdp)).protocol
  })

  afterEach(() => {
    td.reset()
  })

  describe('when sending commands', () => {
    beforeEach(() => {
      td.when(CDP.prototype.send(td.matchers.isA(String), td.matchers.isA(Object)))
        .thenResolve({ snapshotId: 606 })
    })

    it('should send proper method and params', async () => {
      const layerId = 707
      const { snapshotId } = await dp.LayerTree.makeSnapshot({ layerId })
      snapshotId.should.be.equal(606)

      const methodCaptor = td.matchers.captor()
      const paramsCaptor = td.matchers.captor()
      td.verify(CDP.prototype.send(methodCaptor.capture(), paramsCaptor.capture()))
      methodCaptor.value.should.be.equal('LayerTree.makeSnapshot')
      paramsCaptor.value.layerId.should.be.equal(707)
    })
  })

  it('should describe events', async () => {
    setTimeout(() =>
      cdp.emit('LayerTree.layerTreeDidChange', {
        parmas: {
          layers: [
            { layerId: 'number', backendNodeId: 'number', offsetX: 0, offsetY: 0 },
            { layerId: 'number', offsetX: 10, offsetY: 10, drawsContent: true }
          ]
        }
      }), 1000)

    const layers = (await dp.LayerTree.onceLayerTreeDidChange()).parmas.layers
    layers.length.should.be.equal(2)
    layers[0].offsetX.should.be.equal(0)
  })
})
