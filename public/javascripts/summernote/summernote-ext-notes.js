(function ($) {
  // template, editor
  var tmpl = $.summernote.renderer.getTemplate();
  var editor = $.summernote.eventHandler.getEditor();
  var tagsMap = {};
  //var range = $.summernote.core.range;
  //var dom = $.summernote.core.dom;

  var pasteHtmlAtCaret = function(html) {
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // only relatively recently standardized and is not supported in
            // some browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
  }

  // add plugin
  $.summernote.addPlugin({
    name: 'addTag',
    buttons: {
      addTag: function () {
        var tags = [
          {clazz: 'todo', icon: 'square-o', label: 'To Do', continuous: true},
          {clazz: 'done', icon: 'check-square-o', label: 'Done'},
          {clazz: 'important', icon: 'star', label: 'Important'},
          {clazz: 'task', icon: 'tasks', label: 'Task', continuous: true},
          {clazz: 'research', icon: 'search', label: 'Research'},
          {clazz: 'book', icon: 'book', label: 'Learn'},
          {clazz: 'heart', icon: 'heart-o', label: 'Like'},
          {clazz: 'at', icon: 'at', label: 'Mention'},
          {clazz: 'bell', icon: 'bell', label: 'Alert'},
          {clazz: 'bookmark', icon: 'bookmark', label: 'Bookmark'},
          {clazz: 'question', icon: 'question', label: 'Question', continuous: true},
          {clazz: 'bug', icon: 'bug', label: 'Bug', continuous: true},
          {clazz: 'calendar', icon: 'calendar', label: 'Event'},
          {clazz: 'comment', icon: 'comment-o', label: 'Discuss'},
          {clazz: 'dot-circle', icon: 'dot-circle-o', label: 'Dot'},
          {clazz: 'envelope', icon: 'envelope-o', label: 'Mail'},
          {clazz: 'exclamation', icon: 'exclamation-triangle', label: 'Warning'},
          {clazz: 'eye', icon: 'eye', label: 'Watch'},
          {clazz: 'university', icon: 'university', label: 'University'},
          {clazz: 'lock', icon: 'lock', label: 'Secret'},
          {clazz: 'quote', icon: 'quote-left', label: 'Quote'},
          {clazz: 'lightbulb', icon: 'lightbulb-o', label: 'Idea'},
          {clazz: 'brainstorm', icon: 'sitemap', label: 'Brainstorm'},
          {clazz: 'share', icon: 'share-alt', label: 'Share'},
          {clazz: 'trophy', icon: 'trophy', label: 'Trophy'},
          {clazz: 'doubt', icon: 'hand-o-up', label: 'Doubt'},
          {clazz: 'users', icon: 'users', label: 'Friends'},
          {clazz: 'emojiOneChar', icon: 'users', label: 'Emoticon'}

        ];
        /*
        var UL_TAG = '<ul class="list-unstyled col-md-4 col-xs-4 col-sm-4">';
        var list = '';
        list += UL_TAG;
        tags.forEach(function (atag, index) {
          tagsMap[atag.clazz] = atag;
          if (index && index % (Math.round(tags.length / 3)) === 0) {
            list = list + '</ul>' + UL_TAG;
          }
          list = list + '<li class="note_tag ' + atag.clazz + '"><a data-event="addTag" href="#" data-value="';
          list = list + atag.clazz + '"><i class="fa fa-' + atag.icon + '"></i> &nbsp;' + atag.label + '</li>';
        });
        var dropdown = '<ul class="dropdown-menu"><li><div class="row tags_container" style="width: 420px;">' + list + '</ul></div></li></ul>';
        */
        var list = '';
        tags.forEach(function (atag) {
          tagsMap[atag.clazz] = atag;
          list = list + '<li class="note_tag ' + atag.clazz + '"><a data-event="addTag" href="#" data-value="';
          list = list + atag.clazz + '"><i class="fa fa-' + atag.icon + '"></i> &nbsp;' + atag.label + '</li>';
        });
        var dropdown = '<ul class="dropdown-menu columns">' + list + '</ul>';
        return tmpl.iconButton('fa fa-tags', {
          title: 'Insert Tags',
          hide: true,
          dropdown : dropdown
        });
      }

    },

    events: {
      addTag: function (layoutInfo, value) {
        var $editable = layoutInfo.editable();
        editor.saveRange($editable);
        var tag = tagsMap[value],
          tagTpl = '';
        if (tag.continuous) {
          /*
          tagTpl = '<li class="note_tag ' + tag.clazz + '"><i class="fa fa-' +  tag.icon + '"></i> &nbsp;' + tag.label + '</li>';
          var rng = range.create();
          var anchor = null;
          if (rng && rng.sc) {
            anchor = dom.ancestor(rng.sc, dom.isList);
          }
          if (!anchor) {
            console.log('New tag list');
            editor.insertNode($editable, $('<ul class="note_tags">' + tagTpl + '</ul>')[0]);
          } else if ($(anchor).hasClass('note_tags')) {
            console.log('New sub-tag list');
            editor.insertNode($editable, $('<ul class="note_tags">' + tagTpl + '</ul>')[0]);
          } else {
            console.log('Cont tag list');
            editor.insertNode($editable, $(tagTpl)[0]);
          }
          */
          tagTpl = '<p><div class="note_tag ' + tag.clazz + '" title="' + tag.label + '"><i class="fa fa-' +  tag.icon + '"></i> &nbsp;' + tag.label + '</div></p>';
          //editor.insertNode($editable, tagTpl[0], false);
          pasteHtmlAtCaret(tagTpl);
        } else {
          tagTpl = '<p><div class="note_tag ' + tag.clazz + '" title="' + tag.label + '"><i class="fa fa-' +  tag.icon + '"></i> &nbsp;' + tag.label + '</div></p>';
          //editor.insertNode($editable, tagTpl[0], false);
          pasteHtmlAtCaret(tagTpl);
        }
      }
    }
  });
})(jQuery);
