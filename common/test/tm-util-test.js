'use strict'

const vows = require('vows')
const topicMapUtil = require('../util/topicMapUtil')
const assert = require('assert')
const categoryMapSimple = {
  title: 'First topic',
  id: 10,
  order: null,
  formatVersion: 2,
  ideas: {
    '20': {
      title: 'Topic 1.1',
      id: 20,
      order: 1,
      formatVersion: 2
    },
    '30': {
      title: 'Topic 2.1',
      id: 30,
      order: 2,
      formatVersion: 2
    },
    '40': {
      title: 'Topic 3.1',
      id: 40,
      order: 3,
      formatVersion: 2
    }
  }
}
const expectedListSimple = [
  { uiKey: '10',
    name: 'First topic',
    id: 'first-topic',
    oid: null,
    order: null,
    path: null,
  skipReorder: true },
  { uiKey: '20',
    name: 'Topic 1.1',
    id: 'topic-1-1',
    oid: null,
    order: 1,
    path: ',first-topic,',
  skipReorder: false },
  { uiKey: '30',
    name: 'Topic 2.1',
    id: 'topic-2-1',
    oid: null,
    order: 2,
    path: ',first-topic,',
  skipReorder: false },
  { uiKey: '40',
    name: 'Topic 3.1',
    id: 'topic-3-1',
    oid: null,
    order: 3,
    path: ',first-topic,',
  skipReorder: false }
]

const categoryMapMixed = {
  title: 'First topic',
  id: 10,
  oid: '52c6663a0b7b13b309000002',
  order: null,
  formatVersion: 2,
  ideas: {
    '20': {
      title: 'Topic 1.1',
      id: 20,
      oid: '52c6663a0b7b13b309000003',
      order: 1,
      formatVersion: 2
    },
    '30': {
      title: 'Topic 2.1',
      id: 23.5,
      oid: '52c6663a0b7b13b309000005',
      order: 5,
      formatVersion: 2,
      ideas: {
        '50': {
          title: 'Topic 2.1.1',
          id: 50,
          oid: '52c6663a0b7b13b309000006',
          order: 1,
          formatVersion: 2
        },
        '61.1345': {
          title: 'Topic 2.1.2',
          id: 40,
          order: 2,
          formatVersion: 2
        }
      }
    },
    '40': {
      title: 'Topic 3.1',
      id: 30,
      order: 7,
      formatVersion: 2
    }
  }
}

const expectedListMixed = [ { uiKey: '10',
  name: 'First topic',
  id: 'first-topic',
  oid: '52c6663a0b7b13b309000002',
  order: null,
  path: null,
skipReorder: true },
  { uiKey: '20',
    name: 'Topic 1.1',
    id: 'topic-1-1',
    oid: '52c6663a0b7b13b309000003',
    order: 1,
    path: ',first-topic,',
  skipReorder: false },
  { uiKey: '23.5',
    name: 'Topic 2.1',
    id: 'topic-2-1',
    oid: '52c6663a0b7b13b309000005',
    order: 2,
    path: ',first-topic,',
  skipReorder: false },
  { uiKey: '50',
    name: 'Topic 2.1.1',
    id: 'topic-2-1-1',
    oid: '52c6663a0b7b13b309000006',
    order: 1,
    path: ',first-topic,topic-2-1,',
  skipReorder: false },
  { uiKey: '40',
    name: 'Topic 2.1.2',
    id: 'topic-2-1-2',
    oid: null,
    order: 2,
    path: ',first-topic,topic-2-1,',
  skipReorder: false },
  { uiKey: '30',
    name: 'Topic 3.1',
    id: 'topic-3-1',
    oid: null,
    order: 3,
    path: ',first-topic,',
  skipReorder: false } ]

