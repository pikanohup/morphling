const puppeteer = require('puppeteer')
const { DEFAULT_STABILIZE_NAMES, DEFAULT_BROWSER_OPTIONS } = require('./constants')
const { Logger } = require('./logger')
const { Page } = require('./page')

class Driver {
  /**
   * @param {!Browser} browser
   * @param {string} targetUrl
   * @param {Logger} logger
   */
  constructor (browser, targetUrl, logger) {
    this._browser = browser
    this._targetUrl = targetUrl || ''
    this._logger = logger || new Logger(process.stdout, DEFAULT_STABILIZE_NAMES)
  }

  static launchBrowser (options) {
    options = options || DEFAULT_BROWSER_OPTIONS
    return puppeteer.launch(options)
  }

  log (...args) {
    this._logger.log(...args)
  }

  async _die () {
    this._logger.end()
    await this._browser.close()
  }

  die (message, error) {
    this.log(`${message}: ${error}\n${error.stack}`)
    this._die()
    throw new Error(message)
  }

  async createPage () {
    const page = await this._browser.newPage()
    return new Page(this, page)
  }

  async _start (description, options) {
    try {
      if (!description) {
        throw new Error('Hey boy where is ur description for this run?')
      }
      this.log(description)

      const page = await this.createPage()
      if (options.url) {
        await page.navigate(options.url)
      } else if (options.html) {
        await page.loadHTML(options.html)
      }

      // TODO: profile
      const session = await page.createSession()
      return {
        page: page,
        session: session,
        dp: session.protocol
      }
    } catch (error) {
      this.die('Oops! ERR:', error)
    }
  }

  startBlank (description, options) {
    return this._start(description, options || {})
  }

  startHTML (html, description, options) {
    options = options || {}
    options.html = html
    return this._start(description, options)
  }

  startURL (url, description, options) {
    options = options || {}
    options.url = url
    return this._start(description, options)
  }
}

module.exports = {
  Driver: Driver
}
