var unoconv = require('unoconv')
var config = require('../../lib/config').config
var log = require('../../common/log')
var _ = require('lodash')

;(function (OfficeConvertor) {
  OfficeConvertor.PORT = config.office_convertor_port || 2002
  OfficeConvertor.DEFAULT_OPTIONS = {
    bin: '/usr/bin/unoconv',
    port: OfficeConvertor.PORT,
    verbose: true,
    nolaunch: true,
    timeout: 60
  }

  OfficeConvertor.startServer = function () {
    log.debug('Starting office convertor on port', OfficeConvertor.PORT)
    var listener = unoconv.listen({port: OfficeConvertor.PORT})
    listener.stdout.on('data', function (data) {
      log.debug('OfficeConvertor: ' + data.toString('utf8'))
    })
    listener.stderr.on('data', function (data) {
      log.error('OfficeConvertor: ' + data.toString('utf8'))
    })
  }

  OfficeConvertor.convert = function (file, outputFormat, callback) {
    if (!outputFormat) {
      outputFormat = 'pdf'
    }
    log.debug('Starting conversion of', file)
    unoconv.convert(file, outputFormat, OfficeConvertor.DEFAULT_OPTIONS, callback)
  }

  OfficeConvertor.detectSupportedFormats = function (poptions, callback) {
    var options = _.merge(OfficeConvertor.DEFAULT_OPTIONS, poptions || {})
    unoconv.detectSupportedFormats(options, callback)
  }
}(exports))