const categoryMapSimpleWLinks = {
  title: 'First topic',
  id: 10,
  order: null,
  formatVersion: 2,
  ideas: {
    '20': {
      title: 'Topic 1.1',
      id: 20,
      order: 1,
      formatVersion: 2
    },
    '30': {
      title: 'Topic 2.1',
      id: 30,
      order: 2,
      formatVersion: 2,
      ideas: {
        '50': {
          title: 'Topic 2.1.1',
          id: 50,
          order: 1,
          formatVersion: 2
        },
        '60': {
          title: 'Topic 2.1.2',
          id: 60,
          order: 2,
          formatVersion: 2
        }
      }
    },
    '40': {
      title: 'Topic 3.1',
      id: 40,
      order: 3,
      formatVersion: 2
    }
  },
  links: [{ideaIdFrom: 10, ideaIdTo: 50},
    {ideaIdFrom: 60, ideaIdTo: 20}
  ]
}
const expectedListSimpleWLinks = [
  { uiKey: '10',
    name: 'First topic',
    id: 'first-topic',
    oid: null,
    order: null,
    path: null,
    skipReorder: true,
  link_out: [{path: ',first-topic,topic-2-1,topic-2-1-1,'}] },
  { uiKey: '20',
    name: 'Topic 1.1',
    id: 'topic-1-1',
    oid: null,
    order: 1,
    path: ',first-topic,',
    skipReorder: false,
    link_in: [{path: ',first-topic,topic-2-1,topic-2-1-2,'}]
  },
  { uiKey: '30',
    name: 'Topic 2.1',
    id: 'topic-2-1',
    oid: null,
    order: 2,
    path: ',first-topic,',
  skipReorder: false },
  { uiKey: '50',
    name: 'Topic 2.1.1',
    id: 'topic-2-1-1',
    oid: null,
    order: 1,
    path: ',first-topic,topic-2-1,',
    skipReorder: false,
  link_in: [{path: ',first-topic,'}] },
  { uiKey: '60',
    name: 'Topic 2.1.2',
    id: 'topic-2-1-2',
    oid: null,
    order: 2,
    path: ',first-topic,topic-2-1,',
    skipReorder: false,
  link_out: [{path: ',first-topic,topic-1-1,'}] },
  { uiKey: '40',
    name: 'Topic 3.1',
    id: 'topic-3-1',
    oid: null,
    order: 3,
    path: ',first-topic,',
  skipReorder: false }
]

const categoryMapMixedWLinks = {
  title: 'First topic',
  id: 10,
  oid: '52c6663a0b7b13b309000002',
  order: null,
  formatVersion: 2,
  ideas: {
    '20': {
      title: 'Topic 1.1',
      id: 20,
      oid: '52c6663a0b7b13b309000003',
      order: 1,
      formatVersion: 2
    },
    '30': {
      title: 'Topic 2.1',
      id: 23.5,
      oid: '52c6663a0b7b13b309000005',
      order: 5,
      formatVersion: 2,
      ideas: {
        '50': {
          title: 'Topic 2.1.1',
          id: 50,
          oid: '52c6663a0b7b13b309000006',
          order: 1,
          formatVersion: 2
        },
        '60': {
          title: 'Topic 2.1.2',
          id: '61.2345',
          order: 2,
          formatVersion: 2
        }
      }
    },
    '40': {
      title: 'Topic 3.1',
      id: 30,
      order: 7,
      formatVersion: 2
    }
  },
  links: [{ideaIdFrom: 20, ideaIdTo: '61.2345'},
    {ideaIdFrom: '40', ideaIdTo: '30'},
    {ideaIdFrom: '50', ideaIdTo: 20}]
}

const expectedListMixedWLinks = [
  {
    'uiKey': '10',
    'name': 'First topic',
    'id': 'first-topic',
    'oid': '52c6663a0b7b13b309000002',
    'order': null,
    'path': null,
    'skipReorder': true
  },
  {
    'uiKey': '20',
    'name': 'Topic 1.1',
    'id': 'topic-1-1',
    'oid': '52c6663a0b7b13b309000003',
    'order': 1,
    'path': ',first-topic,',
    'skipReorder': false,
    'link_in': [
      {
        '_id': '52c6663a0b7b13b309000006'
      }
    ],
    'link_out': [
      {
        'path': ',first-topic,topic-2-1,topic-2-1-2,'
      }
    ]
  },
  {
    'uiKey': '23.5',
    'name': 'Topic 2.1',
    'id': 'topic-2-1',
    'oid': '52c6663a0b7b13b309000005',
    'order': 2,
    'path': ',first-topic,',
    'skipReorder': false
  },
  {
    'uiKey': '50',
    'name': 'Topic 2.1.1',
    'id': 'topic-2-1-1',
    'oid': '52c6663a0b7b13b309000006',
    'order': 1,
    'path': ',first-topic,topic-2-1,',
    'skipReorder': false,
    'link_out': [
      {
        '_id': '52c6663a0b7b13b309000003'
      }
    ]
  },
  {
    'uiKey': '61.2345',
    'name': 'Topic 2.1.2',
    'id': 'topic-2-1-2',
    'oid': null,
    'order': 2,
    'path': ',first-topic,topic-2-1,',
    'skipReorder': false,
    'link_in': [
      {
        '_id': '52c6663a0b7b13b309000003'
      }
    ]
  },
  {
    'uiKey': '30',
    'name': 'Topic 3.1',
    'id': 'topic-3-1',
    'oid': null,
    'order': 3,
    'path': ',first-topic,',
    'skipReorder': false
  }
]

