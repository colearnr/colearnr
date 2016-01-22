(function ($) {
  // template, editor
  var tmpl = $.summernote.renderer.getTemplate();
  var editor = $.summernote.eventHandler.getEditor();

  // core functions: range, dom
  //var range = $.summernote.core.range;
  //var dom = $.summernote.core.dom;

  /**
   * createVideoNode
   *
   * @param {String} url
   * @param {String} embedSize
   * @return {Node}
   */
  var createVideoNode = function (url, embedSize) {
    var width = '680',
      height = '520';
    if (embedSize.toLowerCase() === 'small') {
      width = '400';
      height = '280';
    } else if (embedSize.toLowerCase() === 'medium') {
      width = '520';
      height = '400';
    } else if (embedSize.toLowerCase() === 'full') {
      width = '840';
      height = '680';
    }
    var $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen class="flex-video">')
      .attr('src', url)
      .attr('width', width).attr('height', height)
      .attr('frameborder', 0);
    return $video[0];
  };

  /**
   * Show video dialog and set event handlers on dialog controls.
   *
   * @return {Promise}
   */
  var showVideoDialog = function () {
    // Summernote options
    var options = {};
    if ($.summernote.allOptions && $.summernote.allOptions.plugins && $.summernote.allOptions.plugins.video) {
      options = $.summernote.allOptions.plugins.video;
    }
    return $.Deferred(function (deferred) {
      var UPLOAD_SERVER_PREFIX = options.uploadServerPrefix,
        STORAGE_PATH = options.storagePath,
        URL_PREFIX = options.urlPrefix,
        EMBED_SIZE = options.embedSize;
      if (typeof window.filepicker === undefined) {
        deferred.reject();
      } else {
        window.filepicker.pickAndStore({
          extensions: ['mov', 'mp4', 'm4v', 'webm', 'flv'],
          container: 'modal',
          services: ['COMPUTER', 'VIDEO'],
          openTo: 'VIDEO',
          multiple: 'false'
        }, {
          location: 'S3',
          path: STORAGE_PATH,
          access: 'public'
        }, function (data) {
          if (data && data[0]) {
            var iurl = URL_PREFIX + '&url=' + encodeURIComponent(UPLOAD_SERVER_PREFIX + data[0].key) + '&embedSize=' + EMBED_SIZE;
            deferred.resolve(iurl, EMBED_SIZE);
          } else {
            deferred.reject();
          }
        });
      }
    });
  };

  // add video plugin
  $.summernote.addPlugin({
    name: 'video',
    buttons: {
      /**
       * @param {Object} lang
       * @return {String}
       */
      video: function () {
        return tmpl.iconButton('fa fa-youtube-play', {
          event: 'showVideoDialog',
          title: 'Video',
          hide: true
        });
      }
    },

    events: {
      /**
       * @param {Object} layoutInfo
       */
      showVideoDialog: function (layoutInfo) {
        var $editable = layoutInfo.editable();

        // save current range
        editor.saveRange($editable);

        showVideoDialog($editable).then(function (url, embedSize) {
          // restore range
          editor.restoreRange($editable);

          // insert video node
          editor.insertNode($editable, createVideoNode(url, embedSize));
        }).fail(function () {
          // when cancel button clicked
          editor.restoreRange($editable);
        });
      },

      createVideoNode: function(layoutInfo, url, embedSize) {
        var $editable = layoutInfo.editable();
        editor.restoreRange($editable);
        var node = createVideoNode(url, embedSize);
        editor.insertNode($editable, node);
        return node;
      }
    }
  });
})(jQuery);
