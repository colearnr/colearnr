/*global _, Kinetic, MAPJS */
Kinetic.IdeaProxy = function (idea, stage, layer) {
	'use strict';
	var nodeimage,
		emptyImage,
		imageRendered,
		container = new Kinetic.Group({opacity: 1, draggable: true, id: idea.attrs.id}),
		removeImage = function () {
			nodeimage.setImage(emptyImage);
			imageRendered = false;
		},
		cacheImage = function () {
			if (!idea.isVisible()) {
				removeImage();
				return;
			}
			if (imageRendered) {
				return;
			}
			imageRendered = true;
			var imageScale = 1,
				scale = stage.getScale().x, x = -(scale * imageScale), y = -(scale * imageScale),
				unscaledWidth = idea.getWidth() + 20,
				unscaledHeight = idea.getHeight() + 20,
				width = (unscaledWidth * scale * imageScale),
				height = (unscaledHeight * scale * imageScale);

			idea.setScale({x: scale * imageScale, y: scale * imageScale});
			idea.toImage({
				x: x,
				y: y,
				width: width,
				height: height,
				callback: function (img) {
					nodeimage.setImage(img);
					nodeimage.attrs.width = unscaledWidth;
					nodeimage.attrs.height = unscaledHeight;
					layer.draw();
				}
			});
		},
		reRender = function () {
			imageRendered = false;
			cacheImage();
		},
		nodeImageDrawFunc;
	idea.disableAnimations = true;
	container.setX(idea.getX());
	container.setY(idea.getY());
	idea.setX(0);
	idea.setY(0);
	_.each(idea.activeWidgets, function (widget) { widget.remove(); });
	nodeimage = new Kinetic.Image({
		x: -1,
		y: -1,
		width: idea.getWidth() + 20,
		height: idea.getHeight() + 20
	});
	nodeImageDrawFunc = nodeimage.getDrawFunc().bind(nodeimage);
	nodeimage.setDrawFunc(function (canvas) {
		cacheImage();
		nodeImageDrawFunc(canvas);
	});
	container.add(nodeimage);
	_.each(idea.activeWidgets, function (widget) { container.add(widget); });
	container.getNodeAttrs = function () {
		return idea.attrs;
	};
	container.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.getX(), container.getY(), container.getWidth(), container.getHeight()), offset);
	};
	idea.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.getX(), container.getY(), container.getWidth(), container.getHeight()), offset);
	};
	idea.getLayer = function () {
		return layer;
	};
	idea.getStage = function () {
		return stage;
	};
	idea.getAbsolutePosition =  function () {
		return container.getAbsolutePosition();
	};
	_.each(['getHeight', 'getWidth', 'getIsSelected', 'getLayer'], function (fname) {
		container[fname] = function () {
			return idea && idea[fname] && idea[fname].apply(idea, arguments);
		};
	});
	_.each([':textChanged', ':editing', ':request', ':invalid_text'], function (fname) {
		idea.on(fname, function (event) {
			container.fire(fname, event);
			reRender();
		});
	});
	_.each(['setMMAttr', 'setIsSelected', 'setText', 'setIsDroppable', 'editNode', 'setupShadows', 'setShadowOffset', 'setIsActivated'], function (fname) {
		container[fname] = function () {
			var result = idea && idea[fname] && idea[fname].apply(idea, arguments);
			reRender();
			return result;
		};
	});
	return container;
};