const categoryMapComplex = {
  'title': 'Learnplan for CoLearnrs',
  'oid': '52b3a669558c2b3f0a000001',
  'id': 10,
  'order': null,
  'formatVersion': 2,
  'user_role': {
    '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
  },
  'user_perms': {
    '1c474c1abb4403fb6c27eefeb3c775aa': [
      'view',
      'edit',
      'add',
      'delete'
    ]
  },
  'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
  'privacy_mode': 'private',
  'hidden': false,
  'link_in': [
    {
      'path': ',learnplan-for-colearnrs,node-js,topic-123,topic-124,topic-125,'
    }
  ],
  'link_out': null,
  'ideas': {
    '30': {
      'title': 'Selenium',
      'oid': '52b3a669558c2b3f0a000002',
      'id': 20,
      'order': 1,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'ideas': {
        '30': {
          'title': 'Books',
          'oid': '52bb2406c47e07216a000064',
          'id': 30,
          'order': 1,
          'formatVersion': 2,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'hidden': false,
          'ideas': {

          },
          'link_in': null,
          'link_out': null,
          'attr': {
            'icon': {
              'url': null,
              'width': 300,
              'height': 192,
              'position': 'top'
            },
            'style': {
              'background': '#FFFFFF'
            }
          }
        }
      },
      'link_in': null,
      'link_out': null,
      'attr': {
        'icon': {
          'url': null,
          'width': 300,
          'height': 192,
          'position': 'top'
        },
        'style': {
          'background': '#FFFFFF'
        }
      }
    },
    '50': {
      'title': 'Mongo DB',
      'oid': '52b3a669558c2b3f0a000003',
      'id': 40,
      'order': 2,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'ideas': {
        '50': {
          'title': 'Ops support',
          'oid': '5432977e58d3f6166f000002',
          'id': 50,
          'order': 1,
          'formatVersion': 2,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'hidden': false,
          'ideas': {

          },
          'link_in': null,
          'link_out': null,
          'attr': {
            'icon': {
              'url': null,
              'width': 300,
              'height': 192,
              'position': 'top'
            },
            'style': {
              'background': '#FFFFFF'
            }
          }
        }
      },
      'attr': {
        'icon': {
          'url': null,
          'width': 300,
          'height': 192,
          'position': 'top'
        },
        'style': {
          'background': '#FFFFFF'
        }
      }
    },
    '60': {
      'title': 'Linux',
      'oid': '52b3a66a558c2b3f0a000004',
      'id': 60,
      'order': 3,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'ideas': {

      },
      'link_in': null,
      'link_out': null,
      'attr': {
        'icon': {
          'url': null,
          'width': 300,
          'height': 192,
          'position': 'top'
        },
        'style': {
          'background': '#FFFFFF'
        }
      }
    },
    '100': {
      'title': 'Node.js',
      'oid': '52bb25afc47e07216a00006f',
      'id': 70,
      'order': 4,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'ideas': {
        '100': {
          'title': 'Topic 123',
          'oid': '5433e305297f4b7719000002',
          'id': 80,
          'order': 1,
          'formatVersion': 2,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'hidden': false,
          'ideas': {
            '100': {
              'title': 'Topic 124',
              'oid': '5433e4a128af4b941f000001',
              'id': 90,
              'order': 1,
              'formatVersion': 2,
              'user_role': {
                '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
              },
              'user_perms': {
                '1c474c1abb4403fb6c27eefeb3c775aa': [
                  'view',
                  'edit',
                  'add',
                  'delete'
                ]
              },
              'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
              'privacy_mode': 'private',
              'hidden': false,
              'ideas': {
                '100': {
                  'title': 'Topic 125',
                  'oid': '5433e56637cce0c820000001',
                  'id': 100,
                  'order': 1,
                  'formatVersion': 2,
                  'user_role': {
                    '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
                  },
                  'user_perms': {
                    '1c474c1abb4403fb6c27eefeb3c775aa': [
                      'view',
                      'edit',
                      'add',
                      'delete'
                    ]
                  },
                  'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
                  'privacy_mode': 'private',
                  'hidden': false,
                  'ideas': {

                  },
                  'link_in': null,
                  'link_out': null,
                  'attr': {
                    'icon': {
                      'url': null,
                      'width': 300,
                      'height': 192,
                      'position': 'top'
                    },
                    'style': {
                      'background': '#FFFFFF'
                    }
                  }
                }
              },
              'link_in': null,
              'link_out': null,
              'attr': {
                'icon': {
                  'url': null,
                  'width': 300,
                  'height': 192,
                  'position': 'top'
                },
                'style': {
                  'background': '#FFFFFF'
                }
              }
            },
            '101': {
              'title': 'Topic 126',
              'id': '101.1412687201808',
              'oid': '',
              'hidden': false
            }
          },
          'link_in': null,
          'link_out': null,
          'attr': {
            'icon': {
              'url': null,
              'width': 300,
              'height': 192,
              'position': 'top'
            },
            'style': {
              'background': '#FFFFFF'
            }
          }
        }
      },
      'link_in': null,
      'link_out': null,
      'attr': {
        'icon': {
          'url': null,
          'width': 300,
          'height': 192,
          'position': 'top'
        },
        'style': {
          'background': '#FFFFFF'
        }
      }
    }
  },
  'links': [
    {
      'ideaIdTo': 10
    },
    {
      'ideaIdFrom': '101.1412687201808',
      'ideaIdTo': 10,
      'attr': {
        'style': {
          'color': '#486D98',
          'lineStyle': 'dashed'
        }
      }
    }
  ]
}

