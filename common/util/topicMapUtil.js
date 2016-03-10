'use strict'

let util = require('./index')
let _ = require('lodash')
let logger = require('../log')

let topicMapUtil = {
  /**
   * Method to convert the topic map json to a list suitable for storing in the db
   */
  convertToList: function (category_map, rootOrder) {
    let self = this
    let category_list = []
    let level_orders = {}
    let id_path_cache = {}
    let id_oid_cache = {}
    category_map.order = rootOrder
    self._recurse(category_list, level_orders, id_path_cache, id_oid_cache, null, category_map)
    return self.addLinks(category_list, category_map.links, id_path_cache, id_oid_cache)
  },

  /**
     * This function recursively builds the list of topics from json
     */
  _recurse: function (category_list, level_orders, id_path_cache, id_oid_cache, parent, ideas) {
    let self = this
    if (!ideas || !_.size(ideas)) {
      return
    }
    if (parent === null) {
      let snode = ideas
      let nodeId = util.idify(snode.title)
      let uiKey = '' + snode.id
      category_list.push({
        uiKey: uiKey,
        name: snode.title,
        id: nodeId,
        oid: snode.oid || null,
        order: snode.order,
        path: null,
        skipReorder: true
      })
      let full_path = ',' + nodeId + ','
      id_path_cache[uiKey] = full_path
      if (snode.oid) {
        id_oid_cache[uiKey] = snode.oid
      }
      self._recurse(category_list, level_orders, id_path_cache, id_oid_cache, full_path, snode.ideas)
    } else {
      let keys = _.keys(ideas)
      // console.log('before sort', keys)
      if (keys && keys.length) {
        keys = _.sortBy(keys, function (id) {
          if (id) {
            return parseFloat(id)
          } else {
            return 0
          }
        })
      }
      // console.log('after sort', keys)
      keys.forEach(function (key) {
        let snode = ideas[key]
        if (snode) {
          // console.log('processing', snode.id, key)
          let uiKey = '' + snode.id
          let nodeId = util.idify(snode.title)
          let path_txt = util.idify(snode.title)
          let full_path = parent + path_txt + ','
          id_path_cache[snode.id] = full_path
          if (snode.oid) {
            id_oid_cache[snode.id] = snode.oid
          }
          let order = level_orders[parent]
          if (!order) {
            level_orders[parent] = 1
            order = 1
          } else {
            order++
            level_orders[parent] = order
          }
          let cat = {
            uiKey: uiKey,
            name: snode.title,
            id: nodeId,
            oid: snode.oid || null,
            order: order,
            path: parent,
            skipReorder: (snode.id === key && keys.length === 1)
          }
          category_list.push(cat)
          self._recurse(category_list, level_orders, id_path_cache, id_oid_cache, full_path, snode.ideas)
        } else {
          logger.log('warn', 'Node is null. Possibly invalid data being passed from the frontend')
        }
      })
    } // else
  },

  addLinks: function (category_list, links, id_path_cache, id_oid_cache) {
    let self = this
    if (!links || !links.length) {
      return category_list
    }
    let updated_category_list = []
    category_list.forEach(function (category) {
      let link_in = self.link_in_out(category.uiKey, links, 'in', id_path_cache, id_oid_cache)
      if (link_in && link_in.length) {
        category.link_in = link_in
      }
      let link_out = self.link_in_out(category.uiKey, links, 'out', id_path_cache, id_oid_cache)
      if (link_out && link_out.length) {
        category.link_out = link_out
      }
      updated_category_list.push(category)
    })
    return updated_category_list
  },

  link_in_out: function (id, links, direction, id_path_cache, id_oid_cache) {
    let listToRet = []
    if (!links || !links.length) {
      return null
    }
    links.forEach(function (alink) {
      let linkNode = null
      let ideaIdFrom = '' + alink.ideaIdFrom
      let ideaIdTo = '' + alink.ideaIdTo
      if (direction === 'in') {
        if (ideaIdTo === '' + id) {
          if (id_oid_cache[ideaIdFrom]) {
            linkNode = {_id: id_oid_cache[ideaIdFrom]}
          } else if (id_path_cache[ideaIdFrom]) {
            linkNode = {path: id_path_cache[ideaIdFrom]}
          }
        }
      } else if (direction === 'out') {
        if (ideaIdFrom === '' + id) {
          if (id_oid_cache[ideaIdTo]) {
            linkNode = {_id: id_oid_cache[ideaIdTo]}
          } else if (id_path_cache[ideaIdTo]) {
            linkNode = {path: id_path_cache[ideaIdTo]}
          }
        }
      }
      if (linkNode) {
        listToRet.push(linkNode)
      }
    })
    return listToRet
  },

  convertToMap: function (category_list) {
    let self = this
    let id = 10
    let oid_id_cache = {}
    let path_id_cache = {}
    let tmp_links = []
    let ideasMap = self._generateIdea(category_list, id, oid_id_cache, path_id_cache, tmp_links)
    if (category_list.topics) {
      let sub_map = self._list_to_map(category_list.topics, id, oid_id_cache, path_id_cache, tmp_links)
      ideasMap.ideas = sub_map.ideas
    // console.log('Last id', sub_map.id)
    }
    // console.log(ideasMap, oid_id_cache, path_id_cache)
    ideasMap.links = self._convert_links_format(oid_id_cache, path_id_cache, tmp_links)
    // console.log(JSON.stringify(ideasMap))
    return ideasMap
  },

  /**
   * This method converts a topic into a format suitable for topic mapper
   */
  _generateIdea: function (topic, id, oid_id_cache, path_id_cache, tmp_links) {
    let ret = {title: topic.name, oid: topic._id, id: id, order: topic.order, formatVersion: 2,
      user_role: (topic.user_role || null), user_perms: topic.user_perms,
      added_by: topic.added_by, privacy_mode: topic.privacy_mode, hidden: topic.hidden,
    link_in: (topic.link_in || null), link_out: (topic.link_out || null), ideas: {}}
    let thumb = (topic.img_url && topic.img_url.length) ? ('/proxy?url=' + encodeURI(topic.img_url[0])) : null
    if (thumb) {
      ret.attr = {icon: {url: thumb, width: 300, height: 192, position: 'top'}}
    }
    oid_id_cache[topic._id] = id
    let full_path = (topic.path || ',') + topic.id + ','
    path_id_cache[full_path] = id
    if (topic.link_in && topic.link_in.length) {
      topic.link_in.forEach(function (alink_in) {
        tmp_links.push({from: alink_in, to: {_id: topic._id}})
      })
    }
    if (topic.link_out && topic.link_out.length) {
      topic.link_out.forEach(function (alink_out) {
        tmp_links.push({from: {_id: topic._id}, to: alink_out})
      })
    }
    return ret
  },

  _list_to_map: function (topic_list, id, oid_id_cache, path_id_cache, tmp_links) {
    let self = this
    let ret = {}
    if (topic_list && topic_list.length) {
      topic_list.forEach(function (ele) {
        id = id + 10
        let eobj = self._generateIdea(ele, id, oid_id_cache, path_id_cache, tmp_links)
        let sub_map = self._list_to_map(ele.topics, id, oid_id_cache, path_id_cache, tmp_links)
        eobj.ideas = sub_map.ideas
        ret[id] = eobj
        id = sub_map.id
      })
    }
    return {ideas: ret, id: id}
  },

  _convert_links_format: function (oid_id_cache, path_id_cache, tmp_links) {
    if (!tmp_links || !tmp_links.length) {
      return null
    }
    let retLinks = []
    let _findId = function (linkToFind) {
      return (oid_id_cache[linkToFind._id] || path_id_cache[linkToFind.path])
    }
    tmp_links.forEach(function (alink) {
      let from = alink.from
      let to = alink.to
      retLinks.push({ideaIdFrom: _findId(from), ideaIdTo: _findId(to)})
    })
    return retLinks
  }

}

module.exports = topicMapUtil
