var config = {
  use_intercom: false,
  use_client_host: false,
  use_ga: false,
  topic_guest_access_allowed: false,
  enable_search_robots: false,
  intercom_key: null,
  sendgrid_user: '',
  sendgrid_key: '',
  upload_server_prefix: null,
  fb_app_id: '',
  pdf_viewer_key: '',
  cf_public_key_id: '',
  cf_private_key: '',
  cf_backup_public_key_id: '',
  cf_backup_private_key: '',
  allowed_domains: null,
  default_password: 'cl.nr123',
  default_cover_arts: "'/images/cover/cover-art1.jpg', '/images/cover/cover-art2.jpg', '/images/cover/cover-art3.jpg', '/images/cover/cover-art4.jpg'",
  accept_ext: "'pdf', 'doc', 'docx', 'ppt', 'pptx', 'mov', 'mp4', 'm4v', 'webm', 'jpg', 'jpeg', 'png', 'gif', 'htm', 'html', 'flv', 'mp3', 'zip', 'rar', '7z', 'tar', 'gz', 'jar', 'rtf', 'odf', 'odt', 'csv', 'mdb', 'vsd', 'cad', 'drw', 'dwg', 'graffle', 'xls', 'xlsx', 'svg'",
  video_accept_ext: "'mov', 'mp4', 'm4v', 'webm', 'flv'",
  platform_plan: "unlimited",
  use_cluster: false,
  chat_enabled: false,
  chat_server_host: '',
  chat_server_port: 5222,
  chat_bosh_server: '',
  chat_domain: '',
  internal_ip: ['127.0.0.1/32'],
  route_chat_auth: false,
  force_all_video_optimisation: false,
  mongo_username: process.env.MONGO_USERNAME || null,
  mongo_password: process.env.MONGO_PASSWORD || null,
  learnbit_upload_url: '/lbit/upload',
  learnbit_add_url: '/lbit/add',
  upload_base_dir: process.env.CL_UPLOAD_DIR || '/cl/uploads/',
  cl_log_dir: process.env.CL_LOG_DIR || '/tmp/',
  cl_cache_dir: process.env.CL_LOG_DIR || '/tmp/',
  cl_scripts_dir: process.env.CL_SCRIPTS_DIR || '/cl/scripts',
  cl_conf_dir: process.env.CL_CONF_DIR || '/cl/conf'
};

var _ = require('lodash');
var dev_ip_map = {};
var INSTALL_HOST = null;
var os = require('os');
var ifaces = os.networkInterfaces();
for (var dev in ifaces) {
  var alias = 0;
  ifaces[dev].forEach(function(details) {
    if (!details.internal && details.family == 'IPv4') {
      dev_ip_map[dev + (alias ? ':' + alias : '')] = details.address;
      if (!INSTALL_HOST) {
        INSTALL_HOST = details.address;
      }
      ++alias;
    }
  });
}

if (!INSTALL_HOST) {
  INSTALL_HOST = "127.0.0.1";
}

function configure(INSTALL_HOST) {
  var envConfig = process.env.ENV_CONFIG || 'dev';
  switch (envConfig) {
    case 'dev':
    default:
      _.merge(config, {
        "secret": "colearnr-webapp-secret-CHANGEMEFOLKS",
        "base_url": "http://localhost",
        "port": 8080,
        "cookieDomain": "localhost",
        "use_port": true,
        "upload_path": "/public/uploads/",
        "redis": {
          "host": "127.0.0.1",
          "port": 6379,
          "password": "",
          "database": "0"
        },
        "mongo": {
          "host": "127.0.0.1:27017",
          "database": "colearnr"
        },
        "es": [{
          "host": "127.0.0.1",
          "port": 9200,
        }],
        "socket": {
          "address": "http://localhost",
          "port": 4567
        },
        "api_url": "http://localhost:4567/api/",
        "cdn_prefix": "",
        "cdn_contrib_prefix": "dev",
        "socket_server": "http://localhost:4567",
        "local_socket_server": "http://localhost:4567",
        "use_intercom": false,
        "use_ga": false,
        "topic_guest_access_allowed": true,
        "use_cluster": false,
        "chat_enabled": false,
        "chat_domain": '',
        "internal_ip": ['127.0.0.1/32'],
        "route_chat_auth": false
      });
      break;
  }

  return config;
}

exports.configure = configure;
configure(INSTALL_HOST);
exports.config = config;
