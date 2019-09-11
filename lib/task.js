const MultiMap = require('multimap')

class TaskCallback {
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

class Task {
  constructor (job, callback, timeout) {
    this._job = job
    this._taskCallback = new TaskCallback(callback, timeout)

    this.error = null
  }
}

class Job {
  constructor (name) {
    this.name = name
    this.tasks = []

    this.before = null
    this.after = null
  }
}

class TaskManager {
  constructor (driver, jobs, tasks, parallel) {
    this._driver = driver
    this._jobs = jobs
    this._tasks = tasks
    this._parallel = parallel

    this._termination = null
    this._runningTaskCallbacks = new MultiMap()

    this._workers = new MultiMap()
    let workerId = 0
    tasks.forEach(task => {
      task.error = null
      this._workers.set(task, workerId)
      this._workers.set(task.job, workerId)
      workerId = (workerId + 1) % parallel
    })
  }

  async _runTask (workerId, task) {
    if (this._termination || !this._workers.has(task, workerId)) {
      return
    }

    this._runningTaskCallbacks.set(workerId, task._taskCallback)
    const error = await task._taskCallback.run(task)
    this._runningTaskCallbacks.delete(workerId, task._taskCallback)

    if (this._termination) {
      return
    }
    task.error = error
  }

  async _runJob (workerId, job) {
    if (this._termination || !this._workers.has(job, workerId)) {
      return
    }
    await this._runHook(workerId, job, 'before')
    for (const task of job.tasks) {
      if (!this._workers.has(task, workerId)) {
        continue
      }
    }
    await this._runHook(workerId, job, 'after')
  }

  async _runHook (workerId, job, hookName, ...args) {
    if (this._termination) {
      return
    }
    const hook = job[hookName]
    if (!hook) {
      return
    }
    this._runningTaskCallbacks.set(workerId, hook)
    const error = await hook.run(...args)
    this._runningTaskCallbacks.delete(workerId, hook)
    if (error) {
      this._terminate(`Oops! ERR in "${hookName}" of "${job.name}"`, error)
    }
  }

  async run () {
    const createTermination = (event, message) => ({
      event,
      message,
      handler: error => this._terminate(message, error)
    })
    const terminations = [
      createTermination.call(this, 'SIGINT', 'SIGINT received'),
      createTermination.call(this, 'SIGHUP', 'SIGHUP received'),
      createTermination.call(this, 'SIGTERM', 'SIGTERM received'),
      createTermination.call(this, 'unhandledRejection', 'UNHANDLED PROMISE REJECTION')
    ]
    terminations.forEach(termination => {
      process.on(termination.event, termination.handler)
    })

    const workerPromise = []
    for (let i = 0; i < this._parallel; i++) {
      workerPromise.push(this._runJob(i, [this._rootJob]))
    }
    await Promise.all(workerPromise)

    terminations.forEach(termination => {
      process.removeListener(termination.event, termination.handler)
    })

    return this._termination
  }

  _terminate (message, error) {
    if (this._termination) {
      return
    }
    this._termination = { message, error }
    for (const callback of this._runningTaskCallbacks.valuesArray()) {
      callback.terminate()
    }
  }
}

module.exports = {
  Task: Task,
  Job: Job,
  TaskManager: TaskManager
}
