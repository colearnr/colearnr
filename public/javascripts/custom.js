(function() {
  var
    fullScreenApi = {
      supportsFullScreen: false,
      isFullScreen: function() {
        return false;
      },
      requestFullScreen: function() {
      },
      cancelFullScreen: function() {
      },
      fullScreenEventName: '',
      prefix: ''
    },
    browserPrefixes = 'webkit moz o ms khtml'.split(' ');

  // check for native support
  if (typeof document.cancelFullScreen != 'undefined') {
    fullScreenApi.supportsFullScreen = true;
  }
  else {
    // check for fullscreen support by vendor prefix
    for (var i = 0, il = browserPrefixes.length; i < il; i++) {
      fullScreenApi.prefix = browserPrefixes[i];

      if (typeof document[fullScreenApi.prefix + 'CancelFullScreen'] != 'undefined') {
        fullScreenApi.supportsFullScreen = true;

        break;
      }
    }
  }

  // update methods to do something useful
  if (fullScreenApi.supportsFullScreen) {
    fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';

    fullScreenApi.isFullScreen = function() {
      switch (this.prefix) {
        case '':
          return document.fullScreen;
        case 'webkit':
          return document.webkitIsFullScreen;
        default:
          return document[this.prefix + 'FullScreen'];
      }
    }
    fullScreenApi.requestFullScreen = function(el) {
      return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
    }
    fullScreenApi.cancelFullScreen = function(el) {
      return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
    }
  }

  // jQuery plugin
  if (typeof jQuery != 'undefined') {
    jQuery.fn.requestFullScreen = function() {

      return this.each(function() {
        if (fullScreenApi.supportsFullScreen) {
          fullScreenApi.requestFullScreen(this);
        }
      });
    };
  }

  // export api
  window.fullScreenApi = fullScreenApi;
})();

function clearSelection() {
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    }
    else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  }
  else if (document.selection) {  // IE?
    document.selection.empty();
  }
}

function cancel(e) {
  if (e.preventDefault) e.preventDefault(); // required by FF + Safari
  e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
  return false; // required by IE
}

function isTouch() {
  return 'ontouchstart' in document.documentElement;
}

