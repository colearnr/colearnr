'use strict'

let vows = require('vows')
let perms = require('../perms')
let constants = require('../../common/constants')
let moment = require('moment')
let should = require('should')

let suite = vows.describe('perms test suite')
let mockuser = {
  _id: '123',
  name: 'test-user',
  description: 'test user'
}

let mockuser2 = {
  _id: '1234',
  name: 'test-user2',
  description: 'test user2'
}
let mockcolearnr = {
  _id: '129',
  name: 'test-colearnr',
  description: 'test colearnr'
}

let mockexpert = {
  _id: '125',
  name: 'test-expert',
  description: 'test expert'
}
let mocktopic = {
  _id: '456',
  name: 'test-topic',
  path: null,
  template: 'category'
}

let mockdrafttopic = {
  _id: '45623',
  added_by: '125',
  name: 'test-draft-topic',
  path: null,
  template: 'category',
  draft_mode: true,
  collaborators: ['1234']
}

let mocktopicwkey = {
  _id: '45676',
  permission_key: 999,
  name: 'test-topic',
  path: null,
  template: 'category'
}

let srctopic = {
  _id: '1000',
  name: 'test-src-topic',
  path: null,
  template: 'category'
}

let desttopic = {
  _id: '1001',
  name: 'test-dest-topic',
  path: null,
  template: 'category'
}

let mockalladmin = {
  _id: '128',
  name: 'test-all-topic-admin',
  description: 'test all topic admin',
  roles: [constants.ALL_TOPIC_ADMIN_ROLE]
}

let mocktopicWithCollaborator = {
  _id: '456',
  name: 'test-topic',
  path: null,
  template: 'category',
  collaborators: ['123']
}

let schedtopic = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'public',
  collaborators: ['1234'],
  startdate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let schedtopicwcolearnr = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['123'],
  collaborators: ['1234'],
  startdate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let schedtopicAscolearnr = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['1234'],
  collaborators: [''],
  startdate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let schedtopicOwnTopic = {
  _id: '45625',
  added_by: mockuser2._id,
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['1238'],
  collaborators: [''],
  startdate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let nschedtopic = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'public',
  collaborators: ['1234'],
  startdate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let nschedtopicwcolearnr = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['123'],
  collaborators: ['1234'],
  startdate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let nschedtopicAscolearnr = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['1234'],
  collaborators: [''],
  startdate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let nschedtopicOwnTopic = {
  _id: '45625',
  added_by: mockuser2._id,
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['1238'],
  collaborators: [''],
  startdate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().add(7, 'days').format('YYYY-MM-DD HH:mm')
}

let pschedtopic = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'public',
  collaborators: ['1234'],
  startdate: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm')
}

let pschedtopicwcolearnr = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['123'],
  collaborators: ['1234'],
  startdate: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm')
}

let pschedtopicAscolearnr = {
  _id: '45625',
  added_by: '125',
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['1234'],
  collaborators: [''],
  startdate: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm')
}

let pschedtopicOwnTopic = {
  _id: '45625',
  added_by: mockuser2._id,
  name: 'test-sched-topic',
  path: null,
  privacy_mode: 'private',
  colearnrs: ['1238'],
  collaborators: [''],
  startdate: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm'),
  enddate: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm')
}

perms.setTestBackend()
perms.addFreeTopicRolePerms(mocktopic, function () {})
perms.addFreeTopicRolePerms(mockdrafttopic, function () {})
perms.addFreeTopicRolePerms(mocktopicwkey, function () {})
perms.addFreeTopicRolePerms(srctopic, function () {})
perms.addFreeTopicRolePerms(desttopic, function () {})

