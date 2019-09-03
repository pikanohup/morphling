const { Session } = require('./session')

class Page {
  constructor (driver, targetPage) {
    this._driver = driver
    this._targetPage = targetPage
  }

  async createSession () {
    const cdpSession = await this._targetPage.target().createCDPSession()
    return new Session(this, cdpSession)
  }

  navigate (url) {
    return this._navigate(url)
  }

  async _navigate (url) {
    return this._targetPage.goto(url, { waitUntil: 'networkidle0' })
  }

  async loadHTML (html) {
    html = html.replace(/'/g, "\\'").replace(/\n/g, '\\n')
    await this._targetPage.evaluate(`
      document.write('${html}');

      // wait for all scripts to load
      const promise = new Promise(x => window._loadHTMLResolve = x).then(() => {
        delete window._loadHTMLResolve;
      });

      if (document.querySelector('script[src]'))
        document.write('<script>window._loadHTMLResolve(); document.currentScript.remove();</script>');
      else
        window._loadHTMLResolve();

      document.close();
      promise;
    `)
  }
}

module.exports = {
  Page: Page
}
