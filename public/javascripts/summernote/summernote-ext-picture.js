(function ($) {
  // template, editor
  var tmpl = $.summernote.renderer.getTemplate();
  var editor = $.summernote.eventHandler.getEditor();

  // core functions: range, dom
  //var range = $.summernote.core.range;
  //var dom = $.summernote.core.dom;

  /**
   * Show video dialog and set event handlers on dialog controls.
   *
   * @return {Promise}
   */
  var showPictureDialog = function () {
    // Summernote options
    var options = {};
    if ($.summernote.allOptions && $.summernote.allOptions.plugins && $.summernote.allOptions.plugins.image) {
      options = $.summernote.allOptions.plugins.image;
    }
    return $.Deferred(function (deferred) {
      var UPLOAD_SERVER_PREFIX = options.uploadServerPrefix,
        STORAGE_PATH = options.storagePath;
      if (typeof window.filepicker === undefined) {
        deferred.reject();
      } else {
        window.filepicker.pickAndStore({
          extensions: ['.jpg', '.png', '.gif', '.jpeg'],
          container: 'modal',
          services: ['COMPUTER', 'URL', 'IMAGE_SEARCH', 'WEBCAM'],
          openTo: 'COMPUTER',
          multiple: 'false'
        }, {
          location: 'S3',
          path: STORAGE_PATH,
          access: 'public'
        }, function (data) {
          if (data && data[0]) {
            var iurl = UPLOAD_SERVER_PREFIX + data[0].key;
            deferred.resolve(iurl);
          } else {
            deferred.reject();
          }
        });
      }
    });
  };

  // add image plugin
  $.summernote.addPlugin({
    name: 'image',
    buttons: {
      /**
       * @param {Object} lang
       * @return {String}
       */
      image: function () {
        return tmpl.iconButton('fa fa-picture-o', {
          event: 'showPictureDialog',
          title: 'Image',
          hide: true
        });
      }
    },

    events: {
      /**
       * @param {Object} layoutInfo
       */
      showPictureDialog: function (layoutInfo) {
        var $editable = layoutInfo.editable();

        // save current range
        editor.saveRange($editable);

        showPictureDialog($editable).then(function (url) {
          // restore range
          editor.restoreRange($editable);
          // insert picture node
          editor.insertImage($editable, url, '');
        }).fail(function () {
          // when cancel button clicked
          editor.restoreRange($editable);
        });
      }
    }
  });
})(jQuery);
