// Based on https://github.com/dominicbarnes/node-constants/blob/master/lib/index.js

/**
 * Binds a new 'constant' property to an input object
 *
 * @param {object} object
 * @param {string} name
 * @param {mixed}  value
 *
 * @return {object}  The input object
 */
var config = require('../lib/config').config,
  define = function define(name, value) {
    Object.defineProperty(exports, name, {
      value: config[name] || value,
      enumerable: true
    });
  };

module.exports.define = define;

// PAGES
define('INDEX_PAGE', 'login.ejs');
define('AUTH_PAGE', '/auth');
define('DEFAULT_HOME_PAGE', '/user/topic');
define('LOGIN_PAGE', '/login');
define('LOGOUT_PAGE', '/logout');
define('PROFILE_PAGE', '/profile/edit');
define('MY_TOPICS_PAGE', '/user/topic');
define('TOPIC_NEW_PAGE', '/topic/new');
define('LBIT_NEW_PAGE', '/lbit/new');
define('POLL_NEW_PAGE', '/poll/new');
define('LBIT_EDIT_PAGE', '/lbit/edit');
define('TOPIC_EDIT_PAGE', '/topic/edit');
define('REGISTER_PAGE', '/register');
define('COMPLETE_PAGE', '/complete');
define('CONTACT_PAGE', '/contact');
define('USER_VERIFY', '/user/verify');
define('HELP_PAGE_ID', 'help');
define('LBIT_EMBED_PAGE', '/lbit/embed');

// ROLES
define('COLEARNR_ROLE', 'colearnr');
define('COLEARNR_USER', 'colearnr');
define('PROLEARNR_ROLE', 'prolearnr');
define('ADMIN_ROLE', 'admin');
define('TOPIC_COLEARNR_ROLE', 'colearnr-');
define('TOPIC_EXPERT_ROLE', 'expert-');
define('TOPIC_COLLAB_ROLE', 'collab-');
define('TOPIC_ADMIN_ROLE', 'admin-');
define('ALL_TOPIC_ADMIN_ROLE', 'all-topic-admin');
define('DEMO_USER', {_id: 'demo-user', displayName: 'guest', emails: [], guestMode: true});

// PERMS
define('VIEW_PERMS', 'view');
define('ADD_PERMS', 'add');
define('EDIT_PERMS', 'edit');
define('DELETE_PERMS', 'delete');

// OTHERS
define('PUBLIC', 'public');
define('PRIVATE', 'private');
define('SAFE_URL_LIST', ['/help', '/api/lbit/search', '/api/topic/search']);

// PROFILE IMAGES
define('DEFAULT_PROFILE_IMAGE', 'https://d3k9jv14qr36q1.cloudfront.net/images/profile-icon.png');

// EMAILS
define('FROM_ADDRESS', 'hello@colearnr.com');
define('FROM_NAME', 'Team CoLearnr');

define('COLEARNR_COM', 'colearnr.com');

define('LEARN_TOPICS_COUNT', 10);
define('POLL_CHOICES_COUNT', 3);
define('SALT_WORK_FACTOR', 10);
define('DEFAULT_CHAPTERS_COUNT', 5);
define('AUTO_COMPLETE_COUNT', 5);
define('DEFAULT_SEARCH_PAGE_SIZE', 12);
define('SUGGEST_COUNT', 4);

define('PLATFORM_PLAN', 'PLATFORM_PLAN');
define('INVALID_ACCESS_CODE', 'INVALID_ACCESS_CODE');
define('MAX_USERS_REACHED', 'MAX_USERS_REACHED');
define('MAX_TOPICS_REACHED', 'MAX_TOPICS_REACHED');
define('MAX_LEARNBITS_REACHED', 'MAX_LEARNBITS_REACHED');
define('APP_PREFIX', '/app');

define('CL_PROTOCOL', 'cl://');

define('MAX_DOWNLOAD_SIZE', 250000000);

define('CLOUD_SERVERS', ['stream.colearnr.com', 'contrib.colearnr.com', config.upload_server_prefix]);
define('STREAM_SERVERS', ['stream.colearnr.com']);

define('ALLOWED_EMBED_DOMAINS', ['colearnr.com', 'drive.google.com', 'view.officeapps.live.com']);

// STRINGS
define('LIKED', 'Liked');
define('DISCUSSED', 'Discussed');
define('MENTIONED', 'Mentioned');