function isUrl(urls) {
  var regexp = /(https?:\/\/|www\.)[\w-]+(\.[\w-]+)?([\w.,!@?^=%&amp;:\/~+#-]*[\w!@?^=%&amp;\/~+#-])?/i;
  var rtmpregexp = /(rtmp:\/\/|www\.)[\w-]+(\.[\w-]+)?([\w.,!@?^=%&amp;:\/~+#-]*[\w!@?^=%&amp;\/~+#-])?/i;
  return urls && urls.indexOf('iframe') == -1 && (regexp.test(urls) || rtmpregexp.test(urls) );
}

function entities(s) {
  var e = {
    '"': '"',
    '&': '&',
    '<': '<',
    '>': '>'
  };
  return s.replace(/["&<>]/g, function(m) {
    return e[m];
  });
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn, scope) {
    for (var i = 0, len = this.length; i < len; ++i) {
      fn.call(scope, this[i], i, this);
    }
  }
}

function queryObj() {
  var result = {}, keyValuePairs = location.search.slice(1).split('&');

  keyValuePairs.forEach(function(keyValuePair) {
    keyValuePair = keyValuePair.split('=');
    result[keyValuePair[0]] = keyValuePair[1] || '';
  });

  return result;
}

var addEvent = (function() {
  if (document.addEventListener) {
    return function(el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false);
      }
      else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  }
  else {
    return function(el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function() {
          return fn.call(el, window.event);
        });
      }
      else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  }
})();

function renderHTML(text) {
  if (text.indexOf("<a") != -1) {
    return text;
  }

  var rawText = strip(text);
  var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

  return rawText.replace(urlRegex, function(url) {

    if ((url.indexOf(".jpg") > 0) || (url.indexOf(".png") > 0) || (url.indexOf(".gif") > 0)) {
      return '<img src="' + url + '">' + '<br/>'
    }
    else {
      return '<a href="' + url + '">' + url + '</a>'
    }
  })
}

function strip(html) {
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return tmp.innerHTML.replace(urlRegex, function(url) {
    return '\n' + url
  })
}

function vimeoLoadingThumb(id) {
  var url = "https://vimeo.com/api/v2/video/" + id + ".json?callback=showThumb";

  var id_img = "#vimeo-" + id;

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;

  $(id_img).before(script);
}

function guidGenerator() {
  var S4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function showThumb(data) {
  var id_img = "#vimeo-" + data[0].id;
  $(id_img).attr('src', data[0].thumbnail_medium);
}

/* -------------------- Placeholder for IE --------------------- */

jQuery(document).ready(function($) {
  $('input, textarea').placeholder();
  var html;
});

/* ------------------- Client Carousel --------------------- */

/* ------------------ Back To Top ------------------- */
jQuery(document).ready(function($) {

  jQuery('#under-footer-back-to-top a').click(function() {
    jQuery('html, body').animate({
      scrollTop: 0
    }, 300);
    return false;
  });

});

/* ------------------ Tooltips ----------------- */

jQuery(document).ready(function($) {

  $('.tooltips').tooltip({
    selector: "a[rel=tooltip]"
  })

});

/* -------------------- Isotope --------------------- */

jQuery(document).ready(function() {

  //$('.topic_lbits').imagesLoaded(function() {

  var $container = $('.topic_lbits');
  $select = $('#filters select');

  // initialize Isotope
  $container.isotope({
    // options...
    resizable: false, // disable normal resizing
    // set columnWidth to a percentage of container width
    layoutMode: 'fitRows',
    getSortData: {
      order: function(itemElem) {
        var $elem = $(itemElem);
        if ($elem.hasClass('item')) {
          if ($elem.find('.lbit-order').text() != '') {
            return parseInt($elem.find('.lbit-order').text(), 10);
          }
          else {
            return 1000000;
          }
        }
        else {
          return -1;
        }
      }
    },
    sortBy: 'order',
  });

  $container.isotope('bindResize');
  
  if ($('.topic_lbits')) {
    $('.topic_lbits').imagesLoaded(function() {
      var $container = $('.topic_lbits');
      $container.isotope();
    });
  }
});

function detectBrowser(userAgent, language) {
  var version, webkitVersion, iOSAgent, iOSDevice, iOSMajorVersion, iOSMinorVersion, browser = {};
  userAgent = (userAgent || navigator.userAgent).toLowerCase();
  language = language || navigator.language || navigator.browserLanguage;
  version = browser.version = (userAgent.match(/.*(?:rv|chrome|webkit|opera|ie)[\/: ](.+?)([ \);]|$)/) || [])[1];
  webkitVersion = (userAgent.match(/webkit\/(.+?) /) || [])[1];
  iOSAgent = (userAgent.match(/\b(iPad|iPhone|iPod)\b.*\bOS (\d)_(\d)/i) || []);
  iOSDevice = iOSAgent[1];
  iOSMajorVersion = iOSAgent[2];
  iOSMinorVersion = iOSAgent[3];
  browser.windows = browser.isWindows = !!/windows/.test(userAgent);
  browser.mac = browser.isMac = !!/macintosh/.test(userAgent) || (/mac os x/.test(userAgent) && !/like mac os x/.test(userAgent));
  browser.lion = browser.isLion = !!(/mac os x 10[_\.][7-9]/.test(userAgent) && !/like mac os x 10[_\.][7-9]/.test(userAgent));
  browser.iPhone = browser.isiPhone = !!/iphone/.test(userAgent);
  browser.iPod = browser.isiPod = !!/ipod/.test(userAgent);
  browser.iPad = browser.isiPad = !!/ipad/.test(userAgent);
  browser.iOS = browser.isiOS = browser.iPhone || browser.iPod || browser.iPad;
  browser.iOSMajorVersion = browser.iOS ? iOSMajorVersion * 1 : undefined;
  browser.iOSMinorVersion = browser.iOS ? iOSMinorVersion * 1 : undefined;
  browser.android = browser.isAndroid = !!/android/.test(userAgent);
  browser.silk = browser.isSilk = !!/silk/.test(userAgent);
  browser.opera = /opera/.test(userAgent) ? version : 0;
  browser.isOpera = !!browser.opera;
  browser.msie = /msie \d+\.\d+|trident\/\d+\.\d.+; rv:\d+\.\d+[;\)]/.test(userAgent) && !browser.opera ? version : 0;
  browser.isIE = !!browser.msie;
  browser.isIE8OrLower = !!(browser.msie && parseInt(browser.msie, 10) <= 8);
  browser.isIE9OrLower = !!(browser.msie && parseInt(browser.msie, 10) <= 9);
  browser.isIE10OrLower = !!(browser.msie && parseInt(browser.msie, 10) <= 10);
  browser.isIE10 = !!(browser.msie && parseInt(browser.msie, 10) === 10);
  browser.isIE11 = !!(browser.msie && parseInt(browser.msie, 10) === 11);
  browser.mozilla = /mozilla/.test(userAgent) && !/(compatible|webkit|msie|trident)/.test(userAgent) ? version : 0;
  browser.isMozilla = !!browser.mozilla;
  browser.webkit = /webkit/.test(userAgent) ? webkitVersion : 0;
  browser.isWebkit = !!browser.webkit;
  browser.chrome = /chrome/.test(userAgent) ? version : 0;
  browser.isChrome = !!browser.chrome;
  browser.mobileSafari = /apple.*mobile/.test(userAgent) && browser.iOS ? webkitVersion : 0;
  browser.isMobileSafari = !!browser.mobileSafari;
  browser.iPadSafari = browser.iPad && browser.isMobileSafari ? webkitVersion : 0;
  browser.isiPadSafari = !!browser.iPadSafari;
  browser.iPhoneSafari = browser.iPhone && browser.isMobileSafari ? webkitVersion : 0;
  browser.isiPhoneSafari = !!browser.iphoneSafari;
  browser.iPodSafari = browser.iPod && browser.isMobileSafari ? webkitVersion : 0;
  browser.isiPodSafari = !!browser.iPodSafari;
  browser.isiOSHomeScreen = browser.isMobileSafari && !/apple.*mobile.*safari/.test(userAgent);
  browser.safari = browser.webkit && !browser.chrome && !browser.iOS && !browser.android ? webkitVersion : 0;
  browser.isSafari = !!browser.safari;
  browser.language = language.split("-", 1)[0];
  browser.current = browser.msie ? "msie" : browser.mozilla ? "mozilla" : browser.chrome ? "chrome" : browser.safari ? "safari" : browser.opera ? "opera" : browser.mobileSafari ? "mobile-safari" : browser.android ? "android" : "unknown";
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    browser.fileApiPresent = true;
  } else {
    browser.fileApiPresent = false;
  }
  return browser
}

function clearHashtag() {
  if (location.href.indexOf('#lbit') !== -1) location.hash = "";
}

function navigateToNode(id) {
  var node = $("#" + id).parent();
  if (node && node.offset()) {
    $('html, body').animate({scrollTop: node.offset().top - 160});
  }
}