const expectedListComplex = [
  {
    'uiKey': '10',
    'name': 'Learnplan for CoLearnrs',
    'id': 'learnplan-for-colearnrs',
    'oid': '52b3a669558c2b3f0a000001',
    'order': null,
    'path': null,
    'skipReorder': true,
    'link_in': [
      {
        'path': ',learnplan-for-colearnrs,node-js,topic-123,topic-126,'
      }
    ]
  },
  {
    'uiKey': '20',
    'name': 'Selenium',
    'id': 'selenium',
    'oid': '52b3a669558c2b3f0a000002',
    'order': 1,
    'path': ',learnplan-for-colearnrs,',
    'skipReorder': false
  },
  {
    'uiKey': '30',
    'name': 'Books',
    'id': 'books',
    'oid': '52bb2406c47e07216a000064',
    'order': 1,
    'path': ',learnplan-for-colearnrs,selenium,',
    'skipReorder': true
  },
  {
    'uiKey': '40',
    'name': 'Mongo DB',
    'id': 'mongo-db',
    'oid': '52b3a669558c2b3f0a000003',
    'order': 2,
    'path': ',learnplan-for-colearnrs,',
    'skipReorder': false
  },
  {
    'uiKey': '50',
    'name': 'Ops support',
    'id': 'ops-support',
    'oid': '5432977e58d3f6166f000002',
    'order': 1,
    'path': ',learnplan-for-colearnrs,mongo-db,',
    'skipReorder': true
  },
  {
    'uiKey': '60',
    'name': 'Linux',
    'id': 'linux',
    'oid': '52b3a66a558c2b3f0a000004',
    'order': 3,
    'path': ',learnplan-for-colearnrs,',
    'skipReorder': false
  },
  {
    'uiKey': '70',
    'name': 'Node.js',
    'id': 'node-js',
    'oid': '52bb25afc47e07216a00006f',
    'order': 4,
    'path': ',learnplan-for-colearnrs,',
    'skipReorder': false
  },
  {
    'uiKey': '80',
    'name': 'Topic 123',
    'id': 'topic-123',
    'oid': '5433e305297f4b7719000002',
    'order': 1,
    'path': ',learnplan-for-colearnrs,node-js,',
    'skipReorder': false
  },
  {
    'uiKey': '90',
    'name': 'Topic 124',
    'id': 'topic-124',
    'oid': '5433e4a128af4b941f000001',
    'order': 1,
    'path': ',learnplan-for-colearnrs,node-js,topic-123,',
    'skipReorder': false
  },
  {
    'uiKey': '100',
    'name': 'Topic 125',
    'id': 'topic-125',
    'oid': '5433e56637cce0c820000001',
    'order': 1,
    'path': ',learnplan-for-colearnrs,node-js,topic-123,topic-124,',
    'skipReorder': true
  },
  {
    'uiKey': '101.1412687201808',
    'name': 'Topic 126',
    'id': 'topic-126',
    'oid': null,
    'order': 2,
    'path': ',learnplan-for-colearnrs,node-js,topic-123,',
    'skipReorder': false,
    'link_out': [
      {
        '_id': '52b3a669558c2b3f0a000001'
      }
    ]
  }
]

