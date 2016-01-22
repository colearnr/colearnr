var acllib = require('acl'),
  logger = require('../common/log'),
  constants = require('../common/constants'),
  util = require('../common/util'),
  _ = require('lodash'),
  db = require('../common/db'),
  mongodb = require('mongodb'),
  perms_db_uri = require('../common/perms_db'),
  moment = require('moment'),
  acl = new acllib(new acllib.memoryBackend());

mongodb.connect('mongodb://' + perms_db_uri, function(err, db) {
  acl = new acllib(new acllib.mongodbBackend(db, 'acl_', false));
});

var perms = {

  getKey: function(topic) {
    if (topic) {
      if (topic.permission_key) {
        return topic.permission_key;
      }
      else if (topic._id) {
        return '' + topic._id;
      }
      else if (topic.id) {
        return topic.id;
      }
    }
    else {
      return null;
    }
  },

  setTestBackend: function() {
    console.log("Using test backend!");
    acl = new acllib(new acllib.memoryBackend());
  },

  checkTopicViewAccess: function(user, topic, callback) {
    //logger.log('debug', 'Check if', user, 'has view access to', topic.name, topic.privacy_mode, topic.added_by);
    this.isRoleAllowed(user, topic, constants.VIEW_PERMS, callback);
  },

  checkTopicEditAccess: function(user, topic, callback) {
    //logger.log('debug', 'Check if', user._id, 'has edit access to', topic.name, topic.privacy_mode, topic.added_by);
    this.isRoleAllowed(user, topic, constants.EDIT_PERMS, callback);
  },

  checkTopicAddAccess: function(user, topic, callback) {
    //logger.log('debug', 'Check if', user._id, 'has add access to', topic.name, topic.privacy_mode, topic.added_by);
    this.isRoleAllowed(user, topic, constants.ADD_PERMS, callback);
  },

  checkTopicDeleteAccess: function(user, topic, callback) {
    //logger.log('debug', 'Check if', user._id, 'has delete access to', topic.name, topic.privacy_mode, topic.added_by);
    this.isRoleAllowed(user, topic, constants.DELETE_PERMS, callback);
  },

  checkTopicShareAccess: function(user, topic, callback) {
    //logger.log('debug', 'Check if', user._id, 'has share access to', topic.name, topic.privacy_mode, topic.added_by);
    var self = this;
    this.isTopicAdmin(user, topic, function(err, isAdmin) {
      if (isAdmin) {
        callback(err, isAdmin);
      }
      else {
        self.isTopicCollab(user, topic, function(err, isCollab) {
          callback(err, isCollab);
        });
      }
    });
  },

  // CoLearnr get view access
  addNewFreeUserPerms: function(user, callback) {
    acl.addUserRoles('' + user._id, constants.COLEARNR_ROLE, callback);
  },

  // ProLearnr get view access on more materials
  addNewProUserPerms: function(user, callback) {
    acl.addUserRoles('' + user._id, constants.PROLEARNR_ROLE, callback);
  },

  removeProUserPerms: function(user, callback) {
    acl.removeUserRoles('' + user._id, constants.PROLEARNR_ROLE, callback);
  },

  setTopicRolePerms: function(user, topic, role, callback) {
    var self = this;
    acl.removeUserRoles('' + user._id, [constants.COLEARNR_ROLE, constants.ADMIN_ROLE, constants.TOPIC_EXPERT_ROLE + self.getKey(topic),
      constants.PROLEARNR_ROLE, constants.TOPIC_COLEARNR_ROLE + self.getKey(topic), constants.TOPIC_COLLAB_ROLE + self.getKey(topic), constants.TOPIC_ADMIN_ROLE + self.getKey(topic)], function(err) {
      acl.addUserRoles('' + user._id, role + '-' + self.getKey(topic), callback);
    });
  },

  // Topic colearnr - Can view content.
  addTopicCoLearnrPerms: function(user, topic, callback) {
    var self = this;
    acl.addUserRoles('' + user._id, constants.TOPIC_COLEARNR_ROLE + self.getKey(topic), callback);
  },

  removeTopicCoLearnrPerms: function(user, topic, callback) {
    var self = this;
    acl.removeUserRoles('' + user._id, constants.TOPIC_COLEARNR_ROLE + self.getKey(topic), callback);
  },

  // Topic experts - Can add/edit content. Can delete only their content.
  addTopicExpertPerms: function(user, topic, callback) {
    var self = this;
    acl.addUserRoles('' + user._id, constants.TOPIC_EXPERT_ROLE + self.getKey(topic), callback);
  },

  removeTopicExpertPerms: function(user, topic, callback) {
    var self = this;
    acl.removeUserRoles('' + user._id, constants.TOPIC_EXPERT_ROLE + self.getKey(topic), callback);
  },

  // Topic collaborators - Can add content. Edit their own content.
  addTopicCollabPerms: function(user, topic, callback) {
    var self = this;
    //console.log('>>', constants.TOPIC_COLLAB_ROLE + self.getKey(topic), user._id);
    acl.addUserRoles('' + user._id, constants.TOPIC_COLLAB_ROLE + self.getKey(topic), callback);
  },

  removeTopicCollabPerms: function(user, topic, callback) {
    var self = this;
    acl.removeUserRoles('' + user._id, constants.TOPIC_COLLAB_ROLE + self.getKey(topic), callback);
  },

  // Topic all access for a given topic
  addTopicAdminPerms: function(user, topic, callback) {
    var self = this;
    acl.addUserRoles('' + user._id, constants.TOPIC_ADMIN_ROLE + self.getKey(topic), callback);
  },

  removeTopicAdminPerms: function(user, topic, callback) {
    var self = this;
    acl.removeUserRoles('' + user._id, constants.TOPIC_ADMIN_ROLE + self.getKey(topic), callback);
  },

  // All access. Limited to only us.
  addAdminPerms: function(user, callback) {
    acl.addUserRoles('' + user._id, constants.ADMIN_ROLE, callback);
  },

  removeAdminPerms: function(user, callback) {
    acl.removeUserRoles('' + user._id, constants.ADMIN_ROLE, callback);
  },

  addFreeTopicRolePerms: function(topic, callback) {
    //logger.log('debug', 'Creating default roles for topic', ''+self.getKey(topic));
    var self = this;
    acl.allow([{
      roles: constants.TOPIC_EXPERT_ROLE + self.getKey(topic),
      allows: [
        {
          resources: '' + self.getKey(topic),
          permissions: [constants.VIEW_PERMS, constants.EDIT_PERMS, constants.ADD_PERMS]
        }
      ]
    },
      {
        roles: constants.COLEARNR_ROLE,
        allows: [
          {resources: '' + self.getKey(topic), permissions: [constants.VIEW_PERMS]}
        ]
      },
      {
        roles: constants.PROLEARNR_ROLE,
        allows: [
          {resources: '' + self.getKey(topic), permissions: [constants.VIEW_PERMS]}
        ]
      },
      {
        roles: constants.TOPIC_COLEARNR_ROLE + self.getKey(topic),
        allows: [
          {resources: '' + self.getKey(topic), permissions: [constants.VIEW_PERMS]}
        ]
      },
      {
        roles: constants.TOPIC_COLLAB_ROLE + self.getKey(topic),
        allows: [
          {
            resources: '' + self.getKey(topic),
            permissions: [constants.VIEW_PERMS, constants.ADD_PERMS, constants.EDIT_PERMS]
          }
        ]
      },
      {
        roles: constants.TOPIC_ADMIN_ROLE + self.getKey(topic),
        allows: [
          {
            resources: '' + self.getKey(topic),
            permissions: [constants.VIEW_PERMS, constants.ADD_PERMS, constants.EDIT_PERMS, constants.DELETE_PERMS]
          }
        ]
      },
      {
        roles: constants.ADMIN_ROLE,
        allows: [
          {
            resources: '' + self.getKey(topic),
            permissions: [constants.VIEW_PERMS, constants.ADD_PERMS, constants.EDIT_PERMS, constants.DELETE_PERMS]
          }
        ]
      }
    ], callback);
  },

  addProTopicRolePerms: function(topic, callback) {
    var self = this;
    acl.allow([{
      roles: constants.TOPIC_EXPERT_ROLE + self.getKey(topic),
      allows: [
        {resources: '' + self.getKey(topic), permissions: [constants.VIEW_PERMS, constants.EDIT_PERMS]}
      ]
    },
      {
        roles: constants.PROLEARNR_ROLE,
        allows: [
          {resources: '' + self.getKey(topic), permissions: [constants.VIEW_PERMS]}
        ]
      },
      {
        roles: constants.TOPIC_COLEARNR_ROLE + self.getKey(topic),
        allows: [
          {resources: '' + self.getKey(topic), permissions: [constants.VIEW_PERMS]}
        ]
      },
      {
        roles: constants.TOPIC_COLLAB_ROLE + self.getKey(topic),
        allows: [
          {
            resources: '' + self.getKey(topic),
            permissions: [constants.VIEW_PERMS, constants.ADD_PERMS, constants.EDIT_PERMS]
          }
        ]
      },
      {
        roles: constants.TOPIC_ADMIN_ROLE + self.getKey(topic),
        allows: [
          {
            resources: '' + self.getKey(topic),
            permissions: [constants.VIEW_PERMS, constants.ADD_PERMS, constants.EDIT_PERMS, constants.DELETE_PERMS]
          }
        ]
      },
      {
        roles: constants.ADMIN_ROLE,
        allows: [
          {
            resources: '' + self.getKey(topic),
            permissions: [constants.VIEW_PERMS, constants.ADD_PERMS, constants.EDIT_PERMS, constants.DELETE_PERMS]
          }
        ]
      }
    ], callback);
  },

  userRoles: function(user, callback) {
    acl.userRoles('' + user._id, callback);
  },

  isAdmin: function(user, callback) {
    this.userRoles(user, function(err, roles) {
      callback(err, _.indexOf(roles, constants.ADMIN_ROLE) != -1);
    });
  },

  isAllTopicAdmin: function(user, callback) {
    callback(null, (user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1));
  },

  userTopicRole: function(user, topic, callback) {
    var self = this;
    var role = null;
    if (user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1) {
      role = constants.TOPIC_ADMIN_ROLE;
      callback(null, role);
    }
    else if (topic.collaborators && _.indexOf(topic.collaborators, user._id) != -1) {
      role = constants.TOPIC_COLLAB_ROLE;
      callback(null, role);
    }
    else if (topic.colearnrs && _.indexOf(topic.colearnrs, user._id) != -1) {
      role = constants.TOPIC_COLEARNR_ROLE;
      callback(null, role);
    }
    else {
      this.userRoles(user, function(err, roles) {
        if (err || !roles.length) {
          callback(err, null);
        }
        else {
          if (_.indexOf(roles, constants.TOPIC_COLLAB_ROLE + self.getKey(topic)) != -1) {
            role = constants.TOPIC_COLLAB_ROLE;
          }
          else if (_.indexOf(roles, constants.TOPIC_COLEARNR_ROLE + self.getKey(topic)) != -1) {
            role = constants.TOPIC_COLEARNR_ROLE;
          }
          else if (_.indexOf(roles, constants.TOPIC_EXPERT_ROLE + self.getKey(topic)) != -1) {
            role = constants.TOPIC_EXPERT_ROLE;
          }
          else if (user._id == topic.added_by || _.indexOf(roles, constants.TOPIC_ADMIN_ROLE + self.getKey(topic)) != -1) {
            role = constants.TOPIC_ADMIN_ROLE;
          }
          else if (_.indexOf(roles, constants.ADMIN_ROLE) != -1) {
            role = constants.ADMIN_ROLE;
          }
          callback(err, role);
        }
      });
    }
  },

  isTopicCoLearnr: function(user, topic, callback) {
    var self = this;
    if (!topic) {
      callback(null, false);
    }
    else if (topic.colearnrs && _.indexOf(topic.colearnrs, user._id) != -1) {
      callback(null, true);
    }
    else {
      this.userRoles(user, function(err, roles) {
        callback(err, _.indexOf(roles, constants.TOPIC_COLEARNR_ROLE + self.getKey(topic)) != -1);
      });
    }
  },

  isTopicCollab: function(user, topic, callback) {
    var self = this;
    if (!topic) {
      callback(null, false);
    }
    else if (topic.collaborators && _.indexOf(topic.collaborators, user._id) != -1) {
      callback(null, true);
    }
    else {
      this.userRoles(user, function(err, roles) {
        callback(err, _.indexOf(roles, constants.TOPIC_COLLAB_ROLE + self.getKey(topic)) != -1);
      });
    }
  },

  isTopicExpert: function(user, topic, callback) {
    var self = this;
    this.userRoles(user, function(err, roles) {
      callback(err, _.indexOf(roles, constants.TOPIC_EXPERT_ROLE + self.getKey(topic)) != -1);
    });
  },

  isTopicAdmin: function(user, topic, callback) {
    var self = this;
    if (!topic) {
      callback(null, false);
    }
    else if (topic.added_by == user._id || (user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1)) {
      callback(null, true);
    }
    else {
      this.userRoles(user, function(err, roles) {
        callback(err, _.indexOf(roles, constants.TOPIC_ADMIN_ROLE + self.getKey(topic)) != -1);
      });
    }
  },

  allowedPerms: function(user, topic, callback) {
    var self = this;
    var retMap = {};
    var permlist = [];
    // If the user is the owner or all topic admin
    if (topic.added_by == user._id || (user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1)) {
      permlist = [constants.VIEW_PERMS, constants.EDIT_PERMS, constants.ADD_PERMS, constants.DELETE_PERMS];
      retMap['' + self.getKey(topic)] = permlist;
      callback(null, retMap);
    }
    else if (topic.collaborators && _.indexOf(topic.collaborators, user._id) != -1) { // If the user is a collaborator
      permlist = [constants.VIEW_PERMS, constants.EDIT_PERMS, constants.ADD_PERMS];
      retMap['' + self.getKey(topic)] = permlist;
      callback(null, retMap);
    }
    else if (topic.colearnrs && _.indexOf(topic.colearnrs, user._id) != -1) { // If the user is a colearnr
      permlist = [constants.VIEW_PERMS];
      retMap['' + self.getKey(topic)] = permlist;
      callback(null, retMap);
    }
    else {
      acl.allowedPermissions('' + user._id, '' + self.getKey(topic), function(err, result) {
        if (err) {
          callback(err, result);
        }
        else {
          self.userTopicRole(user, topic, function(err, role) {
            self.isRoleAllowed(user, topic, constants.VIEW_PERMS, function(err, resp) {
              if (resp) {
                if ((!role || role == constants.COLEARNR_ROLE) && topic.draft_mode) {
                  // No view access for colearnr for draft topics

                }
                else {
                  permlist.push(constants.VIEW_PERMS);
                }
              }
              self.isRoleAllowed(user, topic, constants.EDIT_PERMS, function(err, resp) {
                if (resp) {
                  permlist.push(constants.EDIT_PERMS);
                }
                self.isRoleAllowed(user, topic, constants.ADD_PERMS, function(err, resp) {
                  if (resp) {
                    permlist.push(constants.ADD_PERMS);
                  }
                  self.isRoleAllowed(user, topic, constants.DELETE_PERMS, function(err, resp) {
                    if (resp) {
                      permlist.push(constants.DELETE_PERMS);
                    }
                    var retMap = {};
                    retMap['' + self.getKey(topic)] = permlist;
                    callback(err, retMap);
                  });
                });
              });
            });
          });
        } // else
      });
    }
  },

  copyPerms: function(user, sourceTopic, destTopic, callback) {
    var self = this;
    this.userRoles(user, function(err, roles) {
      if (err || !roles) {
        callback(err);
      }
      else {
        roles.forEach(function(role) {
          if (role) {
            if (role.indexOf(constants.ADMIN_ROLE) != -1) {
              self.addTopicAdminPerms(user, destTopic, callback);
            }
            else if (role == constants.TOPIC_ADMIN_ROLE + self.getKey(sourceTopic)) {
              self.addTopicAdminPerms(user, destTopic, callback);
            }
            else if (role == constants.TOPIC_COLLAB_ROLE + self.getKey(sourceTopic)) {
              self.addTopicCollabPerms(user, destTopic, callback);
            }
            else if (role == constants.TOPIC_COLEARNR_ROLE + self.getKey(sourceTopic)) {
              self.addTopicCoLearnrPerms(user, destTopic, callback);
            }
            else if (role == constants.TOPIC_EXPERT_ROLE + self.getKey(sourceTopic)) {
              self.addTopicExpertPerms(user, destTopic, callback);
            }
          }
        });
      }
    });
  },

  isRoleAllowed: function(user, topic, perm, callback) {
    var self = this;
    var ret = false;
    if (!topic || !user) {
      callback(null, false);
      return;
    }
    if (topic.added_by == user._id || (user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1)) {
      callback(null, true);
      return;
    }
    if (topic.collaborators && _.indexOf(topic.collaborators, user._id) != -1) { // If the user is a collaborator
      callback(null, _.indexOf([constants.VIEW_PERMS, constants.EDIT_PERMS, constants.ADD_PERMS], perm) != -1);
      return;
    }
    if (topic.colearnrs && _.indexOf(topic.colearnrs, user._id) != -1) { // If the user is a colearnr
      if (topic.startdate || topic.enddate) {
        self.checkDate(user, topic, perm, callback);
      }
      else {
        callback(null, _.indexOf([constants.VIEW_PERMS], perm) != -1 && topic.draft_mode !== true);
      }
      return;
    }
    if (topic.user_perms && topic.user_perms[user._id] && _.indexOf(topic.user_perms[user._id], perm) != -1) {
      //console.log('Topic already has permissions set', topic.user_perms, perm, user._id);
      callback(null, true);
      return;
    }
    else {
      // If the user is a collaborator on any sub-topic, then he should have view access for this topic
      self.is_subtopic_collaborator(user, topic, function(err, isCollab) {
        if (constants.VIEW_PERMS == perm && isCollab) {
          callback(null, true);
        }
        else if (constants.VIEW_PERMS == perm && constants.PUBLIC == topic.privacy_mode) {
          if (topic.startdate || topic.enddate) {
            self.checkDate(user, topic, perm, callback);
          }
          else {
            callback(null, topic.draft_mode !== true);
          }
        }
        else {
          self.userRoles(user, function(err, roles) {
            if (err) {
              callback(err, false);
            }
            else {
              acl.areAnyRolesAllowed(roles, '' + self.getKey(topic), perm, function(err, result) {
                if (!result && (topic.added_by == constants.COLEARNR_ROLE && constants.VIEW_PERMS == perm && topic.draft_mode !== true)) {
                  logger.log('debug', 'Allowing access through monkey patch!', topic.added_by);
                  self.addFreeTopicRolePerms(topic, function(err) {

                  });
                  // If this is a user created topic or if the user has admin role, then add topic admin perms
                  if (topic.added_by == user._id || _.indexOf(roles, constants.ADMIN_ROLE) != -1) {
                    logger.log('debug', 'Adding topic admin permission to user', user._id, 'for topic', topic._id);
                    self.addTopicAdminPerms(user, topic, function(err) {
                      callback(err, true);
                    });
                  }
                  else {
                    callback(err, (constants.VIEW_PERMS == perm)); // Allow view access by default
                  }
                }
                else {
                  callback(err, result);
                }
              });
            }
          });
        }
      });
    }
  },

  isUserAllowed: function(user, topic, perm, callback) {
    var self = this;
    if (topic.added_by == user._id || (user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1) || (constants.VIEW_PERMS == perm && constants.PUBLIC == topic.privacy_mode && topic.draft_mode !== true)) {
      if (constants.VIEW_PERMS == perm && constants.PUBLIC == topic.privacy_mode && topic.draft_mode !== true) {
        if (topic.startdate || topic.enddate) {
          self.checkDate(user, topic, perm, callback);
        }
        else {
          callback(null, true);
        }
      }
      else {
        if (topic.startdate || topic.enddate) {
          self.checkDate(user, topic, perm, callback);
        }
        else {
          callback(null, true);
        }
      }
      return;
    }
    self.userTopicRole(user, topic, function(err, role) {
      acl.isAllowed('' + user._id, '' + self.getKey(topic), perm, function(err, result) {
        if (err) {
          callback(err, false);
        }
        else if (topic.startdate || topic.enddate) {
          self.checkDate(user, topic, perm, callback);
        }
        else if (topic.draft_mode) {
          if (role && role != constants.COLEARNR_ROLE) {
            callback(err, true);
          }
          else {
            callback(err, false);
          }
        }
        else if (!result && (topic.added_by == constants.COLEARNR_ROLE && constants.VIEW_PERMS == perm)) {
          logger.log('debug', 'Allowing access through monkey patch!');
          callback(err, true); // Allow view access by default
        }
        else {
          callback(err, result);
        }
      });
    });
  },

  anyRolesAllowed: function(topic, callback) {
    var self = this;
    acl.areAnyRolesAllowed([constants.COLEARNR_ROLE, constants.ADMIN_ROLE, constants.TOPIC_EXPERT_ROLE + self.getKey(topic),
        constants.PROLEARNR_ROLE, constants.TOPIC_COLEARNR_ROLE + self.getKey(topic), constants.TOPIC_COLLAB_ROLE + self.getKey(topic), constants.TOPIC_ADMIN_ROLE + self.getKey(topic)],
      '' + self.getKey(topic), [constants.VIEW_PERMS, constants.EDIT_PERMS, constants.ADD_PERMS, constants.DELETE_PERMS],
      callback);
  },

  whatResources: function(role, callback) {
    acl.whatResources(role, callback);
  },

  checkDate: function(user, topic, perm, callback) {
    var isCollab = topic.collaborators && _.indexOf(topic.collaborators, user._id) != -1;
    var isCoLearnr = topic.colearnrs && _.indexOf(topic.colearnrs, user._id) != -1;
    var isOwner = (topic.added_by == user._id);
    var isAdmin = user.roles && _.indexOf(user.roles, constants.ALL_TOPIC_ADMIN_ROLE) != -1;
    if (!isCoLearnr && !isCollab && !isOwner && !isAdmin) {
      isCoLearnr = true;
    }
    if (isAdmin || isOwner) {
      callback(null, true);
      return;
    }
    if (isCoLearnr && perm != 'view' && topic.added_by != user._id) {
      callback(null, false);
      return;
    }

    if (isCollab) {
      if (perm != 'delete') {
        callback(null, true);
        return;
      }
      if (perm == 'delete' && topic.added_by != user._id) {
        callback(null, false);
        return;
      }
    }
    if (topic.startdate || topic.enddate) {
      var now = moment();
      var startdate = topic.startdate ? moment(topic.startdate, 'YYYY-MM-DD HH:mm') : null;
      var enddate = topic.enddate ? moment(topic.enddate, 'YYYY-MM-DD HH:mm') : null;
      var ret = true;
      if (startdate && now.isBefore(startdate)) {
        ret = false;
      }
      if (enddate && now.isAfter(enddate)) {
        ret = false;
      }
      callback(null, ret);
    }
  },

  is_subtopic_collaborator: function(user, topic, callback) {
    if (user && !user.guestMode && topic) {
      var path = topic.path ? topic.path : ',';
      path = path + topic.id + ',';
      path = util.pathify(path);
      db.topics.find({path: new RegExp('^' + path), collaborators: user._id}, function(err, atopics) {
        if (err || !atopics || !atopics.length) {
          callback(err, false);
        }
        else {
          callback(err, true);
        }
      });
    }
    else {
      callback(null, false);
    }
  }

}

module.exports = perms;
