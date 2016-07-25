'use strict'

let _ = require('lodash')
let config = require('../../lib/config').config
let constants = require('../constants')
let db = require('../db')
let log = require('../log')
let moment = require('moment')
let crypto = require('crypto')
let urlUtils = require('url')
let util = {
  topicUrlPatterns: [new RegExp('\/topic\/map\/(.[^\/]+)$'), new RegExp('\/topic\/(.[^\/]+)$'),
    new RegExp('\/topic\/(.[^\/]+)\/(.[^\/]+)$'),
    new RegExp('\/topic\/(.[^\/]+)\/(.[^\/]+)\/(.[^\/]+)$')],
  lbitUrlPatterns: [new RegExp('\/lbit\/view\/(.[^\/]+)$')],

  // Regular expression that checks for hex value
  checkForHexRegExp: new RegExp('^[0-9a-fA-F]{24}$'),

  capitalise: function (str) {
    if (!str) {
      str = ''
    }
    let pieces = str.split(' ')
    for (let i = 0; i < pieces.length; i++) {
      let word = pieces[i]
      if (word !== 'a' && word !== 'an' && word !== 'the' && word !== 'for' && word !== 'to') {
        let j = pieces[i].charAt(0).toUpperCase()
        pieces[i] = j + pieces[i].substr(1)
      }
    }
    return pieces.join(' ')
  },

  str_replace: function (search, replace, subject, count) {
    //  discuss at: http://phpjs.org/functions/str_replace/
    //        note: The count parameter must be passed as a string in order
    //        note: to find a global variable in which the result will be given
    //   example 1: str_replace(' ', '.', 'Kevin van Zonneveld')
    //   returns 1: 'Kevin.van.Zonneveld'
    //   example 2: str_replace(['{name}', 'l'], ['hello', 'm'], '{name}, lars')
    //   returns 2: 'hemmo, mars'
    let i = 0
    let j = 0
    let temp = ''
    let repl = ''
    let sl = 0
    let fl = 0
    let f = [].concat(search)
    let r = [].concat(replace)
    let s = subject
    let ra = Object.prototype.toString.call(r) === '[object Array]'
    let sa = Object.prototype.toString.call(s) === '[object Array]'
    s = [].concat(s)
    if (count) {
      this.window[count] = 0
    }

    for (i = 0, sl = s.length; i < sl; i++) {
      if (s[i] === '') {
        continue
      }
      for (j = 0, fl = f.length; j < fl; j++) {
        temp = s[i] + ''
        repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0]
        s[i] = (temp)
          .split(f[j])
          .join(repl)
        if (count && s[i] !== temp) {
          this.window[count] += (temp.length - s[i].length) / f[j].length
        }
      }
    }
    return sa ? s : s[0]
  },

  quote: function (str) {
    if (str === null) {
      return ''
    }
    // str = str.replace(/'/, '&#39;')
    return str
  },
  quote_regex: function (str) {
    return (str + '').replace(/([?*+$[\]\\(){}|])/g, '\\$1')
  },
  trim: function (str) {
    try {
      str = (str) ? str.replace(/^\s+|\s+$/g, '') : ''
      str = str.replace(/(\r\n|\n|\r)/gm, '')
      str = str.replace(new RegExp('(<p><br></p>)*$'), '')
      str = str.replace(new RegExp('(<p></p>)*$'), '')
      return str
    } catch (e) {
      return str
    }
  },

  empty: function (mixed_var) {
    // *     example 1: empty(null)
    // *     returns 1: true
    // *     example 2: empty(undefined)
    // *     returns 2: true
    // *     example 3: empty([])
    // *     returns 3: true
    // *     example 4: empty({})
    // *     returns 4: true
    // *     example 5: empty({'aFunc' : function () { alert('humpty'); } })
    // *     returns 5: false
    let undef
    let mixed_let
    let i
    let len
    let emptyValues = [undef, null, false, 0, '', '0', 'undefined', 'null', '<br/>', '<br />', '<p><br></p>', '&nbsp;', '<br>']
    let _this = this
    for (i = 0, len = emptyValues.length; i < len; i++) {
      mixed_let = _this.trim(mixed_var)
      if (mixed_let instanceof Date) {
        return isNaN(Number(mixed_var))
      }
      if (mixed_let === emptyValues[i]) {
        return true
      }
    }

    if (typeof mixed_let === 'object') {
      for (let key in mixed_var) {
        if (key) {
          return false
        }
      }
      return true
    }
    return false
  },

  getParents: function (id, fullpath) {
    if (!fullpath) {
      return null
    }
    let parents = []
    let nodes = fullpath.split(',')
    nodes.forEach(function (node, index) {
      if (node !== '') {
        let path = null
        if (index > 1) {
          path = ''
          for (let i = 0; i < index; i++) {
            path += nodes[i] + ','
          }
        }
        parents.push({id: node, path: path})
      }
    })
    return parents
  },

  getImmediateParent: function (id, fullpath) {
    let _this = this
    let parents = _this.getParents(id, fullpath)
    return parents && parents.length ? parents[parents.length - 1] : null
  },

  parseJson: function (json) {
    if (this.empty(json)) {
      return ''
    }
    let ret = json
    if (typeof json === 'string') {
      try {
        ret = JSON.parse(json)
      } catch (e) {
        ret = json
      }
    }
    return ret
  },

  stringify: function (json) {
    let ret = ''
    if (!json) {
      return ''
    }
    try {
      ret = JSON.stringify(json)
    } catch (e) {}
    return ret
  },

  textify: function (text) {
    console.log('FIXME: textify should not be used at all!!!')
    if (!text) {
      return null
    }
    text = text.replace(/-/g, ' ')
    text = this.capitalise(text)
    return text
  },

  purify: function (text) {
    text = text.replace(/[^a-zA-Z 0-9\\.\-\_]+/g, '')
    text = text.replace(/ /g, '-')
    return text
  },

  idify: function (text) {
    if (!text) {
      return null
    }
    text = '' + text
    text = text.toLowerCase()
    text = text.replace(/([?*%#;,~±§!@`<>£^\&$[\]\\(){}|\'\/])/g, '')
    text = text.replace(/([\-\\.])/g, ' ')
    text = text.replace(/([?:+])/g, '-')
    // text = text.replace(/[a-zA-Z0-9]/g, '')
    text = text.replace(/ /g, '-')
    text = this.trim(text)
    return text
  },

  pathify: function (text) {
    let _this = this
    if (_this.empty(text) || text === ',' || text === ',,') {
      return null
    }
    let ret = null
    let nodes = text.split(',')
    nodes.forEach(function (anode) {
      if (!_this.empty(anode)) {
        if (!ret) {
          ret = ','
        }
        ret = ret + _this.idify(anode) + ','
      }
    })
    return ret
  },

  listify: function (obj) {
    if (!obj) {
      return []
    } else if (_.isArray(obj)) {
      return obj
    } else {
      return [obj]
    }
  },

  convert_links: function (links) {
    let _this = this
    links = _this.listify(links)
    if (!links || !links.length) {
      return null
    }
    let id_list = []
    let path_list = []
    let ret = null
    links.forEach(function (alink) {
      if (alink._id && _this.validOid('' + alink._id)) {
        id_list.push(db.ObjectId('' + alink._id))
      } else if (alink.path) {
        path_list.push(_this.split_path(alink.path))
      }
    })
    if (!id_list.length && !path_list.length) {
      return null
    } else if (id_list.length && !path_list.length) {
      ret = {_id: {$in: id_list}}
    } else if (!id_list.length && path_list.length) {
      ret = {$or: path_list}
    } else {
      let args = [{_id: {$in: id_list}}]
      args = _.union(args, path_list)
      ret = {$or: args}
    }
    return ret
  },

  encode_s3_url: function (url) {
    let self = this
    if (url) {
      url = unescape(encodeURIComponent(url))
      url = escape(url)
      let decodeMap = {
        '%2E': '.',
        '%2D': '-',
        '%5F': '_',
        '%7E': '~',
        '%2F': '/',
        '%3A': ':',
        '%20': '+'
      }
      for (let key in decodeMap) {
        url = self.str_replace([key], decodeMap[key], url)
      }
    }
    return url
  },

  list_to_path: function (l) {
    let _this = this
    if (_this.empty(l)) {
      return null
    }
    let ret = null
    l.forEach(function (anode) {
      if (!_this.empty(anode)) {
        if (!ret) {
          ret = ','
        }
        ret = ret + _this.idify(anode) + ','
      }
    })
    return ret
  },

  get_full_path: function (node) {
    let _this = this
    if (!node) {
      return null
    } else {
      return node.path ? (_this.pathify(node.path) + _this.idify(node.id) + ',') : (',' + _this.idify(node.id) + ',')
    }
  },

  relativeTime: function (date, min) {
    let timestamp = moment(date).valueOf()
    let now = +new Date()
    let difference = now - Math.floor(parseFloat(timestamp))
    difference = Math.floor(difference / 1000)
    if (difference < 60) return 'Just now'

    difference = Math.floor(difference / 60)
    if (difference < 60) return difference + (min ? 'm' : ' minute') + (difference !== 1 && !min ? 's' : '') + ' ago'

    difference = Math.floor(difference / 60)
    if (difference < 24) return difference + (min ? 'h' : ' hour') + (difference !== 1 && !min ? 's' : '') + ' ago'

    difference = Math.floor(difference / 24)
    if (difference < 30) return difference + (min ? 'd' : ' day') + (difference !== 1 && !min ? 's' : '') + ' ago'

    difference = Math.floor(difference / 30)
    if (difference < 12) return difference + (min ? 'mon' : ' month') + (difference !== 1 && !min ? 's' : '') + ' ago'

    difference = Math.floor(difference / 12)
    return difference + (min ? 'y' : ' year') + (difference !== 1 && !min ? 's' : '') + ' ago'
  },

  path_to_list: function (input, path_id_map) {
    // console.log('***', input, path_id_map)
    let output = []
    for (let i = 0; i < input.length; i++) {
      let fpath = input[i]
      let chain = input[i].split(',')
      let currentNode = output
      for (let j = 0; j < chain.length; j++) {
        let wantedNode = chain[j]
        let lastNode = currentNode
        let k
        for (k = 0; k < currentNode.length; k++) {
          if (currentNode[k].name === wantedNode) {
            currentNode = currentNode[k].children
            break
          }
        }
        // If we couldn't find an item in this list of children
        // that has the right name, create one:
        if (lastNode === currentNode) {
          // console.log('Retrieving id for ', fpath + '|' + wantedNode)
          let oid = path_id_map[fpath + '|' + wantedNode] || ''
          if (!oid) {
            log.warn('Unable to find oid for', wantedNode, fpath)
          }
          let newNode = currentNode[k] = {name: wantedNode, oid: oid, children: []}
          currentNode = newNode.children
        }
      }
    }
    return output
  },

  create_hash: function (str) {
    return crypto.createHash('md5').update(str).digest('hex')
  },

  split_path: function (pathstr) {
    let path
    if (!pathstr) {
      return null
    }
    let _this = this
    let tmpA = pathstr.split(',')
    if (tmpA.length) {
      let tmpB = _.filter(tmpA, function (v) {
        return !_this.empty(v)
      })
      let id = tmpB[tmpB.length - 1]
      tmpB = _.initial(tmpB)
      if (tmpB.length) {
        path = ',' + tmpB.join() + ','
      } else {
        path = null
      }

      return {path: path, id: id}
    } else {
      return null
    }
  },

  validEmail: function (email) {
    let re = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
  },

  validUrl: function (urls) {
    let regexp = /(https?:\/\/|www\.)[\w-]+(\.[\w-]+)?([\w.,!@?^=%&amp;:\/~+#-]*[\w!@?^=%&amp;\/~+#-])?/i
    let rtmp_regexp = /(rtmp:\/\/|www\.)[\w-]+(\.[\w-]+)?([\w.,!@?^=%&amp;:\/~+#-]*[\w!@?^=%&amp;\/~+#-])?/i
    let ret = regexp.test(urls) || rtmp_regexp.test(urls)
    if (urls.substring(0, 6) === 'about:' || urls.substring(0, 11) === 'javascript:') {
      ret = false
    }
    return ret
  },

  hasInvalidSymbol: function (str) {
    let symbolRegExp = /[!%^&*\\|~=`{}\[\]\'<>\/]/
    return str && symbolRegExp.test(str)
  },

  validOid: function (id) {
    let _this = this
    if (!id) {
      return false
    }

    // Check specifically for hex correctness
    if (typeof id === 'string' && id.length === 24) {
      return _this.checkForHexRegExp.test(id)
    }
    return false
  },

  query_to_json: function (queryStr) {
    let _this = this
    let ret = {}
    if (!_this.empty(queryStr)) {
      let pairs = queryStr.split('&')
      pairs.forEach(function (pair) {
        pair = pair.split('=')
        ret[pair[0]] = decodeURIComponent(pair[1] || '')
      })
    }
    return ret
  },

  clean_path: function (path) {
    if (!path) {
      return path
    }
    let tmpA = path.split(',')
    let finalPath = []
    tmpA.forEach(function (ap) {
      let ele = ap
      if (ap.indexOf(':') !== -1) {
        ele = ap.split(':')[1]
      }
      finalPath.push(ele)
    })
    return finalPath.join(',')
  },

  formatPath: function (path) {
    path = this.clean_path(path)
    if (!path) {
      return path
    }
    path = path.replace(/,/g, '/')
    if (path[0] === '/') {
      path = path.substr(1, path.length - 1)
    }
    if (path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1)
    }
    return path
  },

  tagify: function (keyword_map) {
    let tags = []
    for (let i in keyword_map) {
      let tag = keyword_map[i].name
      if (tag && tag !== 'http' && tag !== 'google' && tag !== 'picasa' && tag !== 'gmail' && tag !== 'ccc' && tag !== 'orkut' && tag !== 'chrome' && tag !== 'english' && tag !== 'www' && tag !== ' ' && tag !== '_') {
        tags.push(tag)
      }
    }
    return tags.join(',')
  },

  generateUUID: function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0
      let v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  toString: function (obj) {
    return _(obj).toString()
  },

  random: function (min, max) {
    return Math.round(min + Math.random() * (max - min))
  },

  curr_date: function () {
    return moment().format('MMMM Do YYYY h:mm:s')
  },

  getTTLDate: function (ttl) {
    return moment().add(ttl, 's').toDate()
  },

  guessDomain: function (userAgent) {
    if (!userAgent) {
      return null
    }
    if (userAgent.indexOf('WAC-OFU') !== -1) {
      return 'view.officeapps.live.com'
    }
    if (userAgent.indexOf('WAC-OFU') !== -1) {
      return 'drive.google.com'
    }
  },

  getUrlType: function (itemSrc, body_val) {
    function _customSiteParsers (url) {
      let urlObj = urlUtils.parse(url)
      let type = 'html'
      switch (urlObj.hostname) {
        case 'www.hstalks.com':
        case 'hstalks.com':
          type = 'hstalks'
          break
        default:
          type = 'html'
          break
      }
      return type
    }
    itemSrc = itemSrc.toLowerCase()
    if (itemSrc.match(/\.jpg/i) || itemSrc.match(/\.png/i) || itemSrc.match(/\.gif/i) || itemSrc.match(/\.webp/i) || itemSrc.match(/\.svg/i)) {
      return 'image'
    } else if (itemSrc.match(/\.swf/i)) {
      return 'flash'
    } else if (itemSrc.match(/\.pdf/i)) {
      return 'pdf'
    } else if (itemSrc.match(/\.zip/i) || itemSrc.match(/\.rar/i) || itemSrc.match(/\.7z/i) || itemSrc.match(/\.tar/i) || itemSrc.match(/\.gz/i) || itemSrc.match(/\.jar/i) || itemSrc.match(/\.csv/i) || itemSrc.match(/\.rtf/i) || itemSrc.match(/\.mdb/i)) {
      return 'archive'
    } else if (itemSrc.match(/\.vsd/i) || itemSrc.match(/\.cad/i) || itemSrc.match(/\.drw/i) || itemSrc.match(/\.dwg/i) || itemSrc.match(/\.graffle/i)) {
      return 'drawing'
    } else if (itemSrc.match(/\.f4m/i) || itemSrc.match(/rtmp:\/\//i)) {
      return 'rtmp-live'
    } else if (itemSrc.match(/\.m3u8/i)) {
      return 'hls-live'
    } else if (itemSrc.match(/\.mp3/i) || itemSrc.match(/\.m4a/i)) {
      return 'audio'
    } else if (itemSrc.match(/\.ppt/i) || itemSrc.match(/\.doc/i) || itemSrc.match(/\.docx/i) || itemSrc.match(/\.pptx/i) || itemSrc.match(/\.odf/i) || itemSrc.match(/\.odt/i) || itemSrc.match(/\.xls/i) || itemSrc.match(/\.xlsx/i)) {
      return 'office'
    } else if (itemSrc.match(/\.mp4/i) || itemSrc.match(/\.webm/i) || itemSrc.match(/\.flv/i) || itemSrc.match(/\.m4v/i) || itemSrc.match(/\.mov/i)) {
      return 'video'
    } else if (itemSrc.match(/bcove\.me/i) || itemSrc.match(/brightcove\.com/i)) {
      return 'flash-video'
    } else if (itemSrc.match(/\biframe=true\b/i)) {
      return 'iframe'
    } else if (itemSrc.match(/\bajax=true\b/i)) {
      return 'ajax'
    } else if (itemSrc.match(/\bcustom=true\b/i)) {
      return 'custom'
    } else if (itemSrc.match(/youtube\.com\/watch/i) || itemSrc.match(/youtu\.be/i)) {
      return 'youtube'
    } else if (itemSrc.match(/vimeo\.com/i)) {
      return 'vimeo'
    } else if (itemSrc.match(/annotag\.tv/i)) {
      return 'annotag'
    } else if (itemSrc.match(/timetag\.tv/i)) {
      return 'timetag'
    } else if (itemSrc.match(/slideshare\.net/i)) {
      return 'slideshare'
    } else if (body_val && body_val.substr(0, 1) === '"' && body_val.substr(body_val.length - 1, 1) === '"') {
      return 'quote'
    } else if (itemSrc.substr(0, 1) === '#') {
      return 'inline-html'
    } else if (!itemSrc && body_val && body_val.indexOf('iframe') !== -1) {
      return 'iframe-embed'
    } else {
      return _customSiteParsers(itemSrc)
    }
  },

  isDownloadSupported: function (type, allowedTypes) {
    if (!type) {
      return false
    }
    if (!allowedTypes) {
      allowedTypes = ['pdf', 'archive', 'drawing', 'video', 'image', 'office', 'audio', 'flash', 'youtube', 'vimeo']
    }
    return allowedTypes.indexOf(type) !== -1
  },

  isSupportedVideoSource: function (url, type) {
    if (!type) {
      return false
    }
    let externalSources = ['youtube', 'vimeo']
    return externalSources.indexOf(type) !== -1
  },

  isOptimisationSupported: function (type, allowedTypes) {
    if (!type) {
      return false
    }
    if (!allowedTypes) {
      allowedTypes = ['pdf', 'video', 'image', 'office', 'flash-video', 'youtube', 'vimeo']
    }
    return allowedTypes.indexOf(type) !== -1
  },

  isEmbedSupported: function (type, allowedTypes) {
    if (!type) {
      return false
    }
    if (!allowedTypes) {
      allowedTypes = ['pdf', 'video', 'youtube', 'vimeo', 'slideshare',
        'timetag', 'audio', 'hls-live', 'rtmp-live', 'html', 'inline-html',
        'flash', 'image', 'office', 'flash-video']
    }
    return allowedTypes.indexOf(type) !== -1
  },

  getReturnToUrl: function (req) {
    let _this = this
    let defaultPage = constants.DEFAULT_HOME_PAGE
    let existingSessionReturnTo = ((req.session && req.session.returnTo) ? req.session.returnTo : null)
    let retVal = defaultPage
    let returnTo = req.headers.referer || req.originalUrl || existingSessionReturnTo || defaultPage
    let url = urlUtils.parse(returnTo)
    let isTopicUrl = false
    let path = (url.pathname || '') + (url.search ? url.search : '')
    if (existingSessionReturnTo) {
      if (existingSessionReturnTo === constants.MY_TOPICS_PAGE) {
        delete req.session.returnTo
      } else {
        // log.log('debug', 'Existing session returnTo', existingSessionReturnTo)
        retVal = existingSessionReturnTo
        delete req.session.returnTo
      }
    }

    if (returnTo.indexOf(req.url) !== -1) {
      returnTo = constants.DEFAULT_HOME_PAGE
    }

    _this.topicUrlPatterns.forEach(function (pattern) {
      if (path.match(pattern)) {
        isTopicUrl = true
      }
    })
    if (!isTopicUrl) {
      returnTo = defaultPage
    }

    if (_this.empty(existingSessionReturnTo) || (!_this.empty(returnTo) && returnTo !== constants.DEFAULT_HOME_PAGE)) {
      retVal = returnTo
    }
    if (retVal === '/') {
      retVal = defaultPage
    }
    // log.log('debug', 'Setting returnTo url ', retVal)
    return retVal
  },

  isInternalUrl: function (url) {
    let ret = false
    if (!url) {
      return false
    }
    if (url.indexOf(config.base_url) !== -1 || url.indexOf(constants.COLEARNR_COM) !== -1 || url.indexOf('localhost') !== -1) {
      ret = true
    }
    return ret
  },

  isCloudUrl: function (url) {
    let ret = false
    constants.CLOUD_SERVERS.forEach(function (cserver) {
      if (url.indexOf(cserver) !== -1) {
        ret = true
      }
    })
    return ret
  },

  isStreamUrl: function (url) {
    let ret = false
    constants.STREAM_SERVERS.forEach(function (cserver) {
      if (cserver && url.indexOf(cserver) !== -1) {
        ret = true
      }
    })
    return ret
  },

  getExtension: function (url) {
    return '.' + url.split('.').pop().toLowerCase()
  },

  getTopicFromUrl: function (urlstr) {
    let _this = this
    let topic = {}
    let url = urlUtils.parse(urlstr)
    let path = url.pathname || ''
    if (_this.isInternalUrl(urlstr)) {
      _this.topicUrlPatterns.forEach(function (pattern) {
        let match = path.match(pattern)
        if (match) {
          if (match.length > 1 && !topic.oid) {
            topic.oid = match[1]
            topic.type = 'topic'
          }
          if (match.length > 2 && !topic.id) {
            if (match[1] !== 'map') {
              topic.id = match[2]
            } else {
              topic.type = 'map'
            }
          }
          if (match.length > 3 && !topic.sortOrder) {
            topic.sortOrder = match[3]
          }
        }
      })
    } else if (urlstr.indexOf('learnth.is') > 0) {
      topic.shortUrl = url
    }
    return topic
  },

  getLbitFromUrl: function (urlstr) {
    let _this = this
    let url = urlUtils.parse(urlstr)
    let path = url.pathname || ''
    let lbit = {}
    if (_this.isInternalUrl(urlstr)) {
      _this.lbitUrlPatterns.forEach(function (pattern) {
        let match = path.match(pattern)
        if (match) {
          lbit._id = match[1]
        }
      })
    }
    return lbit
  },

  convertToTimecode: function (secs) {
    if (!secs || isNaN(parseInt(secs, 10))) {
      return ''
    }
    let date = new Date(secs * 1000)
    let hh = date.getHours()
    let mm = date.getMinutes()
    let ss = date.getSeconds()

    if (hh < 10) {
      hh = '0' + hh
    }
    if (mm < 10) {
      mm = '0' + mm
    }
    if (ss < 10) {
      ss = '0' + ss
    }

    if (hh === '00') {
      return mm + ':' + ss + '.000'
    } else {
      return hh + ':' + mm + ':' + ss + '.000'
    }
  },

  clean_html: function (str) {
    if (this.empty(str)) {
      return ''
    } else {
      str = '' + str
      str = str.replace(/<div/ig, '<span').replace(/<\/div>/ig, '<\/span>')
      return str
    }
  },

  createWebVTT: function (trackList, duration) {
    let _this = this
    let prevTime = 0
    let prevChapter = null
    let msg = 'WEBVTT\n\n'
    let finalTime = null

    if (util.empty(trackList)) {
      return null
    }

    trackList.forEach(function (atrack) {
      if (atrack && atrack.time) {
        if (prevChapter === null) {
          prevChapter = atrack.text
        }
        if (prevTime === 0) {
          prevTime = atrack.time
        } else {
          msg = msg + _this.convertToTimecode(prevTime) + ' --> ' + _this.convertToTimecode(atrack.time) + '\n' + prevChapter + '\n\n'
          prevTime = atrack.time
          prevChapter = atrack.text
        }
      }
    })
    finalTime = (duration && parseFloat(duration) > prevTime) ? duration : prevTime
    msg += _this.convertToTimecode(prevTime) + ' --> ' + _this.convertToTimecode(finalTime) + '\n' + prevChapter + '\n'
    return msg
  },

  isExternalLink: function (lbitType) {
    if (!lbitType) {
      return false
    }

    let internalTypes = ['inline-html', 'archive', 'drawing', 'audio', 'office', 'video', 'image', 'pdf', 'flash-video', 'quote', 'iframe-embed']
    return internalTypes.indexOf(lbitType) === -1
  }
}

module.exports = util