const categoryMapDBComplex = {
  '_id': '52b3a669558c2b3f0a000001',
  'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
  'added_date': '2013-12-20T02:07:36.996Z',
  'body': '\r\n',
  'collaborators': [
    '264c260b3bcb0537f652f9e63b4fd9bc'
  ],
  'description': '\r\n',
  'followers': [
    '264c260b3bcb0537f652f9e63b4fd9bc'
  ],
  'hidden': false,
  'hidden_by': null,
  'id': 'learnplan-for-colearnrs',
  'img_url': [],
  'last_updated': '2014-04-21T20:46:03.503Z',
  'moderation_required': false,
  'modified_by': '1c474c1abb4403fb6c27eefeb3c775aa',
  'name': 'Learnplan for CoLearnrs',
  'order': null,
  'path': null,
  'privacy_mode': 'private',
  'random': 0.8491215251851827,
  'saf e': true,
  'template': 'category',
  'link_in': [
    {
      'path': ',learnplan-for-colearnrs,node-js,topic-123,topic-126,'
    }
  ],
  'link_out': null,
  'user_role': {
    '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
  },
  'user_perms': {
    '1c474c1abb4403fb6c27eefeb3c775aa': [
      'view',
      'edit',
      'add',
      'delete'
    ]
  },
  'full_path': ',learnplan-for-colearnrs,',
  'level': 1,
  'topics': [
    {
      '_id': '52b3a669558c2b3f0a000002',
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'added_date': '2013-12-20T02:07:37.394Z',
      'collaborators': [
        '264c260b3bcb0537f652f9e63b4fd9bc'
      ],
      'description': '\r\n',
      'hidden': false,
      'hidden_by': null,
      'id': 'selenium',
      'last_updated': '2014-04-21T20:46:03.528Z',
      'moderation_required': false,
      'modified_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'name': 'Selenium',
      'order': 1,
      'path': ',learnplan-for-colearnrs,',
      'privacy_mode': 'private',
      'random': 0.31055155489593744,
      'safe': true,
      'template': 'category',
      'link_in': null,
      'link_out': null,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'full_path': ',learnplan-for-colearnrs,selenium,',
      'level': 2,
      'topics': [
        {
          '_id': '52bb2406c47e07216a000064',
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'added_date': '2013-12-25T18:29:26.342Z',
          'collaborators': [
            '264c260b3bcb0537f652f9e63b4fd9bc'
          ],
          'hidden': false,
          'hidden_by': null,
          'id': 'books',
          'last_updated': '2014-04-21T20:46 :03.541Z',
          'moderation_required': false,
          'modified_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'name': 'Books',
          'order': 1,
          'path': ',learnplan-for-colearnrs,selenium,',
          'privacy_mode': 'private',
          'random': 0.533893276238814,
          'safe': true,
          'template': 'category',
          'link_in': null,
          'link_out': null,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa ': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'full_path': ',learnplan-for-colearnrs,selenium,books,',
          'level': 3
        }
      ]
    },
    {
      '_id': '52b3a669558c2b3f0a000003',
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'added_ date': '2013-12-20T02:07:37.776Z',
      'collaborators': [
        '264c260b3bcb0537f652f9e63b4fd9bc'
      ],
      'hidden': false,
      'hidden_by': null,
      'id': 'mongo-db',
      'last_updated': '2014-04-21T20:46:03.528Z',
      'moderation_r equired': false,
      'modified_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'name': 'Mongo DB',
      'order': 2,
      'path': ',learnplan-for-colearnrs,',
      'privacy_mode': 'private',
      'random': 0.4394079023040831,
      'safe': true,
      'template': 'category',
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'full_path': ',learnplan-for-colearnrs,mongo-db,',
      'level': 2,
      'topics': [
        {
          '_id': '5432977e58d3f6166f000002',
          'id': 'ops-support',
          'name': 'Ops support',
          'path': ',learnplan-for-colearnrs,mongo-db,',
          'order': 1,
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'safe': true,
          'moderation_required': false,
          'hidden': false,
          'added_date': '2014-10-06T13:22:06.086Z',
          'last_updated': '2014-10-06T13:22:06.086Z ',
          'link_in': null,
          'link_out': null,
          'collaborators': [
            '264c260b3bcb0537f652f9e63b4fd9bc'
          ],
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'full_path': ',learnplan-for-colearnrs,mongo-db,ops-support,',
          'level': 3
        }
      ]
    },
    {
      '_id': '52b3a66a558c2b3f0a000004',
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'added_date': '2013-12-20T02:07:38.298Z',
      'collaborators': [
        '264c260b3bcb0537f652f9e63b4fd9bc'
      ],
      'hidden': false,
      'hidden_by': null,
      'id': 'linux',
      'last_updated': '2014-10-06T13:22:06.091Z',
      'moderat ion_required': false,
      'modified_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'name': 'Linux',
      'order': 3,
      'path': ',learnplan-for-colearnrs,',
      'privacy_mode': 'private',
      'random': 0.2809074632823467,
      'safe': true,
      'template': 'category',
      'link_in': null,
      'link_out': null,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'full_path': ',learnplan-for-colearnrs,linux,',
      'level': 2
    },
    {
      '_id': '52bb25afc47e07216a00006f',
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'added_date': '2013-12-25T18:36:31.737Z',
      'collaborators': [
        '264c260b3bcb0537f652f9e63b4fd9bc'
      ],
      'hidden': false,
      'hidden_by': null,
      'id': 'node.js',
      'last_updated': '2014-10-06T13:22:06.153Z',
      'moderation_required': false,
      'modified_by': '1c474c1a bb4403fb6c27eefeb3c775aa',
      'name': 'Node.js',
      'order': 4,
      'path': ',learnplan-for-colearnrs,',
      'privacy_mode': 'private',
      'random': 0.8248766376636922,
      'safe': true,
      'template': 'category',
      'link_in': null,
      'link_out': null,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'full_path': ',learnplan-for-colea rnrs,node-js,',
      'level': 2,
      'topics': [
        {
          '_id': '5433e305297f4b7719000002',
          'id': 'topic-123',
          'name': 'Topic 123',
          'path': ',learnplan-for-colearnrs,node-js,',
          'order': 1,
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'safe': true,
          'moderation_required': false,
          'hidden': false,
          'added_date': '2014-10-07T12:56:37.090Z',
          'last_updated': '2014-10-07T12:56:37.090Z',
          'link_in': null,
          'link_out': null,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'full_path': ',learnplan-for-colearnrs,node-js,topic-123,',
          'level': 3,
          'topics': [
            {
              '_id': '5433e4a128af4b941f000001',
              'id': 'topic-124',
              'name': 'Topic 124',
              'path': ',learnplan-for-colearnrs,node-js,topic-123,',
              'order': 1,
              'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
              'privacy_mode': 'private',
              'safe': true,
              'moderation_required': false,
              'hidden': false,
              'added_date': '2014-10-07T13:03:29.884Z',
              'last_updated': '2014-10-07T13:03:29.884Z',
              'link_in': null,
              'link_out': null,
              'user_role': {
                '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
              },
              'user_perms': {
                '1c474c1abb4403fb6c27eefeb3c775aa': [
                  'view',
                  'edit',
                  'add',
                  'delete'
                ]
              },
              'full_path': ',learnplan-for-colearnrs,node-js,topic-123,topic-124,',
              'level': 4,
              'topics': [
                {
                  '_id': '5433e56637cce0c820000001',
                  'id': 'topic-125',
                  'name': 'Topic 125',
                  'path': ',learnplan-for-colearnrs,node-js,topic-123,topic-124,',
                  'order': 1,
                  'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
                  'privacy_mode': 'private',
                  'safe': true,
                  'moderation_required': false,
                  'hidden': false,
                  'added_date': '2014-10-07T13:06 :46.428Z',
                  'last_updated': '2014-10-07T13:06:46.428Z',
                  'link_in': null,
                  'link_out': null,
                  'empty': true,
                  'user_role': {
                    '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
                  },
                  'user_perms': {
                    '1c474c1abb4403fb6c27eefeb3c775aa': [
                      'view',
                      'edit',
                      'add',
                      'delete'
                    ]
                  },
                  'full_path': ',learnplan-for-colearnrs,node-js,topic-123,topic-124,topic-125,',
                  'level': 5
                }
              ]
            },
            {
              '_id': '5433e64005b1329021000001',
              'id': 'topic-126',
              'name': 'Topic 126',
              'path': ',learnplan-for-colearnrs,node-js,topic-123,',
              'order': 2,
              'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
              'privacy_mode': 'private',
              'safe': true,
              'moderation_required': false,
              'hidden': false,
              'added_date': '2014-10-07T13:10:24.888Z',
              'last_updated': '2014-10-07T13:10:24.888Z',
              'link_in': null,
              'link_out': null,
              'empty': true,
              'user_role': {
                '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
              },
              'user_perms': {
                '1c474c1abb4403fb6c27eefeb3c775aa': [
                  'view',
                  'edit',
                  'add',
                  'delete'
                ]
              },
              'full_path': ',learnplan-for-colearnrs,node-js,topic-123,topic-126,',
              'level': 4
            }
          ]
        }
      ]
    }
  ]
}

