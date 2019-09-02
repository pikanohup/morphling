class Logger {
  constructor (stream, stabilizeNames) {
    this._stream = stream
    this._stabilizeNames = stabilizeNames || null
  }

  end () {
    // XXX
    this._stream.end('--------------------')
  }

  _log (...args) {
    this._stream.write(...args)
  }

  log (item, description, stabilizeNames) {
    if (typeof item === 'object') {
      return this._logObject(item, description, stabilizeNames)
    }
    this._log(item)
  }

  _logObject (object, description, stabilizeNames = this._stabilizeNames) {
    const lines = []

    const dumpValue = (value, prefix, prefixWithName) => {
      if (typeof value === 'object' && value !== null) {
        if (value instanceof Array) {
          dumpItems(value, prefix, prefixWithName)
        } else {
          dumpProperties(value, prefix, prefixWithName)
        }
      } else {
        lines.push(prefixWithName + String(value).replace(/\n/g, ' '))
      }
    }

    const dumpItems = (object, prefix, firstLinePrefix) => {
      prefix = prefix || ''
      firstLinePrefix = firstLinePrefix || prefix
      lines.push(firstLinePrefix + '[')
      for (let i = 0; i < object.length; i++) {
        dumpValue(object[i], '    ' + prefix, '    ' + prefix + '[' + i + '] : ')
      }
      lines.push(prefix + ']')
    }

    const dumpProperties = (object, prefix, firstLinePrefix) => {
      prefix = prefix || ''
      firstLinePrefix = firstLinePrefix || prefix
      lines.push(firstLinePrefix + '{')

      const propertyNames = Object.keys(object)
      propertyNames.sort()
      for (const name of propertyNames) {
        if (!object.hasOwnProperty(name)) {
          continue
        }
        const prefixWithName = '    ' + prefix + name + ' : '
        let value = object[name]
        if (stabilizeNames && stabilizeNames.includes(name)) {
          value = `<${typeof value}>`
        }
        dumpValue(value, '    ' + prefix, prefixWithName)
      }
      lines.push(prefix + '}')
    }

    dumpValue(object, '', description || '')
    this._log(lines.join('\n'))
  }

  static sequence (...loggers) {
    return new Proxy({}, {
      get: (target, key, receiver) => new Proxy(() => {}, {
        apply: (target, that, args) => {
          return loggers.forEach(logger => logger[key](...args))
        }
      })
    })
  }
}

module.exports = {
  Logger: Logger
}
