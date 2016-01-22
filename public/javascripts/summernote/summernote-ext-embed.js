(function ($) {
  // template, editor
  var tmpl = $.summernote.renderer.getTemplate();
  var editor = $.summernote.eventHandler.getEditor();

  // core functions: range, dom
  var range = $.summernote.core.range;
  var dom = $.summernote.core.dom;

  /**
   * create embed
   *
   * @type command
   *
   * @param {jQuery} $editable
   * @param {Object} linkInfo
   * @param {Object} options
   */
  var createEmbed = function ($editable, linkInfo, options) {
    var linkUrl = linkInfo.url,
      isEmbed = linkInfo.embedLink,
      rng = linkInfo.range;

    var createSimpleLink = function() {
      // Create a new link when there is no anchor on range.
      var anchor = rng.insertNode(createSimpleLinkNode(linkInfo));
      range.createFromNode(anchor).select();
    };

    rng = rng.deleteContents();

    if (isEmbed && options.onCreateLink) {
      options.onCreateLink(linkUrl, $editable, linkInfo, options);
    } else {
      createSimpleLink();
    }
  };

  /**
   * createIFrameNode
   *
   * @param {String} url
   * @param {String} embedSize
   * @return {Node}
   */
  var createIFrameNode = function (url, embedSize) {
    var $media;
    var width = '980';
    var height = '620';
    if (embedSize.toLowerCase() == 'small') {
      width = '500';
      height = '420';
    } else if (embedSize.toLowerCase() == 'medium') {
      width = '740';
      height = '520';
    }
    $media = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen class="flex-embed">')
      .attr('src', url)
      .attr('width', width).attr('height', height)
      .attr('frameborder', 0);
    return $media[0];
  };

  /**
   * createSimpleLinkNode
   *
   * @param {Object} linkInfo
   * @param {String} url
   * @return {Node}
   */
  var createSimpleLinkNode = function (linkInfo) {
    var linkUrl = linkInfo.url,
      linkText = linkInfo.text,
      isNewWindow = linkInfo.newWindow,
      isEmbed = linkInfo.embedLink;
    var anchor = $('<A>' + linkText + '</A>');
    $(anchor).attr({
      href: linkUrl,
      target: isNewWindow ? '_blank' : '',
      'data-embed': isEmbed ? 'true' : 'false'
    });
    return anchor[0];
  };

  /**
   * toggle button status
   *
   * @param {jQuery} $btn
   * @param {Boolean} isEnable
   */
  var toggleBtn = function ($btn, isEnable) {
    $btn.toggleClass('disabled', !isEnable);
    $btn.attr('disabled', !isEnable);
  };

  /**
   * returns link info
   *
   * @return {Object}
   */
  var getLinkInfo = function ($editable) {
    $editable.focus();

    var rng = range.create().expand(dom.isAnchor);

    // Get the first anchor on range(for edit).
    var $anchor = $(rng.nodes(dom.isAnchor)[0]);

    return {
      range: rng,
      text: rng.toString(),
      isNewWindow: $anchor.length ? $anchor.attr('target') === '_blank' : true,
      url: $anchor.length ? $anchor.attr('href') : '',
      isEmbed: $anchor.length ? $anchor.attr('data-embed') === 'true' : true
    };
  };

  /**
   * Show link dialog and set event handlers on dialog controls.
   *
   * @param {jQuery} $dialog
   * @param {Object} linkInfo
   * @return {Promise}
   */
  var showEmbedDialog = function ($editable, $dialog, linkInfo) {
    return $.Deferred(function (deferred) {
      var $linkDialog = $dialog.find('.note-embed-dialog'),
        $linkText = $linkDialog.find('.note-embed-text'),
        $linkUrl = $linkDialog.find('.note-embed-url'),
        $linkBtn = $linkDialog.find('.note-embed-btn'),
        $openInNewWindow = $linkDialog.find('#openInNewWindow'),
        $embedLink = $linkDialog.find('#embedLink');

      $linkDialog.one('shown.bs.modal', function () {
        $linkText.val(linkInfo.text);

        $linkText.on('input', function () {
          // if linktext was modified by keyup,
          // stop cloning text from linkUrl
          linkInfo.text = $linkText.val();
        });

        // if no url was given, copy text to url
        if (!linkInfo.url) {
          linkInfo.url = linkInfo.text;
          toggleBtn($linkBtn, linkInfo.text);
        }

        $linkUrl.on('input', function () {
          toggleBtn($linkBtn, $linkUrl.val());
          // display same link on `Text to display` input
          // when create a new link
          if (!linkInfo.text) {
            $linkText.val($linkUrl.val());
          }
        }).val(linkInfo.url).trigger('focus').trigger('select');

        $openInNewWindow.prop('checked', linkInfo.newWindow);
        $embedLink.prop('checked', linkInfo.embedLink);

        $linkBtn.one('click', function (event) {
          event.preventDefault();

          deferred.resolve({
            range: linkInfo.range,
            url: $linkUrl.val(),
            text: $linkText.val(),
            newWindow: $openInNewWindow.is(':checked'),
            embedLink: $embedLink.is(':checked')
          });
          $linkDialog.modal('hide');
        });
      }).one('hidden.bs.modal', function () {
        // detach events
        $linkText.off('input');
        $linkUrl.off('input');
        $linkBtn.off('click');

        if (deferred.state() === 'pending') {
          deferred.reject();
        }
      }).modal('show');
    }).promise();
  };

  // add embed plugin
  $.summernote.addPlugin({
    name: 'embed',
    buttons: {
      /**
       * @return {String}
       */
      embed: function () {
        return tmpl.iconButton('fa fa-link', {
          event: 'showEmbedDialog',
          title: 'Link',
          hide: true
        });
      }
    },

    dialogs: {
      embed: function (lang, options) {
        var body = '<div class="form-group row">' +
                     '<label>' + lang.link.textToDisplay + '</label>' +
                     '<input class="note-embed-text form-control span12" type="text" />' +
                   '</div>' +
                   '<div class="form-group row">' +
                     '<label>' + lang.link.url + '</label>' +
                     '<input class="note-embed-url form-control span12" type="text" />' +
                   '</div>' +
                   (!options.disableLinkTarget ?
                     '<div class="checkbox">' +
                       '<label>' + '<input name="openInNewWindow" id="openInNewWindow" type="checkbox" checked> ' +
                         lang.link.openInNewWindow +
                       '</label>' +
                     '</div>' : ''
                   ) +
                   (!options.disableLinkEmbed ?
                     '<div class="checkbox">' +
                       '<label>' + '<input name="embedLink" id="embedLink" type="checkbox" checked> ' +
                         'Embed this link' +
                       '</label>' +
                     '</div>' : ''
                   );
        var footer = '<button href="#" class="btn btn-primary note-embed-btn disabled" disabled>' + lang.link.insert + '</button>';
        return tmpl.dialog('note-embed-dialog', lang.link.insert, body, footer);
      }
    },

    events: {
      /**
       * @param {Object} layoutInfo
       */
      showEmbedDialog: function (layoutInfo) {
        var $editor = layoutInfo.editor(),
            $dialog = layoutInfo.dialog(),
            $editable = layoutInfo.editable(),
            linkInfo = getLinkInfo($editable);
        var options = $editor.data('options');

        editor.saveRange($editable);
        showEmbedDialog($editable, $dialog, linkInfo).then(function (linkInfo) {
          editor.restoreRange($editable);
          createEmbed($editable, linkInfo, options);
        }).fail(function () {
          editor.restoreRange($editable);
        });
      },

      createIFrameNode: function(layoutInfo, url, embedSize) {
        var $editable = layoutInfo.editable();
        editor.restoreRange($editable);
        var node = createIFrameNode(url, embedSize);
        editor.insertNode($editable, node);
        return node;
      },

      createSimpleLinkNode: function(layoutInfo, url, linkInfo) {
        var $editable = layoutInfo.editable();
        editor.restoreRange($editable);
        var node = createSimpleLinkNode(linkInfo);
        editor.insertNode($editable, node);
        return node;
      }
    }
  });
})(jQuery);
