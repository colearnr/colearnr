'use strict'

const db = require('../../common/db')
const fs = require('fs')
const fse = require('fs-extra')
const youtubedl = require('youtube-dl')
const config = require('../config').config
const constants = require('../../common/constants')
const log = require('../../common/log')
const util = require('../../common/util')
const convertor = require('../office-convertor')
const GridFS = require('../gridfs')
const pathlib = require('path')
const spawn = require('child_process').spawn

;(function (Optimise) {
  let out = fs.openSync(pathlib.join(config.cl_log_dir, 'optimise.log'), 'a')
  let err = fs.openSync(pathlib.join(config.cl_log_dir, 'optimise.log'), 'a')
  let CACHE_DIR = config.cl_cache_dir || '/tmp'
  Optimise.CLOUD_PREFIX = constants.CL_PROTOCOL
  Optimise.CLOUD_URL_PREFIX = constants.CL_PROTOCOL
  if (!util.empty(config.upload_server_prefix)) {
    Optimise.CLOUD_PREFIX = config.upload_server_prefix + 'learnbits/'
    Optimise.CLOUD_URL_PREFIX = config.upload_server_prefix + 'learnbits/'
  }

  let pushArtefactsToGrid = function (lbitId, userId, pdfFile) {
    let artefactDir = pathlib.join(CACHE_DIR, lbitId)
    if (!fs.existsSync(artefactDir)) {
      log.warn('Artefacts directory', artefactDir, 'not found!')
      return
    }
    let files = fs.readdirSync(artefactDir)
    files.filter(function (file) {
      return fs.statSync(pathlib.join(artefactDir, file)).isFile()
    }).forEach(function (file) {
      let fullPath = pathlib.join(artefactDir, file)
      GridFS.storeFile(fullPath, {lbit_id: lbitId, added_by: userId}, function (err, fileObj) {
        if (err) {
          log.error('Exception while storing artefact in grid', fullPath, err)
        } else {
          log.info('Stored file ' + fullPath + ' in grid as ' + fileObj._id)
        }
      })
    })
  }

  Optimise.prepare = function (url, fname, lbitId, userId, callback) {
    url = util.encode_s3_url(url)
    log.log('debug', 'Preparing to optimise', url, fname, lbitId, Optimise.CLOUD_PREFIX + userId)
    // Is this cl protocol
    if (url.indexOf(constants.CL_PROTOCOL) === 0) {
      GridFS.readFile(lbitId, null, null, function (err, filestream) {
        if (err) {
          callback(err, null)
          return
        }
        fse.mkdirsSync(pathlib.join(CACHE_DIR, '' + lbitId))
        let outputFile = pathlib.join(CACHE_DIR, '' + lbitId, fname)
        let writeStream = fs.createWriteStream(outputFile)
        log.debug('About to download file from Grid', lbitId, 'to', outputFile)
        filestream.pipe(writeStream)
        if (!fs.existsSync(outputFile)) {
          callback('Download failed for ' + lbitId, null)
        } else {
          callback(null, null)
        }
      })
    } else {
      let child = spawn('sh', [config.cl_scripts_dir + '/download.sh', url, fname, lbitId, userId, Optimise.CLOUD_PREFIX + userId], {stdio: ['ignore', out, err]})

      child.on('error', function (err) {
        callback(err, null)
      })

      child.on('exit', function (code, signal) {
        let res = { lbitId: lbitId, userId: userId, file: fname }
        callback((code === 0) ? null : code, res)
      })
    }
  }

  Optimise.doPdf = function (url, pdfFile, lbitId, userId, callback) {
    let _processFn = function () {
      let child = spawn('sh', [config.cl_scripts_dir + '/pdftk.sh', url, pdfFile, lbitId, userId,
        Optimise.CLOUD_PREFIX + userId], { stdio: ['ignore', out, err] })
      child.on('error', function (err) {
        callback(err, null)
      })
      child.on('exit', function (code, signal) {
        let res = { lbitId: lbitId, userId: userId, file: pdfFile }
        if (code === 0) {
          pushArtefactsToGrid(lbitId, userId, pdfFile)
        }
        callback((code === 0) ? null : code, res)
      })
    }
    url = util.encode_s3_url(url)
    log.log('debug', 'Optimising', lbitId, Optimise.CLOUD_PREFIX + userId, CACHE_DIR)
    // Is this cl protocol
    if (url.indexOf(constants.CL_PROTOCOL) === 0) {
      let outputFile = pathlib.join(CACHE_DIR, '' + lbitId, pdfFile)
      if (!fs.existsSync(outputFile)) {
        GridFS.readFile(lbitId, null, null, function (err, filestream) {
          if (err) {
            callback(err, null)
            return
          }
          fse.mkdirsSync(pathlib.join(CACHE_DIR, '' + lbitId))
          let writeStream = fs.createWriteStream(outputFile)
          log.debug('About to download file from Grid', lbitId, 'to', outputFile)
          filestream.pipe(writeStream)
          if (!fs.existsSync(outputFile)) {
            callback('Download failed for ' + lbitId, null)
          } else {
            _processFn()
          }
        })
      } else {
        _processFn()
      }
    } else {
      _processFn()
    }
  }

  Optimise.findFiles = function (count, callback) {
    db.learnbits.find({
      type: {$in: ['pdf', 'office', 'image']}, url: {$in: [new RegExp(constants.CL_PROTOCOL), new RegExp(config.upload_server_prefix)]},
      optimised: {$ne: true},
      optimisation_started: {$ne: true},
      skip_optimisation: {$ne: true},
      hidden: {$ne: true}
    }).sort({added_date: -1}).limit(count, function (err, lbits) {
      if (err) {
        log.log('error', 'Error finding files for optimisation', err)
        callback(err, lbits)
      } else if (!lbits.length) {
        callback(null, null)
      } else {
        lbits.forEach(function (lbit) {
          Optimise.processLearnbit(lbit, callback)
        })
      }
    })
  }

  Optimise.processLearnbit = function (lbit, callback) {
    let tmpA = lbit.url.split('/')
    let fname = (tmpA && tmpA.length) ? util.purify(tmpA[tmpA.length - 1]) : null
    let urlPrefix = '/lbit/' + lbit._id + '/media/'
    switch (lbit.type) {
      case 'pdf':
        Optimise.processPdfLearnbit(lbit, fname, urlPrefix, callback)
        break

      case 'image':
      case 'office':
        Optimise.processOfficeLearnbit(lbit, fname, urlPrefix, callback)
        break

      case 'video':
        Optimise.processVideoLearnbit(lbit, fname, urlPrefix, callback)
        break

      case 'youtube':
      case 'vimeo':
        Optimise.processExternalSourceLearnbit(lbit, fname, urlPrefix, callback)
        break

      default:
        log.warn('Optimisation not supported for', lbit._id, fname, lbit.title)
        break
    }
  }

  Optimise.processOfficeLearnbit = function (lbit, fname, urlPrefix, callback) {
    Optimise.prepare(lbit.url, fname, '' + lbit._id, lbit.added_by, function (err) {
      if (err) {
        log.error('Optimising office file', fname, 'has failed with', err)
        callback(err, null)
      } else {
        let downloaded_file = pathlib.join(CACHE_DIR, '' + lbit._id, fname.replace(/%20/g, ' '))
        if (fs.existsSync(downloaded_file)) {
          convertor.convert(downloaded_file, 'pdf', function (err) {
            if (err) {
              log.error('Converting office file', fname, 'has failed with', err)
              callback(err, null)
            } else {
              let ext = pathlib.extname(fname)
              let pdfFile = fname.replace(ext, '.pdf')
              Optimise.processPdfLearnbit(lbit, pdfFile, urlPrefix, callback)
            }
          })
        } else {
          log.error('File', fname, 'was not downloaded')
          callback('Not downloaded', null)
        }
      }
    })
  }

  Optimise.processVideoLearnbit = function (lbit, fname, urlPrefix, callback) {}

  Optimise.processExternalSourceLearnbit = function (lbit, fname, urlPrefix, callback) {
    function handleComplete (err, res) {
      let optimised_url = urlPrefix + 'opt-' + lbit._id + '.mp4'
      if (!err) {
        db.learnbits.update({_id: db.ObjectId('' + lbit._id)},
          {
            $set: {
              optimised: true,
              optimised_url: optimised_url,
              optimisation_started: null,
              optimisation_end_date: new Date(),
              last_updated: new Date()
            }
          })
        log.log('debug', '' + lbit._id, optimised_url, 'is optimised!')
        lbit.optimised = true
        lbit.optimised_url = optimised_url
        callback(err, lbit)
      } else {
        log.log('error', 'Error while optimising pdf', err, fname, lbit._id, lbit.title)
        db.learnbits.update({_id: db.ObjectId('' + lbit._id)},
          {
            $set: {
              optimised: false,
              optimised_url: optimised_url,
              optimisation_started: null,
              optimisation_status: 'error',
              optimisation_end_date: new Date(),
              last_updated: new Date()
            }
          })
        callback(err, lbit)
      }
    }

    let userId = lbit.added_by
    if (util.isSupportedVideoSource(lbit.url, lbit.type)) {
      let downloadLocation = '/tmp/' + lbit._id + '/orig-' + lbit._id + '.mp4'
      let video = youtubedl(lbit.url,
        ['--max-filesize', constants.MAX_DOWNLOAD_SIZE, '--format', 'mp4'],
        { cwd: '/tmp' })
      video.on('info', function (info) {
        fse.ensureDirSync('/tmp/' + lbit._id)
        log.debug('Download started for', lbit.url, 'to', downloadLocation)
        log.debug('filename: ' + info._filename)
        log.debug('size: ' + info.size)
        if (info.size > constants.MAX_DOWNLOAD_SIZE) {
          handleComplete('video size is too big', null)
          return
        } else {
          video.pipe(fs.createWriteStream(downloadLocation))
        }
      })

      video.on('end', function () {
        log.log('debug', 'Optimising', downloadLocation, lbit._id, Optimise.CLOUD_PREFIX + userId)
        let child = spawn('sh', [config.cl_scripts_dir + '/video_optimise.sh', downloadLocation, lbit._id, userId, Optimise.CLOUD_PREFIX + userId], {stdio: ['ignore', out, err]})

        child.on('error', function (err) {
          handleComplete(err, null)
        })

        child.on('exit', function (code, signal) {
          let res = {lbitId: lbit._id, userId: userId, file: fname}
          handleComplete((code === 0) ? null : code, res)
        })
      })
    }
  }

  Optimise.processPdfLearnbit = function (lbit, fname, urlPrefix, callback) {
    let added_by = lbit.added_by
    let optimised_url = urlPrefix + fname.replace(/.pdf$/, '_[*,2].pdf')
    let pdf_json_url = urlPrefix + fname.replace(/.pdf$/, '_{page}.js')
    let pdf_png_url = urlPrefix + fname.replace(/.pdf$/, '_{page}.png')
    let thumb_url = urlPrefix + fname.replace(/.pdf$/, '_thumb_{page}.png')
    let img_url_list = [urlPrefix + fname.replace(/.pdf$/, '_thumb_1.png')]

    // HACK - Prevents optimised images from having non-existing thumbnail url. This probably
    // should be based on metadata
    if (lbit.type !== 'image') {
      img_url_list.push(urlPrefix + fname.replace(/.pdf$/, '_thumb_2.png'))
      img_url_list.push(urlPrefix + fname.replace(/.pdf$/, '_thumb_3.png'))
    }
    log.log('debug', optimised_url, pdf_json_url, pdf_png_url, thumb_url)

    Optimise.doPdf(lbit.url, fname, '' + lbit._id, added_by, function (err, res) {
      if (!err) {
        db.learnbits.update({_id: db.ObjectId('' + lbit._id)},
          {
            $set: {
              optimised: true,
              png_generated: true,
              optimised_url: optimised_url,
              pdf_json_url: pdf_json_url,
              pdf_png_url: pdf_png_url,
              thumb_url: thumb_url,
              img_url: img_url_list,
              optimisation_started: null,
              optimisation_end_date: new Date(),
              optimisation_status: 'success',
              last_updated: new Date()
            }
          })
        log.log('debug', '' + lbit._id, 'is optimised!')
        lbit.optimised = true
        lbit.thumb_url = thumb_url
        lbit.img_url = img_url_list
        callback(err, lbit)
      } else {
        log.log('error', 'Error while optimising pdf', err, fname, lbit._id, lbit.title)
        db.learnbits.update({_id: db.ObjectId('' + lbit._id)},
          {
            $set: {
              optimised: false,
              png_generated: false,
              optimised_url: optimised_url,
              pdf_json_url: pdf_json_url,
              pdf_png_url: pdf_png_url,
              thumb_url: thumb_url,
              optimisation_started: null,
              optimisation_status: 'error',
              optimisation_end_date: new Date(),
              last_updated: new Date()
            }
          })
        callback(err, lbit)
      }
    })
    db.learnbits.update({_id: db.ObjectId('' + lbit._id)},
      {
        $set: {
          optimisation_started: true,
          optimised: false,
          png_generated: false,
          optimisation_start_date: new Date(),
          optimised_url: optimised_url,
          pdf_json_url: pdf_json_url,
          pdf_png_url: pdf_png_url,
          thumb_url: thumb_url,
          last_updated: new Date()
        }
      })
    log.log('debug', '' + lbit._id, 'is being optimised now')
  }

/*
 Optimise.doPdf('', 'cp8cYP9aTnmftf5Uxde8_Transcend%20-Nine%20steps%20to%20living%20well%20forever%202010.pdf', '123', '1c474c1abb4403fb6c27eefeb3c775aa', function (err, res) {
 console.log(err, res)
 })
 */
// Optimise.findFiles(1, function() {})
}(exports))
