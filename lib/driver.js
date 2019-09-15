const { Page } = require('./page')

class Driver {
  /**
   * @param {!Browser} browser
   */
  constructor (browser) {
    this._browser = browser
  }

  async end () {
    await this._browser.close()
  }

  async createPage () {
    const page = await this._browser.newPage()
    return new Page(this, page)
  }

  async _start (options) {
    try {
      const page = await this.createPage()
      if (options.url) {
        await page.navigate(options.url)
      } else if (options.html) {
        await page.loadHTML(options.html)
      }
      const session = await page.createSession()
      return {
        page: page,
        session: session,
        dp: session.protocol
      }
    } catch (error) {
      return error
    }
  }

  startBlank (options) {
    return this._start(options || {})
  }

  startHTML (html, options) {
    options = options || {}
    options.html = html
    return this._start(options)
  }

  startURL (url, options) {
    options = options || {}
    options.url = url
    return this._start(options)
  }
}

module.exports = {
  Driver: Driver
}
