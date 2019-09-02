const puppeteer = require('puppeteer')
const { DEFAULT_STABILIZE_NAMES } = require('./constants')
const { Logger } = require('./logger')
const { Page } = require('./page')

class Runner {
  constructor (browser, targetUrl, logger) {
    this._browser = browser
    this._targetUrl = targetUrl || ''
    this._logger = logger || new Logger(process.stdout, DEFAULT_STABILIZE_NAMES)
  }

  log (...args) {
    this._logger.log(...args)
  }

  async _die () {
    this._logger.end()
    await this._browser.close()
  }

  async die (message, error) {
    this.log(`${message}: ${error}\n${error.stack}`)
    await this._die()
    throw new Error(message)
  }

  async createPage (options) {
    options = options || {}
    // TODO: default options
    const page = await this._browser.newPage()
    if (options.url) {
      await page.navigate(options.url)
    }
    return page
  }

  async _start (desription, options) {
    try {
      if (!desription) {
        throw new Error('Hey boy where is ur description for this run?')
      }
    } catch (error) {
      await this.die('Oops! ERR:', error)
    }
  }
}

module.exports = {
  Runner: Runner
}
