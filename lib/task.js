class Task {
  constructor (name, callback, timeout) {
    this.name = name
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

module.exports = {
  Task: Task
}