suite.addBatch({
  'Check the roles allowed for mocktopic': {
    topic: function () { perms.anyRolesAllowed(mocktopic, this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
      res.should.be.true
    }
  },
  'Check the roles allowed for mocktopicwkey': {
    topic: function () { perms.anyRolesAllowed(mocktopicwkey, this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
      res.should.be.true
    }
  }
})
  .addBatch({
    'Permission a new free user': {
      topic: function () { perms.addNewFreeUserPerms(mockuser, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Permission a new mockcolearnr user': {
      topic: function () { perms.addNewFreeUserPerms(mockcolearnr, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check the roles for the free user': {
      topic: function () { perms.userRoles(mockuser, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(1)
        roles.should.containEql('colearnr')
      }
    },

    'check if the free user has view permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'make the topic a draft check if the free user has no view permission': {
      topic: function () { perms.isUserAllowed(mockuser, mockdrafttopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'make the topic a draft check if the collaborator has view permission': {
      topic: function () { perms.isUserAllowed(mockuser2, mockdrafttopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'make the topic a draft check if all admin still has view permission': {
      topic: function () { perms.isUserAllowed(mockalladmin, mockdrafttopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'make the topic a draft check if the owner still has view permission': {
      topic: function () { perms.isUserAllowed(mockexpert, mockdrafttopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the free user has view permission based on roles': {
      topic: function () { perms.isRoleAllowed(mockuser, mocktopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the mock user has view permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the free user has edit permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'check if the free user has delete permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'delete', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'Make the mockexpert user a topic expert': {
      topic: function () { perms.addTopicExpertPerms(mockexpert, mocktopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check if the mockexpert user is really a topic expert': {
      topic: function () { perms.isTopicExpert(mockexpert, mocktopic, this.callback) },
      'no error': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check the roles for the mockexpert user': {
      topic: function () { perms.userRoles(mockexpert, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(1)
        roles.should.containEql('expert-' + mocktopic._id)
      }
    },

    'Check if the mockexpert is allowed to add and edit the topic': {
      topic: function () { perms.allowedPerms(mockexpert, mocktopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(mocktopic._id)
        permlist[mocktopic._id].should.have.length(3)
        permlist[mocktopic._id].should.containEql('view').containEql('edit').containEql('add')
      }
    },

    'check if the mockexpert has edit permission': {
      topic: function () { perms.isUserAllowed(mockexpert, mocktopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the mockexpert has edit permission based on roles': {
      topic: function () { perms.isRoleAllowed(mockexpert, mocktopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Make the free user a topic admin': {
      topic: function () { perms.addTopicAdminPerms(mockuser, mocktopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check if the free user is now able to do all the 4 operations': {
      topic: function () { perms.allowedPerms(mockuser, mocktopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(mocktopic._id)
        permlist[mocktopic._id].should.have.length(4)
        permlist[mocktopic._id].should.containEql('view').containEql('add')
          .containEql('edit').containEql('delete')
      }
    },

    'Check the roles for the mockuser': {
      topic: function () { perms.userRoles(mockuser, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(2)
        roles.should.containEql('admin-' + mocktopic._id)
        roles.should.containEql('colearnr')
      }
    },

    'check if the user has delete permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'delete', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the user has delete permission based on role': {
      topic: function () { perms.isRoleAllowed(mockuser, mocktopic, 'delete', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'remove permission for mock user': {
      topic: function () { perms.removeTopicAdminPerms(mockuser, mocktopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check the roles for the mockuser': {
      topic: function () { perms.userRoles(mockuser, this.callback) },
      'checks': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(1)
        roles.should.not.containEql('expert-' + mocktopic._id)
        roles.should.not.containEql('admin-' + mocktopic._id)
        roles.should.containEql('colearnr')
      }
    },

    'Check the operations available for the mockuser': {
      topic: function () { perms.allowedPerms(mockuser, mocktopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(mocktopic._id)
        permlist[mocktopic._id].should.containEql('view')
      }
    },

    'check if the user has delete permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'delete', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'check if the user has view permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the user has delete permission based on roles': {
      topic: function () { perms.isRoleAllowed(mockuser, mocktopic, 'delete', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'check if the user has view permission based on roles': {
      topic: function () { perms.isRoleAllowed(mockuser, mocktopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'remove permission for expert user': {
      topic: function () { perms.removeTopicExpertPerms(mockexpert, mocktopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check the roles for the mockexpert user': {
      topic: function () { perms.userRoles(mockexpert, this.callback) },
      'checks': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(0)
        roles.should.not.containEql('expert-' + mocktopic._id)
      }
    },

    'check if the expertuser has edit permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'check if the expertuser has view permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'view', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Make the mockcolearnr user a topic colearnr': {
      topic: function () { perms.addTopicCoLearnrPerms(mockcolearnr, mocktopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check if the mockcolearnr user is really a topic colearnr': {
      topic: function () { perms.isTopicCoLearnr(mockcolearnr, mocktopic, this.callback) },
      'no error': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check if the mockcolearnr user is now able to do view but not add or edit': {
      topic: function () { perms.allowedPerms(mockcolearnr, mocktopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(mocktopic._id)
        permlist[mocktopic._id].should.have.length(1)
        permlist[mocktopic._id].should.containEql('view')
      }
    },

    'Check the roles for the mockcolearnr': {
      topic: function () { perms.userRoles(mockcolearnr, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(2)
        roles.should.containEql('colearnr-' + mocktopic._id)
        roles.should.containEql('colearnr')
      }
    },

    'check if the mockcolearnr has no add permission': {
      topic: function () { perms.isUserAllowed(mockcolearnr, mocktopic, 'add', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'check if the mockcolearnr has no edit permission': {
      topic: function () { perms.isUserAllowed(mockcolearnr, mocktopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    }
  })
  .addBatch({
    'Make the free user a topic collaborator': {
      topic: function () { perms.addTopicCollabPerms(mockuser, mocktopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check if the free user is really a topic collaborator': {
      topic: function () { perms.isTopicCollab(mockuser, mocktopic, this.callback) },
      'no error': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check if the free user is now able to do view, add and edit operations': {
      topic: function () { perms.allowedPerms(mockuser, mocktopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(mocktopic._id)
        permlist[mocktopic._id].should.have.length(3)
        permlist[mocktopic._id].should.containEql('view').containEql('add').containEql('edit')
      }
    },

    'Check the roles for the mockuser': {
      topic: function () { perms.userRoles(mockuser, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(2)
        roles.should.containEql('collab-' + mocktopic._id)
        roles.should.containEql('colearnr')
      }
    },

    'check if the user has add permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'add', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the user has edit permission': {
      topic: function () { perms.isUserAllowed(mockuser, mocktopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Make the mockuser2 a topic collaborator for srctopic': {
      topic: function () { perms.addTopicCollabPerms(mockuser2, srctopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Remove the mockuser2 topic collaborator for srctopic': {
      topic: function () { perms.removeTopicCollabPerms(mockuser2, srctopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Re-Make the mockuser2 a topic collaborator for srctopic': {
      topic: function () { perms.addTopicCollabPerms(mockuser2, srctopic, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check if the mockuser2 is now able to do view, add and edit operations for srctopic': {
      topic: function () { perms.allowedPerms(mockuser2, srctopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(srctopic._id)
        permlist[srctopic._id].should.have.length(3)
        permlist[srctopic._id].should.containEql('view').containEql('add').containEql('edit')
      }
    },

    'Check if the mockuser2 has edit access for srctopic': {
      topic: function () { perms.checkTopicEditAccess(mockuser2, srctopic, this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check if the mockuser2 has view access for srctopic': {
      topic: function () { perms.checkTopicViewAccess(mockuser2, srctopic, this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check if the mockuser2 has share access for srctopic': {
      topic: function () { perms.checkTopicShareAccess(mockuser2, srctopic, this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check the roles for the mockuser2': {
      topic: function () { perms.userRoles(mockuser2, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(1)
        roles.should.containEql('collab-' + srctopic._id)
      }
    },

    'check if the mockuser2 has add permission': {
      topic: function () { perms.isUserAllowed(mockuser2, srctopic, 'add', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the mockuser2 has edit permission': {
      topic: function () { perms.isUserAllowed(mockuser2, srctopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Copy the perms from one topic to another': {
      topic: function () { perms.copyPerms(mockuser2, srctopic, desttopic, this.callback) },
      'checks': function (err) {
        should.not.exist(err)
      }
    },

    'Check if the free user is now able to do view, add and edit operations on desttopic': {
      topic: function () { perms.allowedPerms(mockuser2, desttopic, this.callback) },
      'checks': function (err, permlist) {
        should.not.exist(err)
        permlist.should.have.keys(desttopic._id)
        permlist[desttopic._id].should.have.length(3)
        permlist[desttopic._id].should.containEql('view').containEql('add').containEql('edit')
      }
    },

    'Check the roles for the mockuser': {
      topic: function () { perms.userRoles(mockuser2, this.callback) },
      'no error': function (err, roles) {
        should.not.exist(err)
        roles.should.have.length(2)
        roles.should.containEql('collab-' + srctopic._id)
        roles.should.containEql('collab-' + desttopic._id)
      }
    },

    'check if the user has add permission on desttopic': {
      topic: function () { perms.isUserAllowed(mockuser2, desttopic, 'add', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the user has edit permission on desttopic': {
      topic: function () { perms.isUserAllowed(mockuser2, desttopic, 'edit', this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'check if the user has view access on desttopic': {
      topic: function () { perms.checkTopicViewAccess(mockuser2, desttopic, this.callback) },
      'checks': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }

  })
  .addBatch({
    'Check if mockuser2 is a admin': {
      topic: function () { perms.isAdmin(mockuser2, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },

    'Make the mockuser2 a topic admin for srctopic': {
      topic: function () { perms.addAdminPerms(mockuser2, this.callback) },
      'no error': function (err) {
        should.not.exist(err)
      }
    },

    'Check again if mockuser2 is a admin': {
      topic: function () { perms.isAdmin(mockuser2, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check user topic role': {
      topic: function () { perms.userTopicRole(mockuser2, desttopic, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.equal(constants.TOPIC_COLLAB_ROLE)
      }
    }
  })
  .addBatch({
    'Check if mockalladmin is a admin': {
      topic: function () { perms.isTopicAdmin(mockalladmin, mocktopic, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check if mockalladmin is a admin2': {
      topic: function () { perms.isTopicAdmin(mockalladmin, mocktopicwkey, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },

    'Check mockalladmin user topic role': {
      topic: function () { perms.userTopicRole(mockalladmin, mocktopic, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.equal(constants.TOPIC_ADMIN_ROLE)
      }
    },

    'Check mockuser topic role2': {
      topic: function () { perms.userTopicRole(mockuser, mocktopicWithCollaborator, this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.equal(constants.TOPIC_COLLAB_ROLE)
      }
    }
  })
  .addBatch({
    'Check if mockuser can access schedtopic': {
      topic: function () { perms.isUserAllowed(mockuser, schedtopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser can access schedtopic2': {
      topic: function () { perms.isUserAllowed(mockuser, schedtopicwcolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can access schedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access schedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicwcolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access schedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicAscolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can access schedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicOwnTopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access pschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access pschedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicwcolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access pschedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicAscolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can access pschedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicOwnTopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Check if mockuser can edit schedtopic': {
      topic: function () { perms.isUserAllowed(mockuser, schedtopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser can edit schedtopic2': {
      topic: function () { perms.isUserAllowed(mockuser, schedtopicwcolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can edit schedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit schedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicwcolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit schedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicAscolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can edit schedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicOwnTopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit pschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit pschedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicwcolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit pschedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicAscolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can edit pschedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicOwnTopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Check if mockuser can delete schedtopic': {
      topic: function () { perms.isUserAllowed(mockuser, schedtopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser can delete schedtopic2': {
      topic: function () { perms.isUserAllowed(mockuser, schedtopicwcolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete schedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete schedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicwcolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete schedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicAscolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete schedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, schedtopicOwnTopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can delete pschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete pschedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicwcolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete pschedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicAscolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete pschedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, pschedtopicOwnTopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Check if mockuser can access nschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser, nschedtopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser can access nschedtopic2': {
      topic: function () { perms.isUserAllowed(mockuser, nschedtopicwcolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access nschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access nschedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicwcolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access nschedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicAscolearnr, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can access nschedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicOwnTopic, 'view', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Check if mockuser can edit nschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser, nschedtopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser can edit nschedtopic2': {
      topic: function () { perms.isUserAllowed(mockuser, nschedtopicwcolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can edit nschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit nschedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicwcolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    },
    'Check if mockuser2 can edit nschedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicAscolearnr, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can edit nschedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicOwnTopic, 'edit', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .addBatch({
    'Check if mockuser can delete nschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser, nschedtopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser can delete nschedtopic2': {
      topic: function () { perms.isUserAllowed(mockuser, nschedtopicwcolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete nschedtopic': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete nschedtopicwcolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicwcolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete nschedtopicAscolearnr': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicAscolearnr, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.false
      }
    },
    'Check if mockuser2 can delete nschedtopicOwnTopic': {
      topic: function () { perms.isUserAllowed(mockuser2, nschedtopicOwnTopic, 'delete', this.callback) },
      'check': function (err, res) {
        should.not.exist(err)
        res.should.be.true
      }
    }
  })
  .export(module)
