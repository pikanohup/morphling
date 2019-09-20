const { DEFAULT_TASK_TIMEOUT } = require('./constants')

class Task {
  constructor (callback, timeout = DEFAULT_TASK_TIMEOUT) {
    this._callback = callback
    this.timeout = timeout

    this._terminatePromise = new Promise((resolve, reject) => {
      this._terminateCallback = resolve
    })
  }

  async run (runner, ...args) {
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(resolve.bind(null, new Error('Timeout')), this.timeout)
    })
    try {
      return await Promise.race([
        Promise.resolve()
          .then(this._callback.bind(null, runner, ...args))
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

class TaskResourcePool {
  constructor (poolConstructor) {
    this._pool = null
    const init = (async () => {
      await poolConstructor()
      delete this.then
      return this
    })()
    this.then = init.then.bind(init)
  }

  async acquire () {
    const instance = await this._pool.acquire()
    instance.useCount++
    return instance
  }

  async queue (task, ...args) {
    let instance
    try {
      instance = await this.acquire()
      await task.run(instance, ...args)
    } catch (error) {
      throw error
    } finally {
      this._pool.release(instance)
    }
  }

  async clear () {
    await this._pool.drain()
    await this._pool.clear()
  }
}

module.exports = {
  Task: Task,
  TaskResourcePool: TaskResourcePool
}
