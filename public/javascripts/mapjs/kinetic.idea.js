/*global MAPJS, Color, _, jQuery, Kinetic*/
/*jslint nomen: true, newcap: true, browser: true*/
(function() {
  'use strict';
  /*shamelessly copied from http://james.padolsey.com/javascript/wordwrap-for-javascript */
  var COLUMN_WORD_WRAP_LIMIT = 25;

  function wordWrap(str, width, brk, cut) {
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
    if (!str) {
      return str;
    }
    var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');
    return str.match(new RegExp(regex, 'g')).join(brk);
  }

  function breakWords(string) {
    var lines = string.split('\n'),
      formattedLines = _.map(lines, function(line) {
        return wordWrap(line, COLUMN_WORD_WRAP_LIMIT, '\n', false);
      });
    return formattedLines.join('\n');
  }

  function createLink() {
    var link = new Kinetic.Group(),
      rectProps = {
        width: 10,
        height: 20,
        rotation: 0.6,
        stroke: '#555555',
        strokeWidth: 3,
        cornerRadius: 6,
        shadowOffset: [2, 2],
        shadow: '#CCCCCC',
        shadowBlur: 0.4,
        shadowOpacity: 0.4
      },
      rect = new Kinetic.Rect(rectProps),
      rect2 = new Kinetic.Rect(rectProps);
    rect2.setX(7);
    rect2.setY(-7);
    link.add(rect);
    link.add(rect2);
    link.setActive = function(isActive) {
      rect2.setStroke(isActive ? 'black' : '#555555');
      rect.setStroke(rect2.getStroke());
      link.getLayer().draw();
    };
    return link;
  }

  function createClip() {
    var group, clip, props = {width: 5, height: 25, radius: 3, rotation: 0.1, strokeWidth: 3, clipTo: 10};
    group = new Kinetic.Group();
    group.getClipMargin = function() {
      return props.clipTo;
    };
    group.add(new Kinetic.Clip(_.extend({stroke: '#486D98', x: 7, y: 1}, props)));
    clip = new Kinetic.Clip(_.extend({stroke: '#FFF', x: 6, y: 0}, props));
    group.add(clip);
    group.on('mouseover', function() {
      clip.setStroke('#000');
      group.getLayer().draw();
    });
    group.on('mouseout', function() {
      clip.setStroke('#FFF');
      group.getLayer().draw();
    });
    return group;
  }

  function createIcon() {
    var icon = new Kinetic.Image({
      x: 0,
      y: 0,
      width: 0,
      height: 0
    });
    icon.oldDrawScene = icon.drawScene;
    icon.updateMapjsAttribs = function(iconHash) {
      var safeIconProp = function(name) {
          return iconHash && iconHash[name];
        },
        imgUrl = safeIconProp('url'),
        imgWidth = safeIconProp('width'),
        imgHeight = safeIconProp('height');
      if (this.getAttr('image') && this.getAttr('image').src !== imgUrl) {
        this.getAttr('image').src = imgUrl || '';
      }
      this.setAttr('mapjs-image-url', imgUrl);
      if (this.getAttr('width') !== imgWidth) {
        this.setAttr('width', imgWidth);
      }
      if (this.getAttr('height') !== imgHeight) {
        this.setAttr('height', imgHeight);
      }
      this.setVisible(imgUrl);
    };
    icon.initMapjsImage = function() {
      var self = this,
        imageSrc = this.getAttr('mapjs-image-url');
      if (!imageSrc) {
        return;
      }
      if (!this.getAttr('image')) {
        this.setAttr('image', new Image());
        this.getAttr('image').onload = function loadImage() {
          self.getLayer().draw();
        };
        this.getAttr('image').src = imageSrc;
        this.getAttr('image').setAttribute('crossOrigin', 'anonymous');
      }
    };
    icon.drawScene = function() {
      if (!this.getAttr('image')) {
        this.initMapjsImage();
      }
      if (this.getAttr('mapjs-image-url')) {
        this.oldDrawScene.apply(this, arguments);
      }
    };
    return icon;
  }

  Kinetic.Idea = function(config) {
    var ENTER_KEY_CODE = 13,
      ESC_KEY_CODE = 27,
      self = this,
      unformattedText = config.text,
      bgRect = function(offset) {
        return new Kinetic.Rect({
          strokeWidth: 1,
          cornerRadius: 10,
          x: offset,
          y: offset,
          visible: false
        });
      };
    this.level = config.level;
    this.mmAttr = config.mmAttr;
    this.isSelected = false;
    this.isActivated = !!config.activated;
    config.draggable = config.level > 1;
    config.name = 'Idea';
    Kinetic.Group.call(this, config);
    this.rectAttrs = {stroke: '#486D98', strokeWidth: 1};
    this.rect = new Kinetic.Rect({
      strokeWidth: 1,
      cornerRadius: 10
    });
    this.rectbg1 = bgRect(8);
    this.rectbg2 = bgRect(4);
    this.link = createLink();
    this.link.on('click tap', function() {
      var url = MAPJS.URLHelper.getLink(unformattedText);
      if (url) {
        window.open(url, '_blank');
      }
    });
    this.link.on('mouseover', function() {
      self.link.setActive(true);
    });
    this.link.on('mouseout', function() {
      self.link.setActive(false);
    });
    this.text = new Kinetic.Text({
      fontSize: 16,
      fontFamily: 'Source Sans Pro, sans-serif, Helvetica-Neue, Helvetica',
      lineHeight: 1.5,
      fontStyle: 'Bold',
      align: 'center'
    });
    this.clip = createClip();
    this.clip.on('click tap', function() {
      self.fire(':request', {type: 'openNode', source: 'mouse'});
    });
    this.icon = createIcon();
    this.add(this.rectbg1);
    this.add(this.rectbg2);
    this.add(this.rect);
    this.add(this.icon);
    this.add(this.text);
    this.add(this.link);
    this.add(this.clip);
    this.setText = function(text) {
      var replacement = breakWords(MAPJS.URLHelper.stripLink(text)) ||
        (text.length < COLUMN_WORD_WRAP_LIMIT ? text : (text.substring(0, COLUMN_WORD_WRAP_LIMIT) + '...'));
      unformattedText = text;
      self.text.setText(replacement);
      self.link.setVisible(MAPJS.URLHelper.containsLink(text));
      self.setStyle();
    };
    this.setText(config.text);
    this.classType = 'Idea';
    this.getNodeAttrs = function() {
      return self.attrs;
    };
    this.isVisible = function(offset) {
      var stage = self.getStage();
      return stage && stage.isRectVisible(new MAPJS.Rectangle(self.getX(), self.getY(), self.getWidth(), self.getHeight()), offset);
    };
    this.validText = function(newText, unformattedText) {
      var symbolRegExp = /[!%^&*\\|~=`{}\[\]\";<>\/]/;
      if (newText && !symbolRegExp.test(newText)) {
        return newText;
      } else {
        self.fire(':invalid_text', {source: newText, oldText: unformattedText});
        return unformattedText;
      }
    };
    this.editNode = function(shouldSelectAll, deleteOnCancel) {
      self.fire(':editing');
      var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
        ideaInput,
        onStageMoved = _.throttle(function() {
          ideaInput.css({
            top: canvasPosition.top + self.getAbsolutePosition().y,
            left: canvasPosition.left + self.getAbsolutePosition().x
          });
        }, 10),
        updateText = function(newText) {
          self.setStyle();
          var stage = self.getStage();
          if (stage) {
            stage.draw();
          }
          self.fire(':textChanged', {
            text: newText,
            isNew: deleteOnCancel
          });
          ideaInput.remove();
          self.stopEditing = undefined;
          if (stage) {
            stage.off('xChange yChange', onStageMoved);
          }
        },
        onCommit = function() {
          if (ideaInput.val() === '') {
            onCancelEdit();
          } else {
            updateText('' + ideaInput.val());
          }
        },
        onCancelEdit = function() {
          updateText(unformattedText);
          if (deleteOnCancel) {
            self.fire(':request', {type: 'undo', source: 'internal'});
          }
        },
        scale = self.getStage().getScale().x || 1;
      ideaInput = jQuery('<textarea type="text" wrap="soft" class="ideaInput"></textarea>')
        .css({
          top: canvasPosition.top + self.getAbsolutePosition().y,
          left: canvasPosition.left + self.getAbsolutePosition().x,
          width: (6 + self.getWidth()) * scale,
          height: (6 + self.getHeight()) * scale,
          'padding': 3 * scale + 'px',
          'font-size': self.text.getFontSize() * scale + 'px',
          'line-height': '150%',
          'background-color': self.getBackground(),
          'margin': -3 * scale,
          'border-radius': self.rect.getCornerRadius() * scale + 'px',
          'border': self.rectAttrs.strokeWidth * (2 * scale) + 'px dashed ' + self.rectAttrs.stroke,
          'color': self.text.getFill(),
          'overflow': 'hidden'
        })
        .val(unformattedText)
        .appendTo('body')
        .keydown(function(e) {
          if (self.mmAttr && self.mmAttr.style.background == '#486D98') {
            ideaInput.css('color', '#FFFFFF');
          } else {
            ideaInput.css('color', '#000000');
          }
          if (e.shiftKey && e.which === ENTER_KEY_CODE) {
            return; // allow shift+enter to break lines
          }
          else if (e.which === ENTER_KEY_CODE) {
            onCommit();
          } else if (e.which === ESC_KEY_CODE) {
            onCancelEdit();
          } else if (e.which === 9) {
            onCommit();
            e.preventDefault();
            self.fire(':request', {type: 'addSubIdea', source: 'keyboard'});
            return;
          } else if (e.which === 83 && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onCommit();
            return;
            /* propagate to let the environment handle ctrl+s */
          } else if (!e.shiftKey && e.which === 90 && (e.metaKey || e.ctrlKey)) {
            if (ideaInput.val() === unformattedText) {
              onCancelEdit();
            }
          }
          e.stopPropagation();
        })
        .blur(onCommit)
        .focus(function() {
          if (shouldSelectAll) {
            if (ideaInput[0].setSelectionRange) {
              ideaInput[0].setSelectionRange(0, unformattedText.length);
            } else {
              ideaInput.select();
            }
          } else if (ideaInput[0].setSelectionRange) {
            ideaInput[0].setSelectionRange(unformattedText.length, unformattedText.length);
          }
          if (self.mmAttr && self.mmAttr.style.background == '#486D98') {
            ideaInput.css('color', '#FFFFFF');
          } else {
            ideaInput.css('color', '#000000');
          }
        })
        .on('input', function() {
          var text = new Kinetic.Idea({
            text: ideaInput.val()
          });
          ideaInput.width(Math.max(ideaInput.width(), text.getWidth() * scale));
          ideaInput.height(Math.max(ideaInput.height(), text.getHeight() * scale));
        });
      self.stopEditing = onCancelEdit;
      ideaInput.focus();
      self.getStage().on('xChange yChange', onStageMoved);
    };
  };
}());

Kinetic.Idea.prototype.setShadowOffset = function(offset) {
  'use strict';
  offset = this.getMMScale().x * offset;
  _.each([this.rect, this.rectbg1, this.rectbg2], function(r) {
    r.setShadowOffset([offset, offset]);
  });
};

Kinetic.Idea.prototype.getMMScale = function() {
  'use strict';
  var stage = this.getStage(),
    scale = (stage && stage.getScaleX()) || this.getScaleX() || 1;
  return {x: scale, y: scale};
};


Kinetic.Idea.prototype.setupShadows = function() {
  'use strict';
  var scale = this.getMMScale().x,
    isSelected = this.isSelected,
    offset = this.isCollapsed() ? 3 * scale : 4 * scale,
    normalShadow = {
      color: '#EEEEEE',
      blur: 10 * scale,
      offset: [offset, offset],
      opacity: 0.4 * scale
    },
    selectedShadow = {
      color: 'black',
      blur: 0,
      offset: [offset, offset],
      opacity: 1
    },
    shadow = isSelected ? selectedShadow : normalShadow;

  if (this.oldShadow && this.oldShadow.selected === isSelected && this.oldShadow.scale === scale && this.oldShadow.offset === offset) {
    return;
  }
  this.oldShadow = {selected: isSelected, scale: scale, offset: offset};
  _.each([this.rect, this.rectbg1, this.rectbg2], function(r) {
    r.setShadowColor(shadow.color);
    r.setShadowBlur(shadow.blur);
    r.setShadowOpacity(shadow.opacity);
    r.setShadowOffset(shadow.offset);
  });
};

Kinetic.Idea.prototype.getBackground = function() {
  'use strict';
  /*jslint newcap: true*/
  var isRoot = this.level === 1,
    defaultBg = MAPJS.defaultStyles[isRoot ? 'root' : 'nonRoot'].background,
    validColor = function(color, defaultColor) {
      if (!color) {
        return defaultColor;
      }
      var parsed = Color(color).hexString();
      return color.toUpperCase() === parsed.toUpperCase() ? color : defaultColor;
    };
  return validColor(this.mmAttr && this.mmAttr.style && this.mmAttr.style.background, defaultBg);
};


Kinetic.Idea.prototype.setStyle = function() {
  'use strict';
  /*jslint newcap: true*/
  var selectedBg = '#486D98';
  var defaultBg = '#FFFFFF';
  var self = this,
    isDroppable = this.isDroppable,
    isSelected = this.isSelected,
    isActivated = this.isActivated,
    background = this.getBackground(),
    tintedBackground = Color('#FFFFFF').hexString(),
    rectOffset,
    rectIncrement = 4,
    padding = 8,
    isClipVisible = false,
    clipMargin = self.clip.getClipMargin(),
    getDash = function() {
      if (!self.isActivated) {
        return [];
      }
      return [5, 3];
    },
    textSize = {
      width: this.text.getWidth(),
      height: this.text.getHeight()
    },
    calculatedSize,
    pad = function(box) {
      return {
        width: box.width + 2 * padding,
        height: box.height + 2 * padding
      };
    },
    positionTextAndIcon = function() {
      var iconPos = self.mmAttr && self.mmAttr.icon && self.mmAttr.icon.position;
      if (!iconPos || iconPos === 'center') {
        self.text.setX((calculatedSize.width - self.text.getWidth()) / 2);
        self.text.setY((calculatedSize.height - self.text.getHeight()) / 2 + clipMargin);
        self.icon.setY((calculatedSize.height - self.icon.getHeight()) / 2 + clipMargin);
        self.icon.setX((calculatedSize.width - self.icon.getWidth()) / 2);
      } else if (iconPos === 'bottom') {
        self.text.setX((calculatedSize.width - self.text.getWidth()) / 2);
        self.text.setY(clipMargin + padding);
        self.icon.setY(clipMargin + calculatedSize.height - self.icon.getHeight() - padding);
        self.icon.setX((calculatedSize.width - self.icon.getWidth()) / 2);
      } else if (iconPos === 'top') {
        self.text.setX((calculatedSize.width - self.text.getWidth()) / 2);
        self.icon.setY(clipMargin + padding);
        self.text.setY(clipMargin + calculatedSize.height - self.text.getHeight() - padding);
        self.icon.setX((calculatedSize.width - self.icon.getWidth()) / 2);
      } else if (iconPos === 'left') {
        self.text.setX(calculatedSize.width - self.text.getWidth() - padding);
        self.text.setY((calculatedSize.height - self.text.getHeight()) / 2 + clipMargin);
        self.icon.setY((calculatedSize.height - self.icon.getHeight()) / 2 + clipMargin);
        self.icon.setX(padding);
      } else if (iconPos === 'right') {
        self.text.setY((calculatedSize.height - self.text.getHeight()) / 2 + clipMargin);
        self.text.setX(padding);
        self.icon.setY((calculatedSize.height - self.icon.getHeight()) / 2 + clipMargin);
        self.icon.setX(calculatedSize.width - self.icon.getWidth() - padding);
      }
    },
    calculateMergedBoxSize = function(box1, box2) {
      if (box2.position === 'bottom' || box2.position === 'top') {
        return {
          width: Math.max(box1.width, box2.width) + 2 * padding,
          height: box1.height + box2.height + 3 * padding
        };
      }
      if (box2.position === 'left' || box2.position === 'right') {
        return {
          width: box1.width + box2.width + 3 * padding,
          height: Math.max(box1.height, box2.height) + 2 * padding
        };
      }
      return pad({
        width: Math.max(box1.width, box2.width),
        height: Math.max(box1.height, box2.height)
      });
    };
  if (this.mmAttr && this.mmAttr.icon && this.mmAttr.icon.url) {
    calculatedSize = calculateMergedBoxSize(textSize, this.mmAttr.icon);
  } else {
    calculatedSize = pad(textSize);
  }
  this.icon.updateMapjsAttribs(self.mmAttr && self.mmAttr.icon);

  this.clip.setVisible(clipMargin);
  this.setWidth(calculatedSize.width);
  this.setHeight(calculatedSize.height + clipMargin);
  this.link.setX(calculatedSize.width - 2 * padding + 10);
  this.link.setY(calculatedSize.height - 2 * padding + 5 + clipMargin);
  positionTextAndIcon();
  rectOffset = clipMargin;
  _.each([this.rect, this.rectbg2, this.rectbg1], function(r) {
    r.setWidth(calculatedSize.width);
    r.setHeight(calculatedSize.height);
    r.setY(rectOffset);
    rectOffset += rectIncrement;
    if (isDroppable) {
      r.setStroke('#9F4F4F');
      r.setFill('#EF6F6F');
    } else if (isSelected) {
      r.setFill(selectedBg);
    } else {
      r.setStroke(self.rectAttrs.stroke);
      r.setFill(defaultBg);
    }
  });
  if (isActivated) {
    this.clip.setVisible(true);
    this.rect.setStroke('#000000');
    var dashes = [[5, 3, 0, 0], [4, 3, 1, 0], [3, 3, 2, 0], [2, 3, 3, 0], [1, 3, 4, 0], [0, 3, 5, 0], [0, 2, 5, 1], [0, 1, 5, 2]];
    this.text.setFill('#FFFFFF');
    if (true || this.disableAnimations) {
      self.rect.setDashArray(dashes[0]);
    } else {
      if (!this.activeAnimation) {
        this.activeAnimation = new Kinetic.Animation(
          function(frame) {
            var da = dashes[Math.floor(frame.time / 30) % 8];
            self.rect.setDashArray(da);
          },
          self.getLayer()
        );
      }
      this.activeAnimation.start();
    }
  } else {
    this.clip.setVisible(false);
    if (this.activeAnimation) {
      this.activeAnimation.stop();
    }
    this.rect.setDashArray([]);
    this.text.setFill(MAPJS.contrastForeground(tintedBackground));
  }
  this.rect.setDashArray(getDash());
  this.rect.setStrokeWidth(this.isActivated ? 3 : self.rectAttrs.strokeWidth);
  this.rectbg1.setVisible(this.isCollapsed());
  this.rectbg2.setVisible(this.isCollapsed());
  this.clip.setX(calculatedSize.width - padding);
  this.setupShadows();
};

Kinetic.Idea.prototype.setMMAttr = function(newMMAttr) {
  'use strict';
  this.mmAttr = newMMAttr;
  this.setStyle();
//	this.getLayer().draw();
};

Kinetic.Idea.prototype.getIsSelected = function() {
  'use strict';
  return this.isSelected;
};

Kinetic.Idea.prototype.isCollapsed = function() {
  'use strict';
  return this.mmAttr && this.mmAttr.collapsed || false;
};

Kinetic.Idea.prototype.setIsSelected = function(isSelected) {
  'use strict';
  this.isSelected = isSelected;
  this.setStyle();
  this.getLayer().draw();
  if (!isSelected && this.stopEditing) {
    this.stopEditing();
  }
};

Kinetic.Idea.prototype.setIsActivated = function(isActivated) {
  'use strict';
  this.isActivated = isActivated;
  this.setStyle();
//	this.getLayer().draw();
};

Kinetic.Idea.prototype.setIsDroppable = function(isDroppable) {
  'use strict';
  this.isDroppable = isDroppable;
  this.setStyle(this.attrs);
};

Kinetic.Util.extend(Kinetic.Idea, Kinetic.Group);