const expectedMapDBComplex = {
  'title': 'Learnplan for CoLearnrs',
  'oid': '52b3a669558c2b3f0a000001',
  'id': 10,
  'order': null,
  'formatVersion': 2,
  'user_role': {
    '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
  },
  'user_perms': {
    '1c474c1abb4403fb6c27eefeb3c775aa': [
      'view',
      'edit',
      'add',
      'delete'
    ]
  },
  'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
  'privacy_mode': 'private',
  'hidden': false,
  'link_in': [
    {
      'path': ',learnplan-for-colearnrs,node-js,topic-123,topic-126,'
    }
  ],
  'link_out': null,
  'ideas': {
    '20': {
      'title': 'Selenium',
      'oid': '52b3a669558c2b3f0a000002',
      'id': 20,
      'order': 1,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'link_in': null,
      'link_out': null,
      'ideas': {
        '30': {
          'title': 'Books',
          'oid': '52bb2406c47e07216a000064',
          'id': 30,
          'order': 1,
          'formatVersion': 2,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa ': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'hidden': false,
          'link_in': null,
          'link_out': null,
          'ideas': {}
        }
      }
    },
    '40': {
      'title': 'Mongo DB',
      'oid': '52b3a669558c2b3f0a000003',
      'id': 40,
      'order': 2,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'link_in': null,
      'link_out': null,
      'ideas': {
        '50': {
          'title': 'Ops support',
          'oid': '5432977e58d3f6166f000002',
          'id': 50,
          'order': 1,
          'formatVersion': 2,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'hidden': false,
          'link_in': null,
          'link_out': null,
          'ideas': {}
        }
      }
    },
    '60': {
      'title': 'Linux',
      'oid': '52b3a66a558c2b3f0a000004',
      'id': 60,
      'order': 3,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'link_in': null,
      'link_out': null,
      'ideas': {}
    },
    '70': {
      'title': 'Node.js',
      'oid': '52bb25afc47e07216a00006f',
      'id': 70,
      'order': 4,
      'formatVersion': 2,
      'user_role': {
        '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
      },
      'user_perms': {
        '1c474c1abb4403fb6c27eefeb3c775aa': [
          'view',
          'edit',
          'add',
          'delete'
        ]
      },
      'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
      'privacy_mode': 'private',
      'hidden': false,
      'link_in': null,
      'link_out': null,
      'ideas': {
        '80': {
          'title': 'Topic 123',
          'oid': '5433e305297f4b7719000002',
          'id': 80,
          'order': 1,
          'formatVersion': 2,
          'user_role': {
            '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
          },
          'user_perms': {
            '1c474c1abb4403fb6c27eefeb3c775aa': [
              'view',
              'edit',
              'add',
              'delete'
            ]
          },
          'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
          'privacy_mode': 'private',
          'hidden': false,
          'link_in': null,
          'link_out': null,
          'ideas': {
            '90': {
              'title': 'Topic 124',
              'oid': '5433e4a128af4b941f000001',
              'id': 90,
              'order': 1,
              'formatVersion': 2,
              'user_role': {
                '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
              },
              'user_perms': {
                '1c474c1abb4403fb6c27eefeb3c775aa': [
                  'view',
                  'edit',
                  'add',
                  'delete'
                ]
              },
              'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
              'privacy_mode': 'private',
              'hidden': false,
              'link_in': null,
              'link_out': null,
              'ideas': {
                '100': {
                  'title': 'Topic 125',
                  'oid': '5433e56637cce0c820000001',
                  'id': 100,
                  'order': 1,
                  'formatVersion': 2,
                  'user_role': {
                    '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
                  },
                  'user_perms': {
                    '1c474c1abb4403fb6c27eefeb3c775aa': [
                      'view',
                      'edit',
                      'add',
                      'delete'
                    ]
                  },
                  'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
                  'privacy_mode': 'private',
                  'hidden': false,
                  'link_in': null,
                  'link_out': null,
                  'ideas': {}
                }
              }
            },
            '110': {
              'title': 'Topic 126',
              'oid': '5433e64005b1329021000001',
              'id': 110,
              'order': 2,
              'formatVersion': 2,
              'user_role': {
                '1c474c1abb4403fb6c27eefeb3c775aa': 'admin-'
              },
              'user_perms': {
                '1c474c1abb4403fb6c27eefeb3c775aa': [
                  'view',
                  'edit',
                  'add',
                  'delete'
                ]
              },
              'added_by': '1c474c1abb4403fb6c27eefeb3c775aa',
              'privacy_mode': 'private',
              'hidden': false,
              'link_in': null,
              'link_out': null,
              'ideas': {}
            }
          }
        }
      }
    }
  },
  'links': [
    {
      'ideaIdFrom': 110,
      'ideaIdTo': 10
    }
  ]
}

