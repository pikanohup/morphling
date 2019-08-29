const puppeteer = require('puppeteer')
const { Constants } = require('./constants')
const { Logger } = require('./logger')

class Runner {
  constructor (targetUrl, logger) {
    this._targetUrl = targetUrl || ''
    this._logger = logger || new Logger(process.stdout, Constants.stabilizeNames)
    this._page = null
    this._session = null
  }

  log (...args) {
    this._logger.log(...args)
  }
}

module.exports = {
  Runner: Runner
}
