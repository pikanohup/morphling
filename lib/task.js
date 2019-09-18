const genericPool = require('generic-pool')

class Task {
  constructor (callback, timeout) {
    this._callback = callback
    this.timeout = timeout

    this._terminatePromise = new Promise((resolve, reject) => {
      this._terminateCallback = resolve
    })
  }

  async run (...args) {
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(resolve.bind(null, new Error('Timeout')), this.timeout)
    })
    try {
      return await Promise.race([
        Promise.resolve()
          .then(this._callback.bind(null, ...args))
          .then(() => null)
          .catch(error => error),
        timeoutPromise,
        this._terminatePromise
      ])
    } catch (error) {
      return error
    }
  }

  terminate () {
    this._terminateCallback(new Error('Terminated'))
  }
}

class TaskPool {
  constructor (task, factory, poolOption) {
    const init = (async () => {
      this._task = task
      this._pool = await genericPool.createPool(factory, poolOption)
      delete this.then
      return this
    })()
    this.then = init.then.bind(init)
  }

  queue (...args) {
    // TODO
  }

  run () {

  }

  async clear () {
    await this.pool.drain()
    await this.pool.clear()
  }
}

module.exports = {
  Task: Task,
  TaskPool: TaskPool
}
