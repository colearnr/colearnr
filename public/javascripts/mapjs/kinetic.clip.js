/*global Kinetic*/
Kinetic.Clip = function (config) {
	'use strict';
	this.createAttrs();
	Kinetic.Shape.call(this, config);
	this.shapeType = 'Clip';
	this._setDrawFuncs();
};
Kinetic.Clip.prototype.drawFunc = function (canvas) {
	'use strict';
	var context = canvas.getContext(),
		xClip = this.getWidth() * 2 - this.getRadius() * 2;
	context.beginPath();
	context.moveTo(0, this.getClipTo());
	context.arcTo(0, 0, this.getWidth() * 2, 0,  this.getWidth());
	context.arcTo(this.getWidth() * 2, 0, this.getWidth() * 2, this.getHeight(),  this.getWidth());
	context.arcTo(this.getWidth() * 2, this.getHeight(), 0, this.getHeight(), this.getRadius());
	context.arcTo(xClip, this.getHeight(), xClip, 0, this.getRadius());
	context.lineTo(xClip, this.getClipTo() * 0.5);
	canvas.fillStroke(this);
};
Kinetic.Node.addGetterSetter(Kinetic.Clip, 'clipTo', 0);
Kinetic.Node.addGetterSetter(Kinetic.Clip, 'radius', 0);
Kinetic.Util.extend(Kinetic.Clip, Kinetic.Shape);
