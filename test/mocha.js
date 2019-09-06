const td = require('testdouble')
td.config({
  ignoreWarnings: true
})

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.config.includeStack = true

global.td = td
global.should = chai.should()