vows.describe('topicMapUtil').addBatch({
  'When using the topicMapUtil module': {
    'to convert simple json': {
      topic: topicMapUtil.convertToList(categoryMapSimple, null),
      'should return expected list': function (topic) {
        assert.deepEqual(topic, expectedListSimple)
      }
    },

    'to convert mixed json': {
      topic: topicMapUtil.convertToList(categoryMapMixed, null),
      'should return expected list': function (topic) {
        assert.deepEqual(topic, expectedListMixed)
      }
    },

    'to convert simple with links json': {
      topic: topicMapUtil.convertToList(categoryMapSimpleWLinks, null),
      'should return expected list': function (topic) {
        assert.deepEqual(topic, expectedListSimpleWLinks)
      }
    },

    'to convert mixed with links json': {
      topic: topicMapUtil.convertToList(categoryMapMixedWLinks, null),
      'should return expected list': function (topic) {
        assert.deepEqual(topic, expectedListMixedWLinks)
      }
    },

    'to convert complex with links json': {
      topic: topicMapUtil.convertToList(categoryMapComplex, null),
      'should return expected list': function (topic) {
        assert.notDeepEqual(topic, expectedListComplex)
      }
    }
  }
}).addBatch({
  'When converting list to map functionality': {
    'to convert a typical one': {
      topic: topicMapUtil.convertToMap(categoryMapDBComplex),
      'should return expected json': function (topic) {
        assert.deepEqual(topic, expectedMapDBComplex)
      }
    }
  }
}).export(module)
