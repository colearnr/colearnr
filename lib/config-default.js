const config = {
  // Server url and port config
  base_url: 'http://localhost',
  host: '0.0.0.0',
  port: 8080,
  cookieDomain: 'localhost',
  use_port: true,

  // CORS url to lockdown the installation. Default *
  corsUrl: '*',

  // This needs changing. Use the same secret for discuss as well.
  secret: 'colearnr-webapp-secret-CHANGEMEFOLKS',

  // Theme
  theme: 'colearnr-theme-default',
  themes_dir: 'themes',

  // Database settings
  mongo: {
    host: process.env.MONGO_HOST || '127.0.0.1:27017',
    database: 'colearnr'
  },
  mongo_username: process.env.MONGO_USERNAME || null,
  mongo_password: process.env.MONGO_PASSWORD || null,
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: 6379,
    password: process.env.REDIS_PASSWORD || '',
    database: process.env.REDIS_DB || '0'
  },
  es: [{
    host: process.env.ES_HOST || '127.0.0.1',
    port: 9200
  }],

  // Connections to discuss app
  socket: {
    address: 'http://localhost',
    port: 4567
  },
  api_url: 'http://localhost:4567/api/',
  socket_server: 'http://localhost:4567',
  local_socket_server: 'http://localhost:4567',

  // Various directories
  cdn_prefix: '',
  cdn_contrib_prefix: 'dev',
  upload_base_dir: process.env.CL_UPLOAD_DIR || '/cl/uploads/',
  cl_log_dir: process.env.CL_LOG_DIR || '/tmp/',
  cl_cache_dir: process.env.CL_LOG_DIR || '/tmp/',
  cl_scripts_dir: process.env.CL_SCRIPTS_DIR || '/cl/scripts',
  cl_conf_dir: process.env.CL_CONF_DIR || '/cl/conf',

  // url configs
  upload_path: '/public/uploads/',
  learnbit_upload_url: '/lbit/upload',
  learnbit_add_url: '/lbit/add',

  // Third party integration
  use_intercom: false,
  use_client_host: false,
  use_ga: false,
  enable_search_robots: false,
  intercom_key: null,

  // Sendgrid for emailing purposes
  sendgrid_user: '',
  sendgrid_key: '',

  // Facebook app id
  fb_app_id: '',

  pdf_viewer_key: '',

  // Cloudfront support
  cf_public_key_id: '',
  cf_private_key: '',
  cf_backup_public_key_id: '',
  cf_backup_private_key: '',

  /* Advanced settings */
  // User agent string to use while fetching external pages
  cl_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:40.0) Gecko/20100101 Firefox/40.0',

  // This will enable guest access for public topic pages
  topic_guest_access_allowed: false,
  upload_server_prefix: null,

  // Support for some sass type plans
  platform_plan: 'unlimited',

  // Enable node clustering - EXPERIMENTAL
  use_cluster: false,

  // Download and optimise all videos including youtube
  force_all_video_optimisation: false,

  // List of domains to restrict during registration
  allowed_domains: null,
  default_password: 'cl.nr123',

  // Cover art and file types
  default_cover_arts: "'/images/cover/cover-art1.jpg', '/images/cover/cover-art2.jpg', '/images/cover/cover-art3.jpg', '/images/cover/cover-art4.jpg'",
  accept_ext: "'pdf', 'doc', 'docx', 'ppt', 'pptx', 'mov', 'mp4', 'm4v', 'webm', 'jpg', 'jpeg', 'png', 'gif', 'htm', 'html', 'flv', 'mp3', 'zip', 'rar', '7z', 'tar', 'gz', 'jar', 'rtf', 'odf', 'odt', 'csv', 'mdb', 'vsd', 'cad', 'drw', 'dwg', 'graffle', 'xls', 'xlsx', 'svg'",
  video_accept_ext: "'mov', 'mp4', 'm4v', 'webm', 'flv'",
  extra_art: false,
  custom_font: null,

  // Colour overrides
  color_lbit_highlight: 'rgba(0, 0, 0, 0.5)',
  color_lbit_edit_bg: 'rgba(255, 255, 255, 0.9)',
  color_primary: '#486D98'
}

let INSTALL_HOST = null

/*
var _ = require('lodash')
var dev_ip_map = {}
var os = require('os')
var ifaces = os.networkInterfaces()
for (var dev in ifaces) {
  var alias = 0
  ifaces[dev].forEach(function(details) {
    if (!details.internal && details.family == 'IPv4') {
      dev_ip_map[dev + (alias ? ':' + alias : '')] = details.address
      if (!INSTALL_HOST) {
        INSTALL_HOST = details.address
      }
      ++alias
    }
  })
}
*/

if (!INSTALL_HOST) {
  INSTALL_HOST = '127.0.0.1'
}

function configure (INSTALL_HOST) {
  return config
}

exports.configure = configure
configure(INSTALL_HOST)
exports.config = config
