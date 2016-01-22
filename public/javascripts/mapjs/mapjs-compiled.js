/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));
/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * http://github.com/tzuryby/hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/

(function(jQuery){

    jQuery.hotkeys = {
        version: "0.8",

        specialKeys: {
            8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
            20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
            37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
            96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
            104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
            112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
            120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
        },

        shiftNums: {
            "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
            "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
            ".": ">",  "/": "?",  "\\": "|"
        }
    };

    function keyHandler( handleObj ) {
        // Only care when a possible input has been specified
        if ( typeof handleObj.data !== "string" ) {
            return;
        }

        var origHandler = handleObj.handler,
            keys = handleObj.data.toLowerCase().split(" "),
            textAcceptingInputTypes = ["text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime", "datetime-local", "search", "color"];

        handleObj.handler = function( event ) {
            // Don't fire in text-accepting inputs that we didn't directly bind to
            if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
                jQuery.inArray(event.target.type, textAcceptingInputTypes) > -1 ) ) {
                return;
            }

            // Keypress represents characters, not special keys
            var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
                character = String.fromCharCode( event.which ).toLowerCase(),
                key, modif = "", possible = {};

            // check combinations (alt|ctrl|shift+anything)
            if ( event.altKey && special !== "alt" ) {
                modif += "alt+";
            }

            if ( event.ctrlKey && special !== "ctrl" ) {
                modif += "ctrl+";
            }

            // TODO: Need to make sure this works consistently across platforms
            if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
                modif += "meta+";
            }

            if ( event.shiftKey && special !== "shift" ) {
                modif += "shift+";
            }

            if ( special ) {
                possible[ modif + special ] = true;

            } else {
                possible[ modif + character ] = true;
                possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

                // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
                if ( modif === "shift+" ) {
                    possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
                }
            }

            for ( var i = 0, l = keys.length; i < l; i++ ) {
                if ( possible[ keys[i] ] ) {
                    return origHandler.apply( this, arguments );
                }
            }
        };
    }

    jQuery.each([ "keydown", "keyup", "keypress" ], function() {
        jQuery.event.special[ this ] = { add: keyHandler };
    });

})( jQuery );
/*! Hammer.JS - v1.0.4 - 2013-03-23
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
    return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
    // add styles and attributes to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling, but cancels
    // the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: {
        userSelect: 'none', // this also triggers onselectstart=false for IE
        touchCallout: 'none',
        touchAction: 'none',
        contentZooming: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
    }

    // more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = document;

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Hammer.event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    for(var name in Hammer.gestures) {
        if(Hammer.gestures.hasOwnProperty(name)) {
            Hammer.detection.register(Hammer.gestures[name]);
        }
    }

    // Add touch events on the document
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    this.element = element;

    // start/stop detection option
    this.enabled = true;

    // merge options
    this.options = Hammer.utils.extend(
        Hammer.utils.extend({}, Hammer.defaults),
        options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.stop_browser_behavior) {
        Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
    }

    // start detection on touchstart
    Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
        if(self.enabled) {
            Hammer.detection.startDetect(self, ev);
        }
    });

    // return instance
    return this;
};


Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    on: function onEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.addEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * unbind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    off: function offEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.removeEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * trigger gesture event
     * @param   {String}      gesture
     * @param   {Object}      eventData
     * @returns {Hammer.Instance}
     */
    trigger: function triggerEvent(gesture, eventData){
        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
        event.initEvent(gesture, true, true);
        event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Hammer.utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },


    /**
     * enable of disable hammer.js detection
     * @param   {Boolean}   state
     * @returns {Hammer.Instance}
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    }
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
    /**
     * simple addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        type
     * @param   {Function}      handler
     */
    bindDom: function(element, type, handler) {
        var types = type.split(' ');
        for(var t=0; t<types.length; t++) {
            element.addEventListener(types[t], handler, false);
        }
    },


    /**
     * touch events with mouse fallback
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Function}      handler
     */
    onTouch: function onTouch(element, eventType, handler) {
        var self = this;

        this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
            var sourceEventType = ev.type.toLowerCase();

            // onmouseup, but when touchend has been fired we do nothing.
            // this is for touchdevices which also fire a mouseup on touchend
            if(sourceEventType.match(/mouse/) && touch_triggered) {
                return;
            }

            // mousebutton must be down or a touch event
            else if( sourceEventType.match(/touch/) ||   // touch events are always on screen
                sourceEventType.match(/pointerdown/) || // pointerevents touch
                (sourceEventType.match(/mouse/) && ev.which === 1)   // mouse is pressed
            ){
                enable_detect = true;
            }

            // we are in a touch event, set the touch triggered bool to true,
            // this for the conflicts that may occur on ios and android
            if(sourceEventType.match(/touch|pointer/)) {
                touch_triggered = true;
            }

            // count the total touches on the screen
            var count_touches = 0;

            // when touch has been triggered in this detection session
            // and we are now handling a mouse event, we stop that to prevent conflicts
            if(enable_detect) {
                // update pointerevent
                if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
                // touch
                else if(sourceEventType.match(/touch/)) {
                    count_touches = ev.touches.length;
                }
                // mouse
                else if(!touch_triggered) {
                    count_touches = sourceEventType.match(/up/) ? 0 : 1;
                }

                // if we are in a end event, but when we remove one touch and
                // we still have enough, set eventType to move
                if(count_touches > 0 && eventType == Hammer.EVENT_END) {
                    eventType = Hammer.EVENT_MOVE;
                }
                // no touches, force the end event
                else if(!count_touches) {
                    eventType = Hammer.EVENT_END;
                }

                // because touchend has no touches, and we often want to use these in our gestures,
                // we send the last move event as our eventData in touchend
                if(!count_touches && last_move_event !== null) {
                    ev = last_move_event;
                }
                // store the last move event
                else {
                    last_move_event = ev;
                }

                // trigger the handler
                handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

                // remove pointerevent from list
                if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
            }

            //debug(sourceEventType +" "+ eventType);

            // on the end we reset everything
            if(!count_touches) {
                last_move_event = null;
                enable_detect = false;
                touch_triggered = false;
                Hammer.PointerEvent.reset();
            }
        });
    },


    /**
     * we have different events for each device/browser
     * determine what we need and set them in the Hammer.EVENT_TYPES constant
     */
    determineEventTypes: function determineEventTypes() {
        // determine the eventtype we want to set
        var types;
        if(Hammer.HAS_POINTEREVENTS) {
            types = Hammer.PointerEvent.getEvents();
        }
        // for non pointer events browsers
        else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'];
        }

        Hammer.EVENT_TYPES[Hammer.EVENT_START]  = types[0];
        Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]   = types[1];
        Hammer.EVENT_TYPES[Hammer.EVENT_END]    = types[2];
    },


    /**
     * create touchlist depending on the event
     * @param   {Object}    ev
     * @param   {String}    eventType   used by the fakemultitouch plugin
     */
    getTouchList: function getTouchList(ev/*, eventType*/) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return Hammer.PointerEvent.getTouchList();
        }
        // get the touchlist
        else if(ev.touches) {
            return ev.touches;
        }
        // make fake touchlist from mouse position
        else {
            return [{
                identifier: 1,
                pageX: ev.pageX,
                pageY: ev.pageY,
                target: ev.target
            }];
        }
    },


    /**
     * collect event data for Hammer js
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Object}        eventData
     */
    collectEventData: function collectEventData(element, eventType, ev) {
        var touches = this.getTouchList(ev, eventType);

        // find out pointerType
        var pointerType = Hammer.POINTER_TOUCH;
        if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
            pointerType = Hammer.POINTER_MOUSE;
        }

        return {
            center      : Hammer.utils.getCenter(touches),
            timeStamp   : new Date().getTime(),
            target      : ev.target,
            touches     : touches,
            eventType   : eventType,
            pointerType : pointerType,
            srcEvent    : ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                if(this.srcEvent.preventManipulation) {
                    this.srcEvent.preventManipulation();
                }

                if(this.srcEvent.preventDefault) {
                    this.srcEvent.preventDefault();
                }
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Hammer.detection.stopDetect();
            }
        };
    }
};

Hammer.PointerEvent = {
    /**
     * holds all pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get a list of pointers
     * @returns {Array}     touchlist
     */
    getTouchList: function() {
        var self = this;
        var touchlist = [];

        // we can use forEach since pointerEvents only is in IE10
        Object.keys(self.pointers).sort().forEach(function(id) {
            touchlist.push(self.pointers[id]);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @param   {String}   type             Hammer.EVENT_END
     * @param   {Object}   pointerEvent
     */
    updatePointer: function(type, pointerEvent) {
        if(type == Hammer.EVENT_END) {
            this.pointers = {};
        }
        else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }

        return Object.keys(this.pointers).length;
    },

    /**
     * check if ev matches pointertype
     * @param   {String}        pointerType     Hammer.POINTER_MOUSE
     * @param   {PointerEvent}  ev
     */
    matchType: function(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var types = {};
        types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
        types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
        types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
        return types[pointerType];
    },


    /**
     * get events
     */
    getEvents: function() {
        return [
            'pointerdown MSPointerDown',
            'pointermove MSPointerMove',
            'pointerup pointercancel MSPointerUp MSPointerCancel'
        ];
    },

    /**
     * reset the list
     */
    reset: function() {
        this.pointers = {};
    }
};


Hammer.utils = {
    /**
     * extend method,
     * also used for cloning when dest is an empty object
     * @param   {Object}    dest
     * @param   {Object}    src
     * @returns {Object}    dest
     */
    extend: function extend(dest, src) {
        for (var key in src) {
            dest[key] = src[key];
        }
        return dest;
    },


    /**
     * find if a node is in the given parent
     * used for event delegation tricks
     * @param   {HTMLElement}   node
     * @param   {HTMLElement}   parent
     * @returns {boolean}       has_parent
     */
    hasParent: function(node, parent) {
        while(node){
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },


    /**
     * get the center of all the touches
     * @param   {Array}     touches
     * @returns {Object}    center
     */
    getCenter: function getCenter(touches) {
        var valuesX = [], valuesY = [];

        for(var t= 0,len=touches.length; t<len; t++) {
            valuesX.push(touches[t].pageX);
            valuesY.push(touches[t].pageY);
        }

        return {
            pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
            pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
        };
    },


    /**
     * calculate the velocity between two points
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
        return {
            x: Math.abs(delta_x / delta_time) || 0,
            y: Math.abs(delta_y / delta_time) || 0
        };
    },


    /**
     * calculate the angle between two coordinates
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var y = touch2.pageY - touch1.pageY,
            x = touch2.pageX - touch1.pageX;
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    /**
     * angle to direction define
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.pageX - touch2.pageX),
            y = Math.abs(touch1.pageY - touch2.pageY);

        if(x >= y) {
            return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        else {
            return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
        }
    },


    /**
     * calculate the distance between two touches
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.pageX - touch1.pageX,
            y = touch2.pageY - touch1.pageY;
        return Math.sqrt((x*x) + (y*y));
    },


    /**
     * calculate the scale factor between two touchLists (fingers)
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) /
                this.getDistance(start[0], start[1]);
        }
        return 1;
    },


    /**
     * calculate the rotation degrees between two touchLists (fingers)
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) -
                this.getAngle(start[1], start[0]);
        }
        return 0;
    },


    /**
     * boolean if the direction is vertical
     * @param    {String}    direction
     * @returns  {Boolean}   is_vertical
     */
    isVertical: function isVertical(direction) {
        return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
    },


    /**
     * stop browser default behavior with css props
     * @param   {HtmlElement}   element
     * @param   {Object}        css_props
     */
    stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
        var prop,
            vendors = ['webkit','khtml','moz','ms','o',''];

        if(!css_props || !element.style) {
            return;
        }

        // with css properties for modern browsers
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                if(css_props.hasOwnProperty(p)) {
                    prop = p;

                    // vender prefix at the property
                    if(vendors[i]) {
                        prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    }

                    // set the style
                    element.style[prop] = css_props[p];
                }
            }
        }

        // also the disable onselectstart
        if(css_props.userSelect == 'none') {
            element.onselectstart = function() {
                return false;
            };
        }
    }
};

Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,


    /**
     * start Hammer.gesture detection
     * @param   {Hammer.Instance}   inst
     * @param   {Object}            eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        this.current = {
            inst        : inst, // reference to HammerInstance we're working for
            startEvent  : Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent   : false, // last eventData
            name        : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },


    /**
     * Hammer.gesture detection
     * @param   {Object}    eventData
     * @param   {Object}    eventData
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // instance options
        var inst_options = this.current.inst.options;

        // call Hammer.gesture handlers
        for(var g=0,len=this.gestures.length; g<len; g++) {
            var gesture = this.gestures[g];

            // only when the instance options have enabled this gesture
            if(!this.stopped && inst_options[gesture.name] !== false) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
                    this.stopDetect();
                    break;
                }
            }
        }

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        // endevent, but not the last touch, so dont stop
        if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length-1) {
            this.stopDetect();
        }

        return eventData;
    },


    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Hammer.utils.extend({}, this.current);

        // reset the current
        this.current = null;

        // stopped!
        this.stopped = true;
    },


    /**
     * extend eventData for Hammer.gestures
     * @param   {Object}   ev
     * @returns {Object}   ev
     */
    extendEventData: function extendEventData(ev) {
        var startEv = this.current.startEvent;

        // if the touches change, set the new touches over the startEvent touches
        // this because touchevents don't have all the touches on touchstart, or the
        // user must place his fingers at the EXACT same time on the screen, which is not realistic
        // but, sometimes it happens that both fingers are touching at the EXACT same time
        if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
            // extend 1 level deep to get the touchlist with the touch objects
            startEv.touches = [];
            for(var i=0,len=ev.touches.length; i<len; i++) {
                startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
            }
        }

        var delta_time = ev.timeStamp - startEv.timeStamp,
            delta_x = ev.center.pageX - startEv.center.pageX,
            delta_y = ev.center.pageY - startEv.center.pageY,
            velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

        Hammer.utils.extend(ev, {
            deltaTime   : delta_time,

            deltaX      : delta_x,
            deltaY      : delta_y,

            velocityX   : velocity.x,
            velocityY   : velocity.y,

            distance    : Hammer.utils.getDistance(startEv.center, ev.center),
            angle       : Hammer.utils.getAngle(startEv.center, ev.center),
            direction   : Hammer.utils.getDirection(startEv.center, ev.center),

            scale       : Hammer.utils.getScale(startEv.touches, ev.touches),
            rotation    : Hammer.utils.getRotation(startEv.touches, ev.touches),

            startEvent  : startEv
        });

        return ev;
    },


    /**
     * register new gesture
     * @param   {Object}    gesture object, see gestures.js for documentation
     * @returns {Array}     gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Hammer.utils.extend(Hammer.defaults, options);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *   index: 1337,
 *   defaults: {
 *     mygesture_option: true
 *   }
 *   handler: function(type, ev, inst) {
 *     // trigger gesture event
 *     inst.trigger(this.name, ev);
 *   }
 * }

 * @param   {String}    name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param   {Number}    [index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param   {Object}    [defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param   {Function}  handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *      @param  {Object}    eventData
 *      event data containing the following properties:
 *          timeStamp   {Number}        time the event occurred
 *          target      {HTMLElement}   target element
 *          touches     {Array}         touches (fingers, pointers, mouse) on the screen
 *          pointerType {String}        kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *          center      {Object}        center position of the touches. contains pageX and pageY
 *          deltaTime   {Number}        the total time of the touches in the screen
 *          deltaX      {Number}        the delta on x axis we haved moved
 *          deltaY      {Number}        the delta on y axis we haved moved
 *          velocityX   {Number}        the velocity on the x
 *          velocityY   {Number}        the velocity on y
 *          angle       {Number}        the angle we are moving
 *          direction   {String}        the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *          distance    {Number}        the distance we haved moved
 *          scale       {Number}        scaling of the touches, needs 2 touches
 *          rotation    {Number}        rotation of the touches, needs 2 touches *
 *          eventType   {String}        matches Hammer.EVENT_START|MOVE|END
 *          srcEvent    {Object}        the source event, like TouchStart or MouseDown *
 *          startEvent  {Object}        contains the same properties as above,
 *                                      but from the first touch. this is used to calculate
 *                                      distances, deltaTime, scaling etc
 *
 *      @param  {Hammer.Instance}    inst
 *      the instance we are doing the detection for. you can get the options from
 *      the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *      @param  {String}    name
 *      contains the name of the gesture we have detected. it has not a real function,
 *      only to check in other gestures if something is detected.
 *      like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *      check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *      @readonly
 *      @param  {Hammer.Instance}    inst
 *      the instance we do the detection for
 *
 *      @readonly
 *      @param  {Object}    startEvent
 *      contains the properties of the first gesture detection in this session.
 *      Used for calculations about timing, distance, etc.
 *
 *      @readonly
 *      @param  {Object}    lastEvent
 *      contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
    name: 'hold',
    index: 10,
    defaults: {
        hold_timeout: 500,
        hold_threshold: 1
    },
    timer: null,
    handler: function holdGesture(ev, inst) {
        switch(ev.eventType) {
            case Hammer.EVENT_START:
                // clear any running timers
                clearTimeout(this.timer);

                // set the gesture so we can check in the timeout if it still is
                Hammer.detection.current.name = this.name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                this.timer = setTimeout(function() {
                    if(Hammer.detection.current.name == 'hold') {
                        inst.trigger('hold', ev);
                    }
                }, inst.options.hold_timeout);
                break;

            // when you move or end we clear the timer
            case Hammer.EVENT_MOVE:
                if(ev.distance > inst.options.hold_threshold) {
                    clearTimeout(this.timer);
                }
                break;

            case Hammer.EVENT_END:
                clearTimeout(this.timer);
                break;
        }
    }
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
    name: 'tap',
    index: 100,
    defaults: {
        tap_max_touchtime  : 250,
        tap_max_distance   : 10,
        doubletap_distance : 20,
        doubletap_interval : 300
    },
    handler: function tapGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // previous gesture, for the double tap since these are two different gesture detections
            var prev = Hammer.detection.previous;

            // when the touchtime is higher then the max touch time
            // or when the moving distance is too much
            if(ev.deltaTime > inst.options.tap_max_touchtime ||
                ev.distance > inst.options.tap_max_distance) {
                return;
            }

            // check if double tap
            if(prev && prev.name == 'tap' &&
                (ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
                ev.distance < inst.options.doubletap_distance) {
                Hammer.detection.current.name = 'doubletap';
            }
            else {
                Hammer.detection.current.name = 'tap';
            }

            inst.trigger(Hammer.detection.current.name, ev);
        }
    }
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        // set 0 for unlimited, but this can conflict with transform
        swipe_max_touches  : 1,
        swipe_velocity     : 0.7
    },
    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // max touches
            if(inst.options.swipe_max_touches > 0 &&
                ev.touches.length > inst.options.swipe_max_touches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > inst.options.swipe_velocity ||
                ev.velocityY > inst.options.swipe_velocity) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
    name: 'drag',
    index: 50,
    defaults: {
        drag_min_distance : 10,
        // set 0 for unlimited, but this can conflict with transform
        drag_max_touches  : 1,
        // prevent default browser behavior when dragging occurs
        // be careful with it, it makes the element a blocking element
        // when you are using the drag gesture, it is a good practice to set this true
        drag_block_horizontal   : false,
        drag_block_vertical     : false,
        // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
        // It disallows vertical directions if the initial direction was horizontal, and vice versa.
        drag_lock_to_axis       : false
    },
    triggered: false,
    handler: function dragGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // max touches
        if(inst.options.drag_max_touches > 0 &&
            ev.touches.length > inst.options.drag_max_touches) {
            return;
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.drag_min_distance &&
                    Hammer.detection.current.name != this.name) {
                    return;
                }

                // we are dragging!
                Hammer.detection.current.name = this.name;

                // lock drag to axis?
                var last_direction = Hammer.detection.current.lastEvent.direction;
                if(inst.options.drag_lock_to_axis && last_direction !== ev.direction) {
                    // keep direction on the axis that the drag gesture started on
                    if(Hammer.utils.isVertical(last_direction)) {
                        ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
                    }
                    else {
                        ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                // trigger normal event
                inst.trigger(this.name, ev);

                // direction event, like dragdown
                inst.trigger(this.name + ev.direction, ev);

                // block the browser events
                if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
                    (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
                    ev.preventDefault();
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
    name: 'transform',
    index: 45,
    defaults: {
        // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
        transform_min_scale     : 0.01,
        // rotation in degrees
        transform_min_rotation  : 1,
        // prevent default browser behavior when two touches are on the screen
        // but it makes the element a blocking element
        // when you are using the transform gesture, it is a good practice to set this true
        transform_always_block  : false
    },
    triggered: false,
    handler: function transformGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // atleast multitouch
        if(ev.touches.length < 2) {
            return;
        }

        // prevent default when two fingers are on the screen
        if(inst.options.transform_always_block) {
            ev.preventDefault();
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                var scale_threshold = Math.abs(1-ev.scale);
                var rotation_threshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scale_threshold < inst.options.transform_min_scale &&
                    rotation_threshold < inst.options.transform_min_rotation) {
                    return;
                }

                // we are transforming!
                Hammer.detection.current.name = this.name;

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                inst.trigger(this.name, ev); // basic transform event

                // trigger rotate event
                if(rotation_threshold > inst.options.transform_min_rotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scale_threshold > inst.options.transform_min_scale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        // call preventDefault at touchstart, and makes the element blocking by
        // disabling the scrolling of the page, but it improves gestures like
        // transforming and dragging.
        // be careful with using this, it can be very annoying for users to be stuck
        // on the page
        prevent_default: false,

        // disable mouse events, so only touch (or pen!) input triggers events
        prevent_mouseevents: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.prevent_default) {
            ev.preventDefault();
        }

        if(ev.eventType ==  Hammer.EVENT_START) {
            inst.trigger(this.name, ev);
        }
    }
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType ==  Hammer.EVENT_END) {
            inst.trigger(this.name, ev);
        }
    }
};

// node export
if(typeof module === 'object' && typeof module.exports === 'object'){
    module.exports = Hammer;
}
// just window export
else {
    window.Hammer = Hammer;

    // requireJS module definition
    if(typeof window.define === 'function' && window.define.amd) {
        window.define('hammer', [], function() {
            return Hammer;
        });
    }
}
})(this);

(function($, undefined) {
    'use strict';

    // no jQuery or Zepto!
    if($ === undefined) {
        return;
    }

    /**
     * bind dom events
     * this overwrites addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        eventTypes
     * @param   {Function}      handler
     */
    Hammer.event.bindDom = function(element, eventTypes, handler) {
        $(element).on(eventTypes, function(ev) {
            var data = ev.originalEvent || ev;

            // IE pageX fix
            if(data.pageX === undefined) {
                data.pageX = ev.pageX;
                data.pageY = ev.pageY;
            }

            // IE target fix
            if(!data.target) {
                data.target = ev.target;
            }

            // IE button fix
            if(data.which === undefined) {
                data.which = data.button;
            }

            // IE preventDefault
            if(!data.preventDefault) {
                data.preventDefault = ev.preventDefault;
            }

            // IE stopPropagation
            if(!data.stopPropagation) {
                data.stopPropagation = ev.stopPropagation;
            }

            handler.call(this, data);
        });
    };

    /**
     * the methods are called by the instance, but with the jquery plugin
     * we use the jquery event methods instead.
     * @this    {Hammer.Instance}
     * @return  {jQuery}
     */
    Hammer.Instance.prototype.on = function(types, handler) {
        return $(this.element).on(types, handler);
    };
    Hammer.Instance.prototype.off = function(types, handler) {
        return $(this.element).off(types, handler);
    };


    /**
     * trigger events
     * this is called by the gestures to trigger an event like 'tap'
     * @this    {Hammer.Instance}
     * @param   {String}    gesture
     * @param   {Object}    eventData
     * @return  {jQuery}
     */
    Hammer.Instance.prototype.trigger = function(gesture, eventData){
        var el = $(this.element);
        if(el.has(eventData.target).length) {
            el = $(eventData.target);
        }

        return el.trigger({
            type: gesture,
            gesture: eventData
        });
    };


    /**
     * jQuery plugin
     * create instance of Hammer and watch for gestures,
     * and when called again you can change the options
     * @param   {Object}    [options={}]
     * @return  {jQuery}
     */
    $.fn.hammer = function(options) {
        return this.each(function() {
            var el = $(this);
            var inst = el.data('hammer');
            // start new hammer instance
            if(!inst) {
                el.data('hammer', new Hammer(this, options || {}));
            }
            // change the options
            else if(inst && options) {
                Hammer.utils.extend(inst.options, options);
            }
        });
    };

})(window.jQuery || window.Zepto);
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);
/*
 * KineticJS JavaScript Framework v4.5.4
 * http://www.kineticjs.com/
 * Copyright 2013, Eric Rowell
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: 2013-06-09
 *
 * Copyright (C) 2011 - 2013 by Eric Rowell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/** 
 * @namespace Kinetic
 */
var Kinetic = {}; 
(function() {
    Kinetic.version = '4.5.4';
    
    /** 
     * @namespace Filters
     * @memberof Kinetic
     */
    Kinetic.Filters = {};

    /**
     * Node constructor. Nodes are entities that can be transformed, layered,
     * and have bound events. The stage, layers, groups, and shapes all extend Node.
     * @constructor
     * @memberof Kinetic
     * @abstract
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     */
    Kinetic.Node = function(config) {
        this._nodeInit(config);
    };

    /**
     * Shape constructor.  Shapes are primitive objects such as rectangles,
     *  circles, text, lines, etc.
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Node
     * @param {Object} config
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var customShape = new Kinetic.Shape({<br>
     *   x: 5,<br>
     *   y: 10,<br>
     *   fill: 'red',<br>
     *   // a Kinetic.Canvas renderer is passed into the drawFunc function<br>
     *   drawFunc: function(canvas) {<br>
     *     var context = canvas.getContext();<br>
     *     context.beginPath();<br>
     *     context.moveTo(200, 50);<br>
     *     context.lineTo(420, 80);<br>
     *     context.quadraticCurveTo(300, 100, 260, 170);<br>
     *     context.closePath();<br>
     *     canvas.fillStroke(this);<br>
     *   }<br>   
     *});
     */
    Kinetic.Shape = function(config) {
        this._initShape(config);
    }; 

    /**
     * Container constructor.&nbsp; Containers are used to contain nodes or other containers
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Node
     * @abstract
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @param {Function} [config.clipFunc] clipping function

     */
    Kinetic.Container = function(config) {
        this._containerInit(config);
    };

    /**
     * Stage constructor.  A stage is used to contain multiple layers
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Container
     * @param {Object} config
     * @param {String|DomElement} config.container Container id or DOM element
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @param {Function} [config.clipFunc] clipping function

     * @example
     * var stage = new Kinetic.Stage({<br>
     *   width: 500,<br>
     *   height: 800,<br>
     *   container: 'containerId'<br>
     * });
     */
    Kinetic.Stage = function(config) {
        this._initStage(config);
    };

    /**
     * Layer constructor.  Layers are tied to their own canvas element and are used
     * to contain groups or shapes
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Container
     * @param {Object} config
     * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
     * to clear the canvas before each layer draw.  The default value is true.
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @param {Function} [config.clipFunc] clipping function

     * @example
     * var layer = new Kinetic.Layer();
     */
    Kinetic.Layer = function(config) {
        this._initLayer(config);
    };

    /**
     * Group constructor.  Groups are used to contain shapes or other groups.
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Container
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @param {Function} [config.clipFunc] clipping function

     * @example
     * var group = new Kinetic.Group();
     */
    Kinetic.Group = function(config) {
        this._initGroup(config);
    }; 

    /** 
     * @namespace Global
     * @memberof Kinetic
     */
    Kinetic.Global = {
        stages: [],
        idCounter: 0,
        ids: {},
        names: {},
        //shapes hash.  rgb keys and shape values
        shapes: {},

        /**
         * returns whether or not drag and drop is currently active
         * @method
         * @memberof Kinetic.Global
         */
        isDragging: function() {
            var dd = Kinetic.DD;  

            // if DD is not included with the build, then
            // drag and drop is not even possible
            if (!dd) {
                return false;
            } 
            // if DD is included with the build
            else {
                return dd.isDragging;
            }
        },
        /**
        * returns whether or not a drag and drop operation is ready, but may
        *  not necessarily have started
        * @method
        * @memberof Kinetic.Global
        */
        isDragReady: function() {
            var dd = Kinetic.DD;  

            // if DD is not included with the build, then
            // drag and drop is not even possible
            if (!dd) {
                return false;
            } 
            // if DD is included with the build
            else {
                return !!dd.node;
            }
        },
        _addId: function(node, id) {
            if(id !== undefined) {
                this.ids[id] = node;
            }
        },
        _removeId: function(id) {
            if(id !== undefined) {
                delete this.ids[id];
            }
        },
        _addName: function(node, name) {
            if(name !== undefined) {
                if(this.names[name] === undefined) {
                    this.names[name] = [];
                }
                this.names[name].push(node);
            }
        },
        _removeName: function(name, _id) {
            if(name !== undefined) {
                var nodes = this.names[name];
                if(nodes !== undefined) {
                    for(var n = 0; n < nodes.length; n++) {
                        var no = nodes[n];
                        if(no._id === _id) {
                            nodes.splice(n, 1);
                        }
                    }
                    if(nodes.length === 0) {
                        delete this.names[name];
                    }
                }
            }
        }
    };
})();

// Uses Node, AMD or browser globals to create a module.

// If you want something that will work in other stricter CommonJS environments,
// or if you need to create a circular dependency, see commonJsStrict.js

// Defines a module "returnExports" that depends another module called "b".
// Note that the name of the module is implied by the file name. It is best
// if the file name and the exported global have matching names.

// If the 'b' module also uses this type of boilerplate, then
// in the browser, it will create a global .b that is used below.

// If you do not want to support the browser global path, then you
// can remove the `root` use and the passing `this` as the first arg to
// the top function.

// if the module has no dependencies, the above pattern can be simplified to
( function(root, factory) {
    if( typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    }
    else if( typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    }
    else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function() {

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return Kinetic;
}));
;(function() {
    /**
     * Collection constructor.  Collection extends
     *  Array.  This class is used in conjunction with {@link Kinetic.Container#get}
     * @constructor
     * @memberof Kinetic
     */
    Kinetic.Collection = function() {
        var args = [].slice.call(arguments), length = args.length, i = 0;

        this.length = length;
        for(; i < length; i++) {
            this[i] = args[i];
        }
        return this;
    };
    Kinetic.Collection.prototype = [];
    /**
     * iterate through node array and run a function for each node.
     *  The node and index is passed into the function
     * @method
     * @memberof Kinetic.Collection.prototype
     * @param {Function} func
     * @example
     * // get all nodes with name foo inside layer, and set x to 10 for each
     * layer.get('.foo').each(function(shape, n) {<br>
     *   shape.setX(10);<br>
     * });
     */
    Kinetic.Collection.prototype.each = function(func) {
        for(var n = 0; n < this.length; n++) {
            func(this[n], n);
        }
    };
    /**
     * convert collection into an array
     * @method
     * @memberof Kinetic.Collection.prototype
     */
    Kinetic.Collection.prototype.toArray = function() {
        var arr = [];
        for(var n = 0; n < this.length; n++) {
            arr.push(this[n]);
        }
        return arr;
    };

    Kinetic.Collection.mapMethods = function(arr) {
        var leng = arr.length,
            n;
            
        for(n = 0; n < leng; n++) {
            // induce scope
            (function(i) {
                var method = arr[i];
                Kinetic.Collection.prototype[method] = function() {
                    var len = this.length,
                        i;
                        
                    args = [].slice.call(arguments);
                    for(i = 0; i < len; i++) {
                        this[i][method].apply(this[i], args);
                    }        
                };
            })(n);
        }
    };
})();


(function() {
    /*
    * Last updated November 2011
    * By Simon Sarris
    * www.simonsarris.com
    * sarris@acm.org
    *
    * Free to use and distribute at will
    * So long as you are nice to people, etc
    */

    /*
    * The usage of this class was inspired by some of the work done by a forked
    * project, KineticJS-Ext by Wappworks, which is based on Simon's Transform
    * class.  Modified by Eric Rowell
    */

    /**
     * Transform constructor
     * @constructor
     * @memberof Kinetic
     */
    Kinetic.Transform = function() {
        this.m = [1, 0, 0, 1, 0, 0];
    };

    Kinetic.Transform.prototype = {
        /**
         * Apply translation
         * @method
         * @memberof Kinetic.Transform.prototype
         * @param {Number} x
         * @param {Number} y
         */
        translate: function(x, y) {
            this.m[4] += this.m[0] * x + this.m[2] * y;
            this.m[5] += this.m[1] * x + this.m[3] * y;
        },
        /**
         * Apply scale
         * @method
         * @memberof Kinetic.Transform.prototype
         * @param {Number} sx
         * @param {Number} sy
         */
        scale: function(sx, sy) {
            this.m[0] *= sx;
            this.m[1] *= sx;
            this.m[2] *= sy;
            this.m[3] *= sy;
        },
        /**
         * Apply rotation
         * @method
         * @memberof Kinetic.Transform.prototype
         * @param {Number} rad  Angle in radians
         */
        rotate: function(rad) {
            var c = Math.cos(rad);
            var s = Math.sin(rad);
            var m11 = this.m[0] * c + this.m[2] * s;
            var m12 = this.m[1] * c + this.m[3] * s;
            var m21 = this.m[0] * -s + this.m[2] * c;
            var m22 = this.m[1] * -s + this.m[3] * c;
            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
        },
        /**
         * Returns the translation
         * @method
         * @memberof Kinetic.Transform.prototype
         * @returns {Object} 2D point(x, y)
         */
        getTranslation: function() {
            return {
                x: this.m[4],
                y: this.m[5]
            };
        },
        /**
         * Apply skew 
         * @method
         * @memberof Kinetic.Transform.prototype
         * @param {Number} sx
         * @param {Number} sy
         */
        skew: function(sx, sy) {
            var m11 = this.m[0] + this.m[2] * sy;
            var m12 = this.m[1] + this.m[3] * sy;
            var m21 = this.m[2] + this.m[0] * sx;
            var m22 = this.m[3] + this.m[1] * sx;
            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
         },
        /**
         * Transform multiplication
         * @method
         * @memberof Kinetic.Transform.prototype
         * @param {Kinetic.Transform} matrix
         */
        multiply: function(matrix) {
            var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
            var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

            var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
            var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

            var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
            var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
            this.m[4] = dx;
            this.m[5] = dy;
        },
        /**
         * Invert the matrix
         * @method
         * @memberof Kinetic.Transform.prototype
         */
        invert: function() {
            var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
            var m0 = this.m[3] * d;
            var m1 = -this.m[1] * d;
            var m2 = -this.m[2] * d;
            var m3 = this.m[0] * d;
            var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
            var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
            this.m[0] = m0;
            this.m[1] = m1;
            this.m[2] = m2;
            this.m[3] = m3;
            this.m[4] = m4;
            this.m[5] = m5;
        },
        /**
         * return matrix
         * @method
         * @memberof Kinetic.Transform.prototype
         */
        getMatrix: function() {
            return this.m;
        }
    };
})();


(function() {
    // CONSTANTS
    var CANVAS = 'canvas',
        CONTEXT_2D = '2d',
        OBJECT_ARRAY = '[object Array]',
        OBJECT_NUMBER = '[object Number]',
        OBJECT_STRING = '[object String]',
        PI_OVER_DEG180 = Math.PI / 180,
        DEG180_OVER_PI = 180 / Math.PI,
        HASH = '#',
        EMPTY_STRING = '',
        ZERO = '0',
        KINETIC_WARNING = 'Kinetic warning: ',
        RGB_PAREN = 'rgb(',
        COLORS = {
            aqua: [0,255,255],
            lime: [0,255,0],
            silver: [192,192,192],
            black: [0,0,0],
            maroon: [128,0,0],
            teal: [0,128,128],
            blue: [0,0,255],
            navy: [0,0,128],
            white: [255,255,255],
            fuchsia: [255,0,255],
            olive:[128,128,0],
            yellow: [255,255,0],
            orange: [255,165,0],
            gray: [128,128,128],
            purple: [128,0,128],
            green: [0,128,0],
            red: [255,0,0],
            pink: [255,192,203],
            cyan: [0,255,255],
            transparent: [255,255,255,0]
        },

        RGB_REGEX = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;

    /** 
     * @namespace Util
     * @memberof Kinetic
     */
    Kinetic.Util = {
        /*
         * cherry-picked utilities from underscore.js
         */
        _isElement: function(obj) {
            return !!(obj && obj.nodeType == 1);
        },
        _isFunction: function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },
        _isObject: function(obj) {
            return (!!obj && obj.constructor == Object);
        },
        _isArray: function(obj) {
            return Object.prototype.toString.call(obj) == OBJECT_ARRAY;
        },
        _isNumber: function(obj) {
            return Object.prototype.toString.call(obj) == OBJECT_NUMBER;
        },
        _isString: function(obj) {
            return Object.prototype.toString.call(obj) == OBJECT_STRING;
        },
        /*
         * other utils
         */
        _hasMethods: function(obj) {
            var names = [],
                key;
                
            for(key in obj) {
                if(this._isFunction(obj[key])) {
                    names.push(key);
                }
            }
            return names.length > 0;
        },
        _isInDocument: function(el) {
            while(el = el.parentNode) {
                if(el == document) {
                    return true;
                }
            }
            return false;
        },
        /*
         * The argument can be:
         * - an integer (will be applied to both x and y)
         * - an array of one integer (will be applied to both x and y)
         * - an array of two integers (contains x and y)
         * - an array of four integers (contains x, y, width, and height)
         * - an object with x and y properties
         * - an array of one element which is an array of integers
         * - an array of one element of an object
         */
        _getXY: function(arg) {
            if(this._isNumber(arg)) {
                return {
                    x: arg,
                    y: arg
                };
            }
            else if(this._isArray(arg)) {
                // if arg is an array of one element
                if(arg.length === 1) {
                    var val = arg[0];
                    // if arg is an array of one element which is a number
                    if(this._isNumber(val)) {
                        return {
                            x: val,
                            y: val
                        };
                    }
                    // if arg is an array of one element which is an array
                    else if(this._isArray(val)) {
                        return {
                            x: val[0],
                            y: val[1]
                        };
                    }
                    // if arg is an array of one element which is an object
                    else if(this._isObject(val)) {
                        return val;
                    }
                }
                // if arg is an array of two or more elements
                else if(arg.length >= 2) {
                    return {
                        x: arg[0],
                        y: arg[1]
                    };
                }
            }
            // if arg is an object return the object
            else if(this._isObject(arg)) {
                return arg;
            }

            // default
            return null;
        },
        /*
         * The argument can be:
         * - an integer (will be applied to both width and height)
         * - an array of one integer (will be applied to both width and height)
         * - an array of two integers (contains width and height)
         * - an array of four integers (contains x, y, width, and height)
         * - an object with width and height properties
         * - an array of one element which is an array of integers
         * - an array of one element of an object
         */
        _getSize: function(arg) {
            if(this._isNumber(arg)) {
                return {
                    width: arg,
                    height: arg
                };
            }
            else if(this._isArray(arg)) {
                // if arg is an array of one element
                if(arg.length === 1) {
                    var val = arg[0];
                    // if arg is an array of one element which is a number
                    if(this._isNumber(val)) {
                        return {
                            width: val,
                            height: val
                        };
                    }
                    // if arg is an array of one element which is an array
                    else if(this._isArray(val)) {
                        /*
                         * if arg is an array of one element which is an
                         * array of four elements
                         */
                        if(val.length >= 4) {
                            return {
                                width: val[2],
                                height: val[3]
                            };
                        }
                        /*
                         * if arg is an array of one element which is an
                         * array of two elements
                         */
                        else if(val.length >= 2) {
                            return {
                                width: val[0],
                                height: val[1]
                            };
                        }
                    }
                    // if arg is an array of one element which is an object
                    else if(this._isObject(val)) {
                        return val;
                    }
                }
                // if arg is an array of four elements
                else if(arg.length >= 4) {
                    return {
                        width: arg[2],
                        height: arg[3]
                    };
                }
                // if arg is an array of two elements
                else if(arg.length >= 2) {
                    return {
                        width: arg[0],
                        height: arg[1]
                    };
                }
            }
            // if arg is an object return the object
            else if(this._isObject(arg)) {
                return arg;
            }

            // default
            return null;
        },
        /*
         * arg will be an array of numbers or
         *  an array of point arrays or
         *  an array of point objects
         */
        _getPoints: function(arg) {
            var arr = [],
                n, len;

            if(arg === undefined) {
                return [];
            }

            len = arg.length;

            // an array of arrays
            if(this._isArray(arg[0])) {
                /*
                 * convert array of arrays into an array
                 * of objects containing x, y
                 */
                for(n = 0; n < len; n++) {
                    arr.push({
                        x: arg[n][0],
                        y: arg[n][1]
                    });
                }

                return arr;
            }
            // an array of objects
            if(this._isObject(arg[0])) {
                return arg;
            }
            // an array of integers
            else {
                /*
                 * convert array of numbers into an array
                 * of objects containing x, y
                 */
                for(n = 0; n < len; n += 2) {
                    arr.push({
                        x: arg[n],
                        y: arg[n + 1]
                    });
                }

                return arr;
            }
        },
        /*
         * arg can be an image object or image data
         */
        _getImage: function(arg, callback) {
            var imageObj, canvas, context, dataUrl;
            
            // if arg is null or undefined
            if(!arg) {
                callback(null);
            }

            // if arg is already an image object
            else if(this._isElement(arg)) {
                callback(arg);
            }

            // if arg is a string, then it's a data url
            else if(this._isString(arg)) {
                imageObj = new Image();
                imageObj.onload = function() {
                    callback(imageObj);
                };
                imageObj.src = arg;
            }

            //if arg is an object that contains the data property, it's an image object
            else if(arg.data) {
                canvas = document.createElement(CANVAS);
                canvas.width = arg.width;
                canvas.height = arg.height;
                context = canvas.getContext(CONTEXT_2D);
                context.putImageData(arg, 0, 0);
                dataUrl = canvas.toDataURL();
                imageObj = new Image();
                imageObj.onload = function() {
                    callback(imageObj);
                };
                imageObj.src = dataUrl;
            }
            else {
                callback(null);
            }
        },
        _rgbToHex: function(r, g, b) {
            return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        _hexToRgb: function(hex) {
            hex = hex.replace(HASH, EMPTY_STRING);
            var bigint = parseInt(hex, 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
            };
        },
        /**
         * return random hex color
         * @method
         * @memberof Kinetic.Util.prototype
         */
        getRandomColor: function() {
            var randColor = (Math.random() * 0xFFFFFF << 0).toString(16);
            while (randColor.length < 6) {
              randColor = ZERO + randColor;
            }
            return HASH + randColor;
        },
        /**
         * get RGB components of a color
         * @method
         * @memberof Kinetic.Util.prototype
         * @param {String} color 
         * @example
         * // each of the following examples return {r:0, g:0, b:255}<br>
         * var rgb = Kinetic.Util.getRGB('blue');<br>
         * var rgb = Kinetic.Util.getRGB('#0000ff');<br>
         * var rgb = Kinetic.Util.getRGB('rgb(0,0,255)');
         */
        getRGB: function(color) {
          var rgb;
          // color string
          if (color in COLORS) {
            rgb = COLORS[color];
            return {
              r: rgb[0],
              g: rgb[1],
              b: rgb[2]
            };
          }
          // hex
          else if (color[0] === HASH) {
            return this._hexToRgb(color.substring(1));
          }
          // rgb string
          else if (color.substr(0, 4) === RGB_PAREN) {
            rgb = RGB_REGEX.exec(color.replace(/ /g,'')); 
            return {
                r: parseInt(rgb[1], 10),
                g: parseInt(rgb[2], 10),
                b: parseInt(rgb[3], 10)
            };
          }
          // default
          else {
            return {
                r: 0,
                g: 0,
                b: 0
            };
          }
        },
        // o1 takes precedence over o2
        _merge: function(o1, o2) {
            var retObj = this._clone(o2);
            for(var key in o1) {
                if(this._isObject(o1[key])) {
                    retObj[key] = this._merge(o1[key], retObj[key]);
                }
                else {
                    retObj[key] = o1[key];
                }
            }
            return retObj;
        },
        // deep clone
        _clone: function(obj) {
            var retObj = {};
            for(var key in obj) {
                if(this._isObject(obj[key])) {
                    retObj[key] = this._clone(obj[key]);
                }
                else {
                    retObj[key] = obj[key];
                }
            }
            return retObj;
        },
        _degToRad: function(deg) {
            return deg * PI_OVER_DEG180;
        },
        _radToDeg: function(rad) {
            return rad * DEG180_OVER_PI;
        },
        _capitalize: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        warn: function(str) {
            /*
             * IE9 on Windows7 64bit will throw a JS error
             * if we don't use window.console in the conditional
             */
            if(window.console && console.warn) {
                console.warn(KINETIC_WARNING + str);
            }
        },
        extend: function(c1, c2) {
            for(var key in c2.prototype) {
                if(!( key in c1.prototype)) {
                    c1.prototype[key] = c2.prototype[key];
                }
            }
        },
        /**
         * adds methods to a constructor prototype
         * @method
         * @memberof Kinetic.Util.prototype
         * @param {Function} constructor
         * @param {Object} methods
         */
        addMethods: function(constructor, methods) {
          var key;

          for (key in methods) {
            constructor.prototype[key] = methods[key];
          }
        },
        _getControlPoints: function(p0, p1, p2, t) {
            var x0 = p0.x;
            var y0 = p0.y;
            var x1 = p1.x;
            var y1 = p1.y;
            var x2 = p2.x;
            var y2 = p2.y;
            var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
            var d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            var fa = t * d01 / (d01 + d12);
            var fb = t * d12 / (d01 + d12);
            var p1x = x1 - fa * (x2 - x0);
            var p1y = y1 - fa * (y2 - y0);
            var p2x = x1 + fb * (x2 - x0);
            var p2y = y1 + fb * (y2 - y0);
            return [{
                x: p1x,
                y: p1y
            }, {
                x: p2x,
                y: p2y
            }];
        },
        _expandPoints: function(points, tension) {
            var length = points.length, 
                allPoints = [],
                n, cp;

            for(n = 1; n < length - 1; n++) {
                cp = Kinetic.Util._getControlPoints(points[n - 1], points[n], points[n + 1], tension);
                allPoints.push(cp[0]);
                allPoints.push(points[n]);
                allPoints.push(cp[1]);
            }

            return allPoints;
        }
    };
})();
;(function() {    
    // calculate pixel ratio
    var canvas = document.createElement('canvas'), 
        context = canvas.getContext('2d'), 
        devicePixelRatio = window.devicePixelRatio || 1, 
        backingStoreRatio = context.webkitBackingStorePixelRatio 
            || context.mozBackingStorePixelRatio 
            || context.msBackingStorePixelRatio 
            || context.oBackingStorePixelRatio 
            || context.backingStorePixelRatio || 1, 
        _pixelRatio = devicePixelRatio / backingStoreRatio;
        
    /**
     * Canvas Renderer constructor
     * @constructor
     * @abstract
     * @memberof Kinetic
     * @param {Number} width
     * @param {Number} height
     */
    Kinetic.Canvas = function(config) {
        this.init(config);
    };

    Kinetic.Canvas.prototype = {
        init: function(config) {
            config = config || {};

            var width = config.width || 0,
                height = config.height || 0,
                pixelRatio = config.pixelRatio || _pixelRatio,
                contextType = config.contextType || '2d'; 

            this.pixelRatio = pixelRatio;
            this.element = document.createElement('canvas');
            this.element.style.padding = 0;
            this.element.style.margin = 0;
            this.element.style.border = 0;
            this.element.style.background = 'transparent';
            this.context = this.element.getContext(contextType);
            this.setSize(width, height);   
        },        
        /**
         * get canvas element
         * @method
         * @memberof Kinetic.Canvas.prototype
         */
        getElement: function() {
            return this.element;
        },
        /**
         * get canvas context
         * @method
         * @memberof Kinetic.Canvas.prototype
         */
        getContext: function() {
            return this.context;
        },
        /**
         * set width
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Number} width
         */
        setWidth: function(width) {
            // take into account pixel ratio
            this.width = this.element.width = width * this.pixelRatio;
            this.element.style.width = width + 'px';
        },
        /**
         * set height
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Number} height
         */
        setHeight: function(height) {
            // take into account pixel ratio
            this.height = this.element.height = height * this.pixelRatio;
            this.element.style.height = height + 'px';
        },
        /**
         * get width
         * @method
         * @memberof Kinetic.Canvas.prototype
         */
        getWidth: function() {
            return this.width;
        },
        /**
         * get height
         * @method
         * @memberof Kinetic.Canvas.prototype
         */
        getHeight: function() {
            return this.height;
        },
        /**
         * set size
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Number} width
         * @param {Number} height
         */
        setSize: function(width, height) {
            this.setWidth(width);
            this.setHeight(height);
        },
        /**
         * clear canvas
         * @method
         * @memberof Kinetic.Canvas.prototype
         */
        clear: function() {
            var context = this.getContext();
            var el = this.getElement();
            context.clearRect(0, 0, this.getWidth(), this.getHeight());
        },
        /**
         * to data url
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {String} mimeType
         * @param {Number} quality between 0 and 1 for jpg mime types
         */
        toDataURL: function(mimeType, quality) {
            try {
                // If this call fails (due to browser bug, like in Firefox 3.6),
                // then revert to previous no-parameter image/png behavior
                return this.element.toDataURL(mimeType, quality);
            }
            catch(e) {
                try {
                    return this.element.toDataURL();
                }
                catch(err) {
                    Kinetic.Util.warn('Unable to get data URL. ' + err.message);
                    return '';
                }
            }
        },
        /**
         * fill shape
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Kinetic.Shape} shape
         */
        fill: function(shape) {
            if(shape.getFillEnabled()) {
                this._fill(shape);
            }
        },
        /**
         * stroke shape
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Kinetic.Shape} shape
         */
        stroke: function(shape) {
            if(shape.getStrokeEnabled()) {
                this._stroke(shape);
            }
        },
        /**
         * fill, stroke, and apply shadows
         *  will only be applied to either the fill or stroke.&nbsp; Fill
         *  is given priority over stroke.
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Kinetic.Shape} shape
         */
        fillStroke: function(shape) {
            var fillEnabled = shape.getFillEnabled();
            if(fillEnabled) {
                this._fill(shape);
            }

            if(shape.getStrokeEnabled()) {
                this._stroke(shape, shape.hasShadow() && shape.hasFill() && fillEnabled);
            }
        },
        /**
         * apply shadow
         * @method
         * @memberof Kinetic.Canvas.prototype
         * @param {Kinetic.Shape} shape
         * @param {Function} drawFunc
         */
        applyShadow: function(shape, drawFunc) {
            var context = this.context;
            context.save();
            this._applyShadow(shape);
            drawFunc();
            context.restore();
            drawFunc();
        },
        _applyLineCap: function(shape) {
            var lineCap = shape.getLineCap();
            if(lineCap) {
                this.context.lineCap = lineCap;
            }
        },
        _applyOpacity: function(shape) {
            var absOpacity = shape.getAbsoluteOpacity();
            if(absOpacity !== 1) {
                this.context.globalAlpha = absOpacity;
            }
        },
        _applyLineJoin: function(shape) {
            var lineJoin = shape.getLineJoin();
            if(lineJoin) {
                this.context.lineJoin = lineJoin;
            }
        },
        _applyAncestorTransforms: function(node) {
            var context = this.context,
                t, m;

            node._eachAncestorReverse(function(no) {
                t = no.getTransform(true); 
                m = t.getMatrix();
                context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }, true);
        },
        _clip: function(container) {
            var context = this.getContext(); 
            context.save();
            this._applyAncestorTransforms(container);
            context.beginPath(); 
            container.getClipFunc()(this);
            context.clip();
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
    };

    Kinetic.SceneCanvas = function(config) {
        Kinetic.Canvas.call(this, config);
    };

    Kinetic.SceneCanvas.prototype = {
        setWidth: function(width) {  
            var pixelRatio = this.pixelRatio;           
            Kinetic.Canvas.prototype.setWidth.call(this, width);
            this.context.scale(pixelRatio, pixelRatio);
        },
        setHeight: function(height) { 
            var pixelRatio = this.pixelRatio; 
            Kinetic.Canvas.prototype.setHeight.call(this, height);
            this.context.scale(pixelRatio, pixelRatio);
        },
        _fillColor: function(shape) {
            var context = this.context, fill = shape.getFill();
            context.fillStyle = fill;
            shape._fillFunc(context);
        },
        _fillPattern: function(shape) {
            var context = this.context, 
                fillPatternImage = shape.getFillPatternImage(), 
                fillPatternX = shape.getFillPatternX(), 
                fillPatternY = shape.getFillPatternY(), 
                fillPatternScale = shape.getFillPatternScale(), 
                fillPatternRotation = shape.getFillPatternRotation(), 
                fillPatternOffset = shape.getFillPatternOffset(), 
                fillPatternRepeat = shape.getFillPatternRepeat();

            if(fillPatternX || fillPatternY) {
                context.translate(fillPatternX || 0, fillPatternY || 0);
            }
            if(fillPatternRotation) {
                context.rotate(fillPatternRotation);
            }
            if(fillPatternScale) {
                context.scale(fillPatternScale.x, fillPatternScale.y);
            }
            if(fillPatternOffset) {
                context.translate(-1 * fillPatternOffset.x, -1 * fillPatternOffset.y);
            }

            context.fillStyle = context.createPattern(fillPatternImage, fillPatternRepeat || 'repeat');
            context.fill();
        },
        _fillLinearGradient: function(shape) {
            var context = this.context, 
                start = shape.getFillLinearGradientStartPoint(), 
                end = shape.getFillLinearGradientEndPoint(), 
                colorStops = shape.getFillLinearGradientColorStops(), 
                grd = context.createLinearGradient(start.x, start.y, end.x, end.y);

            if (colorStops) {
                // build color stops
                for(var n = 0; n < colorStops.length; n += 2) {
                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
                }
                context.fillStyle = grd;
                context.fill();  
            }
        },
        _fillRadialGradient: function(shape) {
            var context = this.context, 
            start = shape.getFillRadialGradientStartPoint(), 
            end = shape.getFillRadialGradientEndPoint(), 
            startRadius = shape.getFillRadialGradientStartRadius(), 
            endRadius = shape.getFillRadialGradientEndRadius(), 
            colorStops = shape.getFillRadialGradientColorStops(), 
            grd = context.createRadialGradient(start.x, start.y, startRadius, end.x, end.y, endRadius);

            // build color stops
            for(var n = 0; n < colorStops.length; n += 2) {
                grd.addColorStop(colorStops[n], colorStops[n + 1]);
            }
            context.fillStyle = grd;
            context.fill();
        },
        _fill: function(shape, skipShadow) {
            var context = this.context, 
                hasColor = shape.getFill(), 
                hasPattern = shape.getFillPatternImage(), 
                hasLinearGradient = shape.getFillLinearGradientColorStops(), 
                hasRadialGradient = shape.getFillRadialGradientColorStops(), 
                fillPriority = shape.getFillPriority();

            context.save();

            if(!skipShadow && shape.hasShadow()) {
                this._applyShadow(shape);
            }

            // priority fills
            if(hasColor && fillPriority === 'color') {
                this._fillColor(shape);
            }
            else if(hasPattern && fillPriority === 'pattern') {
                this._fillPattern(shape);
            }
            else if(hasLinearGradient && fillPriority === 'linear-gradient') {
                this._fillLinearGradient(shape);
            }
            else if(hasRadialGradient && fillPriority === 'radial-gradient') {
                this._fillRadialGradient(shape);
            }
            // now just try and fill with whatever is available
            else if(hasColor) {
                this._fillColor(shape);
            }
            else if(hasPattern) {
                this._fillPattern(shape);
            }
            else if(hasLinearGradient) {
                this._fillLinearGradient(shape);
            }
            else if(hasRadialGradient) {
                this._fillRadialGradient(shape);
            }
            context.restore();

            if(!skipShadow && shape.hasShadow()) {
                this._fill(shape, true);
            }
        },
        _stroke: function(shape, skipShadow) {
            var context = this.context, 
                stroke = shape.getStroke(), 
                strokeWidth = shape.getStrokeWidth(), 
                dashArray = shape.getDashArray();

            if(stroke || strokeWidth) {
                context.save();
                if (!shape.getStrokeScaleEnabled()) {
                  
                    context.setTransform(1, 0, 0, 1, 0, 0);
                }
                this._applyLineCap(shape);
                if(dashArray && shape.getDashArrayEnabled()) {
                    if(context.setLineDash) {
                        context.setLineDash(dashArray);
                    }
                    else if('mozDash' in context) {
                        context.mozDash = dashArray;
                    }
                    else if('webkitLineDash' in context) {
                        context.webkitLineDash = dashArray;
                    }
                }
                if(!skipShadow && shape.hasShadow()) {
                    this._applyShadow(shape);
                }
                context.lineWidth = strokeWidth || 2;
                context.strokeStyle = stroke || 'black';
                shape._strokeFunc(context);
                context.restore();

                if(!skipShadow && shape.hasShadow()) {
                    this._stroke(shape, true);
                }
            }
        },
        _applyShadow: function(shape) {
            var context = this.context;
            if(shape.hasShadow() && shape.getShadowEnabled()) {
                var aa = shape.getAbsoluteOpacity();
                // defaults
                var color = shape.getShadowColor() || 'black';
                var blur = shape.getShadowBlur() || 5;
                var offset = shape.getShadowOffset() || {
                    x: 0,
                    y: 0
                };

                if(shape.getShadowOpacity()) {
                    context.globalAlpha = shape.getShadowOpacity() * aa;
                }
                context.shadowColor = color;
                context.shadowBlur = blur;
                context.shadowOffsetX = offset.x;
                context.shadowOffsetY = offset.y;
            }
        }
    };
    Kinetic.Util.extend(Kinetic.SceneCanvas, Kinetic.Canvas);

    Kinetic.HitCanvas = function(config) {
        Kinetic.Canvas.call(this, config);
    };

    Kinetic.HitCanvas.prototype = {
        _fill: function(shape) {
            var context = this.context;
            context.save();
            context.fillStyle = shape.colorKey;
            shape._fillFuncHit(context);
            context.restore();
        },
        _stroke: function(shape) {
            var context = this.context, 
                stroke = shape.getStroke(), 
                strokeWidth = shape.getStrokeWidth();

            if(stroke || strokeWidth) {
                this._applyLineCap(shape);
                context.save();
                context.lineWidth = strokeWidth || 2;
                context.strokeStyle = shape.colorKey;
                shape._strokeFuncHit(context);
                context.restore();
            }
        }
    };
    Kinetic.Util.extend(Kinetic.HitCanvas, Kinetic.Canvas);

})();
;(function() {
    // CONSTANTS
    var SPACE = ' ',
        EMPTY_STRING = '',
        DOT = '.',
        GET = 'get',
        SET = 'set',
        SHAPE = 'Shape',
        STAGE = 'Stage',
        X = 'x',
        Y = 'y',
        UPPER_X = 'X',
        UPPER_Y = 'Y',
        KINETIC = 'kinetic',
        BEFORE = 'before',
        CHANGE = 'Change',
        ID = 'id',
        NAME = 'name',
        MOUSEENTER = 'mouseenter',
        MOUSELEAVE = 'mouseleave',
        DEG = 'Deg',
        ON = 'on',
        OFF = 'off',
        BEFORE_DRAW = 'beforeDraw',
        DRAW = 'draw',
        BLACK = 'black',
        RGB = 'RGB',
        R = 'r',
        G = 'g',
        B = 'b',
        UPPER_R = 'R',
        UPPER_G = 'G',
        UPPER_B = 'B',
        HASH = '#',
        CHILDREN = 'children';
        
    Kinetic.Util.addMethods(Kinetic.Node, {
        _nodeInit: function(config) {
            this._id = Kinetic.Global.idCounter++;
            this.eventListeners = {};
            this.setAttrs(config);
        },
        /**
         * bind events to the node. KineticJS supports mouseover, mousemove,
         *  mouseout, mouseenter, mouseleave, mousedown, mouseup, click, dblclick, touchstart, touchmove,
         *  touchend, tap, dbltap, dragstart, dragmove, and dragend events. Pass in a string
         *  of events delimmited by a space to bind multiple events at once
         *  such as 'mousedown mouseup mousemove'. Include a namespace to bind an
         *  event by name such as 'click.foobar'.
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} typesStr e.g. 'click', 'mousedown touchstart', 'mousedown.foo touchstart.foo'
         * @param {Function} handler The handler function is passed an event object
         * @example
         * // add click listener<br>
         * node.on('click', function() {<br>
         *   console.log('you clicked me!');<br>
         * });<br><br>
         * 
         * // get the target node<br>
         * node.on('click', function(evt) {<br>
         *   console.log(evt.targetNode);<br>
         * });<br><br>
         *
         * // stop event propagation<br>
         * node.on('click', function(evt) {<br>
         *   evt.cancelBubble = true;<br>
         * });<br><br>
         *
         * // bind multiple listeners<br>
         * node.on('click touchstart', function() {<br>
         *   console.log('you clicked/touched me!');<br>
         * });<br><br>
         *
         * // namespace listener<br>
         * node.on('click.foo', function() {<br>
         *   console.log('you clicked/touched me!');<br>
         * });
         */
        on: function(typesStr, handler) {
            var types = typesStr.split(SPACE),
                len = types.length,
                n, type, event, parts, baseEvent, name;
            
             /*
             * loop through types and attach event listeners to
             * each one.  eg. 'click mouseover.namespace mouseout'
             * will create three event bindings
             */
            for(n = 0; n < len; n++) {
                type = types[n];
                event = type;
                parts = event.split(DOT);
                baseEvent = parts[0];
                name = parts.length > 1 ? parts[1] : EMPTY_STRING;

                if(!this.eventListeners[baseEvent]) {
                    this.eventListeners[baseEvent] = [];
                }

                this.eventListeners[baseEvent].push({
                    name: name,
                    handler: handler
                });
            }
            return this;
        },
        /**
         * remove event bindings from the node. Pass in a string of
         *  event types delimmited by a space to remove multiple event
         *  bindings at once such as 'mousedown mouseup mousemove'.
         *  include a namespace to remove an event binding by name
         *  such as 'click.foobar'. If you only give a name like '.foobar',
         *  all events in that namespace will be removed.
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} typesStr e.g. 'click', 'mousedown touchstart', '.foobar'
         * @example
         * // remove listener<br>
         * node.off('click');<br><br>
         *
         * // remove multiple listeners<br>
         * node.off('click touchstart');<br><br>
         *
         * // remove listener by name<br>
         * node.off('click.foo');
         */
        off: function(typesStr) {
            var types = typesStr.split(SPACE),
                len = types.length,
                n, type, t, event, parts, baseEvent;
                
            for(n = 0; n < len; n++) {
                type = types[n];
                event = type;
                parts = event.split(DOT);
                baseEvent = parts[0];

                if(parts.length > 1) {
                    if(baseEvent) {
                        if(this.eventListeners[baseEvent]) {
                            this._off(baseEvent, parts[1]);
                        }
                    }
                    else {
                        for(t in this.eventListeners) {
                            this._off(t, parts[1]);
                        }
                    }
                }
                else {
                    delete this.eventListeners[baseEvent];
                }
            }
            return this;
        },
        /**
         * remove self from parent, but don't destroy
         * @method
         * @memberof Kinetic.Node.prototype
         * @example
         * node.remove();
         */
        remove: function() {
            var parent = this.getParent();
            
            if(parent && parent.children) {
                parent.children.splice(this.index, 1);
                parent._setChildrenIndices();
                delete this.parent;
            }
            
            return this;
        },
        /**
         * remove and destroy self
         * @method
         * @memberof Kinetic.Node.prototype
         * @example
         * node.destroy();
         */
        destroy: function() {
            var go = Kinetic.Global;

            // remove from ids and names hashes
            go._removeId(this.getId());
            go._removeName(this.getName(), this._id);

            this.remove();
        },
        /**
         * get attr
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} attr  
         * @example
         * var x = node.getAttr('x');
         */
        getAttr: function(attr) {
            var method = GET + Kinetic.Util._capitalize(attr);
            if(Kinetic.Util._isFunction(this[method])) {
                return this[method]();
            }
            // otherwise get directly
            else {
                return this.attrs[attr];
            }
        },
        /**
         * set attr
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} attr  
         * #param {*} val
         * @example
         * node.setAttr('x', 5);
         */
        setAttr: function() {
            var args = Array.prototype.slice.call(arguments),
                attr = args[0],
                method = SET + Kinetic.Util._capitalize(attr),
                func = this[method];

            args.shift();
            if(Kinetic.Util._isFunction(func)) {
                func.apply(this, args);
            }
            // otherwise set directly
            else {
                this.attrs[attr] = args[0];
            }
            return this;
        },
        /**
         * get attrs object literal
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getAttrs: function() {
            return this.attrs || {};
        },
        createAttrs: function() {
            if(this.attrs === undefined) {
                this.attrs = {};
            }
            return this;
        },
        
        /**
         * set multiple attrs at once using an object literal
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Object} config object containing key value pairs
         * @example
         * node.setAttrs({<br>
         *   x: 5,<br>
         *   fill: 'red'<br>
         * });<br>
         */
        setAttrs: function(config) {
            var key, method;
            
            if(config) {
                for(key in config) {
                    if (key === CHILDREN) {
                   
                    }
                    else {
                        method = SET + Kinetic.Util._capitalize(key);
                        // use setter if available
                        if(Kinetic.Util._isFunction(this[method])) {
                            this[method](config[key]);
                        }
                        // otherwise set directly
                        else {
                            this._setAttr(key, config[key]);
                        }
                    }
                }
            }
            return this;
        },
        /**
         * determine if node is visible or not.  Node is visible only
         *  if it's visible and all of its ancestors are visible.  If an ancestor
         *  is invisible, this means that the node is also invisible
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getVisible: function() {
            var visible = this.attrs.visible, 
                parent = this.getParent();
              
            // default  
            if (visible === undefined) {
                visible = true;  
            }
            
            if(visible && parent && !parent.getVisible()) {
                return false;
            }
            return visible;
        },
        /**
         * determine if node is listening or not.  Node is listening only
         *  if it's listening and all of its ancestors are listening.  If an ancestor
         *  is not listening, this means that the node is also not listening
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getListening: function() {
            var listening = this.attrs.listening, 
                parent = this.getParent();
                
            // default  
            if (listening === undefined) {
                listening = true;  
            }
            
            if(listening && parent && !parent.getListening()) {
                return false;
            }
            return listening;
        },
        /**
         * show node
         * @method
         * @memberof Kinetic.Node.prototype
         */
        show: function() {
            this.setVisible(true);
            return this;
        },
        /**
         * hide node.  Hidden nodes are no longer detectable
         * @method
         * @memberof Kinetic.Node.prototype
         */
        hide: function() {
            this.setVisible(false);
            return this;
        },
        /**
         * get zIndex relative to the node's siblings who share the same parent
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getZIndex: function() {
            return this.index || 0;
        },
        /**
         * get absolute z-index which takes into account sibling
         *  and ancestor indices
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getAbsoluteZIndex: function() {
            var level = this.getLevel(),
                stage = this.getStage(),
                that = this,
                index = 0,
                nodes, len, n, child;
                
            function addChildren(children) {
                nodes = [];
                len = children.length;
                for(n = 0; n < len; n++) {
                    child = children[n];
                    index++;

                    if(child.nodeType !== SHAPE) {
                        nodes = nodes.concat(child.getChildren().toArray());
                    }

                    if(child._id === that._id) {
                        n = len;
                    }
                }

                if(nodes.length > 0 && nodes[0].getLevel() <= level) {
                    addChildren(nodes);
                }
            }
            if(that.nodeType !== STAGE) {
                addChildren(that.getStage().getChildren());
            }

            return index;
        },
        /**
         * get node level in node tree.  Returns an integer.<br><br>
         *  e.g. Stage level will always be 0.  Layers will always be 1.  Groups and Shapes will always
         *  be >= 2
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getLevel: function() {
            var level = 0,
                parent = this.parent;
                
            while(parent) {
                level++;
                parent = parent.parent;
            }
            return level;
        },
        /**
         * set node position relative to parent
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Number} x
         * @param {Number} y
         * @example
         * // set x and y<br>
         * node.setPosition(5, 10);<br><br>
         *
         * // set x only<br>
         * node.setPosition({<br>
         *   x: 5<br>
         * });<br><br>
         *
         * // set x and y using an array<br>
         * node.setPosition([5, 10]);<br><br>
         *
         * // set both x and y to 5<br>
         * node.setPosition(5);
         */
        setPosition: function() {
            var pos = Kinetic.Util._getXY([].slice.call(arguments));
            this.setX(pos.x);
            this.setY(pos.y);
            return this;
        },
        /**
         * get node position relative to parent
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getPosition: function() {
            return {
                x: this.getX(),
                y: this.getY()
            };
        },
        /**
         * get absolute position relative to the top left corner of the stage container div
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getAbsolutePosition: function() {
            var trans = this.getAbsoluteTransform(),
                o = this.getOffset();
                
            trans.translate(o.x, o.y);
            return trans.getTranslation();
        },
        /**
         * set absolute position
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Number} x
         * @param {Number} y
         */
        setAbsolutePosition: function() {
            var pos = Kinetic.Util._getXY([].slice.call(arguments)),
                trans = this._clearTransform(),
                it;
                
            // don't clear translation
            this.attrs.x = trans.x;
            this.attrs.y = trans.y;
            delete trans.x;
            delete trans.y;

            // unravel transform
            it = this.getAbsoluteTransform();

            it.invert();
            it.translate(pos.x, pos.y);
            pos = {
                x: this.attrs.x + it.getTranslation().x,
                y: this.attrs.y + it.getTranslation().y
            };

            this.setPosition(pos.x, pos.y);
            this._setTransform(trans);
            return this;
        },
        /**
         * move node by an amount relative to its current position
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Number} x
         * @param {Number} y
         * @example
         * // move node in x direction by 1px and y direction by 2px<br>
         * node.move(1, 2);<br><br>
         *
         * // move node in x direction by 1px<br>
         * node.move({<br>
         *   x: 1<br>
         * });
         */
        move: function() {
            var pos = Kinetic.Util._getXY([].slice.call(arguments)),
                x = this.getX(),
                y = this.getY();

            if(pos.x !== undefined) {
                x += pos.x;
            }

            if(pos.y !== undefined) {
                y += pos.y;
            }

            this.setPosition(x, y);
            return this;
        },
        _eachAncestorReverse: function(func, includeSelf) {
            var family = [], 
                parent = this.getParent(),
                len, n;

            // build family by traversing ancestors
            if(includeSelf) {
                family.unshift(this);
            }
            while(parent) {
                family.unshift(parent);
                parent = parent.parent;
            }

            len = family.length;
            for(n = 0; n < len; n++) {
                func(family[n]);
            }
        },
        /**
         * rotate node by an amount in radians relative to its current rotation
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Number} theta
         */
        rotate: function(theta) {
            this.setRotation(this.getRotation() + theta);
            return this;
        },
        /**
         * rotate node by an amount in degrees relative to its current rotation
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Number} deg
         */
        rotateDeg: function(deg) {
            this.setRotation(this.getRotation() + Kinetic.Util._degToRad(deg));
            return this;
        },
        /**
         * move node to the top of its siblings
         * @method
         * @memberof Kinetic.Node.prototype
         */
        moveToTop: function() {
            var index = this.index;
            this.parent.children.splice(index, 1);
            this.parent.children.push(this);
            this.parent._setChildrenIndices();
            return true;
        },
        /**
         * move node up
         * @method
         * @memberof Kinetic.Node.prototype
         */
        moveUp: function() {
            var index = this.index,
                len = this.parent.getChildren().length;
            if(index < len - 1) {
                this.parent.children.splice(index, 1);
                this.parent.children.splice(index + 1, 0, this);
                this.parent._setChildrenIndices();
                return true;
            }
            return false;
        },
        /**
         * move node down
         * @method
         * @memberof Kinetic.Node.prototype
         */
        moveDown: function() {
            var index = this.index;
            if(index > 0) {
                this.parent.children.splice(index, 1);
                this.parent.children.splice(index - 1, 0, this);
                this.parent._setChildrenIndices();
                return true;
            }
            return false;
        },
        /**
         * move node to the bottom of its siblings
         * @method
         * @memberof Kinetic.Node.prototype
         */
        moveToBottom: function() {
            var index = this.index;
            if(index > 0) {
                this.parent.children.splice(index, 1);
                this.parent.children.unshift(this);
                this.parent._setChildrenIndices();
                return true;
            }
            return false;
        },
        /**
         * set zIndex relative to siblings
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Integer} zIndex
         */
        setZIndex: function(zIndex) {
            var index = this.index;
            this.parent.children.splice(index, 1);
            this.parent.children.splice(zIndex, 0, this);
            this.parent._setChildrenIndices();
            return this;
        },
        /**
         * get absolute opacity
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getAbsoluteOpacity: function() {
            var absOpacity = this.getOpacity();
            if(this.getParent()) {
                absOpacity *= this.getParent().getAbsoluteOpacity();
            }
            return absOpacity;
        },
        /**
         * move node to another container
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Container} newContainer
         * @example
         * // move node from current layer into layer2<br>
         * node.moveTo(layer2);
         */
        moveTo: function(newContainer) {
            Kinetic.Node.prototype.remove.call(this);
            newContainer.add(this);
            return this;
        },
        /**
         * convert Node into an object for serialization.  Returns an object.
         * @method
         * @memberof Kinetic.Node.prototype
         */
        toObject: function() {
            var type = Kinetic.Util, 
                obj = {}, 
                attrs = this.getAttrs(),
                key, val;

            obj.attrs = {};

            // serialize only attributes that are not function, image, DOM, or objects with methods
            for(key in attrs) {
                val = attrs[key];
                if(!type._isFunction(val) && !type._isElement(val) && !(type._isObject(val) && type._hasMethods(val))) {
                    obj.attrs[key] = val;
                }
            }

            obj.className = this.getClassName();
            return obj;
        },
        /**
         * convert Node into a JSON string.  Returns a JSON string.
         * @method
         * @memberof Kinetic.Node.prototype
         */
        toJSON: function() {
            return JSON.stringify(this.toObject());
        },
        /**
         * get parent container
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getParent: function() {
            return this.parent;
        },
        /**
         * get layer ancestor
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getLayer: function() {
            return this.getParent().getLayer();
        },
        /**
         * get stage ancestor
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getStage: function() {
            if(this.getParent()) {
                return this.getParent().getStage();
            }
            else {
                return undefined;
            }
        },
        /**
         * fire event
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} eventType event type.  can be a regular event, like click, mouseover, or mouseout, or it can be a custom event, like myCustomEvent
         * @param {EventObject} evt event object
         * @param {Boolean} bubble setting the value to false, or leaving it undefined, will result in the event 
         *  not bubbling.  Setting the value to true will result in the event bubbling.
         * @example
         * // manually fire click event<br>
         * node.fire('click');<br><br>
         *
         * // fire custom event<br>
         * node.fire('foo');<br><br>
         *
         * // fire custom event with custom event object<br>
         * node.fire('foo', {<br>
         *   bar: 10<br>
         * });<br><br>
         *
         * // fire click event that bubbles<br>
         * node.fire('click', null, true);
         */
        fire: function(eventType, evt, bubble) {
            // bubble
            if (bubble) {
                this._fireAndBubble(eventType, evt || {});
            }
            // no bubble
            else {
                this._fire(eventType, evt || {});
            }
            return this;
        },
        /**
         * get absolute transform of the node which takes into
         *  account its ancestor transforms
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getAbsoluteTransform: function() {
            // absolute transform
            var am = new Kinetic.Transform(),
                m;

            this._eachAncestorReverse(function(node) {
                m = node.getTransform();
                am.multiply(m);
            }, true);
            return am;
        },
        _getAndCacheTransform: function() {
            var m = new Kinetic.Transform(), 
                x = this.getX(), 
                y = this.getY(), 
                rotation = this.getRotation(),
                scaleX = this.getScaleX(), 
                scaleY = this.getScaleY(), 
                skewX = this.getSkewX(), 
                skewY = this.getSkewY(), 
                offsetX = this.getOffsetX(), 
                offsetY = this.getOffsetY();
                
            if(x !== 0 || y !== 0) {
                m.translate(x, y);
            }
            if(rotation !== 0) {
                m.rotate(rotation);
            }
            if(skewX !== 0 || skewY !== 0) {
                m.skew(skewX, skewY);
            }
            if(scaleX !== 1 || scaleY !== 1) {
                m.scale(scaleX, scaleY);
            }
            if(offsetX !== 0 || offsetY !== 0) {
                m.translate(-1 * offsetX, -1 * offsetY);
            }
             
            // cache result
            this.cachedTransform = m;
            return m;
        },
        /**
         * get transform of the node
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getTransform: function(useCache) {
            var cachedTransform = this.cachedTransform;
            if (useCache && cachedTransform) {
                return cachedTransform;
            }
            else {
                return this._getAndCacheTransform();
            }
        },
        /**
         * clone node.  Returns a new Node instance with identical attributes.  You can also override
         *  the node properties with an object literal, enabling you to use an existing node as a template
         *  for another node
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Object} attrs override attrs
         * @example
         * // simple clone<br>
         * var clone = node.clone();<br><br>
         *
         * // clone a node and override the x position<br>
         * var clone = rect.clone({<br>
         *   x: 5<br>
         * });
         */
        clone: function(obj) {
            // instantiate new node
            var className = this.getClassName(),
                node = new Kinetic[className](this.attrs),
                key, allListeners, len, n, listener;

            // copy over listeners
            for(key in this.eventListeners) {
                allListeners = this.eventListeners[key];
                len = allListeners.length;
                for(n = 0; n < len; n++) {
                    listener = allListeners[n];
                    /*
                     * don't include kinetic namespaced listeners because
                     *  these are generated by the constructors
                     */
                    if(listener.name.indexOf(KINETIC) < 0) {
                        // if listeners array doesn't exist, then create it
                        if(!node.eventListeners[key]) {
                            node.eventListeners[key] = [];
                        }
                        node.eventListeners[key].push(listener);
                    }
                }
            }

            // apply attr overrides
            node.setAttrs(obj);
            return node;
        },
        /**
         * Creates a composite data URL. If MIME type is not
         * specified, then "image/png" will result. For "image/jpeg", specify a quality
         * level as quality (range 0.0 - 1.0)
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toDataURL: function(config) {
            config = config || {};

            var mimeType = config.mimeType || null, 
                quality = config.quality || null,
                stage = this.getStage(),
                x = config.x || 0, 
                y = config.y || 0,
                canvas = new Kinetic.SceneCanvas({
                    width: config.width || stage.getWidth(), 
                    height: config.height || stage.getHeight(),
                    pixelRatio: 1
                }),
                context = canvas.getContext();
            
            context.save();

            if(x || y) {
                context.translate(-1 * x, -1 * y);
            }

            this.drawScene(canvas);
            context.restore();

            return canvas.toDataURL(mimeType, quality);
        },
        /**
         * converts node into an image.  Since the toImage
         *  method is asynchronous, a callback is required.  toImage is most commonly used
         *  to cache complex drawings as an image so that they don't have to constantly be redrawn
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         * @example
         * var image = node.toImage({<br>
         *   callback: function(img) {<br>
         *     // do stuff with img<br>
         *   }<br>
         * });
         */
        toImage: function(config) {
            Kinetic.Util._getImage(this.toDataURL(config), function(img) {
                config.callback(img);
            });
        },
        /**
         * set size
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {Number} width
         * @param {Number} height
         */
        setSize: function() {
            // set stage dimensions
            var size = Kinetic.Util._getSize(Array.prototype.slice.call(arguments));
            this.setWidth(size.width);
            this.setHeight(size.height);
            return this;
        },
        /**
         * get size
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getSize: function() {
            return {
                width: this.getWidth(),
                height: this.getHeight()
            };
        },
        /**
         * get width
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getWidth: function() {
            return this.attrs.width || 0;
        },
        /**
         * get height
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getHeight: function() {
            return this.attrs.height || 0;
        },
        /**
         * get class name, which may return Stage, Layer, Group, or shape class names like Rect, Circle, Text, etc.
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getClassName: function() {
            return this.className || this.nodeType;
        },
        /**
         * get the node type, which may return Stage, Layer, Group, or Node
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getType: function() {
            return this.nodeType;
        },
        _get: function(selector) {
            return this.nodeType === selector ? [this] : [];
        },
        _off: function(type, name) {
            var evtListeners = this.eventListeners[type],
                i;
                
            for(i = 0; i < evtListeners.length; i++) {
                if(evtListeners[i].name === name) {
                    evtListeners.splice(i, 1);
                    if(evtListeners.length === 0) {
                        delete this.eventListeners[type];
                        break;
                    }
                    i--;
                }
            }
        },
        _clearTransform: function() {

            var trans = {
                x: this.getX(),
                y: this.getY(),
                rotation: this.getRotation(),
                scaleX: this.getScaleX(),
                scaleY: this.getScaleY(),
                offsetX: this.getOffsetX(),
                offsetY: this.getOffsetY(),
                skewX: this.getSkewX(),
                skewY: this.getSkewY()
            };

            this.attrs.x = 0;
            this.attrs.y = 0;
            this.attrs.rotation = 0;
            this.attrs.scaleX = 1;
            this.attrs.scaleY = 1;
            this.attrs.offsetX = 0;
            this.attrs.offsetY = 0;
            this.attrs.skewX = 0;
            this.attrs.skewY = 0;

            return trans;
        },
        _setTransform: function(trans) {
            var key;
            
            for(key in trans) {
                this.attrs[key] = trans[key];
            }

            this.cachedTransform = null;
        },
        _fireBeforeChangeEvent: function(attr, oldVal, newVal) {
            this._fire(BEFORE + Kinetic.Util._capitalize(attr) + CHANGE, {
                oldVal: oldVal,
                newVal: newVal
            });
        },
        _fireChangeEvent: function(attr, oldVal, newVal) {
            this._fire(attr + CHANGE, {
                oldVal: oldVal,
                newVal: newVal
            });
        },
        /**
         * set id
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} id
         */
        setId: function(id) {
            var oldId = this.getId(), 
                stage = this.getStage(), 
                go = Kinetic.Global;
                
            go._removeId(oldId);
            go._addId(this, id);
            this._setAttr(ID, id);
            return this;
        },
        /**
         * set name
         * @method
         * @memberof Kinetic.Node.prototype
         * @param {String} name
         */
        setName: function(name) {
            var oldName = this.getName(), 
                stage = this.getStage(), 
                go = Kinetic.Global;
                
            go._removeName(oldName, this._id);
            go._addName(this, name);
            this._setAttr(NAME, name);
            return this;
        },
        _setAttr: function(key, val) {
            var oldVal;
            if(val !== undefined) {
                oldVal = this.attrs[key];
                this._fireBeforeChangeEvent(key, oldVal, val);
                this.attrs[key] = val;
                this._fireChangeEvent(key, oldVal, val);
            }
        },
        _fireAndBubble: function(eventType, evt, compareShape) {
            if(evt && this.nodeType === SHAPE) {
                evt.targetNode = this;
            }
            var stage = this.getStage();
            var el = this.eventListeners;
            var okayToRun = true;

            if(eventType === MOUSEENTER && compareShape && this._id === compareShape._id) {
                okayToRun = false;
            }
            else if(eventType === MOUSELEAVE && compareShape && this._id === compareShape._id) {
                okayToRun = false;
            }

            if(okayToRun) {                
                this._fire(eventType, evt);

                // simulate event bubbling
                if(evt && !evt.cancelBubble && this.parent) {
                    if(compareShape && compareShape.parent) {
                        this._fireAndBubble.call(this.parent, eventType, evt, compareShape.parent);
                    }
                    else {
                        this._fireAndBubble.call(this.parent, eventType, evt);
                    }
                }
            }
        },
        _fire: function(eventType, evt) {
            var events = this.eventListeners[eventType],
                len, i;
                
            if (events) {
                len = events.length;
                for(i = 0; i < len; i++) {
                    events[i].handler.call(this, evt);
                }
            }
        },
        /*
         * draw both scene and hit graphs.  If the node being drawn is the stage, all of the layers will be cleared and redra
         * @method
         * @memberof Kinetic.Node.prototype
         *  the scene renderer
         */
        draw: function() {
            var evt = {
                node: this
            };
            
            this._fire(BEFORE_DRAW, evt);
            this.drawScene();
            this.drawHit();
            this._fire(DRAW, evt);
            return this;
        },
        shouldDrawHit: function() { 
            return this.isVisible() && this.isListening() && !Kinetic.Global.isDragging(); 
        },
        isDraggable: function() {
            return false;
        }
    });

    // setter functions
    Kinetic.Node.setPoints = function(val) {
        var points = Kinetic.Util._getPoints(val);
        this._setAttr('points', points);
    };

    // getter setter adders
    Kinetic.Node.addGetterSetter = function(constructor, attr, def, isTransform) {
        this.addGetter(constructor, attr, def);
        this.addSetter(constructor, attr, isTransform);
    };
    Kinetic.Node.addPointGetterSetter = function(constructor, attr, def, isTransform) {
        this.addPointGetter(constructor, attr);
        this.addPointSetter(constructor, attr);  

        // add invdividual component getters and setters
        this.addGetter(constructor, attr + UPPER_X, def);
        this.addGetter(constructor, attr + UPPER_Y, def);
        this.addSetter(constructor, attr + UPPER_X, isTransform);
        this.addSetter(constructor, attr + UPPER_Y, isTransform);
    };
    Kinetic.Node.addPointsGetterSetter = function(constructor, attr) {
        this.addPointsGetter(constructor, attr);
        this.addPointsSetter(constructor, attr);  
    };
    Kinetic.Node.addRotationGetterSetter = function(constructor, attr, def, isTransform) {
        this.addRotationGetter(constructor, attr, def);
        this.addRotationSetter(constructor, attr, isTransform);    
    };
    Kinetic.Node.addColorGetterSetter = function(constructor, attr) {
        this.addGetter(constructor, attr);
        this.addSetter(constructor, attr); 
  
        // component getters 
        this.addColorRGBGetter(constructor, attr);
        this.addColorComponentGetter(constructor, attr, R);
        this.addColorComponentGetter(constructor, attr, G);
        this.addColorComponentGetter(constructor, attr, B);

        // component setters
        this.addColorRGBSetter(constructor, attr);
        this.addColorComponentSetter(constructor, attr, R);
        this.addColorComponentSetter(constructor, attr, G);
        this.addColorComponentSetter(constructor, attr, B);
    };

    // getter adders
    Kinetic.Node.addColorRGBGetter = function(constructor, attr) {
        var method = GET + Kinetic.Util._capitalize(attr) + RGB;
        constructor.prototype[method] = function() {
            return Kinetic.Util.getRGB(this.attrs[attr]);
        };
    };

    Kinetic.Node.addColorComponentGetter = function(constructor, attr, c) {
        var prefix = GET + Kinetic.Util._capitalize(attr),
            method = prefix + Kinetic.Util._capitalize(c);
        constructor.prototype[method] = function() {
            return this[prefix + RGB]()[c];
        };
    };
    Kinetic.Node.addPointsGetter = function(constructor, attr) {
        var that = this,
            method = GET + Kinetic.Util._capitalize(attr);
           
        constructor.prototype[method] = function(arg) {
            var val = this.attrs[attr];
            return val === undefined ? [] : val;  
        };
    };
    Kinetic.Node.addGetter = function(constructor, attr, def) {
        var that = this,
            method = GET + Kinetic.Util._capitalize(attr);
           
        constructor.prototype[method] = function(arg) {
            var val = this.attrs[attr];
            return val === undefined ? def : val;  
        };
    };
    Kinetic.Node.addPointGetter = function(constructor, attr) {
        var that = this,
            baseMethod = GET + Kinetic.Util._capitalize(attr);
            
        constructor.prototype[baseMethod] = function(arg) {
            var that = this;
            return {
                x: that[baseMethod + UPPER_X](),
                y: that[baseMethod + UPPER_Y]()
            };  
        };
    };
    Kinetic.Node.addRotationGetter = function(constructor, attr, def) {
        var that = this,
            method = GET + Kinetic.Util._capitalize(attr);
            
        // radians
        constructor.prototype[method] = function() {
            var val = this.attrs[attr];
            if (val === undefined) {
                val = def; 
            }
            return val;
        };
        // degrees
        constructor.prototype[method + DEG] = function() {
            var val = this.attrs[attr];
            if (val === undefined) {
                val = def; 
            }
            return Kinetic.Util._radToDeg(val);
        };
    };

    // setter adders
    Kinetic.Node.addColorRGBSetter = function(constructor, attr) {
        var method = SET + Kinetic.Util._capitalize(attr) + RGB;

        constructor.prototype[method] = function(obj) {
            var r = obj && obj.r !== undefined ? obj.r | 0 : this.getAttr(attr + UPPER_R),
                g = obj && obj.g !== undefined ? obj.g | 0 : this.getAttr(attr + UPPER_G),
                b = obj && obj.b !== undefined ? obj.b | 0 : this.getAttr(attr + UPPER_B);

            this._setAttr(attr, HASH + Kinetic.Util._rgbToHex(r, g, b));
        };
    };

    Kinetic.Node.addColorComponentSetter = function(constructor, attr, c) {
        var prefix = SET + Kinetic.Util._capitalize(attr),
            method = prefix + Kinetic.Util._capitalize(c);
        constructor.prototype[method] = function(val) {
            var obj = {};
            obj[c] = val;
            this[prefix + RGB](obj);
        };
    };
    Kinetic.Node.addPointsSetter = function(constructor, attr) {
        var method = SET + Kinetic.Util._capitalize(attr);
        constructor.prototype[method] = Kinetic.Node.setPoints;
    };
    Kinetic.Node.addSetter = function(constructor, attr, isTransform) {
        var that = this,
            method = SET + Kinetic.Util._capitalize(attr);
            
        constructor.prototype[method] = function(val) {
            this._setAttr(attr, val);
            if (isTransform) {
                this.cachedTransform = null;
            }
        };
    };
    Kinetic.Node.addPointSetter = function(constructor, attr) {
        var that = this,
            baseMethod = SET + Kinetic.Util._capitalize(attr);
            
        constructor.prototype[baseMethod] = function() {
            var pos = Kinetic.Util._getXY([].slice.call(arguments)),
                oldVal = this.attrs[attr],
                x = 0,
                y = 0;

            if (pos) {
              x = pos.x;
              y = pos.y;

              this._fireBeforeChangeEvent(attr, oldVal, pos);
              if (x !== undefined) {
                this[baseMethod + UPPER_X](x);
              }
              if (y !== undefined) {
                this[baseMethod + UPPER_Y](y);
              }
              this._fireChangeEvent(attr, oldVal, pos);
            }    
        };
    };
    Kinetic.Node.addRotationSetter = function(constructor, attr, isTransform) {
        var that = this,
            method = SET + Kinetic.Util._capitalize(attr);
            
        // radians
        constructor.prototype[method] = function(val) {
            this._setAttr(attr, val);
            if (isTransform) {
                this.cachedTransform = null;
            }
        };
        // degrees
        constructor.prototype[method + DEG] = function(deg) {
            this._setAttr(attr, Kinetic.Util._degToRad(deg));
            if (isTransform) {
                this.cachedTransform = null;
            }
        };
    };

    /**
     * create node with JSON string.  De-serializtion does not generate custom
     *  shape drawing functions, images, or event handlers (this would make the
     *  serialized object huge).  If your app uses custom shapes, images, and
     *  event handlers (it probably does), then you need to select the appropriate
     *  shapes after loading the stage and set these properties via on(), setDrawFunc(),
     *  and setImage() methods
     * @method
     * @memberof Kinetic.Node
     * @param {String} JSON string
     * @param {DomElement} [container] optional container dom element used only if you're
     *  creating a stage node
     */
    Kinetic.Node.create = function(json, container) {
        return this._createNode(JSON.parse(json), container);
    };
    Kinetic.Node._createNode = function(obj, container) {
        var className = Kinetic.Node.prototype.getClassName.call(obj),
            children = obj.children,
            no, len, n;

        // if container was passed in, add it to attrs
        if(container) {
            obj.attrs.container = container;
        }

        no = new Kinetic[className](obj.attrs);
        if(children) {
            len = children.length;
            for(n = 0; n < len; n++) {
                no.add(this._createNode(children[n]));
            }
        }

        return no;
    };
    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Node, 'x', 0, true);

    /**
     * set x position
     * @name setX
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} x
     */

    /**
     * get x position
     * @name getX
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Node, 'y', 0, true);

    /**
     * set y position
     * @name setY
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} y
     */

    /**
     * get y position
     * @name getY
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Node, 'opacity', 1);

    /**
     * set opacity.  Opacity values range from 0 to 1.
     *  A node with an opacity of 0 is fully transparent, and a node
     *  with an opacity of 1 is fully opaque
     * @name setOpacity
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Object} opacity
     */

    /**
     * get opacity.
     * @name getOpacity
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addGetter(Kinetic.Node, 'name');

     /**
     * get name
     * @name getName
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addGetter(Kinetic.Node, 'id');

    /**
     * get id
     * @name getId
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addRotationGetterSetter(Kinetic.Node, 'rotation', 0, true);

    /**
     * set rotation in radians
     * @name setRotation
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} theta
     */

    /**
     * set rotation in degrees
     * @name setRotationDeg
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} deg
     */

    /**
     * get rotation in degrees
     * @name getRotationDeg
     * @method
     * @memberof Kinetic.Node.prototype
     */

    /**
     * get rotation in radians
     * @name getRotation
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Node, 'scale', 1, true);

    /**
     * set scale
     * @name setScale
     * @param {Number} scale
     * @method
     * @memberof Kinetic.Node.prototype
     * @example
     * // set x and y to the same value<br>
     * shape.setScale(5);<br><br>
     *
     * // set x and y<br>
     * shape.setScale(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setScale({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setScale([20, 40]);
     */

     /**
     * set scale x
     * @name setScaleX
     * @param {Number} x
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * set scale y
     * @name setScaleY
     * @param {Number} y
     * @method
     * @memberof Kinetic.Node.prototype
     */

    /**
     * get scale
     * @name getScale
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * get scale x
     * @name getScaleX
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * get scale y
     * @name getScaleY
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Node, 'skew', 0, true);

    /**
     * set skew
     * @name setSkew
     * @param {Number} x
     * @param {Number} y
     * @method
     * @memberof Kinetic.Node.prototype
     * @example
     * // set x and y<br>
     * shape.setSkew(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setSkew({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setSkew([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setSkew(5);
     */

     /**
     * set skew x
     * @name setSkewX
     * @param {Number} x
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * set skew y
     * @name setSkewY
     * @param {Number} y
     * @method
     * @memberof Kinetic.Node.prototype
     */

    /**
     * get skew 
     * @name getSkew
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * get skew x
     * @name getSkewX
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * get skew y
     * @name getSkewY
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Node, 'offset', 0, true);

    /**
     * set offset.  A node's offset defines the position and rotation point
     * @name setOffset
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} x
     * @param {Number} y
     * @example
     * // set x and y<br>
     * shape.setOffset(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setOffset({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setOffset([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setOffset(5);
     */

     /**
     * set offset x
     * @name setOffsetX
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} x
     */

     /**
     * set offset y
     * @name setOffsetY
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} y
     */

    /**
     * get offset
     * @name getOffset
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * get offset x
     * @name getOffsetX
     * @method
     * @memberof Kinetic.Node.prototype
     */

     /**
     * get offset y
     * @name getOffsetY
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addSetter(Kinetic.Node, 'width');

    /**
     * set width
     * @name setWidth
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} width
     */

    Kinetic.Node.addSetter(Kinetic.Node, 'height');

    /**
     * set height
     * @name setHeight
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Number} height
     */

    Kinetic.Node.addSetter(Kinetic.Node, 'listening');

    /**
     * listen or don't listen to events
     * @name setListening
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Boolean} listening
     */

    Kinetic.Node.addSetter(Kinetic.Node, 'visible');

    /**
     * set visible
     * @name setVisible
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Boolean} visible
     */

    // aliases
    /**
     * Alias of getListening()
     * @name isListening
     * @method
     * @memberof Kinetic.Node.prototype
     */
    Kinetic.Node.prototype.isListening = Kinetic.Node.prototype.getListening;
    /**
     * Alias of getVisible()
     * @name isVisible
     * @method
     * @memberof Kinetic.Node.prototype
     */
    Kinetic.Node.prototype.isVisible = Kinetic.Node.prototype.getVisible;
    
    Kinetic.Collection.mapMethods([
        'on', 
        'off', 
        'remove', 
        'destroy', 
        'show', 
        'hide', 
        'move', 
        'rotate', 
        'moveToTop', 
        'moveUp', 
        'moveDown', 
        'moveToBottom',  
        'moveTo', 
        'fire', 
        'draw'
    ]);
})();
;(function() {
    /**
     * Animation constructor.  A stage is used to contain multiple layers and handle
     * @constructor
     * @memberof Kinetic
     * @param {Function} func function executed on each animation frame.  The function is passed a frame object, which contains
     *  timeDiff, lastTime, time, and frameRate properties.  The timeDiff property is the number of milliseconds that have passed
     *  since the last animation frame.  The lastTime property is time in milliseconds that elapsed from the moment the animation started
     *  to the last animation frame.  The time property is the time in milliseconds that ellapsed from the moment the animation started
     *  to the current animation frame.  The frameRate property is the current frame rate in frames / second
     * @param {Kinetic.Layer|Array} [layers] layer(s) to be redrawn on each animation frame. Can be a layer, an array of layers, or null.  
     *  Not specifying a node will result in no redraw.
     * @example
     * // move a node to the right at 50 pixels / second<br>
     * var velocity = 50;<br><br>
     *
     * var anim = new Kinetic.Animation(function(frame) {<br>
     *   var dist = velocity * (frame.timeDiff / 1000);<br>
     *   node.move(dist, 0);<br>
     * }, layer);<br><br>
     *
     * anim.start();
     */
    Kinetic.Animation = function(func, layers) {
        this.func = func;
        this.setLayers(layers);
        this.id = Kinetic.Animation.animIdCounter++;
        this.frame = {
            time: 0,
            timeDiff: 0,
            lastTime: new Date().getTime()
        };
    };
    /*
     * Animation methods
     */
    Kinetic.Animation.prototype = {
        /**
         * set layers to be redrawn on each animation frame
         * @method
         * @memberof Kinetic.Animation.prototype
         * @param {Kinetic.Layer|Array} [layers] layer(s) to be redrawn.&nbsp; Can be a layer, an array of layers, or null.  Not specifying a node will result in no redraw.
         */
        setLayers: function(layers) {
            var lays = []; 
            // if passing in no layers
            if (!layers) {
                lays = [];
            }
            // if passing in an array of Layers
            // NOTE: layers could be an array or Kinetic.Collection.  for simplicity, I'm just inspecting
            // the length property to check for both cases
            else if (layers.length > 0) {
                lays = layers;
            }
            // if passing in a Layer
            else {
                lays = [layers];
            }

            this.layers = lays;
        },
        /**
         * get layers
         * @method
         * @memberof Kinetic.Animation.prototype
         */
        getLayers: function() {
            return this.layers;
        },
        /**
         * add layer.  Returns true if the layer was added, and false if it was not
         * @method
         * @memberof Kinetic.Animation.prototype
         * @param {Kinetic.Layer} layer
         */
        addLayer: function(layer) {
            var layers = this.layers,
                len, n;

            if (layers) {
                len = layers.length;

                // don't add the layer if it already exists
                for (n = 0; n < len; n++) {
                    if (layers[n]._id === layer._id) {
                        return false; 
                    } 
                } 
            }
            else {
                this.layers = [];
            }

            this.layers.push(layer);
            return true;
        },
        /**
         * determine if animation is running or not.  returns true or false
         * @method
         * @memberof Kinetic.Animation.prototype
         */
        isRunning: function() {
            var a = Kinetic.Animation, animations = a.animations;
            for(var n = 0; n < animations.length; n++) {
                if(animations[n].id === this.id) {
                    return true;
                }
            }
            return false;
        },
        /**
         * start animation
         * @method
         * @memberof Kinetic.Animation.prototype
         */
        start: function() {
            this.stop();
            this.frame.timeDiff = 0;
            this.frame.lastTime = new Date().getTime();
            Kinetic.Animation._addAnimation(this);
        },
        /**
         * stop animation
         * @method
         * @memberof Kinetic.Animation.prototype
         */
        stop: function() {
            Kinetic.Animation._removeAnimation(this);
        },
        _updateFrameObject: function(time) {
            this.frame.timeDiff = time - this.frame.lastTime;
            this.frame.lastTime = time;
            this.frame.time += this.frame.timeDiff;
            this.frame.frameRate = 1000 / this.frame.timeDiff;
        }
    };
    Kinetic.Animation.animations = [];
    Kinetic.Animation.animIdCounter = 0;
    Kinetic.Animation.animRunning = false;

    Kinetic.Animation._addAnimation = function(anim) {
        this.animations.push(anim);
        this._handleAnimation();
    };
    Kinetic.Animation._removeAnimation = function(anim) {
        var id = anim.id, animations = this.animations, len = animations.length;
        for(var n = 0; n < len; n++) {
            if(animations[n].id === id) {
                this.animations.splice(n, 1);
                break;
            }
        }
    };

    Kinetic.Animation._runFrames = function() {
        var layerHash = {}, 
            animations = this.animations,
            anim, layers, func, n, i, layersLen, layer, key;
        /*
         * loop through all animations and execute animation
         *  function.  if the animation object has specified node,
         *  we can add the node to the nodes hash to eliminate
         *  drawing the same node multiple times.  The node property
         *  can be the stage itself or a layer
         */
        /*
         * WARNING: don't cache animations.length because it could change while
         * the for loop is running, causing a JS error
         */
        for(n = 0; n < animations.length; n++) {
            anim = animations[n];
            layers = anim.layers; 
            func = anim.func;

            anim._updateFrameObject(new Date().getTime());
            layersLen = layers.length;

            for (i=0; i<layersLen; i++) {
                layer = layers[i];
                if(layer._id !== undefined) {
                    layerHash[layer._id] = layer;
                }
            }

            // if animation object has a function, execute it
            if(func) {
                func.call(anim, anim.frame);
            }
        }

        for(key in layerHash) {
            layerHash[key].draw();
        }
    };
    Kinetic.Animation._animationLoop = function() {
        var that = this;
        if(this.animations.length > 0) {
            this._runFrames();
            Kinetic.Animation.requestAnimFrame(function() {
                that._animationLoop();
            });
        }
        else {
            this.animRunning = false;
        }
    };
    Kinetic.Animation._handleAnimation = function() {
        var that = this;
        if(!this.animRunning) {
            this.animRunning = true;
            that._animationLoop();
        }
    };
    RAF = (function() {
        return window.requestAnimationFrame 
            || window.webkitRequestAnimationFrame 
            || window.mozRequestAnimationFrame 
            || window.oRequestAnimationFrame 
            || window.msRequestAnimationFrame 
            || FRAF;
    })();

    function FRAF(callback) {
        window.setTimeout(callback, 1000 / 60);
    }

    Kinetic.Animation.requestAnimFrame = function(callback) {
        var raf = Kinetic.DD && Kinetic.DD.isDragging ? FRAF : RAF;
        raf(callback);
    };
    
    var moveTo = Kinetic.Node.prototype.moveTo;
    Kinetic.Node.prototype.moveTo = function(container) {
        moveTo.call(this, container);
    };

    Kinetic.Layer.batchAnim = new Kinetic.Animation(function() {
        if (this.getLayers().length === 0) {
            this.stop();
        }
        this.setLayers([]);
    });

    /**
     * get batch draw
     * @method
     * @memberof Kinetic.Layer.prototype
     */
    Kinetic.Layer.prototype.batchDraw = function() {
        var batchAnim = Kinetic.Layer.batchAnim;
        batchAnim.addLayer(this);  

        if (!batchAnim.isRunning()) {
            batchAnim.start(); 
        } 
    };
})();;(function() {
    var blacklist = {
        node: 1,
        duration: 1,
        easing: 1,
        onFinish: 1,
        yoyo: 1
    },

    PAUSED = 1,
    PLAYING = 2,
    REVERSING = 3,

    idCounter = 0;

    /**
     * Tween constructor.  Tweens enable you to animate a node between the current state and a new state.
     *  You can play, pause, reverse, seek, reset, and finish tweens.  By default, tweens are animated using
     *  a linear easing.  For more tweening options, check out {@link Kinetic.Easings}
     * @constructor
     * @memberof Kinetic
     * @example
     * // instantiate new tween which fully rotates a node in 1 second
     * var tween = new Kinetic.Tween({<br>
     *   node: node,<br>
     *   rotationDeg: 360,<br>
     *   duration: 1,<br>
     *   easing: Kinetic.Easings.EaseInOut<br>   
     * });<br><br>
     * 
     * // play tween<br>
     * tween.play();<br><br>
     *
     * // pause tween<br>
     * tween.pause();
     */
    Kinetic.Tween = function(config) {
        var that = this,
            node = config.node,
            nodeId = node._id,
            duration = config.duration || 1,
            easing = config.easing || Kinetic.Easings.Linear,
            yoyo = !!config.yoyo,
            key, tween, start, tweenId;

        this.node = node;
        this._id = idCounter++;
        this.onFinish = config.onFinish;

        this.anim = new Kinetic.Animation(function() {
            that.tween.onEnterFrame();
        }, node.getLayer() || node.getLayers());

        this.tween = new Tween(key, function(i) {
            that._tweenFunc(i);
        }, easing, 0, 1, duration * 1000, yoyo);

        this._addListeners();

        // init attrs map
        if (!Kinetic.Tween.attrs[nodeId]) {
            Kinetic.Tween.attrs[nodeId] = {};
        }
        if (!Kinetic.Tween.attrs[nodeId][this._id]) {
            Kinetic.Tween.attrs[nodeId][this._id] = {};
        }
        // init tweens map
        if (!Kinetic.Tween.tweens[nodeId]) {
            Kinetic.Tween.tweens[nodeId] = {};
        }

        for (key in config) {
            if (blacklist[key] === undefined) {
                this._addAttr(key, config[key]);
            }
        }

        this.reset();
    };

    // start/diff object = attrs.nodeId.tweenId.attr
    Kinetic.Tween.attrs = {};
    // tweenId = tweens.nodeId.attr
    Kinetic.Tween.tweens = {};

    Kinetic.Tween.prototype = {
        _addAttr: function(key, end) {
            var node = this.node,
                nodeId = node._id,
                start, diff, tweenId, n, len, startVal, endVal;

            // remove conflict from tween map if it exists
            tweenId = Kinetic.Tween.tweens[nodeId][key];

            if (tweenId) {
                delete Kinetic.Tween.attrs[nodeId][tweenId][key];
            }

            // add to tween map
            start = node.getAttr(key);
            
            if (Kinetic.Util._isArray(end)) {
                end = Kinetic.Util._getPoints(end);
                diff = [];
                len = end.length;
                for (n=0; n<len; n++) { 
                    startVal = start[n];
                    endVal = end[n];
                    diff.push({
                        x: endVal.x - startVal.x,
                        y: endVal.y - startVal.y
                    });
                }

            }
            else {
                diff = end - start;
            }

            Kinetic.Tween.attrs[nodeId][this._id][key] = {
                start: start,
                diff: diff
            };    
            Kinetic.Tween.tweens[nodeId][key] = this._id; 
        },
        _tweenFunc: function(i) {
            var node = this.node,
                attrs = Kinetic.Tween.attrs[node._id][this._id],
                key, attr, start, diff, newVal, n, len, startVal, diffVal;

            for (key in attrs) {
                attr = attrs[key];
                start = attr.start;
                diff = attr.diff;

                if (Kinetic.Util._isArray(start)) {
                    newVal = [];
                    len = start.length;
                    for (n=0; n<len; n++) {
                        startVal = start[n];
                        diffVal = diff[n];
                        newVal.push({
                            x: startVal.x + (diffVal.x * i),
                            y: startVal.y + (diffVal.y * i)
                        });
                    }
                }
                else {
                    newVal = start + (diff * i); 
                }
                 
                node.setAttr(key, newVal);
            }
        },
        _addListeners: function() {
            var that = this;

            // start listeners
            this.tween.onPlay = function() {
                that.anim.start();
            };
            this.tween.onReverse = function() {
                that.anim.start();
            };

            // stop listeners
            this.tween.onPause = function() {
                that.anim.stop();
            };
            this.tween.onFinish = function() {
                if (that.onFinish) {
                    that.onFinish();
                }
            };
        },
        /**
         * play
         * @method
         * @memberof Kinetic.Tween.prototype
         */
        play: function() {
            this.tween.play();
            return this;
        },
        /**
         * reverse
         * @method
         * @memberof Kinetic.Tween.prototype
         */
        reverse: function() {
            this.tween.reverse();
            return this;
        },
        /**
         * reset
         * @method
         * @memberof Kinetic.Tween.prototype
         */
        reset: function() {
            var node = this.node;
            this.tween.reset();
            (node.getLayer() || node.getLayers()).draw();
            return this;
        },
        /**
         * seek
         * @method
         * @memberof Kinetic.Tween.prototype
         * @param {Integer} t time in seconds between 0 and the duration
         */
        seek: function(t) {
            var node = this.node;
            this.tween.seek(t * 1000);
            (node.getLayer() || node.getLayers()).draw();
            return this;
        },
        /**
         * pause
         * @method
         * @memberof Kinetic.Tween.prototype
         */
        pause: function() {
            this.tween.pause();
            return this;
        },
        /**
         * finish
         * @method
         * @memberof Kinetic.Tween.prototype
         */
        finish: function() {
            var node = this.node;
            this.tween.finish();
            (node.getLayer() || node.getLayers()).draw();
            return this;
        },
        /**
         * destroy
         * @method
         * @memberof Kinetic.Tween.prototype
         */
        destroy: function() {
            var nodeId = this.node._id,
                thisId = this._id,
                attrs = Kinetic.Tween.tweens[nodeId],
                key;

            this.pause();

            for (key in attrs) {
                delete Kinetic.Tween.tweens[nodeId][key];
            }

            delete Kinetic.Tween.attrs[nodeId][thisId];
        }
    };

    var Tween = function(prop, propFunc, func, begin, finish, duration, yoyo) {
        this.prop = prop;
        this.propFunc = propFunc;
        this.begin = begin;
        this._pos = begin;
        this.duration = duration;
        this._change = 0;
        this.prevPos = 0;
        this.yoyo = yoyo;
        this._time = 0;
        this._position = 0;
        this._startTime = 0;
        this._finish = 0;
        this.func = func;
        this._change = finish - this.begin;
        this.pause();
    };
    /*
     * Tween methods
     */
    Tween.prototype = {
        fire: function(str) {
            var handler = this[str];
            if (handler) {
                handler();
            }
        },
        setTime: function(t) {
            if(t > this.duration) {
                if(this.yoyo) {
                    this._time = this.duration;
                    this.reverse();
                }
                else {
                    this.finish();
                }
            }
            else if(t < 0) {
                if(this.yoyo) {
                    this._time = 0;
                    this.play();
                }
                else {
                    this.reset();
                }
            }
            else {
                this._time = t;
                this.update();
            }
        },
        getTime: function() {
            return this._time;
        },
        setPosition: function(p) {
            this.prevPos = this._pos;
            this.propFunc(p);
            this._pos = p;
        },
        getPosition: function(t) {
            if(t === undefined) {
                t = this._time;
            }
            return this.func(t, this.begin, this._change, this.duration);
        },
        play: function() {
            this.state = PLAYING;
            this._startTime = this.getTimer() - this._time;
            this.onEnterFrame();
            this.fire('onPlay');
        },
        reverse: function() {
            this.state = REVERSING;
            this._time = this.duration - this._time;
            this._startTime = this.getTimer() - this._time;
            this.onEnterFrame();
            this.fire('onReverse');
        },
        seek: function(t) {
            this.pause();
            this._time = t;
            this.update();
            this.fire('onSeek');
        },
        reset: function() {
            this.pause();
            this._time = 0;
            this.update();
            this.fire('onReset');
        },
        finish: function() {
            this.pause();
            this._time = this.duration;
            this.update();
            this.fire('onFinish');
        },
        update: function() {
            this.setPosition(this.getPosition(this._time));
        },
        onEnterFrame: function() {
            var t = this.getTimer() - this._startTime;
            if(this.state === PLAYING) {
                this.setTime(t);
            }
            else if (this.state === REVERSING) {
                this.setTime(this.duration - t);
            }
        },
        pause: function() {
            this.state = PAUSED; 
            this.fire('onPause');
        },
        getTimer: function() {
            return new Date().getTime();
        }
    };

    /*
    * These eases were ported from an Adobe Flash tweening library to JavaScript
    * by Xaric
    */

    /** 
     * @namespace Easings
     * @memberof Kinetic
     */
    Kinetic.Easings = {
        /**
        * back ease in
        * @function
        * @memberof Kinetic.Easings
        */
        'BackEaseIn': function(t, b, c, d, a, p) {
            var s = 1.70158;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        /**
        * back ease out
        * @function
        * @memberof Kinetic.Easings
        */
        'BackEaseOut': function(t, b, c, d, a, p) {
            var s = 1.70158;
            return c * (( t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        /**
        * back ease in out
        * @function
        * @memberof Kinetic.Easings
        */
        'BackEaseInOut': function(t, b, c, d, a, p) {
            var s = 1.70158;
            if((t /= d / 2) < 1) {
                return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
            }
            return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        },
        /**
        * elastic ease in
        * @function
        * @memberof Kinetic.Easings
        */
        'ElasticEaseIn': function(t, b, c, d, a, p) {
            // added s = 0
            var s = 0;
            if(t === 0) {
                return b;
            }
            if((t /= d) == 1) {
                return b + c;
            }
            if(!p) {
                p = d * 0.3;
            }
            if(!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            }
            else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        },
        /**
        * elastic ease out
        * @function
        * @memberof Kinetic.Easings
        */
        'ElasticEaseOut': function(t, b, c, d, a, p) {
            // added s = 0
            var s = 0;
            if(t === 0) {
                return b;
            }
            if((t /= d) == 1) {
                return b + c;
            }
            if(!p) {
                p = d * 0.3;
            }
            if(!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            }
            else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
        },
        /**
        * elastic ease in out
        * @function
        * @memberof Kinetic.Easings
        */
        'ElasticEaseInOut': function(t, b, c, d, a, p) {
            // added s = 0
            var s = 0;
            if(t === 0) {
                return b;
            }
            if((t /= d / 2) == 2) {
                return b + c;
            }
            if(!p) {
                p = d * (0.3 * 1.5);
            }
            if(!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            }
            else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            if(t < 1) {
                return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            }
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
        },
        /**
        * bounce ease out
        * @function
        * @memberof Kinetic.Easings
        */
        'BounceEaseOut': function(t, b, c, d) {
            if((t /= d) < (1 / 2.75)) {
                return c * (7.5625 * t * t) + b;
            }
            else if(t < (2 / 2.75)) {
                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
            }
            else if(t < (2.5 / 2.75)) {
                return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
            }
            else {
                return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
            }
        },
        /**
        * bounce ease in
        * @function
        * @memberof Kinetic.Easings
        */
        'BounceEaseIn': function(t, b, c, d) {
            return c - Kinetic.Easings.BounceEaseOut(d - t, 0, c, d) + b;
        },
        /**
        * bounce ease in out
        * @function
        * @memberof Kinetic.Easings
        */
        'BounceEaseInOut': function(t, b, c, d) {
            if(t < d / 2) {
                return Kinetic.Easings.BounceEaseIn(t * 2, 0, c, d) * 0.5 + b;
            }
            else {
                return Kinetic.Easings.BounceEaseOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
            }
        },
        /**
        * ease in
        * @function
        * @memberof Kinetic.Easings
        */
        'EaseIn': function(t, b, c, d) {
            return c * (t /= d) * t + b;
        },
        /**
        * ease out
        * @function
        * @memberof Kinetic.Easings
        */
        'EaseOut': function(t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
        },
        /**
        * ease in out
        * @function
        * @memberof Kinetic.Easings
        */
        'EaseInOut': function(t, b, c, d) {
            if((t /= d / 2) < 1) {
                return c / 2 * t * t + b;
            }
            return -c / 2 * ((--t) * (t - 2) - 1) + b;
        },
        /**
        * strong ease in
        * @function
        * @memberof Kinetic.Easings
        */
        'StrongEaseIn': function(t, b, c, d) {
            return c * (t /= d) * t * t * t * t + b;
        },
        /**
        * strong ease out
        * @function
        * @memberof Kinetic.Easings
        */
        'StrongEaseOut': function(t, b, c, d) {
            return c * (( t = t / d - 1) * t * t * t * t + 1) + b;
        },
        /**
        * strong ease in out
        * @function
        * @memberof Kinetic.Easings
        */
        'StrongEaseInOut': function(t, b, c, d) {
            if((t /= d / 2) < 1) {
                return c / 2 * t * t * t * t * t + b;
            }
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        },
        /**
        * linear
        * @function
        * @memberof Kinetic.Easings
        */
        'Linear': function(t, b, c, d) {
            return c * t / d + b;
        }
    };
})();;(function() {
    Kinetic.DD = {
        // properties
        anim: new Kinetic.Animation(),
        isDragging: false,
        offset: {
            x: 0,
            y: 0
        },
        node: null,
        
        // methods
        _drag: function(evt) {
            var dd = Kinetic.DD, 
                node = dd.node;
    
            if(node) {
                var pos = node.getStage().getPointerPosition();
                var dbf = node.getDragBoundFunc();
    
                var newNodePos = {
                    x: pos.x - dd.offset.x,
                    y: pos.y - dd.offset.y
                };
    
                if(dbf !== undefined) {
                    newNodePos = dbf.call(node, newNodePos, evt);
                }
    
                node.setAbsolutePosition(newNodePos);
    
                if(!dd.isDragging) {
                    dd.isDragging = true;
                    node.fire('dragstart', evt, true);
                }
                
                // execute ondragmove if defined
                node.fire('dragmove', evt, true);
            }
        },
        _endDragBefore: function(evt) {
            var dd = Kinetic.DD, 
                node = dd.node,
                nodeType, layer;
    
            if(node) {
                nodeType = node.nodeType,
                layer = node.getLayer();
                dd.anim.stop();
    
                // only fire dragend event if the drag and drop
                // operation actually started. 
                if(dd.isDragging) {
                    dd.isDragging = false;

                    if (evt) {
                        evt.dragEndNode = node;
                    } 
                }
                
                delete dd.node;
               
                (layer || node).draw();
            }
        },
        _endDragAfter: function(evt) {
            evt = evt || {};
            
            var dragEndNode = evt.dragEndNode;
                  
            if (evt && dragEndNode) {
              dragEndNode.fire('dragend', evt, true); 
            }
        }
    };

    // Node extenders
    
    /**
     * initiate drag and drop
     * @method
     * @memberof Kinetic.Node.prototype
     */
    Kinetic.Node.prototype.startDrag = function() {
        var dd = Kinetic.DD, 
            that = this, 
            stage = this.getStage(),
            layer = this.getLayer(), 
            pos = stage.getPointerPosition(),
            m = this.getTransform().getTranslation(), 
            ap = this.getAbsolutePosition();
                
        if(pos) {
            if (dd.node) {
                dd.node.stopDrag(); 
            }
          
            dd.node = this;
            dd.offset.x = pos.x - ap.x;
            dd.offset.y = pos.y - ap.y;
            dd.anim.setLayers(layer || this.getLayers());
            dd.anim.start();
        }
    };
    
    /**
     * stop drag and drop
     * @method
     * @memberof Kinetic.Node.prototype
     */
    Kinetic.Node.prototype.stopDrag = function() {
        var dd = Kinetic.DD,
            evt = {};
        dd._endDragBefore(evt);
        dd._endDragAfter(evt);
    };
            
    /**
     * set draggable
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {String} draggable
     */
    Kinetic.Node.prototype.setDraggable = function(draggable) {
        this._setAttr('draggable', draggable);
        this._dragChange();
    };

    var origDestroy = Kinetic.Node.prototype.destroy;

    Kinetic.Node.prototype.destroy = function() {
        var dd = Kinetic.DD;

        // stop DD
        if(dd.node && dd.node._id === this._id) {

            this.stopDrag();
        } 

        origDestroy.call(this); 
    };

    /**
     * determine if node is currently in drag and drop mode
     * @method
     * @memberof Kinetic.Node.prototype
     */
    Kinetic.Node.prototype.isDragging = function() {
        var dd = Kinetic.DD;
        return dd.node && dd.node._id === this._id && dd.isDragging;
    };

    Kinetic.Node.prototype._listenDrag = function() {
        this._dragCleanup();
        var that = this;
        this.on('mousedown.kinetic touchstart.kinetic', function(evt) {
            if(!Kinetic.DD.node) {
                that.startDrag(evt);
            }
        });
    };

    Kinetic.Node.prototype._dragChange = function() {
        if(this.attrs.draggable) {
            this._listenDrag();
        }
        else {
            // remove event listeners
            this._dragCleanup();

            /*
             * force drag and drop to end
             * if this node is currently in
             * drag and drop mode
             */
            var stage = this.getStage();
            var dd = Kinetic.DD;
            if(stage && dd.node && dd.node._id === this._id) {
                dd.node.stopDrag();
            }
        }
    };
    
    Kinetic.Node.prototype._dragCleanup = function() {
        this.off('mousedown.kinetic');
        this.off('touchstart.kinetic');
    };

    Kinetic.Node.addGetterSetter(Kinetic.Node, 'dragBoundFunc');

    /**
     * set drag bound function.  This is used to override the default
     *  drag and drop position
     * @name setDragBoundFunc
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Function} dragBoundFunc
     */

    /**
     * get dragBoundFunc
     * @name getDragBoundFunc
     * @method
     * @memberof Kinetic.Node.prototype
     */

    Kinetic.Node.addGetter(Kinetic.Node, 'draggable', false);
    
     /**
     * get draggable
     * @name getDraggable
     * @method
     * @memberof Kinetic.Node.prototype
     */

    /**
     * alias of getDraggable()
     * @name isDraggable
     * @method
     * @memberof Kinetic.Node.prototype
     */


    /**
     * alias of getDraggable
     * @name isDraggable
     * @method
     * @memberof Kinetic.Node.prototype
     */
     
    Kinetic.Node.prototype.isDraggable = Kinetic.Node.prototype.getDraggable;

    var html = document.getElementsByTagName('html')[0];
    html.addEventListener('mouseup', Kinetic.DD._endDragBefore, true);
    html.addEventListener('touchend', Kinetic.DD._endDragBefore, true);
    
    html.addEventListener('mouseup', Kinetic.DD._endDragAfter, false);
    html.addEventListener('touchend', Kinetic.DD._endDragAfter, false);
    
})();
;(function() {
    Kinetic.Util.addMethods(Kinetic.Container, {
        _containerInit: function(config) {
            this.children = new Kinetic.Collection();
            Kinetic.Node.call(this, config);
        },
        /**
         * returns a {@link Kinetic.Collection} of direct descendant nodes
         * @method
         * @memberof Kinetic.Container.prototype
         */
        getChildren: function() {
            return this.children;
        },
        /**
         * determine if node has children
         * @method
         * @memberof Kinetic.Container.prototype
         */
        hasChildren: function() {
            return this.getChildren().length > 0;
        },
        /**
         * remove all children
         * @method
         * @memberof Kinetic.Container.prototype
         */
        removeChildren: function() {
            var children = this.children,
                child;

            while(children.length > 0) {
                var child = children[0];
                if (child.hasChildren()) {
                    child.removeChildren();
                }
                child.remove();
            }

            return this;
        },
        /**
         * destroy all children
         * @method
         * @memberof Kinetic.Container.prototype
         */
        destroyChildren: function() {
            var children = this.children;
            while(children.length > 0) {
                children[0].destroy();
            }
            return this;
        },
        /**
         * add node to container
         * @method
         * @memberof Kinetic.Container.prototype
         * @param {Node} child
         */
        add: function(child) {
            var go = Kinetic.Global, children = this.children;
            child.index = children.length;
            child.parent = this;
            children.push(child);
            this._fire('add', {
                child: child
            });

            // chainable
            return this;
        },
        destroy: function() {
            // destroy children
            if (this.hasChildren()) {
                this.destroyChildren();
            }
            // then destroy self
            Kinetic.Node.prototype.destroy.call(this);
        },
        /**
         * return a {@link Kinetic.Collection} of nodes that match the selector.  Use '#' for id selections
         * and '.' for name selections.  You can also select by type or class name
         * @method
         * @memberof Kinetic.Container.prototype
         * @param {String} selector
         * @example
         * // select node with id foo<br>
         * var node = stage.get('#foo');<br><br>
         *
         * // select nodes with name bar inside layer<br>
         * var nodes = layer.get('.bar');<br><br>
         *
         * // select all groups inside layer<br>
         * var nodes = layer.get('Group');<br><br>
         *
         * // select all rectangles inside layer<br>
         * var nodes = layer.get('Rect');
         */
        get: function(selector) {
            var collection = new Kinetic.Collection();
            // ID selector
            if(selector.charAt(0) === '#') {
                var node = this._getNodeById(selector.slice(1));
                if(node) {
                    collection.push(node);
                }
            }
            // name selector
            else if(selector.charAt(0) === '.') {
                var nodeList = this._getNodesByName(selector.slice(1));
                Kinetic.Collection.apply(collection, nodeList);
            }
            // unrecognized selector, pass to children
            else {
                var retArr = [];
                var children = this.getChildren();
                var len = children.length;
                for(var n = 0; n < len; n++) {
                    retArr = retArr.concat(children[n]._get(selector));
                }
                Kinetic.Collection.apply(collection, retArr);
            }
            return collection;
        },
        _getNodeById: function(key) {
            var stage = this.getStage(), go = Kinetic.Global, node = go.ids[key];
            if(node !== undefined && this.isAncestorOf(node)) {
                return node;
            }
            return null;
        },
        _getNodesByName: function(key) {
            var go = Kinetic.Global, arr = go.names[key] || [];
            return this._getDescendants(arr);
        },
        _get: function(selector) {
            var retArr = Kinetic.Node.prototype._get.call(this, selector);
            var children = this.getChildren();
            var len = children.length;
            for(var n = 0; n < len; n++) {
                retArr = retArr.concat(children[n]._get(selector));
            }
            return retArr;
        },
        // extenders
        toObject: function() {
            var obj = Kinetic.Node.prototype.toObject.call(this);

            obj.children = [];

            var children = this.getChildren();
            var len = children.length;
            for(var n = 0; n < len; n++) {
                var child = children[n];
                obj.children.push(child.toObject());
            }

            return obj;
        },
        _getDescendants: function(arr) {
            var retArr = [];
            var len = arr.length;
            for(var n = 0; n < len; n++) {
                var node = arr[n];
                if(this.isAncestorOf(node)) {
                    retArr.push(node);
                }
            }

            return retArr;
        },
        /**
         * determine if node is an ancestor
         * of descendant
         * @method
         * @memberof Kinetic.Container.prototype
         * @param {Kinetic.Node} node
         */
        isAncestorOf: function(node) {
            var parent = node.getParent();
            while(parent) {
                if(parent._id === this._id) {
                    return true;
                }
                parent = parent.getParent();
            }

            return false;
        },
        clone: function(obj) {
            // call super method
            var node = Kinetic.Node.prototype.clone.call(this, obj);

            this.getChildren().each(function(no) {
                node.add(no.clone());
            });
            return node;
        },
        /**
         * get all shapes that intersect a point.  Note: because this method must clear a temporary
         * canvas and redraw every shape inside the container, it should only be used for special sitations 
         * because it performs very poorly.  Please use the {@link Kinetic.Stage#getIntersection} method if at all possible
         * because it performs much better
         * @method
         * @memberof Kinetic.Container.prototype
         * @param {Object} pos
         */
        getAllIntersections: function() {
            var pos = Kinetic.Util._getXY(Array.prototype.slice.call(arguments));
            var arr = [];
            var shapes = this.get('Shape');

            var len = shapes.length;
            for(var n = 0; n < len; n++) {
                var shape = shapes[n];
                if(shape.isVisible() && shape.intersects(pos)) {
                    arr.push(shape);
                }
            }

            return arr;
        },
        _setChildrenIndices: function() {
            var children = this.children, len = children.length;
            for(var n = 0; n < len; n++) {
                children[n].index = n;
            }
        },
        drawScene: function(canvas) {
            var layer = this.getLayer(),
                clip = !!this.getClipFunc(),
                children, n, len;
                
            if (!canvas && layer) {
                canvas = layer.getCanvas(); 
            }  

            if(this.isVisible()) {
                if (clip) {
                    canvas._clip(this);
                }
                
                children = this.children; 
                len = children.length;
                
                for(n = 0; n < len; n++) {
                    children[n].drawScene(canvas);
                }
                
                if (clip) {
                    canvas.getContext().restore();
                }
            }

            return this;
        },
        drawHit: function() {
            var clip = !!this.getClipFunc() && this.nodeType !== 'Stage',
                n = 0, 
                len = 0, 
                children = [],
                hitCanvas;

            if(this.shouldDrawHit()) {
                if (clip) {
                    hitCanvas = this.getLayer().hitCanvas; 
                    hitCanvas._clip(this);
                }
                
                children = this.children; 
                len = children.length;

                for(n = 0; n < len; n++) {
                    children[n].drawHit();
                }
                if (clip) {
                    hitCanvas.getContext().restore();
                }
            }

            return this;
        }
    });

    Kinetic.Util.extend(Kinetic.Container, Kinetic.Node);

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Container, 'clipFunc');

    /**
     * set clipping function 
     * @name setClipFunc
     * @method
     * @memberof Kinetic.Container.prototype
     * @param {Number} deg
     */

    /**
     * get clipping function 
     * @name getClipFunc
     * @method
     * @memberof Kinetic.Container.prototype
     */
})();
;(function() {
    function _fillFunc(context) {
        context.fill();
    }
    function _strokeFunc(context) {
        context.stroke();
    }
    function _fillFuncHit(context) {
        context.fill();
    }
    function _strokeFuncHit(context) {
        context.stroke();
    }

    Kinetic.Util.addMethods(Kinetic.Shape, {
        _initShape: function(config) {
            this.nodeType = 'Shape';
            this._fillFunc = _fillFunc;
            this._strokeFunc = _strokeFunc;
            this._fillFuncHit = _fillFuncHit;
            this._strokeFuncHit = _strokeFuncHit;

            // set colorKey
            var shapes = Kinetic.Global.shapes;
            var key;

            while(true) {
                key = Kinetic.Util.getRandomColor();
                if(key && !( key in shapes)) {
                    break;
                }
            }

            this.colorKey = key;
            shapes[key] = this;

            this.createAttrs();
            // call super constructor
            Kinetic.Node.call(this, config);
        },
        hasChildren: function() {
            return false;
        },
        getChildren: function() {
            return [];
        },
        /**
         * get canvas context tied to the layer
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        getContext: function() {
            return this.getLayer().getContext();
        },
        /**
         * get canvas renderer tied to the layer.  Note that this returns a canvas renderer, not a canvas element
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        getCanvas: function() {
            return this.getLayer().getCanvas();
        },
        /**
         * returns whether or not a shadow will be rendered
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        hasShadow: function() {
            return !!(this.getShadowColor() || this.getShadowBlur() || this.getShadowOffsetX() || this.getShadowOffsetY());
        },
        /**
         * returns whether or not a fill is present
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        hasFill: function() {
            return !!(this.getFill() || this.getFillPatternImage() || this.getFillLinearGradientColorStops() || this.getFillRadialGradientColorStops());
        },
        _get: function(selector) {
            return this.className === selector || this.nodeType === selector ? [this] : [];
        },
        /**
         * determines if point is in the shape, regardless if other shapes are on top of it.  Note: because
         *  this method clears a temporary canvas and then redraws the shape, it performs very poorly if executed many times
         *  consecutively.  Please use the {@link Kinetic.Stage#getIntersection} method if at all possible
         *  because it performs much better
         * @method
         * @memberof Kinetic.Shape.prototype
         * @param {Object} point point can be an object containing
         *  an x and y property, or it can be an array with two elements
         *  in which the first element is the x component and the second
         *  element is the y component
         */
        intersects: function() {
            var pos = Kinetic.Util._getXY(Array.prototype.slice.call(arguments));
            var stage = this.getStage();
            var hitCanvas = stage.hitCanvas;
            hitCanvas.clear();
            this.drawScene(hitCanvas);
            var p = hitCanvas.context.getImageData(pos.x | 0, pos.y | 0, 1, 1).data;
            return p[3] > 0;
        },
        /**
         * enable fill
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        enableFill: function() {
            this._setAttr('fillEnabled', true);
            return this;
        },
        /**
         * disable fill
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        disableFill: function() {
            this._setAttr('fillEnabled', false);
            return this;
        },
        /**
         * enable stroke
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        enableStroke: function() {
            this._setAttr('strokeEnabled', true);
            return this;
        },
        /**
         * disable stroke
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        disableStroke: function() {
            this._setAttr('strokeEnabled', false);
            return this;
        },
        /**
         * enable stroke scale
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        enableStrokeScale: function() {
            this._setAttr('strokeScaleEnabled', true);
            return this;
        },
        /**
         * disable stroke scale
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        disableStrokeScale: function() {
            this._setAttr('strokeScaleEnabled', false);
            return this;
        },
        /**
         * enable shadow
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        enableShadow: function() {
            this._setAttr('shadowEnabled', true);
            return this;
        },
        /**
         * disable shadow
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        disableShadow: function() {
            this._setAttr('shadowEnabled', false);
            return this;
        },
        /**
         * enable dash array
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        enableDashArray: function() {
            this._setAttr('dashArrayEnabled', true);
            return this;
        },
        /**
         * disable dash array
         * @method
         * @memberof Kinetic.Shape.prototype
         */
        disableDashArray: function() {
            this._setAttr('dashArrayEnabled', false);
            return this;
        },
        destroy: function() {
            Kinetic.Node.prototype.destroy.call(this);
            delete Kinetic.Global.shapes[this.colorKey];
            return this;
        },
        drawScene: function(canvas) {
            canvas = canvas || this.getLayer().getCanvas();

            var drawFunc = this.getDrawFunc(), 
                context = canvas.getContext();

            if(drawFunc && this.isVisible()) {
                context.save();
                canvas._applyOpacity(this);
                canvas._applyLineJoin(this);                
                canvas._applyAncestorTransforms(this);
                drawFunc.call(this, canvas);
                context.restore();
            }
            return this;
        },
        drawHit: function() {
            var attrs = this.getAttrs(), 
                drawFunc = attrs.drawHitFunc || attrs.drawFunc, 
                canvas = this.getLayer().hitCanvas, 
                context = canvas.getContext();

            if(drawFunc && this.shouldDrawHit()) {
                context.save();
                canvas._applyLineJoin(this);
                canvas._applyAncestorTransforms(this);

                drawFunc.call(this, canvas);
                context.restore();
            }
            return this;
        },
        _setDrawFuncs: function() {
            if(!this.attrs.drawFunc && this.drawFunc) {
                this.setDrawFunc(this.drawFunc);
            }
            if(!this.attrs.drawHitFunc && this.drawHitFunc) {
                this.setDrawHitFunc(this.drawHitFunc);
            }
        }
    });
    Kinetic.Util.extend(Kinetic.Shape, Kinetic.Node);

    // add getters and setters
    Kinetic.Node.addColorGetterSetter(Kinetic.Shape, 'stroke');

    /**
     * set stroke color
     * @name setStroke
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {String} color
     */

     /**
     * set stroke color with an object literal
     * @name setStrokeRGB
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Obect} color requires an object literal containing an r, g, and b component
     * @example
     * shape.setStrokeRGB({<br>
     *   r: 200,<br>
     *   g: 50,<br>
     *   b: 100<br>
     * });
     */

     /**
     * set stroke color red component
     * @name setStrokeR
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} red
     */

     /**
     * set stroke color green component
     * @name setStrokeG
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} green
     */

     /**
     * set stroke color blue component
     * @name setStrokeB
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} blue
     */

     /**
     * get stroke color
     * @name getStroke
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get stroke color as an object literal
     * @name getStrokeRGB
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get stroke color red component
     * @name getStrokeR
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get stroke color green component
     * @name getStrokeG
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get stroke color blue component
     * @name getStrokeB
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'lineJoin');

    /**
     * set line join
     * @name setLineJoin
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {String} lineJoin.  Can be miter, round, or bevel.  The
     *  default is miter
     */

     /**
     * get line join
     * @name getLineJoin
     * @method
     * @memberof Kinetic.Shape.prototype
     */


    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'lineCap');

    /**
     * set line cap.  Can be butt, round, or square
     * @name setLineCap
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {String} lineCap
     */

     /**
     * get line cap
     * @name getLineCap
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'strokeWidth');

    /**
     * set stroke width
     * @name setStrokeWidth
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} strokeWidth
     */

     /**
     * get stroke width
     * @name getStrokeWidth
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'drawFunc');

    /**
     * set draw function
     * @name setDrawFunc
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Function} drawFunc drawing function
     */

     /**
     * get draw function
     * @name getDrawFunc
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'drawHitFunc');

    /**
     * set draw hit function used for hit detection
     * @name setDrawHitFunc
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Function} drawHitFunc drawing function used for hit detection
     */

     /**
     * get draw hit function
     * @name getDrawHitFunc
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'dashArray');

    /**
     * set dash array.
     * @name setDashArray
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Array} dashArray
     *  examples:<br>
     *  [10, 5] dashes are 10px long and 5 pixels apart
     *  [10, 20, 0.001, 20] if using a round lineCap, the line will
     *  be made up of alternating dashed lines that are 10px long
     *  and 20px apart, and dots that have a radius of 5px and are 20px
     *  apart
     */

     /**
     * get dash array
     * @name getDashArray
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addColorGetterSetter(Kinetic.Shape, 'shadowColor');

    /**
     * set shadow color
     * @name setShadowColor
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {String} color
     */

     /**
     * set shadow color with an object literal
     * @name setShadowColorRGB
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Obect} color requires an object literal containing an r, g, and b component
     * @example
     * shape.setShadowRGB({<br>
     *   r: 200,<br>
     *   g: 50,<br>
     *   b: 100<br>
     * });
     */

     /**
     * set shadow color red component
     * @name setShadowColorR
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} red
     */

     /**
     * set shadow color green component
     * @name setShadowColorG
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} green
     */

     /**
     * set shadow color blue component
     * @name setShadowColorB
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} blue
     */

     /**
     * get shadow color
     * @name getShadowColor
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get shadow color as an object literal
     * @name getShadowColorRGB
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get shadow color red component
     * @name getShadowColorR
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get shadow color green component
     * @name getShadowColorG
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get shadow color blue component
     * @name getShadowColorB
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'shadowBlur');

    /**
     * set shadow blur
     * @name setShadowBlur
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} blur
     */

     /**
     * get shadow blur
     * @name getShadowBlur
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'shadowOpacity');

    /**
     * set shadow opacity
     * @name setShadowOpacity
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} opacity must be a value between 0 and 1
     */

     /**
     * get shadow opacity
     * @name getShadowOpacity
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillPatternImage');

    /**
     * set fill pattern image
     * @name setFillPatternImage
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Image} image object
     */

     /**
     * get fill pattern image
     * @name getFillPatternImage
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addColorGetterSetter(Kinetic.Shape, 'fill');

    /**
     * set fill color
     * @name setFill
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {String} color
     */

     /**
     * set fill color with an object literal
     * @name setFillRGB
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Obect} color requires an object literal containing an r, g, and b component
     * @example
     * shape.setFillRGB({<br>
     *   r: 200,<br>
     *   g: 50,<br>
     *   b: 100<br>
     * });
     */

     /**
     * set fill color red component
     * @name setFillR
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} red
     */

     /**
     * set fill color green component
     * @name setFillG
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} green
     */

     /**
     * set fill color blue component
     * @name setFillB
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Integer} blue
     */

     /**
     * get fill color
     * @name getFill
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill color as an object literal
     * @name getFillRGB
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill color red component
     * @name getFillR
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill color green component
     * @name getFillG
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill color blue component
     * @name getFillB
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillPatternX');

    /**
     * set fill pattern x
     * @name setFillPatternX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * get fill pattern x
     * @name getFillPatternX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillPatternY');

    /**
     * set fill pattern y
     * @name setFillPatternY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill pattern y
     * @name getFillPatternY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillLinearGradientColorStops');

    /**
     * set fill linear gradient color stops
     * @name setFillLinearGradientColorStops
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Array} colorStops
     */

     /**
     * get fill linear gradient color stops
     * @name getFillLinearGradientColorStops
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Array} colorStops
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillRadialGradientStartRadius');

    /**
     * set fill radial gradient start radius
     * @name setFillRadialGradientStartRadius
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} radius
     */

     /**
     * get fill radial gradient start radius
     * @name getFillRadialGradientStartRadius
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillRadialGradientEndRadius');

    /**
     * set fill radial gradient end radius
     * @name setFillRadialGradientEndRadius
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} radius
     */

     /**
     * get fill radial gradient end radius
     * @name getFillRadialGradientEndRadius
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillRadialGradientColorStops');

    /**
     * set fill radial gradient color stops
     * @name setFillRadialGradientColorStops
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} colorStops
     */

     /**
     * get fill radial gradient color stops
     * @name getFillRadialGradientColorStops
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillPatternRepeat');

    /**
     * set fill pattern repeat
     * @name setFillPatternRepeat
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} repeat can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     */

     /**
     * get fill pattern repeat
     * @name getFillPatternRepeat
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillEnabled', true);

    /**
     * set fill enabled
     * @name setFillEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Boolean} enabled
     */

     /**
     * get fill enabled
     * @name getFillEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'strokeEnabled', true);

    /**
     * set stroke enabled
     * @name setStrokeEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Boolean} enabled
     */

     /**
     * get stroke enabled
     * @name getStrokeEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'shadowEnabled', true);

    /**
     * set shadow enabled
     * @name setShadowEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Boolean} enabled
     */

     /**
     * get shadow enabled
     * @name getShadowEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'dashArrayEnabled', true);

    /**
     * set dash array enabled
     * @name setDashArrayEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Boolean} enabled
     */

     /**
     * get dash array enabled
     * @name getDashArrayEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'fillPriority', 'color');

    /**
     * set fill priority
     * @name setFillPriority
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} priority can be color, pattern, linear-gradient, or radial-gradient
     *  The default is color.
     */

     /**
     * get fill priority
     * @name getFillPriority
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Shape, 'strokeScaleEnabled', true);

     /**
     * set stroke scale enabled
     * @name setStrokeScaleEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Boolean} enabled
     */

     /**
     * get stroke scale enabled
     * @name getStrokeScaleEnabled
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'fillPatternOffset', 0);

    /**
     * set fill pattern offset
     * @name setFillPatternOffset
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number|Array|Object} offset
     * @example
     * // set x and y<br>
     * shape.setFillPatternOffset(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setFillPatternOffset({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setFillPatternOffset([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setFillPatternOffset(5);
     */

     /**
     * set fill pattern offset x
     * @name setFillPatternOffsetX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set fill pattern offset y
     * @name setFillPatternOffsetY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill pattern offset
     * @name getFillPatternOffset
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill pattern offset x
     * @name getFillPatternOffsetX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill pattern offset y
     * @name getFillPatternOffsetY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'fillPatternScale', 1);

    /**
     * set fill pattern scale
     * @name setFillPatternScale
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} scale
     * @example
     * // set x and y to the same value<br>
     * shape.setFillPatternScale(5);<br><br>
     *
     * // set x and y<br>
     * shape.setFillPatternScale(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setFillPatternScale({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setFillPatternScale([20, 40]);
     */

     /**
     * set fill pattern scale x
     * @name setFillPatternScaleX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set fill pattern scale y
     * @name setFillPatternScaleY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill pattern scale
     * @name getFillPatternScale
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill pattern scale x
     * @name getFillPatternScaleX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill pattern scale y
     * @name getFillPatternScaleY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'fillLinearGradientStartPoint', 0);

    /**
     * set fill linear gradient start point
     * @name setFillLinearGradientStartPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number|Array|Object} startPoint
     * @example
     * // set x and y<br>
     * shape.setFillLinearGradientStartPoint(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setFillLinearGradientStartPoint({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setFillLinearGradientStartPoint([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setFillLinearGradientStartPoint(5);
     */

     /**
     * set fill linear gradient start point x
     * @name setFillLinearGradientStartPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set fill linear gradient start point y
     * @name setFillLinearGradientStartPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill linear gradient start point
     * @name getFillLinearGradientStartPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill linear gradient start point x
     * @name getFillLinearGradientStartPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill linear gradient start point y
     * @name getFillLinearGradientStartPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'fillLinearGradientEndPoint', 0);

    /**
     * set fill linear gradient end point
     * @name setFillLinearGradientEndPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number|Array|Object} endPoint
     * @example
     * // set x and y<br>
     * shape.setFillLinearGradientEndPoint(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setFillLinearGradientEndPoint({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setFillLinearGradientEndPoint([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setFillLinearGradientEndPoint(5);
     */

     /**
     * set fill linear gradient end point x
     * @name setFillLinearGradientEndPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set fill linear gradient end point y
     * @name setFillLinearGradientEndPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill linear gradient end point
     * @name getFillLinearGradientEndPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill linear gradient end point x
     * @name getFillLinearGradientEndPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill linear gradient end point y
     * @name getFillLinearGradientEndPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'fillRadialGradientStartPoint', 0);

    /**
     * set fill radial gradient start point
     * @name setFillRadialGradientStartPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number|Array|Object} startPoint
     * @example
     * // set x and y<br>
     * shape.setFillRadialGradientStartPoint(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setFillRadialGradientStartPoint({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setFillRadialGradientStartPoint([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setFillRadialGradientStartPoint(5);
     */

     /**
     * set fill radial gradient start point x
     * @name setFillRadialGradientStartPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set fill radial gradient start point y
     * @name setFillRadialGradientStartPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill radial gradient start point
     * @name getFillRadialGradientStartPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill radial gradient start point x
     * @name getFillRadialGradientStartPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill radial gradient start point y
     * @name getFillRadialGradientStartPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'fillRadialGradientEndPoint', 0);

    /**
     * set fill radial gradient end point
     * @name setFillRadialGradientEndPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number|Array|Object} endPoint
     * @example
     * // set x and y<br>
     * shape.setFillRadialGradientEndPoint(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setFillRadialGradientEndPoint({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setFillRadialGradientEndPoint([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setFillRadialGradientEndPoint(5);
     */

     /**
     * set fill radial gradient end point x
     * @name setFillRadialGradientEndPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set fill radial gradient end point y
     * @name setFillRadialGradientEndPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

     /**
     * get fill radial gradient end point
     * @name getFillRadialGradientEndPoint
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill radial gradient end point x
     * @name getFillRadialGradientEndPointX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get fill radial gradient end point y
     * @name getFillRadialGradientEndPointY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addPointGetterSetter(Kinetic.Shape, 'shadowOffset', 0);

    /**
     * set shadow offset
     * @name setShadowOffset
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number|Array|Object} offset
     * @example
     * // set x and y<br>
     * shape.setShadowOffset(20, 40);<br><br>
     *
     * // set x only <br>
     * shape.setShadowOffset({<br>
     *   x: 20<br>
     * });<br><br>
     *
     * // set x and y using an array<br>
     * shape.setShadowOffset([20, 40]);<br><br>
     *
     * // set x and y to the same value<br>
     * shape.setShadowOffset(5);
     */

     /**
     * set shadow offset x
     * @name setShadowOffsetX
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} x
     */

     /**
     * set shadow offset y
     * @name setShadowOffsetY
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} y
     */

    /**
     * get shadow offset
     * @name getShadowOffset
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get shadow offset x
     * @name getShadowOffsetX
     * @method
     * @memberof Kinetic.Shape.prototype
     */

     /**
     * get shadow offset y
     * @name getShadowOffsetY
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    Kinetic.Node.addRotationGetterSetter(Kinetic.Shape, 'fillPatternRotation', 0);

    /**
     * set fill pattern rotation in radians
     * @name setFillPatternRotation
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} rotation
     */

    /**
     * set fill pattern rotation in degrees
     * @name setFillPatternRotationDeg
     * @method
     * @memberof Kinetic.Shape.prototype
     * @param {Number} rotationDeg
     */

    /**
     * get fill pattern rotation in radians
     * @name getFillPatternRotation
     * @method
     * @memberof Kinetic.Shape.prototype
     */

    /**
     * get fill pattern rotation in degrees
     * @name getFillPatternRotationDeg
     * @method
     * @memberof Kinetic.Shape.prototype
     */

})();
;(function() {
    // CONSTANTS
    var STAGE = 'Stage',
        STRING = 'string',
        PX = 'px',
        MOUSEOUT = 'mouseout',
        MOUSELEAVE = 'mouseleave',
        MOUSEOVER = 'mouseover',
        MOUSEENTER = 'mouseenter',
        MOUSEMOVE = 'mousemove',
        MOUSEDOWN = 'mousedown',
        MOUSEUP = 'mouseup',
        CLICK = 'click',
        DBL_CLICK = 'dblclick',
        TOUCHSTART = 'touchstart',
        TOUCHEND = 'touchend',
        TAP = 'tap',
        DBL_TAP = 'dbltap',
        TOUCHMOVE = 'touchmove',
        DIV = 'div',
        RELATIVE = 'relative',
        INLINE_BLOCK = 'inline-block',
        KINETICJS_CONTENT = 'kineticjs-content',
        SPACE = ' ',
        UNDERSCORE = '_',
        CONTAINER = 'container',
        EMPTY_STRING = '',
        EVENTS = [MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEOUT, TOUCHSTART, TOUCHMOVE, TOUCHEND],
        
    // cached variables
    eventsLength = EVENTS.length;

    function addEvent(ctx, eventName) {
      ctx.content.addEventListener(eventName, function(evt) {
        evt.preventDefault();
        ctx[UNDERSCORE + eventName](evt);
      }, false);
    }

    Kinetic.Util.addMethods(Kinetic.Stage, {
        _initStage: function(config) {
            this.createAttrs();
            // call super constructor
            Kinetic.Container.call(this, config);
            this.nodeType = STAGE;
            this.dblClickWindow = 400;
            this._id = Kinetic.Global.idCounter++;
            this._buildDOM();
            this._bindContentEvents();
            Kinetic.Global.stages.push(this);
        },
        /**
         * set container dom element which contains the stage wrapper div element
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {DomElement} container can pass in a dom element or id string
         */
        setContainer: function(container) {
            if( typeof container === STRING) {
                container = document.getElementById(container);
            }
            this._setAttr(CONTAINER, container);
            return this;
        },
        draw: function() {
            // clear children layers
            var children = this.getChildren(), 
                len = children.length,
                n, layer;
            
            for(n = 0; n < len; n++) {
                layer = children[n];
                if (layer.getClearBeforeDraw()) {
                    layer.getCanvas().clear();
                    layer.getHitCanvas().clear();
                }
            }
          
            Kinetic.Node.prototype.draw.call(this);
            return this;
        },
        /**
         * draw layer scene graphs
         * @name draw
         * @method
         * @memberof Kinetic.Stage.prototype
         */

        /**
         * draw layer hit graphs
         * @name drawHit
         * @method
         * @memberof Kinetic.Stage.prototype
         */

        /**
         * set height
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {Number} height
         */
        setHeight: function(height) {
            Kinetic.Node.prototype.setHeight.call(this, height);
            this._resizeDOM();
            return this;
        },
        /**
         * set width
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {Number} width
         */
        setWidth: function(width) {
            Kinetic.Node.prototype.setWidth.call(this, width);
            this._resizeDOM();
            return this;
        },
        /**
         * clear all layers
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        clear: function() {
            var layers = this.children,
                len = layers.length,
                n;
                
            for(n = 0; n < len; n++) {
                layers[n].clear();
            }
            return this;
        },
        /**
         * remove stage
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        destroy: function() {
            var content = this.content;
            Kinetic.Container.prototype.destroy.call(this);

            if(content && Kinetic.Util._isInDocument(content)) {
                this.getContainer().removeChild(content);
            }
        },
        /**
         * get mouse position for desktop apps
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        getMousePosition: function() {
            return this.mousePos;
        },
        /**
         * get touch position for mobile apps
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        getTouchPosition: function() {
            return this.touchPos;
        },
        /**
         * get pointer position which can be a touc position or mouse position
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        getPointerPosition: function() {
            return this.getTouchPosition() || this.getMousePosition();
        },
        getStage: function() {
            return this;
        },
        /**
         * get stage content div element which has the
         *  the class name "kineticjs-content"
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        getContent: function() {
            return this.content;
        },
        /**
         * Creates a composite data URL and requires a callback because the composite is generated asynchronously.
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toDataURL: function(config) {
            config = config || {};

            var mimeType = config.mimeType || null, 
                quality = config.quality || null, 
                x = config.x || 0, 
                y = config.y || 0, 
                canvas = new Kinetic.SceneCanvas({
                    width: config.width || this.getWidth(), 
                    height: config.height || this.getHeight(),
                    pixelRatio: 1
                }), 
                context = canvas.getContext(), 
                layers = this.children;

            if(x || y) {
                context.translate(-1 * x, -1 * y);
            }

            function drawLayer(n) {
                var layer = layers[n],
                    layerUrl = layer.toDataURL(),
                    imageObj = new Image();
                    
                imageObj.onload = function() {
                    context.drawImage(imageObj, 0, 0);

                    if(n < layers.length - 1) {
                        drawLayer(n + 1);
                    }
                    else {
                        config.callback(canvas.toDataURL(mimeType, quality));
                    }
                };
                imageObj.src = layerUrl;
            }
            drawLayer(0);
        },
        /**
         * converts stage into an image.
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toImage: function(config) {
            var cb = config.callback;

            config.callback = function(dataUrl) {
                Kinetic.Util._getImage(dataUrl, function(img) {
                    cb(img);
                });
            };
            this.toDataURL(config);
        },
        /**
         * get visible intersection object that contains shape and pixel data. This is the preferred
         *  method for determining if a point intersects a shape or not
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {Object} pos point object
         */
        getIntersection: function() {
            var pos = Kinetic.Util._getXY(Array.prototype.slice.call(arguments)),
                layers = this.getChildren(),
                len = layers.length,
                end = len - 1,
                n, obj;

            for(n = end; n >= 0; n--) {
                obj = layers[n].getIntersection(pos);
                if (obj) {
                    return obj;
                }
            }

            return null;
        },
        _resizeDOM: function() {
            if(this.content) {
                var width = this.getWidth(),
                    height = this.getHeight(),
                    layers = this.getChildren(),
                    len = layers.length,
                    n;

                // set content dimensions
                this.content.style.width = width + PX;
                this.content.style.height = height + PX;

                this.bufferCanvas.setSize(width, height, 1);
                this.hitCanvas.setSize(width, height);
                
                // set pointer defined layer dimensions
                for(n = 0; n < len; n++) {
                    layer = layers[n];
                    layer.getCanvas().setSize(width, height);
                    layer.hitCanvas.setSize(width, height);
                    layer.draw();
                }
            }
        },
        /**
         * add layer to stage
         * @method
         * @memberof Kinetic.Stage.prototype
         * @param {Kinetic.Layer} layer
         */
        add: function(layer) {
            Kinetic.Container.prototype.add.call(this, layer);
            layer.canvas.setSize(this.attrs.width, this.attrs.height);
            layer.hitCanvas.setSize(this.attrs.width, this.attrs.height);

            // draw layer and append canvas to container
            layer.draw();
            this.content.appendChild(layer.canvas.element);
            
            // chainable
            return this;
        },
        getParent: function() {
            return null;
        },
        getLayer: function() {
            return null;
        },
        /**
         * returns a {@link Kinetic.Collection} of layers
         * @method
         * @memberof Kinetic.Stage.prototype
         */
        getLayers: function() {
            return this.getChildren();
        },
        _setPointerPosition: function(evt) {
            if(!evt) {
                evt = window.event;
            }
            this._setMousePosition(evt);
            this._setTouchPosition(evt);
        },
        _bindContentEvents: function() {
            var that = this,
                n;

            for (n = 0; n < eventsLength; n++) {
              addEvent(this, EVENTS[n]);
            }
        },
        _mouseout: function(evt) {
            this._setPointerPosition(evt);
            var go = Kinetic.Global,
                targetShape = this.targetShape;
                
            if(targetShape && !go.isDragging()) {
                targetShape._fireAndBubble(MOUSEOUT, evt);
                targetShape._fireAndBubble(MOUSELEAVE, evt);
                this.targetShape = null;
            }
            this.mousePos = undefined;
        },
        _mousemove: function(evt) {
            this._setPointerPosition(evt);
            var go = Kinetic.Global,
                dd = Kinetic.DD,
                obj = this.getIntersection(this.getPointerPosition()),
                shape;

            if(obj) {
                shape = obj.shape;
                if(shape) {
                    if(!go.isDragging() && obj.pixel[3] === 255 && (!this.targetShape || this.targetShape._id !== shape._id)) {
                        if(this.targetShape) {
                            this.targetShape._fireAndBubble(MOUSEOUT, evt, shape);
                            this.targetShape._fireAndBubble(MOUSELEAVE, evt, shape);
                        }
                        shape._fireAndBubble(MOUSEOVER, evt, this.targetShape);
                        shape._fireAndBubble(MOUSEENTER, evt, this.targetShape);
                        this.targetShape = shape;
                    }
                    else {
                        shape._fireAndBubble(MOUSEMOVE, evt);
                    }
                }
            }
            /*
             * if no shape was detected, clear target shape and try
             * to run mouseout from previous target shape
             */
            else if(this.targetShape && !go.isDragging()) {
                this.targetShape._fireAndBubble(MOUSEOUT, evt);
                this.targetShape._fireAndBubble(MOUSELEAVE, evt);
                this.targetShape = null;
            }

            if(dd) {
                dd._drag(evt);
            }
        },
        _mousedown: function(evt) {
            this._setPointerPosition(evt);
            var go = Kinetic.Global,
                obj = this.getIntersection(this.getPointerPosition()), 
                shape;

            if(obj && obj.shape) {
                shape = obj.shape;
                this.clickStart = true;
                this.clickStartShape = shape;
                shape._fireAndBubble(MOUSEDOWN, evt);
            }

            //init stage drag and drop
            if(this.isDraggable() && !go.isDragReady()) {
                this.startDrag(evt);
            }
        },
        _mouseup: function(evt) {
            this._setPointerPosition(evt);
            var that = this, 
                go = Kinetic.Global, 
                obj = this.getIntersection(this.getPointerPosition()),
                shape;
                
            if(obj && obj.shape) {
                shape = obj.shape;
                shape._fireAndBubble(MOUSEUP, evt);

                // detect if click or double click occurred
                if(this.clickStart) {
                    /*
                     * if dragging and dropping, or if click doesn't map to 
                     * the correct shape, don't fire click or dbl click event
                     */
                    if(!go.isDragging() && shape._id === this.clickStartShape._id) {
                        shape._fireAndBubble(CLICK, evt);

                        if(this.inDoubleClickWindow) {
                            shape._fireAndBubble(DBL_CLICK, evt);
                        }
                        this.inDoubleClickWindow = true;
                        setTimeout(function() {
                            that.inDoubleClickWindow = false;
                        }, this.dblClickWindow);
                    }
                }
            }
            this.clickStart = false;
        },
        _touchstart: function(evt) {
            this._setPointerPosition(evt);
            var go = Kinetic.Global,
                obj = this.getIntersection(this.getPointerPosition()),  
                shape;
            
            if(obj && obj.shape) {
                shape = obj.shape;
                this.tapStart = true;
                this.tapStartShape = shape;
                shape._fireAndBubble(TOUCHSTART, evt);
            }

            //init stage drag and drop
            if(this.isDraggable() && !go.isDragReady()) {
                this.startDrag(evt);
            }
        },
        _touchend: function(evt) {
            this._setPointerPosition(evt);
            var that = this, 
                go = Kinetic.Global, 
                obj = this.getIntersection(this.getPointerPosition()),
                shape;

            if(obj && obj.shape) {
                shape = obj.shape;
                shape._fireAndBubble(TOUCHEND, evt);

                // detect if tap or double tap occurred
                if(this.tapStart) {
                    /*
                     * if dragging and dropping, don't fire tap or dbltap
                     * event
                     */
                    if(!go.isDragging() && shape._id === this.tapStartShape._id) {
                        shape._fireAndBubble(TAP, evt);

                        if(this.inDoubleClickWindow) {
                            shape._fireAndBubble(DBL_TAP, evt);
                        }
                        this.inDoubleClickWindow = true;
                        setTimeout(function() {
                            that.inDoubleClickWindow = false;
                        }, this.dblClickWindow);
                    }
                }
            }

            this.tapStart = false;
        },
        _touchmove: function(evt) {
            this._setPointerPosition(evt);
            var dd = Kinetic.DD,
                obj = this.getIntersection(this.getPointerPosition()),
                shape;
            
            if(obj && obj.shape) {
                shape = obj.shape;
                shape._fireAndBubble(TOUCHMOVE, evt);
            }

            // start drag and drop
            if(dd) {
                dd._drag(evt);
            }
        },
        _setMousePosition: function(evt) {
            var mouseX = evt.clientX - this._getContentPosition().left,
                mouseY = evt.clientY - this._getContentPosition().top;
                
            this.mousePos = {
                x: mouseX,
                y: mouseY
            };
        },
        _setTouchPosition: function(evt) {
            var touch, touchX, touchY;
            
            if(evt.touches !== undefined && evt.touches.length === 1) {
                // one finger
                touch = evt.touches[0];
                
                // get the information for finger #1
                touchX = touch.clientX - this._getContentPosition().left;
                touchY = touch.clientY - this._getContentPosition().top;

                this.touchPos = {
                    x: touchX,
                    y: touchY
                };
            }
        },
        _getContentPosition: function() {
            var rect = this.content.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left
            };
        },
        _buildDOM: function() {
            var container = this.getContainer();
            
            // clear content inside container
            container.innerHTML = EMPTY_STRING;

            // content
            this.content = document.createElement(DIV);
            this.content.style.position = RELATIVE;
            this.content.style.display = INLINE_BLOCK;
            this.content.className = KINETICJS_CONTENT;
            container.appendChild(this.content);

            this.bufferCanvas = new Kinetic.SceneCanvas();
            this.hitCanvas = new Kinetic.HitCanvas();

            this._resizeDOM();
        },
        _onContent: function(typesStr, handler) {
            var types = typesStr.split(SPACE),
                len = types.length,
                n, baseEvent;
                
            for(n = 0; n < len; n++) {
                baseEvent = types[n];
                this.content.addEventListener(baseEvent, handler, false);
            }
        }
    });
    Kinetic.Util.extend(Kinetic.Stage, Kinetic.Container);

    // add getters and setters
    Kinetic.Node.addGetter(Kinetic.Stage, 'container');

    /**
     * get container DOM element
     * @name getContainer
     * @method
     * @memberof Kinetic.Stage.prototype
     */
})();
;(function() {
    // constants
    var HASH = '#';

    Kinetic.Util.addMethods(Kinetic.Layer, {
        _initLayer: function(config) {
            this.nodeType = 'Layer';
            this.createAttrs();
            this.canvas = new Kinetic.SceneCanvas();
            this.canvas.getElement().style.position = 'absolute';
            this.hitCanvas = new Kinetic.HitCanvas();
            // call super constructor
            Kinetic.Container.call(this, config);
        },
        /**
         * get visible intersection object that contains shape and pixel data. This is the preferred
         * method for determining if a point intersects a shape or not
         * @method
         * @memberof Kinetic.Layer.prototype
         * @param {Object} pos point object
         */
        getIntersection: function() {
            var pos = Kinetic.Util._getXY(Array.prototype.slice.call(arguments)),
                p, colorKey, shape;

            if(this.isVisible() && this.isListening()) {
                p = this.hitCanvas.context.getImageData(pos.x | 0, pos.y | 0, 1, 1).data;
                // this indicates that a hit pixel may have been found
                if(p[3] === 255) {
                    colorKey = Kinetic.Util._rgbToHex(p[0], p[1], p[2]);
                    shape = Kinetic.Global.shapes[HASH + colorKey];
                    return {
                        shape: shape,
                        pixel: p
                    };
                }
                // if no shape mapped to that pixel, return pixel array
                else if(p[0] > 0 || p[1] > 0 || p[2] > 0 || p[3] > 0) {
                    return {
                        pixel: p
                    };
                }
            }

            return null;
        },
        drawScene: function(canvas) {
            canvas = canvas || this.getCanvas();

            if(this.getClearBeforeDraw()) {
                canvas.clear();
            }

            Kinetic.Container.prototype.drawScene.call(this, canvas);
            return this;
        },
        drawHit: function() {
            var layer = this.getLayer();
            
            if(layer && layer.getClearBeforeDraw()) {
                layer.getHitCanvas().clear();
            }

            Kinetic.Container.prototype.drawHit.call(this);
            return this;
        },
        /**
         * get layer canvas
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getCanvas: function() {
            return this.canvas;     
        },
        /**
         * get layer hit canvas
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getHitCanvas: function() {
            return this.hitCanvas;
        },
        /**
         * get layer canvas context
         * @method
         * @memberof Kinetic.Node.prototype
         */
        getContext: function() {
            return this.getCanvas().getContext(); 
        },
        /**
         * clear canvas tied to the layer
         * @method
         * @memberof Kinetic.Node.prototype
         */
        clear: function() {
            this.getCanvas().clear();
            return this;
        },
        // extenders
        setVisible: function(visible) {
            Kinetic.Node.prototype.setVisible.call(this, visible);
            if(visible) {
                this.getCanvas().element.style.display = 'block';
                this.hitCanvas.element.style.display = 'block';
            }
            else {
                this.getCanvas().element.style.display = 'none';
                this.hitCanvas.element.style.display = 'none';
            }
            return this;
        },
        setZIndex: function(index) {
            Kinetic.Node.prototype.setZIndex.call(this, index);
            var stage = this.getStage();
            if(stage) {
                stage.content.removeChild(this.getCanvas().element);

                if(index < stage.getChildren().length - 1) {
                    stage.content.insertBefore(this.getCanvas().element, stage.getChildren()[index + 1].getCanvas().element);
                }
                else {
                    stage.content.appendChild(this.getCanvas().element);
                }
            }
            return this;
        },
        moveToTop: function() {
            Kinetic.Node.prototype.moveToTop.call(this);
            var stage = this.getStage();
            if(stage) {
                stage.content.removeChild(this.getCanvas().element);
                stage.content.appendChild(this.getCanvas().element);
            }
        },
        moveUp: function() {
            if(Kinetic.Node.prototype.moveUp.call(this)) {
                var stage = this.getStage();
                if(stage) {
                    stage.content.removeChild(this.getCanvas().element);

                    if(this.index < stage.getChildren().length - 1) {
                        stage.content.insertBefore(this.getCanvas().element, stage.getChildren()[this.index + 1].getCanvas().element);
                    }
                    else {
                        stage.content.appendChild(this.getCanvas().element);
                    }
                }
            }
        },
        moveDown: function() {
            if(Kinetic.Node.prototype.moveDown.call(this)) {
                var stage = this.getStage();
                if(stage) {
                    var children = stage.getChildren();
                    stage.content.removeChild(this.getCanvas().element);
                    stage.content.insertBefore(this.getCanvas().element, children[this.index + 1].getCanvas().element);
                }
            }
        },
        moveToBottom: function() {
            if(Kinetic.Node.prototype.moveToBottom.call(this)) {
                var stage = this.getStage();
                if(stage) {
                    var children = stage.getChildren();
                    stage.content.removeChild(this.getCanvas().element);
                    stage.content.insertBefore(this.getCanvas().element, children[1].getCanvas().element);
                }
            }
        },
        getLayer: function() {
            return this;
        },
        remove: function() {
            var stage = this.getStage(), canvas = this.getCanvas(), element = canvas.element;
            Kinetic.Node.prototype.remove.call(this);

            if(stage && canvas && Kinetic.Util._isInDocument(element)) {
                stage.content.removeChild(element);
            }
            return this;
        }
    });
    Kinetic.Util.extend(Kinetic.Layer, Kinetic.Container);

    // add getters and setters
    Kinetic.Node.addGetterSetter(Kinetic.Layer, 'clearBeforeDraw', true);

    /**
     * set flag which determines if the layer is cleared or not
     *  before drawing
     * @name setClearBeforeDraw
     * @method
     * @memberof Kinetic.Node.prototype
     * @param {Boolean} clearBeforeDraw
     */

    /**
     * get flag which determines if the layer is cleared or not
     *  before drawing
     * @name getClearBeforeDraw
     * @method
     * @memberof Kinetic.Node.prototype
     */
})();
;(function() {
    Kinetic.Util.addMethods(Kinetic.Group, {
        _initGroup: function(config) {
            this.nodeType = 'Group';
            this.createAttrs();
            // call super constructor
            Kinetic.Container.call(this, config);
        }
    });
    Kinetic.Util.extend(Kinetic.Group, Kinetic.Container);
})();
;(function() {
    /**
     * Rect constructor
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Number} [config.cornerRadius]
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var rect = new Kinetic.Rect({<br>
     *   width: 100,<br>
     *   height: 50,<br>
     *   fill: 'red',<br>
     *   stroke: 'black'<br>
     *   strokeWidth: 5<br>
     * });
     */
    Kinetic.Rect = function(config) {
        this._initRect(config);
    };
    
    Kinetic.Rect.prototype = {
        _initRect: function(config) {
            this.createAttrs();
            Kinetic.Shape.call(this, config);
            this.className = 'Rect';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(),
                cornerRadius = this.getCornerRadius(), 
                width = this.getWidth(), 
                height = this.getHeight();
                
            context.beginPath();
            
            if(!cornerRadius) {
                // simple rect - don't bother doing all that complicated maths stuff.
                context.rect(0, 0, width, height);
            }
            else {
                // arcTo would be nicer, but browser support is patchy (Opera)
                context.moveTo(cornerRadius, 0);
                context.lineTo(width - cornerRadius, 0);
                context.arc(width - cornerRadius, cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
                context.lineTo(width, height - cornerRadius);
                context.arc(width - cornerRadius, height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
                context.lineTo(cornerRadius, height);
                context.arc(cornerRadius, height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
                context.lineTo(0, cornerRadius);
                context.arc(cornerRadius, cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
            }
            context.closePath();
            canvas.fillStroke(this);
        }
    };

    Kinetic.Util.extend(Kinetic.Rect, Kinetic.Shape);

    Kinetic.Node.addGetterSetter(Kinetic.Rect, 'cornerRadius', 0);

    /**
     * set corner radius
     * @name setCornerRadius
     * @method
     * @memberof Kinetic.Rect.prototype
     * @param {Number} corner radius
     */

    /**
     * get corner radius
     * @name getCornerRadius
     * @method
     * @memberof Kinetic.Rect.prototype
     */

})();
;(function() {
    // the 0.0001 offset fixes a bug in Chrome 27
    var PIx2 = (Math.PI * 2) - 0.0001,
        CIRCLE = 'Circle';

    /**
     * Circle constructor
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Number} config.radius
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // create simple circle
     * var circle = new Kinetic.Circle({<br>
     *   radius: 40,<br>
     *   fill: 'red',<br>
     *   stroke: 'black'<br>
     *   strokeWidth: 5<br>
     * });<br><br>
     *
     * // create ellipse<br>
     * var circle = new Kinetic.Circle({<br>
     *   radius: 5,<br>
     *   fill: 'red',<br>
     *   stroke: 'black'<br>
     *   strokeWidth: 5,<br>
     *   scaleX: 2,<br>
     *   strokeScaleEnabled: false<br>
     * });
     */
    Kinetic.Circle = function(config) {
        this._initCircle(config);
    };

    Kinetic.Circle.prototype = {
        _initCircle: function(config) {
            this.createAttrs();
            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = CIRCLE;
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext();

            context.beginPath();
            context.arc(0, 0, this.getRadius(), 0, PIx2, false);
            context.closePath();
            canvas.fillStroke(this);
        },
        getWidth: function() {
            return this.getRadius() * 2;
        },
        getHeight: function() {
            return this.getRadius() * 2;
        },
        setWidth: function(width) {
            Kinetic.Node.prototype.setWidth.call(this, width);
            this.setRadius(width / 2);
        },
        setHeight: function(height) {
            Kinetic.Node.prototype.setHeight.call(this, height);
            this.setRadius(height / 2);
        }
    };
    Kinetic.Util.extend(Kinetic.Circle, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Circle, 'radius', 0);

    /**
     * set radius
     * @method
     * @memberof Kinetic.Circle.prototype
     * @param {Number} radius
     */

    /**
     * get radius
     * @method
     * @memberof Kinetic.Circle.prototype
     */
})();
;(function() {
    // the 0.0001 offset fixes a bug in Chrome 27
    var PIx2 = (Math.PI * 2) - 0.0001,
        ELLIPSE = 'Ellipse';

    /**
     * Ellipse constructor
     * @constructor
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Number|Array|Object} config.radius defines x and y radius
     * {{ShapeParams}}
     * {{NodeParams}}
     */
    Kinetic.Ellipse = function(config) {
        this._initEllipse(config);
    };

    Kinetic.Ellipse.prototype = {
        _initEllipse: function(config) {
            this.createAttrs();

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = ELLIPSE;
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(), r = this.getRadius();
            context.beginPath();
            context.save();
            if(r.x !== r.y) {
                context.scale(1, r.y / r.x);
            }
            context.arc(0, 0, r.x, 0, PIx2, false);
            context.restore();
            context.closePath();
            canvas.fillStroke(this);
        },
        getWidth: function() {
            return this.getRadius().x * 2;
        },
        getHeight: function() {
            return this.getRadius().y * 2;
        },
        setWidth: function(width) {
            Kinetic.Node.prototype.setWidth.call(this, width);
            this.setRadius({
                x: width / 2
            });
        },
        setHeight: function(height) {
            Kinetic.Node.prototype.setHeight.call(this, height);
            this.setRadius({
                y: height / 2
            });
        }
    };
    Kinetic.Util.extend(Kinetic.Ellipse, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addPointGetterSetter(Kinetic.Ellipse, 'radius', 0);

    /**
     * set radius
     * @name setRadius
     * @methodOf Kinetic.Ellipse.prototype
     * @param {Object|Array} radius
     *  radius can be a number, in which the ellipse becomes a circle,
     *  it can be an object with an x and y component, or it
     *  can be an array in which the first element is the x component
     *  and the second element is the y component.  The x component
     *  defines the horizontal radius and the y component
     *  defines the vertical radius
     */

    /**
     * get radius
     * @name getRadius
     * @methodOf Kinetic.Ellipse.prototype
     */
})();;(function() {
    /**
     * Wedge constructor
     * @constructor
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Number} config.angle
     * @param {Number} config.angleDeg angle in degrees
     * @param {Number} config.radius
     * @param {Boolean} [config.clockwise]
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // draw a wedge that's pointing downwards<br>
     * var wedge = new Kinetic.Wedge({<br>
     *   radius: 40,<br>
     *   fill: 'red',<br>
     *   stroke: 'black'<br>
     *   strokeWidth: 5,<br>
     *   angleDeg: 60,<br>
     *   rotationDeg: -120<br>
     * });
     */
    Kinetic.Wedge = function(config) {
        this._initWedge(config);
    };

    Kinetic.Wedge.prototype = {
        _initWedge: function(config) {
            this.createAttrs();

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Wedge';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext();
            context.beginPath();
            context.arc(0, 0, this.getRadius(), 0, this.getAngle(), this.getClockwise());
            context.lineTo(0, 0);
            context.closePath();
            canvas.fillStroke(this);
        }
    };
    Kinetic.Util.extend(Kinetic.Wedge, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Wedge, 'radius', 0);

    /**
     * set radius
     * @name setRadius
     * @method
     * @memberof Kinetic.Wedge.prototype
     * @param {Number} radius
     */

     /**
     * get radius
     * @name getRadius
     * @method
     * @memberof Kinetic.Wedge.prototype
     */

    Kinetic.Node.addRotationGetterSetter(Kinetic.Wedge, 'angle', 0);

    /**
     * set angle
     * @name setAngle
     * @method
     * @memberof Kinetic.Wedge.prototype
     * @param {Number} angle
     */

     /**
     * set angle in degrees
     * @name setAngleDeg
     * @method
     * @memberof Kinetic.Wedge.prototype
     * @param {Number} angleDeg
     */

     /**
     * get angle
     * @name getAngle
     * @method
     * @memberof Kinetic.Wedge.prototype
     */

     /**
     * get angle in degrees
     * @name getAngleDeg
     * @method
     * @memberof Kinetic.Wedge.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Wedge, 'clockwise', false);

    /**
     * set clockwise draw direction.  If set to true, the wedge will be drawn clockwise
     *  If set to false, the wedge will be drawn anti-clockwise.  The default is false.
     * @name setClockwise
     * @method
     * @memberof Kinetic.Wedge.prototype
     * @param {Boolean} clockwise
     */

    /**
     * get clockwise
     * @name getClockwise
     * @method
     * @memberof Kinetic.Wedge.prototype
     */
})();
;(function() {
    // CONSTANTS
    var IMAGE = 'Image',
        CROP = 'crop',
        SET = 'set';
    
    /**
     * Image constructor
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {ImageObject} config.image
     * @param {Object} [config.crop]
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var imageObj = new Image();<br>
     * imageObj.onload = function() {<br>
     *   var image = new Kinetic.Image({<br>
     *     x: 200,<br>
     *     y: 50,<br>
     *     image: imageObj,<br>
     *     width: 100,<br>
     *     height: 100<br>
     *   });<br>
     * };<br>
     * imageObj.src = '/path/to/image.jpg'
     */
    Kinetic.Image = function(config) {
        this._initImage(config);
    };

    Kinetic.Image.prototype = {
        _initImage: function(config) {
            var that = this;
            
            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = IMAGE;
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var width = this.getWidth(), 
                height = this.getHeight(), 
                params, 
                that = this, 
                context = canvas.getContext(),
                crop = this.getCrop(),
                cropX, cropY, cropWidth, cropHeight, image;

            // if a filter is set, and the filter needs to be updated, reapply
            if (this.getFilter() && this._applyFilter) {
                this.applyFilter();
                this._applyFilter = false;
            }

            // NOTE: this.filterCanvas may be set by the above code block
            if (this.filterCanvas) {
                image = this.filterCanvas.getElement();
            }
            else {
                image = this.getImage();
            }

            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            canvas.fillStroke(this);

            if(image) {
                // if cropping
                if(crop) {
                    cropX = crop.x || 0;
                    cropY = crop.y || 0;
                    cropWidth = crop.width || 0;
                    cropHeight = crop.height || 0;
                    params = [image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height];
                }
                // no cropping
                else {
                    params = [image, 0, 0, width, height];
                }

                if(this.hasShadow()) {
                    canvas.applyShadow(this, function() {
                        that._drawImage(context, params);
                    });
                }
                else {
                    this._drawImage(context, params);
                }
            }
        },
        drawHitFunc: function(canvas) {
            var width = this.getWidth(), 
                height = this.getHeight(), 
                imageHitRegion = this.imageHitRegion, 
                context = canvas.getContext();

            if(imageHitRegion) {
                context.drawImage(imageHitRegion, 0, 0, width, height);
                context.beginPath();
                context.rect(0, 0, width, height);
                context.closePath();
                canvas.stroke(this);
            }
            else {
                context.beginPath();
                context.rect(0, 0, width, height);
                context.closePath();
                canvas.fillStroke(this);
            }
        },
        applyFilter: function() {
            var image = this.getImage(),
                that = this,
                width = this.getWidth(),
                height = this.getHeight(),
                filter = this.getFilter(),
                filterCanvas, context, imageData;

            if (this.filterCanvas){
                filterCanvas = this.filterCanvas;
            }
            else {
                filterCanvas = this.filterCanvas = new Kinetic.SceneCanvas({
                    width: width, 
                    height: height
                });
            }

            context = filterCanvas.getContext();

            try {
                this._drawImage(context, [image, 0, 0, width, height]);
                imageData = context.getImageData(0, 0, filterCanvas.getWidth(), filterCanvas.getHeight());
                filter.call(this, imageData);
                context.putImageData(imageData, 0, 0);
            }
            catch(e) {
                this.clearFilter();
                Kinetic.Util.warn('Unable to apply filter. ' + e.message);
            }
        },
        /**
         * clear filter
         * @method
         * @memberof Kinetic.Image.prototype
         */
        clearFilter: function() {
            this.filterCanvas = null;
            this._applyFilter = false;
        },
        /**
         * set crop
         * @method
         * @memberof Kinetic.Image.prototype
         * @param {Object|Array} config
         * @param {Number} config.x
         * @param {Number} config.y
         * @param {Number} config.width
         * @param {Number} config.height
         */
        setCrop: function() {
            var config = [].slice.call(arguments),
                pos = Kinetic.Util._getXY(config),
                size = Kinetic.Util._getSize(config),
                both = Kinetic.Util._merge(pos, size);
                
            this._setAttr(CROP, Kinetic.Util._merge(both, this.getCrop()));
        },
        /**
         * create image hit region which enables more accurate hit detection mapping of the image
         *  by avoiding event detections for transparent pixels
         * @method
         * @memberof Kinetic.Image.prototype
         * @param {Function} [callback] callback function to be called once
         *  the image hit region has been created
         */
        createImageHitRegion: function(callback) {
            var that = this,
                width = this.getWidth(),
                height = this.getHeight(),
                canvas = new Kinetic.Canvas({
                    width: width,
                    height: height
                }),
                context = canvas.getContext(),
                image = this.getImage(),
                imageData, data, rgbColorKey, i, n;
                
            context.drawImage(image, 0, 0);
             
            try {
                imageData = context.getImageData(0, 0, width, height);
                data = imageData.data;
                rgbColorKey = Kinetic.Util._hexToRgb(this.colorKey);
                
                // replace non transparent pixels with color key
                for(i = 0, n = data.length; i < n; i += 4) {
                    if (data[i + 3] > 0) {
                        data[i] = rgbColorKey.r;
                        data[i + 1] = rgbColorKey.g;
                        data[i + 2] = rgbColorKey.b;
                    }
                }

                Kinetic.Util._getImage(imageData, function(imageObj) {
                    that.imageHitRegion = imageObj;
                    if(callback) {
                        callback();
                    }
                });
            }
            catch(e) {
                Kinetic.Util.warn('Unable to create image hit region. ' + e.message);
            }
        },
        /**
         * clear image hit region
         * @method
         * @memberof Kinetic.Image.prototype
         */
        clearImageHitRegion: function() {
            delete this.imageHitRegion;
        },
        getWidth: function() {
            var image = this.getImage(); 
            return this.attrs.width || (image ? image.width : 0); 
        },
        getHeight: function() {
            var image = this.getImage();
            return this.attrs.height || (image ? image.height : 0);
        },
        _drawImage: function(context, a) {
            if(a.length === 5) {
                context.drawImage(a[0], a[1], a[2], a[3], a[4]);
            }
            else if(a.length === 9) {
                context.drawImage(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
            }
        }
    };
    Kinetic.Util.extend(Kinetic.Image, Kinetic.Shape);


    Kinetic.Node.addFilterGetterSetter = function(constructor, attr, def) {
        this.addGetter(constructor, attr, def);
        this.addFilterSetter(constructor, attr);
    };

    Kinetic.Node.addFilterSetter = function(constructor, attr) {
        var that = this,
            method = SET + Kinetic.Util._capitalize(attr);
            
        constructor.prototype[method] = function(val) {
            this._setAttr(attr, val);
            this._applyFilter = true;
        };
    };

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Image, 'image');

    /**
     * set image
     * @name setImage
     * @method
     * @memberof Kinetic.Image.prototype
     * @param {ImageObject} image
     */

    /**
     * get image
     * @name getImage
     * @method
     * @memberof Kinetic.Image.prototype
     */
     
    Kinetic.Node.addGetter(Kinetic.Image, 'crop');

    /**
     * get crop
     * @name getCrop
     * @method
     * @memberof Kinetic.Image.prototype
     */

     Kinetic.Node.addFilterGetterSetter(Kinetic.Image, 'filter');

     /**
     * set filter
     * @name setFilter
     * @method
     * @memberof Kinetic.Image.prototype
     * @param {Function} filter
     */

    /**
     * get filter
     * @name getFilter
     * @method
     * @memberof Kinetic.Image.prototype
     */
})();
;(function() {
    /**
     * Polygon constructor.&nbsp; Polygons are defined by an array of points
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Array} config.points can be a flattened array of points, an array of point arrays, or an array of point objects.
     *  e.g. [0,1,2,3], [[0,1],[2,3]] and [{x:0,y:1},{x:2,y:3}] are equivalent
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var polygon = new Kinetic.Polygon({<br>
     *   points: [73, 192, 73, 160, 340, 23, 500, 109, 499, 139, 342, 93],<br>
     *   fill: '#00D2FF',<br>
     *   stroke: 'black',<br>
     *   strokeWidth: 5<br>
     * });
     */
    Kinetic.Polygon = function(config) {
        this._initPolygon(config);
    };

    Kinetic.Polygon.prototype = {
        _initPolygon: function(config) {
            this.createAttrs();

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Polygon';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(), points = this.getPoints(), length = points.length;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            for(var n = 1; n < length; n++) {
                context.lineTo(points[n].x, points[n].y);
            }
            context.closePath();
            canvas.fillStroke(this);
        }
    };
    Kinetic.Util.extend(Kinetic.Polygon, Kinetic.Shape);

    Kinetic.Node.addPointsGetterSetter(Kinetic.Polygon, 'points');
    /**
     * set points array
     * @method
     * @memberof Kinetic.Polygon.prototype
     * @param {Array} can be an array of point objects or an array
     *  of Numbers.  e.g. [{x:1,y:2},{x:3,y:4}] or [1,2,3,4]
     */

    /**
     * get points array
     * @method
     * @memberof Kinetic.Polygon.prototype
     */
})();
;(function() {
    // constants
    var AUTO = 'auto', 
        CALIBRI = 'Calibri',
        CANVAS = 'canvas', 
        CENTER = 'center',
        CHANGE_KINETIC = 'Change.kinetic',
        CONTEXT_2D = '2d',
        DASH = '-',
        EMPTY_STRING = '', 
        LEFT = 'left',
        NEW_LINE = '\n',
        TEXT = 'text',
        TEXT_UPPER = 'Text', 
        TOP = 'top', 
        MIDDLE = 'middle',
        NORMAL = 'normal',
        PX_SPACE = 'px ',
        SPACE = ' ',
        RIGHT = 'right',
        WORD = 'word',
        CHAR = 'char',
        NONE = 'none',
        ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'padding', 'align', 'lineHeight', 'text', 'width', 'height', 'wrap'],
        
        // cached variables
        attrChangeListLen = ATTR_CHANGE_LIST.length,
        dummyContext = document.createElement(CANVAS).getContext(CONTEXT_2D);

    /**
     * Text constructor
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {String} [config.fontFamily] default is Calibri
     * @param {Number} [config.fontSize] in pixels.  Default is 12
     * @param {String} [config.fontStyle] can be normal, bold, or italic.  Default is normal
     * @param {String} config.text
     * @param {String} [config.align] can be left, center, or right
     * @param {Number} [config.padding]
     * @param {Number} [config.width] default is auto
     * @param {Number} [config.height] default is auto
     * @param {Number} [config.lineHeight] default is 1
     * @param {String} [config.wrap] can be word, char, or none. Default is word
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var text = new Kinetic.Text({<br>
     *   x: stage.getWidth() / 2,<br>
     *   y: 15,<br>
     *   text: 'Simple Text',<br>
     *   fontSize: 30,<br>
     *   fontFamily: 'Calibri',<br>
     *   fill: 'green'<br>
     * });
     */
    Kinetic.Text = function(config) {
        this._initText(config);
    };
    function _fillFunc(context) {
        context.fillText(this.partialText, 0, 0);
    }
    function _strokeFunc(context) {
        context.strokeText(this.partialText, 0, 0);
    }

    Kinetic.Text.prototype = {
        _initText: function(config) {
            var that = this;
            this.createAttrs();
            
            // since width and height work a bit different for Text,
            // we need to default the values here
            this.attrs.width = AUTO;
            this.attrs.height = AUTO;
            
            // call super constructor
            Kinetic.Shape.call(this, config);

            this._fillFunc = _fillFunc;
            this._strokeFunc = _strokeFunc;
            this.className = TEXT_UPPER;
            this._setDrawFuncs();

            // update text data for certain attr changes
            for(var n = 0; n < attrChangeListLen; n++) {
                this.on(ATTR_CHANGE_LIST[n] + CHANGE_KINETIC, that._setTextData);
            }

            this._setTextData();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(), 
                p = this.getPadding(), 
                fontStyle = this.getFontStyle(),
                fontSize = this.getFontSize(),
                fontFamily = this.getFontFamily(),
                textHeight = this.getTextHeight(),
                lineHeightPx = this.getLineHeight() * textHeight, 
                textArr = this.textArr,
                textArrLen = textArr.length,
                totalWidth = this.getWidth();

            context.font = this._getContextFont();
            context.textBaseline = MIDDLE;
            context.textAlign = LEFT;
            context.save();
            context.translate(p, 0);
            context.translate(0, p + textHeight / 2);

            // draw text lines
            for(var n = 0; n < textArrLen; n++) {
                var obj = textArr[n],
                    text = obj.text,
                    width = obj.width;

                // horizontal alignment
                context.save();
                if(this.getAlign() === RIGHT) {
                    context.translate(totalWidth - width - p * 2, 0);
                }
                else if(this.getAlign() === CENTER) {
                    context.translate((totalWidth - width - p * 2) / 2, 0);
                }

                this.partialText = text;
                canvas.fillStroke(this);
                context.restore();
                context.translate(0, lineHeightPx);
            }
            context.restore();
        },
        drawHitFunc: function(canvas) {
            var context = canvas.getContext(), 
                width = this.getWidth(), 
                height = this.getHeight();

            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            canvas.fillStroke(this);
        },
        /**
         * set text
         * @method
         * @memberof Kinetic.Text.prototype
         * @param {String} text
         */
        setText: function(text) {
            var str = Kinetic.Util._isString(text) ? text : text.toString();
            this._setAttr(TEXT, str);
        },
        /**
         * get width
         * @method
         * @memberof Kinetic.Text.prototype
         */
        getWidth: function() {
            return this.attrs.width === AUTO ? this.getTextWidth() + this.getPadding() * 2 : this.attrs.width;
        },
        /**
         * get height
         * @method
         * @memberof Kinetic.Text.prototype
         */
        getHeight: function() {
            return this.attrs.height === AUTO ? (this.getTextHeight() * this.textArr.length * this.getLineHeight()) + this.getPadding() * 2 : this.attrs.height;
        },
        /**
         * get text width
         * @method
         * @memberof Kinetic.Text.prototype
         */
        getTextWidth: function() {
            return this.textWidth;
        },
        /**
         * get text height
         * @method
         * @memberof Kinetic.Text.prototype
         */
        getTextHeight: function() {
            return this.textHeight;
        },
        _getTextSize: function(text) {
            var context = dummyContext,
                fontSize = this.getFontSize(),
                metrics;

            context.save();
            context.font = this._getContextFont();
            
            metrics = context.measureText(text);
            context.restore();
            return {
                width: metrics.width,
                height: parseInt(fontSize, 10)
            };
        },
        _getContextFont: function() {
            return this.getFontStyle() + SPACE + this.getFontSize() + PX_SPACE + this.getFontFamily();
        },
        _addTextLine: function (line, width, height) {
            return this.textArr.push({text: line, width: width});
        },
        _getTextWidth: function (text) {
            return dummyContext.measureText(text).width;
        },
         _setTextData: function () {
             var lines = this.getText().split('\n'),
                 fontSize = +this.getFontSize(),
                 textWidth = 0,
                 lineHeightPx = this.getLineHeight() * fontSize,
                 width = this.attrs.width,
                 height = this.attrs.height,
                 fixedWidth = width !== AUTO,
                 fixedHeight = height !== AUTO,
                 padding = this.getPadding(),
                 maxWidth = width - padding * 2,
                 maxHeightPx = height - padding * 2,
                 currentHeightPx = 0,
                 wrap = this.getWrap(),
                 shouldWrap = wrap !== NONE,
                 wrapAtWord = wrap !==  CHAR && shouldWrap;

             this.textArr = [];
             dummyContext.save();
             dummyContext.font = this.getFontStyle() + SPACE + fontSize + PX_SPACE + this.getFontFamily();
             for (var i = 0, max = lines.length; i < max; ++i) {
                 var line = lines[i],
                     lineWidth = this._getTextWidth(line);
                 if (fixedWidth && lineWidth > maxWidth) {
                     /* 
                      * if width is fixed and line does not fit entirely
                      * break the line into multiple fitting lines
                      */
                     while (line.length > 0) {
                        /*
                         * use binary search to find the longest substring that
                         * that would fit in the specified width
                         */
                         var low = 0, high = line.length,
                             match = '', matchWidth = 0;
                         while (low < high) {
                             var mid = (low + high) >>> 1,
                                 substr = line.slice(0, mid + 1),
                                 substrWidth = this._getTextWidth(substr);
                             if (substrWidth <= maxWidth) {
                                 low = mid + 1;
                                 match = substr;
                                 matchWidth = substrWidth;
                             } else {
                                 high = mid;
                             }
                         }
                         /*
                          * 'low' is now the index of the substring end
                          * 'match' is the substring
                          * 'matchWidth' is the substring width in px
                          */
                         if (match) {
                             // a fitting substring was found
                             if (wrapAtWord) {
                                 // try to find a space or dash where wrapping could be done
                                 var wrapIndex = Math.max(match.lastIndexOf(SPACE),
                                                          match.lastIndexOf(DASH)) + 1;
                                 if (wrapIndex > 0) {
                                     // re-cut the substring found at the space/dash position
                                     low = wrapIndex;
                                     match = match.slice(0, low);
                                     matchWidth = this._getTextWidth(match);
                                 }
                             }
                             this._addTextLine(match, matchWidth);
                             currentHeightPx += lineHeightPx;
                             if (!shouldWrap ||
                                 (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx)) {
                                 /*
                                  * stop wrapping if wrapping is disabled or if adding
                                  * one more line would overflow the fixed height
                                  */
                                 break;
                             }
                             line = line.slice(low);
                             if (line.length > 0) {
                                 // Check if the remaining text would fit on one line
                                 lineWidth = this._getTextWidth(line);
                                 if (lineWidth <= maxWidth) {
                                     // if it does, add the line and break out of the loop
                                     this._addTextLine(line, lineWidth);
                                     currentHeightPx += lineHeightPx;
                                     break;
                                 }
                             }
                         } else {
                             // not even one character could fit in the element, abort
                             break;
                         }
                     }
                 } else {
                     // element width is automatically adjusted to max line width
                     this._addTextLine(line, lineWidth);
                     currentHeightPx += lineHeightPx;
                     textWidth = Math.max(textWidth, lineWidth);
                 }
                 // if element height is fixed, abort if adding one more line would overflow
                 if (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
                     break;
                 }
             }
             dummyContext.restore();
             this.textHeight = fontSize;
             this.textWidth = textWidth;
         }
    };
    Kinetic.Util.extend(Kinetic.Text, Kinetic.Shape);
 
    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Text, 'fontFamily', CALIBRI);

    /**
     * set font family
     * @name setFontFamily
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {String} fontFamily
     */

     /**
     * get font family
     * @name getFontFamily
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Text, 'fontSize', 12);

    /**
     * set font size in pixels
     * @name setFontSize
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {int} fontSize
     */

     /**
     * get font size
     * @name getFontSize
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Text, 'fontStyle', NORMAL);

    /**
     * set font style.  Can be 'normal', 'italic', or 'bold'.  'normal' is the default.
     * @name setFontStyle
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {String} fontStyle
     */

     /**
     * get font style
     * @name getFontStyle
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Text, 'padding', 0);

    /**
     * set padding
     * @name setPadding
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {int} padding
     */

     /**
     * get padding
     * @name getPadding
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Text, 'align', LEFT);

    /**
     * set horizontal align of text
     * @name setAlign
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {String} align align can be 'left', 'center', or 'right'
     */

     /**
     * get horizontal align
     * @name getAlign
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Text, 'lineHeight', 1);

    /**
     * set line height
     * @name setLineHeight
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {Number} lineHeight default is 1
     */

     /**
     * get line height
     * @name getLineHeight
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Text, 'wrap', WORD);

    /**
     * set wrap
     * @name setWrap
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {String} wrap can be word, char, or none. Default is word
     */

     /**
     * get wrap
     * @name getWrap
     * @method
     * @memberof Kinetic.Text.prototype
     */

    Kinetic.Node.addGetter(Kinetic.Text, TEXT, EMPTY_STRING);

    /**
     * get text
     * @name getText
     * @method
     * @memberof Kinetic.Text.prototype
     */
    
    Kinetic.Node.addSetter(Kinetic.Text, 'width');

    /**
     * set width
     * @name setWidth
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {Number|String} width default is auto
     */

    Kinetic.Node.addSetter(Kinetic.Text, 'height'); 

    /**
     * set height
     * @name setHeight
     * @method
     * @memberof Kinetic.Text.prototype
     * @param {Number|String} height default is auto
     */
})();
;(function() {
    /**
     * Line constructor.&nbsp; Lines are defined by an array of points
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Array} config.points can be a flattened array of points, an array of point arrays, or an array of point objects.
     *  e.g. [0,1,2,3], [[0,1],[2,3]] and [{x:0,y:1},{x:2,y:3}] are equivalent
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // simple line
     * var line = new Kinetic.Line({<br>
     *   x: 100,<br>
     *   y: 50,<br>
     *   points: [73, 70, 340, 23, 450, 60, 500, 20],<br>
     *   stroke: 'red'<br>
     * });<br><br>
     *
     * // dashed line with shadow<br>
     * var line = new Kinetic.Line({<br>
     *   x: 100,<br>
     *   y: 50,<br>
     *   points: [73, 70, 340, 23, 450, 60, 500, 20],<br>
     *   stroke: 'red',<br>
     *   dashArray: [33, 10],<br>
     *   shadowColor: 'black',<br>
     *   shadowBlur: 10,<br>
     *   shadowOffset: 10,<br>
     *   shadowOpacity: 0.5<br>
     * });
     */
    Kinetic.Line = function(config) {
        this._initLine(config);
    };

    Kinetic.Line.prototype = {
        _initLine: function(config) {
            this.createAttrs();

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Line';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var points = this.getPoints(), 
                length = points.length, 
                context = canvas.getContext(),
                n, point;

            context.beginPath();
            context.moveTo(points[0].x, points[0].y);

            for(n = 1; n < length; n++) {
                point = points[n];
                context.lineTo(point.x, point.y);
            }

            canvas.stroke(this);
        }
    };
    Kinetic.Util.extend(Kinetic.Line, Kinetic.Shape);

    Kinetic.Node.addPointsGetterSetter(Kinetic.Line, 'points');
    /**
     * set points array
     * @method
     * @memberof Kinetic.Line.prototype
     * @param {Array} can be an array of point objects or an array
     *  of Numbers.  e.g. [{x:1,y:2},{x:3,y:4}] or [1,2,3,4]
     */

    /**
     * get points array
     * @method
     * @memberof Kinetic.Line.prototype
     */
})();
;(function() {
    /**
     * Spline constructor.&nbsp; Splines are defined by an array of points and
     *  a tension
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Array} config.points can be a flattened array of points, an array of point arrays, or an array of point objects.
     *  e.g. [0,1,2,3], [[0,1],[2,3]] and [{x:0,y:1},{x:2,y:3}] are equivalent
     * @param {Number} [config.tension] default value is 1.  Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var spline = new Kinetic.Spline({<br>
     *   x: 100,<br>
     *   y: 50,<br>
     *   points: [73, 70, 340, 23, 450, 60, 500, 20],<br>
     *   stroke: 'red',<br>
     *   tension: 1<br>
     * });
     */
    Kinetic.Spline = function(config) {
        this._initSpline(config);
    };

    Kinetic.Spline.prototype = {
        _initSpline: function(config) {
            this.createAttrs();
            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Spline';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var points = this.getPoints(), 
                length = points.length, 
                context = canvas.getContext(), 
                tension = this.getTension(),
                ap, len, n, point;

            context.beginPath();
            context.moveTo(points[0].x, points[0].y);

            // tension
            if(tension !== 0 && length > 2) {
                ap = this.allPoints;
                len = ap.length;
                n = 2;

                context.quadraticCurveTo(ap[0].x, ap[0].y, ap[1].x, ap[1].y);

                while(n < len - 1) {
                    context.bezierCurveTo(ap[n].x, ap[n++].y, ap[n].x, ap[n++].y, ap[n].x, ap[n++].y);
                }

                context.quadraticCurveTo(ap[len - 1].x, ap[len - 1].y, points[length - 1].x, points[length - 1].y);
            }
            // no tension
            else {
                for(n = 1; n < length; n++) {
                    point = points[n];
                    context.lineTo(point.x, point.y);
                }
            }

            canvas.stroke(this);
        },
        /**
         * set tension
         * @method
         * @memberof Kinetic.Spline.prototype
         * @param {Number} tension
         */
        setTension: function(tension) {
            this._setAttr('tension', tension);
            this._setAllPoints();
        },
        /**
         * set points array
         * @method
         * @memberof Kinetic.Spline.prototype
         * @param {Array} can be an array of point objects or an array
         *  of Numbers.  e.g. [{x:1,y:2},{x:3,y:4}] or [1,2,3,4]
         */
        setPoints: function(points) {
            Kinetic.Node.setPoints.call(this, points);
            this._setAllPoints();
        },
        _setAllPoints: function() {
            this.allPoints = Kinetic.Util._expandPoints(this.getPoints(), this.getTension());
        }
    };
    Kinetic.Util.extend(Kinetic.Spline, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addGetter(Kinetic.Spline, 'tension', 1);

    /**
     * get tension
     * @name getTension
     * @method
     * @memberof Kinetic.Spline.prototype
     */

    Kinetic.Node.addPointsGetter(Kinetic.Spline, 'points');
    /**
     * get points array
     * @method
     * @memberof Kinetic.Spline.prototype
     */
})();
;(function() {
    /**
     * Blob constructor.  Blobs are defined by an array of points and
     *  a tension
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Array} config.points can be a flattened array of points, an array of point arrays, or an array of point objects.
     *  e.g. [0,1,2,3], [[0,1],[2,3]] and [{x:0,y:1},{x:2,y:3}] are equivalent
     * @param {Number} [config.tension] default value is 1.  Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var blob = new Kinetic.Blob({<br>
     *   points: [73, 140, 340, 23, 500, 109, 300, 170],<br>
     *   tension: 0.8,<br>
     *   fill: 'red',<br>
     *   stroke: 'black'<br>
     *   strokeWidth: 5<br>
     * });
     */
    Kinetic.Blob = function(config) {
        this._initBlob(config);
    };

    Kinetic.Blob.prototype = {
        _initBlob: function(config) {
            this.createAttrs();
            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Blob';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var points = this.getPoints(), 
                length = points.length, 
                context = canvas.getContext(), 
                tension = this.getTension(),
                ap, len, n, point;

            context.beginPath();
            context.moveTo(points[0].x, points[0].y);

            // tension
            if(tension !== 0 && length > 2) {
                ap = this.allPoints;
                len = ap.length;
                n = 0;

                while(n < len-1) {
                    context.bezierCurveTo(ap[n].x, ap[n++].y, ap[n].x, ap[n++].y, ap[n].x, ap[n++].y);
                } 
            }
            // no tension
            else {
                for(n = 1; n < length; n++) {
                    point = points[n];
                    context.lineTo(point.x, point.y);
                }
            }

			context.closePath();
            canvas.fillStroke(this);
        },
        /**
         * set tension
         * @method
         * @memberof Kinetic.Blob.prototype
         * @param {Number} tension
         */
        setTension: function(tension) {
            this._setAttr('tension', tension);
            this._setAllPoints();
        },
        /**
         * set points array
         * @method
         * @memberof Kinetic.Blob.prototype
         * @param {Array} can be an array of point objects or an array
         *  of Numbers.  e.g. [{x:1,y:2},{x:3,y:4}] or [1,2,3,4]
         */
        setPoints: function(points) {
            Kinetic.Node.setPoints.call(this, points);
            this._setAllPoints();
        },
        _setAllPoints: function() {
            var points = this.getPoints(), 
                length = points.length, 
                tension = this.getTension(), 
                util = Kinetic.Util,
                firstControlPoints = util._getControlPoints(points[length - 1], points[0], points[1], tension), 
                lastControlPoints = util._getControlPoints(points[length - 2], points[length - 1], points[0], tension);

            this.allPoints = Kinetic.Util._expandPoints(this.getPoints(), this.getTension());

            // prepend control point
            this.allPoints.unshift(firstControlPoints[1]);

            // append cp, point, cp, cp, first point
            this.allPoints.push(lastControlPoints[0]);
            this.allPoints.push(points[length - 1]);
            this.allPoints.push(lastControlPoints[1]);
            this.allPoints.push(firstControlPoints[0]);
            this.allPoints.push(points[0]);
        }
    };

    Kinetic.Util.extend(Kinetic.Blob, Kinetic.Shape);

    Kinetic.Node.addGetter(Kinetic.Blob, 'tension', 1);
    /**
     * get tension
     * @name getTension
     * @method
     * @memberof Kinetic.Blob.prototype
     */

    Kinetic.Node.addPointsGetter(Kinetic.Blob, 'points');
    /**
     * get points array
     * @method
     * @memberof Kinetic.Blob.prototype
     */
})();
;(function() {
    /**
     * Sprite constructor
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {String} config.animation animation key
     * @param {Object} config.animations animation map
     * @param {Integer} [config.index] animation index
     * @param {Image} config.image image object
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var animations = {<br>
     *   idle: [{<br>
     *     x: 2,<br>
     *     y: 2,<br>
     *     width: 70,<br>
     *     height: 119<br>
     *   }, {<br>
     *     x: 71,<br>
     *     y: 2,<br>
     *     width: 74,<br>
     *     height: 119<br>
     *   }, {<br>
     *     x: 146,<br>
     *     y: 2,<br>
     *     width: 81,<br>
     *     height: 119<br>
     *   }, {<br>
     *     x: 226,<br>
     *     y: 2,<br>
     *     width: 76,<br>
     *     height: 119<br>
     *   }],<br>
     *   punch: [{<br>
     *     x: 2,<br>
     *     y: 138,<br>
     *     width: 74,<br>
     *     height: 122<br>
     *   }, {<br>
     *     x: 76,<br>
     *     y: 138,<br>
     *     width: 84,<br>
     *     height: 122<br>
     *   }, {<br>
     *     x: 346,<br>
     *     y: 138,<br>
     *     width: 120,<br>
     *     height: 122<br>
     *   }]<br>
     * };<br><br>
     *
     * var imageObj = new Image();<br>
     * imageObj.onload = function() {<br>
     *   var sprite = new Kinetic.Sprite({<br>
     *     x: 200,<br>
     *     y: 100,<br>
     *     image: imageObj,<br>
     *     animation: 'idle',<br>
     *     animations: animations,<br>
     *     frameRate: 7,<br>
     *     index: 0<br>    
     *   });<br>
     * };<br>
     * imageObj.src = '/path/to/image.jpg'
     */
    Kinetic.Sprite = function(config) {
        this._initSprite(config);
    };

    Kinetic.Sprite.prototype = {
        _initSprite: function(config) {
            this.createAttrs();
            
            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Sprite';
            this._setDrawFuncs();

            this.anim = new Kinetic.Animation();
            var that = this;
            this.on('animationChange', function() {
                // reset index when animation changes
                that.setIndex(0);
            });
        },
        drawFunc: function(canvas) {
            var anim = this.getAnimation(), 
                index = this.getIndex(), 
                f = this.getAnimations()[anim][index], 
                context = canvas.getContext(), 
                image = this.getImage();

            if(image) {
                context.drawImage(image, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
            }
        },
        drawHitFunc: function(canvas) {
            var anim = this.getAnimation(), 
                index = this.getIndex(), 
                f = this.getAnimations()[anim][index], 
                context = canvas.getContext();

            context.beginPath();
            context.rect(0, 0, f.width, f.height);
            context.closePath();
            canvas.fill(this);
        },
        /**
         * start sprite animation
         * @method
         * @memberof Kinetic.Sprite.prototype
         */
        start: function() {
            var that = this;
            var layer = this.getLayer();

            /*
             * animation object has no executable function because
             *  the updates are done with a fixed FPS with the setInterval
             *  below.  The anim object only needs the layer reference for
             *  redraw
             */
            this.anim.setLayers(layer);

            this.interval = setInterval(function() {
                var index = that.getIndex();
                that._updateIndex();
                if(that.afterFrameFunc && index === that.afterFrameIndex) {
                    that.afterFrameFunc();
                    delete that.afterFrameFunc;
                    delete that.afterFrameIndex;
                }
            }, 1000 / this.getFrameRate());

            this.anim.start();
        },
        /**
         * stop sprite animation
         * @method
         * @memberof Kinetic.Sprite.prototype
         */
        stop: function() {
            this.anim.stop();
            clearInterval(this.interval);
        },
        /**
         * set after frame event handler
         * @method
         * @memberof Kinetic.Sprite.prototype
         * @param {Integer} index frame index
         * @param {Function} func function to be executed after frame has been drawn
         */
        afterFrame: function(index, func) {
            this.afterFrameIndex = index;
            this.afterFrameFunc = func;
        },
        _updateIndex: function() {
            var index = this.getIndex(),
                animation = this.getAnimation(),
                animations = this.getAnimations(),
                anim = animations[animation], 
                len = anim.length;
                 
            if(index < len - 1) {
                this.setIndex(index + 1);
            }
            else {
                this.setIndex(0);
            }
        }
    };
    Kinetic.Util.extend(Kinetic.Sprite, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Sprite, 'animation');

    /**
     * set animation key
     * @name setAnimation
     * @method
     * @memberof Kinetic.Sprite.prototype
     * @param {String} anim animation key
     */

     /**
     * get animation key
     * @name getAnimation
     * @method
     * @memberof Kinetic.Sprite.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Sprite, 'animations');

    /**
     * set animations map
     * @name setAnimations
     * @method
     * @memberof Kinetic.Sprite.prototype
     * @param {Object} animations
     */

     /**
     * get animations map
     * @name getAnimations
     * @method
     * @memberof Kinetic.Sprite.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Sprite, 'image');

    /**
     * set image 
     * @name setImage
     * @method
     * @memberof Kinetic.Sprite.prototype
     * @param {Image} image 
     */

     /**
     * get image
     * @name getImage
     * @method
     * @memberof Kinetic.Sprite.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Sprite, 'index', 0);

    /**
     * set animation frame index
     * @name setIndex
     * @method
     * @memberof Kinetic.Sprite.prototype
     * @param {Integer} index frame index
     */

     /**
     * get animation frame index
     * @name getIndex
     * @method
     * @memberof Kinetic.Sprite.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Sprite, 'frameRate', 17);

    /**
     * set frame rate in frames / second.  Default is 17 frames per second.  Increase this number to make the sprite
     *  animation run faster, and decrease the number to make the sprite animation run slower
     * @name setFrameRate
     * @method
     * @memberof Kinetic.Sprite.prototype
     * @param {Integer} frameRate
     */

     /**
     * get frame rate
     * @name getFrameRate
     * @method
     * @memberof Kinetic.Sprite.prototype
     */

})();
;(function() {
    /**
     * Path constructor.
     * @author Jason Follas
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {String} config.data SVG data string
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var path = new Kinetic.Path({<br>
     *   x: 240,<br>
     *   y: 40,<br>
     *   data: 'M12.582,9.551C3.251,16.237,0.921,29.021,7.08,38.564l-2.36,1.689l4.893,2.262l4.893,2.262l-0.568-5.36l-0.567-5.359l-2.365,1.694c-4.657-7.375-2.83-17.185,4.352-22.33c7.451-5.338,17.817-3.625,23.156,3.824c5.337,7.449,3.625,17.813-3.821,23.152l2.857,3.988c9.617-6.893,11.827-20.277,4.935-29.896C35.591,4.87,22.204,2.658,12.582,9.551z',<br>
     *   fill: 'green',<br>
     *   scale: 2<br>
     * });
     */
    Kinetic.Path = function(config) {
        this._initPath(config);
    };

    Kinetic.Path.prototype = {
        _initPath: function(config) {
            this.dataArray = [];
            var that = this;

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Path';
            this._setDrawFuncs();

            this.dataArray = Kinetic.Path.parsePathData(this.getData());
            this.on('dataChange', function() {
                that.dataArray = Kinetic.Path.parsePathData(this.getData());
            });
        },
        drawFunc: function(canvas) {
            var ca = this.dataArray, context = canvas.getContext();
            // context position
            context.beginPath();
            for(var n = 0; n < ca.length; n++) {
                var c = ca[n].command;
                var p = ca[n].points;
                switch (c) {
                    case 'L':
                        context.lineTo(p[0], p[1]);
                        break;
                    case 'M':
                        context.moveTo(p[0], p[1]);
                        break;
                    case 'C':
                        context.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
                        break;
                    case 'Q':
                        context.quadraticCurveTo(p[0], p[1], p[2], p[3]);
                        break;
                    case 'A':
                        var cx = p[0], cy = p[1], rx = p[2], ry = p[3], theta = p[4], dTheta = p[5], psi = p[6], fs = p[7];

                        var r = (rx > ry) ? rx : ry;
                        var scaleX = (rx > ry) ? 1 : rx / ry;
                        var scaleY = (rx > ry) ? ry / rx : 1;

                        context.translate(cx, cy);
                        context.rotate(psi);
                        context.scale(scaleX, scaleY);
                        context.arc(0, 0, r, theta, theta + dTheta, 1 - fs);
                        context.scale(1 / scaleX, 1 / scaleY);
                        context.rotate(-psi);
                        context.translate(-cx, -cy);

                        break;
                    case 'z':
                        context.closePath();
                        break;
                }
            }
            canvas.fillStroke(this);
        }
    };
    Kinetic.Util.extend(Kinetic.Path, Kinetic.Shape);

    Kinetic.Path.getLineLength = function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    };
    Kinetic.Path.getPointOnLine = function(dist, P1x, P1y, P2x, P2y, fromX, fromY) {
        if(fromX === undefined) {
            fromX = P1x;
        }
        if(fromY === undefined) {
            fromY = P1y;
        }

        var m = (P2y - P1y) / ((P2x - P1x) + 0.00000001);
        var run = Math.sqrt(dist * dist / (1 + m * m));
        if(P2x < P1x)
            run *= -1;
        var rise = m * run;
        var pt;

        if((fromY - P1y) / ((fromX - P1x) + 0.00000001) === m) {
            pt = {
                x: fromX + run,
                y: fromY + rise
            };
        }
        else {
            var ix, iy;

            var len = this.getLineLength(P1x, P1y, P2x, P2y);
            if(len < 0.00000001) {
                return undefined;
            }
            var u = (((fromX - P1x) * (P2x - P1x)) + ((fromY - P1y) * (P2y - P1y)));
            u = u / (len * len);
            ix = P1x + u * (P2x - P1x);
            iy = P1y + u * (P2y - P1y);

            var pRise = this.getLineLength(fromX, fromY, ix, iy);
            var pRun = Math.sqrt(dist * dist - pRise * pRise);
            run = Math.sqrt(pRun * pRun / (1 + m * m));
            if(P2x < P1x)
                run *= -1;
            rise = m * run;
            pt = {
                x: ix + run,
                y: iy + rise
            };
        }

        return pt;
    };

    Kinetic.Path.getPointOnCubicBezier = function(pct, P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y) {
        function CB1(t) {
            return t * t * t;
        }
        function CB2(t) {
            return 3 * t * t * (1 - t);
        }
        function CB3(t) {
            return 3 * t * (1 - t) * (1 - t);
        }
        function CB4(t) {
            return (1 - t) * (1 - t) * (1 - t);
        }
        var x = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
        var y = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);

        return {
            x: x,
            y: y
        };
    };
    Kinetic.Path.getPointOnQuadraticBezier = function(pct, P1x, P1y, P2x, P2y, P3x, P3y) {
        function QB1(t) {
            return t * t;
        }
        function QB2(t) {
            return 2 * t * (1 - t);
        }
        function QB3(t) {
            return (1 - t) * (1 - t);
        }
        var x = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
        var y = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);

        return {
            x: x,
            y: y
        };
    };
    Kinetic.Path.getPointOnEllipticalArc = function(cx, cy, rx, ry, theta, psi) {
        var cosPsi = Math.cos(psi), sinPsi = Math.sin(psi);
        var pt = {
            x: rx * Math.cos(theta),
            y: ry * Math.sin(theta)
        };
        return {
            x: cx + (pt.x * cosPsi - pt.y * sinPsi),
            y: cy + (pt.x * sinPsi + pt.y * cosPsi)
        };
    };
    /*
     * get parsed data array from the data
     *  string.  V, v, H, h, and l data are converted to
     *  L data for the purpose of high performance Path
     *  rendering
     */
    Kinetic.Path.parsePathData = function(data) {
        // Path Data Segment must begin with a moveTo
        //m (x y)+  Relative moveTo (subsequent points are treated as lineTo)
        //M (x y)+  Absolute moveTo (subsequent points are treated as lineTo)
        //l (x y)+  Relative lineTo
        //L (x y)+  Absolute LineTo
        //h (x)+    Relative horizontal lineTo
        //H (x)+    Absolute horizontal lineTo
        //v (y)+    Relative vertical lineTo
        //V (y)+    Absolute vertical lineTo
        //z (closepath)
        //Z (closepath)
        //c (x1 y1 x2 y2 x y)+ Relative Bezier curve
        //C (x1 y1 x2 y2 x y)+ Absolute Bezier curve
        //q (x1 y1 x y)+       Relative Quadratic Bezier
        //Q (x1 y1 x y)+       Absolute Quadratic Bezier
        //t (x y)+    Shorthand/Smooth Relative Quadratic Bezier
        //T (x y)+    Shorthand/Smooth Absolute Quadratic Bezier
        //s (x2 y2 x y)+       Shorthand/Smooth Relative Bezier curve
        //S (x2 y2 x y)+       Shorthand/Smooth Absolute Bezier curve
        //a (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+     Relative Elliptical Arc
        //A (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+  Absolute Elliptical Arc

        // return early if data is not defined
        if(!data) {
            return [];
        }

        // command string
        var cs = data;

        // command chars
        var cc = ['m', 'M', 'l', 'L', 'v', 'V', 'h', 'H', 'z', 'Z', 'c', 'C', 'q', 'Q', 't', 'T', 's', 'S', 'a', 'A'];
        // convert white spaces to commas
        cs = cs.replace(new RegExp(' ', 'g'), ',');
        // create pipes so that we can split the data
        for(var n = 0; n < cc.length; n++) {
            cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
        }
        // create array
        var arr = cs.split('|');
        var ca = [];
        // init context point
        var cpx = 0;
        var cpy = 0;
        for(var n = 1; n < arr.length; n++) {
            var str = arr[n];
            var c = str.charAt(0);
            str = str.slice(1);
            // remove ,- for consistency
            str = str.replace(new RegExp(',-', 'g'), '-');
            // add commas so that it's easy to split
            str = str.replace(new RegExp('-', 'g'), ',-');
            str = str.replace(new RegExp('e,-', 'g'), 'e-');
            var p = str.split(',');
            if(p.length > 0 && p[0] === '') {
                p.shift();
            }
            // convert strings to floats
            for(var i = 0; i < p.length; i++) {
                p[i] = parseFloat(p[i]);
            }
            while(p.length > 0) {
                if(isNaN(p[0]))// case for a trailing comma before next command
                    break;

                var cmd = null;
                var points = [];
                var startX = cpx, startY = cpy;

                // convert l, H, h, V, and v to L
                switch (c) {

                    // Note: Keep the lineTo's above the moveTo's in this switch
                    case 'l':
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'L':
                        cpx = p.shift();
                        cpy = p.shift();
                        points.push(cpx, cpy);
                        break;

                    // Note: lineTo handlers need to be above this point
                    case 'm':
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'M';
                        points.push(cpx, cpy);
                        c = 'l';
                        // subsequent points are treated as relative lineTo
                        break;
                    case 'M':
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'M';
                        points.push(cpx, cpy);
                        c = 'L';
                        // subsequent points are treated as absolute lineTo
                        break;

                    case 'h':
                        cpx += p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'H':
                        cpx = p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'v':
                        cpy += p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'V':
                        cpy = p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'C':
                        points.push(p.shift(), p.shift(), p.shift(), p.shift());
                        cpx = p.shift();
                        cpy = p.shift();
                        points.push(cpx, cpy);
                        break;
                    case 'c':
                        points.push(cpx + p.shift(), cpy + p.shift(), cpx + p.shift(), cpy + p.shift());
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'C';
                        points.push(cpx, cpy);
                        break;
                    case 'S':
                        var ctlPtx = cpx, ctlPty = cpy;
                        var prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'C') {
                            ctlPtx = cpx + (cpx - prevCmd.points[2]);
                            ctlPty = cpy + (cpy - prevCmd.points[3]);
                        }
                        points.push(ctlPtx, ctlPty, p.shift(), p.shift());
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'C';
                        points.push(cpx, cpy);
                        break;
                    case 's':
                        var ctlPtx = cpx, ctlPty = cpy;
                        var prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'C') {
                            ctlPtx = cpx + (cpx - prevCmd.points[2]);
                            ctlPty = cpy + (cpy - prevCmd.points[3]);
                        }
                        points.push(ctlPtx, ctlPty, cpx + p.shift(), cpy + p.shift());
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'C';
                        points.push(cpx, cpy);
                        break;
                    case 'Q':
                        points.push(p.shift(), p.shift());
                        cpx = p.shift();
                        cpy = p.shift();
                        points.push(cpx, cpy);
                        break;
                    case 'q':
                        points.push(cpx + p.shift(), cpy + p.shift());
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'Q';
                        points.push(cpx, cpy);
                        break;
                    case 'T':
                        var ctlPtx = cpx, ctlPty = cpy;
                        var prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'Q') {
                            ctlPtx = cpx + (cpx - prevCmd.points[0]);
                            ctlPty = cpy + (cpy - prevCmd.points[1]);
                        }
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'Q';
                        points.push(ctlPtx, ctlPty, cpx, cpy);
                        break;
                    case 't':
                        var ctlPtx = cpx, ctlPty = cpy;
                        var prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'Q') {
                            ctlPtx = cpx + (cpx - prevCmd.points[0]);
                            ctlPty = cpy + (cpy - prevCmd.points[1]);
                        }
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'Q';
                        points.push(ctlPtx, ctlPty, cpx, cpy);
                        break;
                    case 'A':
                        var rx = p.shift(), ry = p.shift(), psi = p.shift(), fa = p.shift(), fs = p.shift();
                        var x1 = cpx, y1 = cpy; cpx = p.shift(), cpy = p.shift();
                        cmd = 'A';
                        points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
                        break;
                    case 'a':
                        var rx = p.shift(), ry = p.shift(), psi = p.shift(), fa = p.shift(), fs = p.shift();
                        var x1 = cpx, y1 = cpy; cpx += p.shift(), cpy += p.shift();
                        cmd = 'A';
                        points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
                        break;
                }

                ca.push({
                    command: cmd || c,
                    points: points,
                    start: {
                        x: startX,
                        y: startY
                    },
                    pathLength: this.calcLength(startX, startY, cmd || c, points)
                });
            }

            if(c === 'z' || c === 'Z') {
                ca.push({
                    command: 'z',
                    points: [],
                    start: undefined,
                    pathLength: 0
                });
            }
        }

        return ca;
    };
    Kinetic.Path.calcLength = function(x, y, cmd, points) {
        var len, p1, p2;
        var path = Kinetic.Path;

        switch (cmd) {
            case 'L':
                return path.getLineLength(x, y, points[0], points[1]);
            case 'C':
                // Approximates by breaking curve into 100 line segments
                len = 0.0;
                p1 = path.getPointOnCubicBezier(0, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
                for( t = 0.01; t <= 1; t += 0.01) {
                    p2 = path.getPointOnCubicBezier(t, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
                    len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                    p1 = p2;
                }
                return len;
            case 'Q':
                // Approximates by breaking curve into 100 line segments
                len = 0.0;
                p1 = path.getPointOnQuadraticBezier(0, x, y, points[0], points[1], points[2], points[3]);
                for( t = 0.01; t <= 1; t += 0.01) {
                    p2 = path.getPointOnQuadraticBezier(t, x, y, points[0], points[1], points[2], points[3]);
                    len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                    p1 = p2;
                }
                return len;
            case 'A':
                // Approximates by breaking curve into line segments
                len = 0.0;
                var start = points[4];
                // 4 = theta
                var dTheta = points[5];
                // 5 = dTheta
                var end = points[4] + dTheta;
                var inc = Math.PI / 180.0;
                // 1 degree resolution
                if(Math.abs(start - end) < inc) {
                    inc = Math.abs(start - end);
                }
                // Note: for purpose of calculating arc length, not going to worry about rotating X-axis by angle psi
                p1 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], start, 0);
                if(dTheta < 0) {// clockwise
                    for( t = start - inc; t > end; t -= inc) {
                        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
                        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                        p1 = p2;
                    }
                }
                else {// counter-clockwise
                    for( t = start + inc; t < end; t += inc) {
                        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
                        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                        p1 = p2;
                    }
                }
                p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], end, 0);
                len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);

                return len;
        }

        return 0;
    };
    Kinetic.Path.convertEndpointToCenterParameterization = function(x1, y1, x2, y2, fa, fs, rx, ry, psiDeg) {
        // Derived from: http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
        var psi = psiDeg * (Math.PI / 180.0);
        var xp = Math.cos(psi) * (x1 - x2) / 2.0 + Math.sin(psi) * (y1 - y2) / 2.0;
        var yp = -1 * Math.sin(psi) * (x1 - x2) / 2.0 + Math.cos(psi) * (y1 - y2) / 2.0;

        var lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);

        if(lambda > 1) {
            rx *= Math.sqrt(lambda);
            ry *= Math.sqrt(lambda);
        }

        var f = Math.sqrt((((rx * rx) * (ry * ry)) - ((rx * rx) * (yp * yp)) - ((ry * ry) * (xp * xp))) / ((rx * rx) * (yp * yp) + (ry * ry) * (xp * xp)));

        if(fa == fs) {
            f *= -1;
        }
        if(isNaN(f)) {
            f = 0;
        }

        var cxp = f * rx * yp / ry;
        var cyp = f * -ry * xp / rx;

        var cx = (x1 + x2) / 2.0 + Math.cos(psi) * cxp - Math.sin(psi) * cyp;
        var cy = (y1 + y2) / 2.0 + Math.sin(psi) * cxp + Math.cos(psi) * cyp;

        var vMag = function(v) {
            return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        };
        var vRatio = function(u, v) {
            return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
        };
        var vAngle = function(u, v) {
            return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
        };
        var theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
        var u = [(xp - cxp) / rx, (yp - cyp) / ry];
        var v = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
        var dTheta = vAngle(u, v);

        if(vRatio(u, v) <= -1) {
            dTheta = Math.PI;
        }
        if(vRatio(u, v) >= 1) {
            dTheta = 0;
        }
        if(fs === 0 && dTheta > 0) {
            dTheta = dTheta - 2 * Math.PI;
        }
        if(fs == 1 && dTheta < 0) {
            dTheta = dTheta + 2 * Math.PI;
        }
        return [cx, cy, rx, ry, theta, dTheta, psi, fs];
    };
    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Path, 'data');

    /**
     * set SVG path data string.  This method
     *  also automatically parses the data string
     *  into a data array.  Currently supported SVG data:
     *  M, m, L, l, H, h, V, v, Q, q, T, t, C, c, S, s, A, a, Z, z
     * @name setData
     * @method
     * @memberof Kinetic.Path.prototype
     * @param {String} SVG path command string
     */

    /**
     * get SVG path data string
     * @name getData
     * @method
     * @memberof Kinetic.Path.prototype
     */
})();
;(function() {
    var EMPTY_STRING = '',
        CALIBRI = 'Calibri',
        NORMAL = 'normal';

    /**
     * Path constructor.
     * @author Jason Follas
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {String} [config.fontFamily] default is Calibri
     * @param {Number} [config.fontSize] default is 12
     * @param {String} [config.fontStyle] can be normal, bold, or italic.  Default is normal
     * @param {String} config.text
     * @param {String} config.data SVG data string
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var textpath = new Kinetic.TextPath({<br>
     *   x: 100,<br>
     *   y: 50,<br>
     *   fill: '#333',<br>
     *   fontSize: '24',<br>
     *   fontFamily: 'Arial',<br>
     *   text: 'All the world\'s a stage, and all the men and women merely players.',<br>
     *   data: 'M10,10 C0,0 10,150 100,100 S300,150 400,50'<br>
     * });
     */
    Kinetic.TextPath = function(config) {
        this._initTextPath(config);
    };
    
    function _fillFunc(context) {
        context.fillText(this.partialText, 0, 0);
    }
    function _strokeFunc(context) {
        context.strokeText(this.partialText, 0, 0);
    }

    Kinetic.TextPath.prototype = {
        _initTextPath: function(config) {
            var that = this;
          
            this.createAttrs();
            this.dummyCanvas = document.createElement('canvas');
            this.dataArray = [];
            
            // call super constructor
            Kinetic.Shape.call(this, config);

            // overrides
            // TODO: shouldn't this be on the prototype?
            this._fillFunc = _fillFunc;
            this._strokeFunc = _strokeFunc;

            this.className = 'TextPath';
            this._setDrawFuncs();

            this.dataArray = Kinetic.Path.parsePathData(this.attrs.data);
            this.on('dataChange', function() {
                that.dataArray = Kinetic.Path.parsePathData(this.attrs.data);
            });
            // update text data for certain attr changes
            var attrs = ['text', 'textStroke', 'textStrokeWidth'];
            for(var n = 0; n < attrs.length; n++) {
                var attr = attrs[n];
                this.on(attr + 'Change', that._setTextData);
            }
            that._setTextData();
        },
        drawFunc: function(canvas) {
            var charArr = this.charArr, context = canvas.getContext();

            context.font = this._getContextFont();
            context.textBaseline = 'middle';
            context.textAlign = 'left';
            context.save();

            var glyphInfo = this.glyphInfo;
            for(var i = 0; i < glyphInfo.length; i++) {
                context.save();

                var p0 = glyphInfo[i].p0;
                var p1 = glyphInfo[i].p1;
                var ht = parseFloat(this.attrs.fontSize);

                context.translate(p0.x, p0.y);
                context.rotate(glyphInfo[i].rotation);
                this.partialText = glyphInfo[i].text;
                
                canvas.fillStroke(this);
                context.restore();

                //// To assist with debugging visually, uncomment following
                // context.beginPath();
                // if (i % 2)
                // context.strokeStyle = 'cyan';
                // else
                // context.strokeStyle = 'green';

                // context.moveTo(p0.x, p0.y);
                // context.lineTo(p1.x, p1.y);
                // context.stroke();
            }
            context.restore();
        },
        /**
         * get text width in pixels
         * @method
         * @memberof Kinetic.TextPath.prototype
         */
        getTextWidth: function() {
            return this.textWidth;
        },
        /**
         * get text height in pixels
         * @method
         * @memberof Kinetic.TextPath.prototype
         */
        getTextHeight: function() {
            return this.textHeight;
        },
        /**
         * set text
         * @method
         * @memberof Kinetic.TextPath.prototype
         * @param {String} text
         */
        setText: function(text) {
            Kinetic.Text.prototype.setText.call(this, text);
        },
        _getTextSize: function(text) {
            var dummyCanvas = this.dummyCanvas;
            var context = dummyCanvas.getContext('2d');

            context.save();

            context.font = this._getContextFont();
            var metrics = context.measureText(text);

            context.restore();

            return {
                width: metrics.width,
                height: parseInt(this.attrs.fontSize, 10)
            };
        },
        _setTextData: function() {

            var that = this;
            var size = this._getTextSize(this.attrs.text);
            this.textWidth = size.width;
            this.textHeight = size.height;

            this.glyphInfo = [];

            var charArr = this.attrs.text.split('');

            var p0, p1, pathCmd;

            var pIndex = -1;
            var currentT = 0;

            var getNextPathSegment = function() {
                currentT = 0;
                var pathData = that.dataArray;

                for(var i = pIndex + 1; i < pathData.length; i++) {
                    if(pathData[i].pathLength > 0) {
                        pIndex = i;

                        return pathData[i];
                    }
                    else if(pathData[i].command == 'M') {
                        p0 = {
                            x: pathData[i].points[0],
                            y: pathData[i].points[1]
                        };
                    }
                }

                return {};
            };
            var findSegmentToFitCharacter = function(c, before) {

                var glyphWidth = that._getTextSize(c).width;

                var currLen = 0;
                var attempts = 0;
                var needNextSegment = false;
                p1 = undefined;
                while(Math.abs(glyphWidth - currLen) / glyphWidth > 0.01 && attempts < 25) {
                    attempts++;
                    var cumulativePathLength = currLen;
                    while(pathCmd === undefined) {
                        pathCmd = getNextPathSegment();

                        if(pathCmd && cumulativePathLength + pathCmd.pathLength < glyphWidth) {
                            cumulativePathLength += pathCmd.pathLength;
                            pathCmd = undefined;
                        }
                    }

                    if(pathCmd === {} || p0 === undefined)
                        return undefined;

                    var needNewSegment = false;

                    switch (pathCmd.command) {
                        case 'L':
                            if(Kinetic.Path.getLineLength(p0.x, p0.y, pathCmd.points[0], pathCmd.points[1]) > glyphWidth) {
                                p1 = Kinetic.Path.getPointOnLine(glyphWidth, p0.x, p0.y, pathCmd.points[0], pathCmd.points[1], p0.x, p0.y);
                            }
                            else
                                pathCmd = undefined;
                            break;
                        case 'A':

                            var start = pathCmd.points[4];
                            // 4 = theta
                            var dTheta = pathCmd.points[5];
                            // 5 = dTheta
                            var end = pathCmd.points[4] + dTheta;

                            if(currentT === 0)
                                currentT = start + 0.00000001;
                            // Just in case start is 0
                            else if(glyphWidth > currLen)
                                currentT += (Math.PI / 180.0) * dTheta / Math.abs(dTheta);
                            else
                                currentT -= Math.PI / 360.0 * dTheta / Math.abs(dTheta);

                            if(Math.abs(currentT) > Math.abs(end)) {
                                currentT = end;
                                needNewSegment = true;
                            }
                            p1 = Kinetic.Path.getPointOnEllipticalArc(pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], currentT, pathCmd.points[6]);
                            break;
                        case 'C':
                            if(currentT === 0) {
                                if(glyphWidth > pathCmd.pathLength)
                                    currentT = 0.00000001;
                                else
                                    currentT = glyphWidth / pathCmd.pathLength;
                            }
                            else if(glyphWidth > currLen)
                                currentT += (glyphWidth - currLen) / pathCmd.pathLength;
                            else
                                currentT -= (currLen - glyphWidth) / pathCmd.pathLength;

                            if(currentT > 1.0) {
                                currentT = 1.0;
                                needNewSegment = true;
                            }
                            p1 = Kinetic.Path.getPointOnCubicBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], pathCmd.points[4], pathCmd.points[5]);
                            break;
                        case 'Q':
                            if(currentT === 0)
                                currentT = glyphWidth / pathCmd.pathLength;
                            else if(glyphWidth > currLen)
                                currentT += (glyphWidth - currLen) / pathCmd.pathLength;
                            else
                                currentT -= (currLen - glyphWidth) / pathCmd.pathLength;

                            if(currentT > 1.0) {
                                currentT = 1.0;
                                needNewSegment = true;
                            }
                            p1 = Kinetic.Path.getPointOnQuadraticBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3]);
                            break;

                    }

                    if(p1 !== undefined) {
                        currLen = Kinetic.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);
                    }

                    if(needNewSegment) {
                        needNewSegment = false;
                        pathCmd = undefined;
                    }
                }
            };
            for(var i = 0; i < charArr.length; i++) {

                // Find p1 such that line segment between p0 and p1 is approx. width of glyph
                findSegmentToFitCharacter(charArr[i]);

                if(p0 === undefined || p1 === undefined)
                    break;

                var width = Kinetic.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);

                // Note: Since glyphs are rendered one at a time, any kerning pair data built into the font will not be used.
                // Can foresee having a rough pair table built in that the developer can override as needed.

                var kern = 0;
                // placeholder for future implementation

                var midpoint = Kinetic.Path.getPointOnLine(kern + width / 2.0, p0.x, p0.y, p1.x, p1.y);

                var rotation = Math.atan2((p1.y - p0.y), (p1.x - p0.x));
                this.glyphInfo.push({
                    transposeX: midpoint.x,
                    transposeY: midpoint.y,
                    text: charArr[i],
                    rotation: rotation,
                    p0: p0,
                    p1: p1
                });
                p0 = p1;
            }
        }
    };

    // map TextPath methods to Text
    Kinetic.TextPath.prototype._getContextFont = Kinetic.Text.prototype._getContextFont;
    
    Kinetic.Util.extend(Kinetic.TextPath, Kinetic.Shape);

    // add setters and getters
    Kinetic.Node.addGetterSetter(Kinetic.TextPath, 'fontFamily', CALIBRI);

    /**
     * set font family
     * @name setFontFamily
     * @method
     * @memberof Kinetic.TextPath.prototype
     * @param {String} fontFamily
     */

     /**
     * get font family
     * @name getFontFamily
     * @method
     * @memberof Kinetic.TextPath.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.TextPath, 'fontSize', 12);

    /**
     * set font size
     * @name setFontSize
     * @method
     * @memberof Kinetic.TextPath.prototype
     * @param {int} fontSize
     */

     /**
     * get font size
     * @name getFontSize
     * @method
     * @memberof Kinetic.TextPath.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.TextPath, 'fontStyle', NORMAL);

    /**
     * set font style.  Can be 'normal', 'italic', or 'bold'.  'normal' is the default.
     * @name setFontStyle
     * @method
     * @memberof Kinetic.TextPath.prototype
     * @param {String} fontStyle
     */

     /**
     * get font style
     * @name getFontStyle
     * @method
     * @memberof Kinetic.TextPath.prototype
     */
    
    Kinetic.Node.addGetter(Kinetic.TextPath, 'text', EMPTY_STRING);

    /**
     * get text
     * @name getText
     * @method
     * @memberof Kinetic.TextPath.prototype
     */
})();
;(function() {
    /**
     * RegularPolygon constructor.&nbsp; Examples include triangles, squares, pentagons, hexagons, etc.
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Number} config.sides
     * @param {Number} config.radius
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var hexagon = new Kinetic.RegularPolygon({<br>
     *   x: 100,<br>
     *   y: 200,<br>
     *   sides: 6,<br>
     *   radius: 70,<br>
     *   fill: 'red',<br>
     *   stroke: 'black',<br>
     *   strokeWidth: 4<br>
     * });
     */
    Kinetic.RegularPolygon = function(config) {
        this._initRegularPolygon(config);
    };

    Kinetic.RegularPolygon.prototype = {
        _initRegularPolygon: function(config) {
            this.createAttrs();

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'RegularPolygon';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(), 
                sides = this.attrs.sides, 
                radius = this.attrs.radius,
                n, x, y;

            context.beginPath();
            context.moveTo(0, 0 - radius);

            for(n = 1; n < sides; n++) {
                x = radius * Math.sin(n * 2 * Math.PI / sides);
                y = -1 * radius * Math.cos(n * 2 * Math.PI / sides);
                context.lineTo(x, y);
            }
            context.closePath();
            canvas.fillStroke(this);
        }
    };
    Kinetic.Util.extend(Kinetic.RegularPolygon, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.RegularPolygon, 'radius', 0);

    /**
     * set radius
     * @name setRadius
     * @method
     * @memberof Kinetic.RegularPolygon.prototype
     * @param {Number} radius
     */

     /**
     * get radius
     * @name getRadius
     * @method
     * @memberof Kinetic.RegularPolygon.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.RegularPolygon, 'sides', 0);

    /**
     * set number of sides
     * @name setSides
     * @method
     * @memberof Kinetic.RegularPolygon.prototype
     * @param {int} sides
     */

    /**
     * get number of sides
     * @name getSides
     * @method
     * @memberof Kinetic.RegularPolygon.prototype
     */
})();
;(function() {
    /**
     * Star constructor
     * @constructor
     * @memberof Kinetic
     * @augments Kinetic.Shape
     * @param {Object} config
     * @param {Integer} config.numPoints
     * @param {Number} config.innerRadius
     * @param {Number} config.outerRadius
     * @param {String} [config.fill] fill color
     * @param {Object} [config.fillRGB] set fill color with an object literal containing an r, g, and b component
     * @param {Integer} [config.fillR] set fill red component
     * @param {Integer} [config.fillG] set fill green component
     * @param {Integer} [config.fillB] set fill blue component
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Number|Array|Object} [config.fillPatternOffset] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Number|Array|Object} [config.fillPatternScale] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'no-repeat'
     * @param {Number|Array|Object} [config.fillLinearGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number|Array|Object} [config.fillLinearGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Number|Array|Object} [config.fillRadialGradientStartPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Number|Array|Object} [config.fillRadialGradientEndPoint] number, array with two elements, or object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Object} [config.strokeRGB] set stroke color with an object literal containing an r, g, and b component
     * @param {Integer} [config.strokeR] set stroke red component
     * @param {Integer} [config.strokeG] set stroke green component
     * @param {Integer} [config.strokeB] set stroke blue component
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Object} [config.shadowColorRGB] set shadowColor color with an object literal containing an r, g, and b component
     * @param {Integer} [config.shadowColorR] set shadowColor red component
     * @param {Integer} [config.shadowColorG] set shadowColor green component
     * @param {Integer} [config.shadowColorB] set shadowColor blue component
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset]
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dashArray]
     * @param {Boolean} [config.dashArrayEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var star = new Kinetic.Star({<br>
     *   x: 100,<br>
     *   y: 200,<br>
     *   numPoints: 5,<br>
     *   innerRadius: 70,<br>
     *   outerRadius: 70,<br>
     *   fill: 'red',<br>
     *   stroke: 'black',<br>
     *   strokeWidth: 4<br>
     * });
     */
    Kinetic.Star = function(config) {
        this._initStar(config);
    };

    Kinetic.Star.prototype = {
        _initStar: function(config) {
            this.createAttrs();

            // call super constructor
            Kinetic.Shape.call(this, config);
            this.className = 'Star';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(), innerRadius = this.attrs.innerRadius, outerRadius = this.attrs.outerRadius, numPoints = this.attrs.numPoints;

            context.beginPath();
            context.moveTo(0, 0 - this.attrs.outerRadius);

            for(var n = 1; n < numPoints * 2; n++) {
                var radius = n % 2 === 0 ? outerRadius : innerRadius;
                var x = radius * Math.sin(n * Math.PI / numPoints);
                var y = -1 * radius * Math.cos(n * Math.PI / numPoints);
                context.lineTo(x, y);
            }
            context.closePath();

            canvas.fillStroke(this);
        }
    };
    Kinetic.Util.extend(Kinetic.Star, Kinetic.Shape);

    // add getters setters
    Kinetic.Node.addGetterSetter(Kinetic.Star, 'numPoints', 0);

    /**
     * set number of points
     * @name setNumPoints
     * @method
     * @memberof Kinetic.Star.prototype
     * @param {Integer} points
     */

     /**
     * get number of points
     * @name getNumPoints
     * @method
     * @memberof Kinetic.Star.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Star, 'innerRadius', 0);

    /**
     * set inner radius
     * @name setInnerRadius
     * @method
     * @memberof Kinetic.Star.prototype
     * @param {Number} radius
     */

     /**
     * get inner radius
     * @name getInnerRadius
     * @method
     * @memberof Kinetic.Star.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Star, 'outerRadius', 0);

    /**
     * set outer radius
     * @name setOuterRadius
     * @method
     * @memberof Kinetic.Star.prototype
     * @param {Number} radius
     */

     /**
     * get outer radius
     * @name getOuterRadius
     * @method
     * @memberof Kinetic.Star.prototype
     */
})();
;(function() {
    // constants
    var ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'padding', 'lineHeight', 'text'],
        CHANGE_KINETIC = 'Change.kinetic',
        NONE = 'none',
        UP = 'up',
        RIGHT = 'right',
        DOWN = 'down',
        LEFT = 'left',
        LABEL = 'Label',
        
     // cached variables
     attrChangeListLen = ATTR_CHANGE_LIST.length;
        
    /**
     * Label constructor.&nbsp; Labels are groups that contain a Text and Tag shape 
     * @constructor
     * @memberof Kinetic
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in radians
     * @param {Number} [config.rotationDeg] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // create label
     * var label = new Kinetic.Label({<br>
     *   x: 100,<br>
     *   y: 100, <br>
     *   draggable: true<br>
     * });<br><br>
     *
     * // add a tag to the label<br>
     * label.add(new Kinetic.Tag({<br>
     *   fill: '#bbb',<br>
     *   stroke: '#333',<br>
     *   shadowColor: 'black',<br>
     *   shadowBlur: 10,<br>
     *   shadowOffset: [10, 10],<br>
     *   shadowOpacity: 0.2,<br>
     *   lineJoin: 'round',<br>
     *   pointerDirection: 'up',<br>
     *   pointerWidth: 20,<br>
     *   pointerHeight: 20,<br>
     *   cornerRadius: 5<br>
     * }));<br><br>
     *
     * // add text to the label<br>
     * label.add(new Kinetic.Text({<br>
     *   text: 'Hello World!',<br>
     *   fontSize: 50,<br>
     *   lineHeight: 1.2,<br>
     *   padding: 10,<br>
     *   fill: 'green'<br>
     *  }));
     */
    Kinetic.Label = function(config) {
        this._initLabel(config);
    };

    Kinetic.Label.prototype = {
        _initLabel: function(config) {
            var that = this;

            this.createAttrs();
            this.className = LABEL;
            Kinetic.Group.call(this, config); 

            this.on('add', function(evt) {
                that._addListeners(evt.child);
                that._sync();
            });
        },
        /**
         * get Text shape for the label.  You need to access the Text shape in order to update
         * the text properties
         * @name getText
         * @method
         * @memberof Kinetic.Label.prototype
         */
        getText: function() {
            return this.get('Text')[0];
        },    
        /**
         * get Tag shape for the label.  You need to access the Tag shape in order to update
         * the pointer properties and the corner radius
         * @name getTag
         * @method
         * @memberof Kinetic.Label.prototype
         */
        getTag: function() {
            return this.get('Tag')[0];
        },
        _addListeners: function(context) {
            var that = this,
                n;
            // update text data for certain attr changes
            for(n = 0; n < attrChangeListLen; n++) {
                context.on(ATTR_CHANGE_LIST[n] + CHANGE_KINETIC, function() {
                    that._sync();
                });
            } 
        },
        getWidth: function() {
            return this.getText().getWidth();
        },
        getHeight: function() {
            return this.getText().getHeight();
        },
        _sync: function() {
            var text = this.getText(),
                tag = this.getTag(),
                width, height, pointerDirection, pointerWidth, x, y;

            if (text && tag) {
                width = text.getWidth(),
                height = text.getHeight(),   
                pointerDirection = tag.getPointerDirection(),
                pointerWidth = tag.getPointerWidth(),
                pointerHeight = tag.getPointerHeight(),
                x = 0, 
                y = 0;

                switch(pointerDirection) {
                    case UP:
                        x = width / 2;
                        y = -1 * pointerHeight;
                        break;
                    case RIGHT:
                        x = width + pointerWidth;
                        y = height / 2;
                        break;
                    case DOWN:
                        x = width / 2;
                        y = height + pointerHeight;
                        break;
                    case LEFT:
                        x = -1 * pointerWidth;
                        y = height / 2;
                        break;
                }
                
                tag.setAttrs({
                    x: -1 * x,
                    y: -1 * y,
                    width: width,
                    height: height
                }); 

                text.setAttrs({
                    x: -1 * x,
                    y: -1 * y
                });
            }
        }
    };
    
    Kinetic.Util.extend(Kinetic.Label, Kinetic.Group);

    /**
     * Tag constructor.&nbsp; A Tag can be configured
     *  to have a pointer element that points up, right, down, or left 
     * @constructor
     * @memberof Kinetic
     * @param {Object} config
     * @param {String} [config.pointerDirection] can be up, right, down, left, or none; the default
     *  is none.  When a pointer is present, the positioning of the label is relative to the tip of the pointer.
     * @param {Number} [config.pointerWidth]
     * @param {Number} [config.pointerHeight]
     * @param {Number} [config.cornerRadius] 
     */ 
    Kinetic.Tag = function(config) {
        this._initTag(config);
    };

    Kinetic.Tag.prototype = {
        _initTag: function(config) {
            this.createAttrs();
            Kinetic.Shape.call(this, config);
            this.className = 'Tag';
            this._setDrawFuncs();
        },
        drawFunc: function(canvas) {
            var context = canvas.getContext(),
                width = this.getWidth(),
                height = this.getHeight(),
                pointerDirection = this.getPointerDirection(),
                pointerWidth = this.getPointerWidth(),
                pointerHeight = this.getPointerHeight(),
                cornerRadius = this.getCornerRadius();
                
            context.beginPath();
            context.moveTo(0,0);
            
            if (pointerDirection === UP) {
                context.lineTo((width - pointerWidth)/2, 0);
                context.lineTo(width/2, -1 * pointerHeight);
                context.lineTo((width + pointerWidth)/2, 0);
            }
            
            context.lineTo(width, 0);
           
            if (pointerDirection === RIGHT) {
                context.lineTo(width, (height - pointerHeight)/2);
                context.lineTo(width + pointerWidth, height/2);
                context.lineTo(width, (height + pointerHeight)/2);
            }
            
            context.lineTo(width, height);
    
            if (pointerDirection === DOWN) {
                context.lineTo((width + pointerWidth)/2, height);
                context.lineTo(width/2, height + pointerHeight);
                context.lineTo((width - pointerWidth)/2, height); 
            }
            
            context.lineTo(0, height);
            
            if (pointerDirection === LEFT) {
                context.lineTo(0, (height + pointerHeight)/2);
                context.lineTo(-1 * pointerWidth, height/2);
                context.lineTo(0, (height - pointerHeight)/2);
            } 
            
            context.closePath();
            canvas.fillStroke(this);
        }
    };
    
    Kinetic.Util.extend(Kinetic.Tag, Kinetic.Shape);
    Kinetic.Node.addGetterSetter(Kinetic.Tag, 'pointerDirection', NONE);

    /**
     * set pointer Direction
     * @name setPointerDirection
     * @method
     * @memberof Kinetic.Tag.prototype
     * @param {String} pointerDirection can be up, right, down, left, or none.  The
     *  default is none 
     */

     /**
     * get pointer Direction
     * @name getPointerDirection
     * @method
     * @memberof Kinetic.Tag.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Tag, 'pointerWidth', 0);

    /**
     * set pointer width 
     * @name setPointerWidth
     * @method
     * @memberof Kinetic.Tag.prototype
     * @param {Number} pointerWidth 
     */

     /**
     * get pointer width 
     * @name getPointerWidth
     * @method
     * @memberof Kinetic.Tag.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Tag, 'pointerHeight', 0);

    /**
     * set pointer height 
     * @name setPointerHeight
     * @method
     * @memberof Kinetic.Tag.prototype
     * @param {Number} pointerHeight
     */

     /**
     * get pointer height 
     * @name getPointerHeight
     * @method
     * @memberof Kinetic.Tag.prototype
     */

    Kinetic.Node.addGetterSetter(Kinetic.Tag, 'cornerRadius', 0);

    /**
     * set corner radius
     * @name setCornerRadius
     * @method
     * @memberof Kinetic.Tag.prototype
     * @param {Number} corner radius
     */

    /**
     * get corner radius
     * @name getCornerRadius
     * @method
     * @memberof Kinetic.Tag.prototype
     */
})();;(function() {
    /**
     * Grayscale Filter
     * @function
     * @memberof Kinetic.Filters
     * @param {Object} imageData
     */
    Kinetic.Filters.Grayscale = function(imageData) {
        var data = imageData.data;
        for(var i = 0; i < data.length; i += 4) {
            var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            // red
            data[i] = brightness;
            // green
            data[i + 1] = brightness;
            // blue
            data[i + 2] = brightness;
        }
    };
})();
;(function() {
    /**
     * Brighten Filter.  
     * @function
     * @memberof Kinetic.Filters
     * @param {Object} imageData
     */
    Kinetic.Filters.Brighten = function(imageData) {
        var brightness = this.getFilterBrightness();
        var data = imageData.data;
        for(var i = 0; i < data.length; i += 4) {
            // red
            data[i] += brightness;
            // green
            data[i + 1] += brightness;
            // blue
            data[i + 2] += brightness;
        }
    };

    Kinetic.Node.addFilterGetterSetter(Kinetic.Image, 'filterBrightness', 0);
    /**
    * get filter brightness.  The brightness is a number between -255 and 255.&nbsp; Positive values 
    *  increase the brightness and negative values decrease the brightness, making the image darker
    * @name getFilterBrightness
    * @method
    * @memberof Kinetic.Image.prototype
    */

    /**
    * set filter brightness
    * @name setFilterBrightness
    * @method
    * @memberof Kinetic.Image.prototype
    */
})();
;(function() {
    /**
     * Invert Filter
     * @function
     * @memberof Kinetic.Filters
     * @param {Object} imageData
     */
    Kinetic.Filters.Invert = function(imageData) {
        var data = imageData.data;
        for(var i = 0; i < data.length; i += 4) {
            // red
            data[i] = 255 - data[i];
            // green
            data[i + 1] = 255 - data[i + 1];
            // blue
            data[i + 2] = 255 - data[i + 2];
        }
    };
})();
;/*
 the Gauss filter
 master repo: https://github.com/pavelpower/kineticjsGaussFilter/
*/
(function() {
    /*

     StackBlur - a fast almost Gaussian Blur For Canvas

     Version:   0.5
     Author:    Mario Klingemann
     Contact:   mario@quasimondo.com
     Website:   http://www.quasimondo.com/StackBlurForCanvas
     Twitter:   @quasimondo

     In case you find this class useful - especially in commercial projects -
     I am not totally unhappy for a small donation to my PayPal account
     mario@quasimondo.de

     Or support me on flattr:
     https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

     Copyright (c) 2010 Mario Klingemann

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without
     restriction, including without limitation the rights to use,
     copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the
     Software is furnished to do so, subject to the following
     conditions:

     The above copyright notice and this permission notice shall be
     included in all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
     OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
     OTHER DEALINGS IN THE SOFTWARE.
     */

    function BlurStack() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 0;
        this.next = null;
    }

    var mul_table = [
        512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
        454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
        482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
        437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
        497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
        320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
        446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
        329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
        505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
        399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
        324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
        268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
        451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
        385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
        332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
        289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];

    var shg_table = [
        9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
        17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
        19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
        20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

    function filterGaussBlurRGBA( imageData, radius) {

        var pixels = imageData.data,
            width = imageData.width,
            height = imageData.height;

        var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
            r_out_sum, g_out_sum, b_out_sum, a_out_sum,
            r_in_sum, g_in_sum, b_in_sum, a_in_sum,
            pr, pg, pb, pa, rbs;

        var div = radius + radius + 1,
            widthMinus1  = width - 1,
            heightMinus1 = height - 1,
            radiusPlus1  = radius + 1,
            sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2,
            stackStart = new BlurStack(),
            stack = stackStart,
            stackIn = null,
            stackOut = null,
            mul_sum = mul_table[radius],
            shg_sum = shg_table[radius];

        for ( i = 1; i < div; i++ ) {
            stack = stack.next = new BlurStack();
            if ( i == radiusPlus1 ) var stackEnd = stack;
        }

        stack.next = stackStart;

        yw = yi = 0;

        for ( y = 0; y < height; y++ )
        {
            r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

            r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
            g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
            b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
            a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;
            a_sum += sumFactor * pa;

            stack = stackStart;

            for( i = 0; i < radiusPlus1; i++ )
            {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack.a = pa;
                stack = stack.next;
            }

            for( i = 1; i < radiusPlus1; i++ )
            {
                p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
                r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
                g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
                b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
                a_sum += ( stack.a = ( pa = pixels[p+3])) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;
                a_in_sum += pa;

                stack = stack.next;
            }


            stackIn = stackStart;
            stackOut = stackEnd;
            for ( x = 0; x < width; x++ )
            {
                pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
                if ( pa != 0 )
                {
                    pa = 255 / pa;
                    pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
                    pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                    pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
                } else {
                    pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
                }

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;
                a_sum -= a_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;
                a_out_sum -= stackIn.a;

                p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

                r_in_sum += ( stackIn.r = pixels[p]);
                g_in_sum += ( stackIn.g = pixels[p+1]);
                b_in_sum += ( stackIn.b = pixels[p+2]);
                a_in_sum += ( stackIn.a = pixels[p+3]);

                r_sum += r_in_sum;
                g_sum += g_in_sum;
                b_sum += b_in_sum;
                a_sum += a_in_sum;

                stackIn = stackIn.next;

                r_out_sum += ( pr = stackOut.r );
                g_out_sum += ( pg = stackOut.g );
                b_out_sum += ( pb = stackOut.b );
                a_out_sum += ( pa = stackOut.a );

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;
                a_in_sum -= pa;

                stackOut = stackOut.next;

                yi += 4;
            }
            yw += width;
        }


        for ( x = 0; x < width; x++ )
        {
            g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

            yi = x << 2;
            r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
            g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
            b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
            a_out_sum = radiusPlus1 * ( pa = pixels[yi+3]);

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;
            a_sum += sumFactor * pa;

            stack = stackStart;

            for( i = 0; i < radiusPlus1; i++ )
            {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack.a = pa;
                stack = stack.next;
            }

            yp = width;

            for( i = 1; i <= radius; i++ )
            {
                yi = ( yp + x ) << 2;

                r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
                g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
                b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
                a_sum += ( stack.a = ( pa = pixels[yi+3])) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;
                a_in_sum += pa;

                stack = stack.next;

                if( i < heightMinus1 )
                {
                    yp += width;
                }
            }

            yi = x;
            stackIn = stackStart;
            stackOut = stackEnd;
            for ( y = 0; y < height; y++ )
            {
                p = yi << 2;
                pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
                if ( pa > 0 )
                {
                    pa = 255 / pa;
                    pixels[p]   = ((r_sum * mul_sum) >> shg_sum ) * pa;
                    pixels[p+1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
                    pixels[p+2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
                } else {
                    pixels[p] = pixels[p+1] = pixels[p+2] = 0;
                }

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;
                a_sum -= a_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;
                a_out_sum -= stackIn.a;

                p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;

                r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
                g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
                b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
                a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3]));

                stackIn = stackIn.next;

                r_out_sum += ( pr = stackOut.r );
                g_out_sum += ( pg = stackOut.g );
                b_out_sum += ( pb = stackOut.b );
                a_out_sum += ( pa = stackOut.a );

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;
                a_in_sum -= pa;

                stackOut = stackOut.next;

                yi += width;
            }
        }
    }

    /**
     * Blur Filter
     * @function
     * @memberof Kinetic.Filters
     * @param {Object} imageData
     */
    Kinetic.Filters.Blur = function(imageData) {
        var radius = this.getFilterRadius() | 0;

        if (radius > 0) {
            filterGaussBlurRGBA(imageData, radius);
        }
    };

    Kinetic.Node.addFilterGetterSetter(Kinetic.Image, 'filterRadius', 0);

})();
;(function() {

	function pixelAt(idata, x, y) {
		var idx = (y * idata.width + x) * 4;
		var d = [];
		d.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
		return d;
	};

	function rgbDistance(p1, p2) {
		return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
	};

	function rgbMean(pTab) {
		var m = [0, 0, 0];

		for (var i = 0; i < pTab.length; i++) {
			m[0] += pTab[i][0];
			m[1] += pTab[i][1];
			m[2] += pTab[i][2];
		}

		m[0] /= pTab.length;
		m[1] /= pTab.length;
		m[2] /= pTab.length;

		return m;
	};

	function backgroundMask(idata, threshold) {
		var rgbv_no = pixelAt(idata, 0, 0);
		var rgbv_ne = pixelAt(idata, idata.width - 1, 0);
		var rgbv_so = pixelAt(idata, 0, idata.height - 1);
		var rgbv_se = pixelAt(idata, idata.width - 1, idata.height - 1);


		var thres = threshold || 10; 
		if (rgbDistance(rgbv_no, rgbv_ne) < thres && rgbDistance(rgbv_ne, rgbv_se) < thres && rgbDistance(rgbv_se, rgbv_so) < thres && rgbDistance(rgbv_so, rgbv_no) < thres) {

			// Mean color
			var mean = rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);

			// Mask based on color distance
			var mask = [];
			for (var i = 0; i < idata.width * idata.height; i++) {
				var d = rgbDistance(mean, [idata.data[i * 4], idata.data[i * 4 + 1], idata.data[i * 4 + 2]]);
				mask[i] = (d < thres) ? 0 : 255;
			}

			return mask;
		}
	};

	function applyMask(idata, mask) {
		for (var i = 0; i < idata.width * idata.height; i++) {
			idata.data[4 * i + 3] = mask[i];
		}
	};

	function erodeMask(mask, sw, sh) {

		var weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side / 2);

		var maskResult = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {

				var so = y * sw + x;
				var a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = y + cy - halfSide;
						var scx = x + cx - halfSide;

						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

							var srcOff = scy * sw + scx;
							var wt = weights[cy * side + cx];

							a += mask[srcOff] * wt;
						}
					}
				}

				maskResult[so] = (a === 255 * 8) ? 255 : 0;
			}
		}

		return maskResult;
	};

	function dilateMask(mask, sw, sh) {

		var weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side / 2);

		var maskResult = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {

				var so = y * sw + x;
				var a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = y + cy - halfSide;
						var scx = x + cx - halfSide;

						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

							var srcOff = scy * sw + scx;
							var wt = weights[cy * side + cx];

							a += mask[srcOff] * wt;
						}
					}
				}

				maskResult[so] = (a >= 255 * 4) ? 255 : 0;
			}
		}

		return maskResult;
	};

	function smoothEdgeMask(mask, sw, sh) {

		var weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side / 2);

		var maskResult = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {

				var so = y * sw + x;
				var a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = y + cy - halfSide;
						var scx = x + cx - halfSide;

						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

							var srcOff = scy * sw + scx;
							var wt = weights[cy * side + cx];

							a += mask[srcOff] * wt;
						}
					}
				}

				maskResult[so] = a;
			}
		}

		return maskResult;
	}
	
	/**
	 * Mask Filter
	 *
	 * Only crop unicolor background images for instance
	 *
	 * @function
	 * @memberof Kinetic.Filters
	 * @param {Object} imageData
	 */
	Kinetic.Filters.Mask = function(idata) {
		// Detect pixels close to the background color
		var threshold = this.getFilterThreshold(),
		    mask = backgroundMask(idata, threshold);
		if (mask) {
			// Erode
			mask = erodeMask(mask, idata.width, idata.height);

			// Dilate
			mask = dilateMask(mask, idata.width, idata.height);

			// Gradient
			mask = smoothEdgeMask(mask, idata.width, idata.height);

			// Apply mask
			applyMask(idata, mask);
			
			// todo : Update hit region function according to mask
		}

		return idata;
	};

	Kinetic.Node.addFilterGetterSetter(Kinetic.Image, 'filterThreshold', 0);

	//threshold The RGB euclidian distance threshold (default : 10) 

})();
(function(){var global = this;function debug(){return debug};function require(p, parent){ var path = require.resolve(p) , mod = require.modules[path]; if (!mod) throw new Error('failed to require "' + p + '" from ' + parent); if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path), global); } return mod.exports;}require.modules = {};require.resolve = function(path){ var orig = path , reg = path + '.js' , index = path + '/index.js'; return require.modules[reg] && reg || require.modules[index] && index || orig;};require.register = function(path, fn){ require.modules[path] = fn;};require.relative = function(parent) { return function(p){ if ('debug' == p) return debug; if ('.' != p.charAt(0)) return require(p); var path = parent.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/'), parent); };};require.register("color.js", function(module, exports, require, global){
/* MIT license */
var convert = require("color-convert"),
    string = require("color-string");

module.exports = function(cssString) {
   return new Color(cssString);
};

var Color = function(cssString) {
   this.values = {
      rgb: [0, 0, 0],
      hsl: [0, 0, 0],
      hsv: [0, 0, 0],
      cmyk: [0, 0, 0, 0],
      alpha: 1
   }

   // parse Color() argument
   if (typeof cssString == "string") {
      var vals = string.getRgba(cssString);
      if (vals) {
         this.setValues("rgb", vals);
      }
      else if(vals = string.getHsla(cssString)) {
         this.setValues("hsl", vals);
      }
   }
   else if (typeof cssString == "object") {
      var vals = cssString;
      if(vals["r"] !== undefined || vals["red"] !== undefined) {
         this.setValues("rgb", vals)
      }
      else if(vals["l"] !== undefined || vals["lightness"] !== undefined) {
         this.setValues("hsl", vals)
      }
      else if(vals["v"] !== undefined || vals["value"] !== undefined) {
         this.setValues("hsv", vals)
      }
      else if(vals["c"] !== undefined || vals["cyan"] !== undefined) {
         this.setValues("cmyk", vals)
      }
   }
}

Color.prototype = {
   rgb: function (vals) {
      return this.setSpace("rgb", arguments);
   },
   hsl: function(vals) {
      return this.setSpace("hsl", arguments);
   },
   hsv: function(vals) {
      return this.setSpace("hsv", arguments);
   },
   cmyk: function(vals) {
      return this.setSpace("cmyk", arguments);
   },

   rgbArray: function() {
      return this.values.rgb;
   },
   hslArray: function() {
      return this.values.hsl;
   },
   hsvArray: function() {
      return this.values.hsv;
   },
   cmykArray: function() {
      return this.values.cmyk;
   },
   rgbaArray: function() {
      var rgb = this.values.rgb;
      rgb.push(this.values.alpha);
      return rgb;
   },
   hslaArray: function() {
      var hsl = this.values.hsl;
      hsl.push(this.values.alpha);
      return hsl;
   },

   alpha: function(val) {
      if (val === undefined) {
         return this.values.alpha;
      }
      this.setValues("alpha", val);
      return this;
   },

   red: function(val) {
      return this.setChannel("rgb", 0, val);
   },
   green: function(val) {
      return this.setChannel("rgb", 1, val);
   },
   blue: function(val) {
      return this.setChannel("rgb", 2, val);
   },
   hue: function(val) {
      return this.setChannel("hsl", 0, val);
   },
   saturation: function(val) {
      return this.setChannel("hsl", 1, val);
   },
   lightness: function(val) {
      return this.setChannel("hsl", 2, val);
   },
   saturationv: function(val) {
      return this.setChannel("hsv", 1, val);
   },
   value: function(val) {
      return this.setChannel("hsv", 2, val);
   },
   cyan: function(val) {
      return this.setChannel("cmyk", 0, val);
   },
   magenta: function(val) {
      return this.setChannel("cmyk", 1, val);
   },
   yellow: function(val) {
      return this.setChannel("cmyk", 2, val);
   },
   black: function(val) {
      return this.setChannel("cmyk", 3, val);
   },

   hexString: function() {
      return string.hexString(this.values.rgb);
   },
   rgbString: function() {
      return string.rgbString(this.values.rgb, this.values.alpha);
   },
   rgbaString: function() {
      return string.rgbaString(this.values.rgb, this.values.alpha);
   },
   percentString: function() {
      return string.percentString(this.values.rgb, this.values.alpha);
   },
   hslString: function() {
      return string.hslString(this.values.hsl, this.values.alpha);
   },
   hslaString: function() {
      return string.hslaString(this.values.hsl, this.values.alpha);
   },
   keyword: function() {
      return string.keyword(this.values.rgb, this.values.alpha);
   },

   luminosity: function() {
      // http://www.w3.org/TR/WCAG20/#relativeluminancedef
      var rgb = this.values.rgb;
      for (var i = 0; i < rgb.length; i++) {
         var chan = rgb[i] / 255;
         rgb[i] = (chan <= 0.03928) ? chan / 12.92
                  : Math.pow(((chan + 0.055) / 1.055), 2.4)
      }
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
   },

   contrast: function(color2) {
      // http://www.w3.org/TR/WCAG20/#contrast-ratiodef
      var lum1 = this.luminosity();
      var lum2 = color2.luminosity();
      if (lum1 > lum2) {
         return (lum1 + 0.05) / (lum2 + 0.05)
      };
      return (lum2 + 0.05) / (lum1 + 0.05);
   },

   dark: function() {
      // YIQ equation from http://24ways.org/2010/calculating-color-contrast
      var rgb = this.values.rgb,
          yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
   	return yiq < 128;
   },

   light: function() {
      return !this.dark();
   },

   negate: function() {
      var rgb = []
      for (var i = 0; i < 3; i++) {
         rgb[i] = 255 - this.values.rgb[i];
      }
      this.setValues("rgb", rgb);
      return this;
   },

   lighten: function(ratio) {
      this.values.hsl[2] += this.values.hsl[2] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   darken: function(ratio) {
      this.values.hsl[2] -= this.values.hsl[2] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   saturate: function(ratio) {
      this.values.hsl[1] += this.values.hsl[1] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   desaturate: function(ratio) {
      this.values.hsl[1] -= this.values.hsl[1] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   greyscale: function() {
      var rgb = this.values.rgb;
      // http://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale
      var val = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
      this.setValues("rgb", [val, val, val]);
      return this;
   },

   clearer: function(ratio) {
      this.setValues("alpha", this.values.alpha - (this.values.alpha * ratio));
      return this;
   },

   opaquer: function(ratio) {
      this.setValues("alpha", this.values.alpha + (this.values.alpha * ratio));
      return this;
   },

   rotate: function(degrees) {
      var hue = this.values.hsl[0];
      hue = (hue + degrees) % 360;
      hue = hue < 0 ? 360 + hue : hue;
      this.values.hsl[0] = hue;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   mix: function(color2, weight) {
      weight = 1 - (weight || 0.5);

      // algorithm from Sass's mix(). Ratio of first color in mix is
      // determined by the alphas of both colors and the weight
      var t1 = weight * 2 - 1,
          d = this.alpha() - color2.alpha();

      var weight1 = (((t1 * d == -1) ? t1 : (t1 + d) / (1 + t1 * d)) + 1) / 2;
      var weight2 = 1 - weight1;

      var rgb = this.rgbArray();
      var rgb2 = color2.rgbArray();

      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = rgb[i] * weight1 + rgb2[i] * weight2;
      }
      this.setValues("rgb", rgb);

      var alpha = this.alpha() * weight + color2.alpha() * (1 - weight);
      this.setValues("alpha", alpha);

      return this;
   },

   toJSON: function() {
     return this.rgb();
   }
}


Color.prototype.getValues = function(space) {
   var vals = {};
   for (var i = 0; i < space.length; i++) {
      vals[space[i]] = this.values[space][i];
   }
   if (this.values.alpha != 1) {
      vals["a"] = this.values.alpha;
   }
   // {r: 255, g: 255, b: 255, a: 0.4}
   return vals;
}

Color.prototype.setValues = function(space, vals) {
   var spaces = {
      "rgb": ["red", "green", "blue"],
      "hsl": ["hue", "saturation", "lightness"],
      "hsv": ["hue", "saturation", "value"],
      "cmyk": ["cyan", "magenta", "yellow", "black"]
   };

   var maxes = {
      "rgb": [255, 255, 255],
      "hsl": [360, 100, 100],
      "hsv": [360, 100, 100],
      "cmyk": [100, 100, 100, 100],
   };

   var alpha = 1;
   if (space == "alpha") {
      alpha = vals;
   }
   else if (vals.length) {
      // [10, 10, 10]
      this.values[space] = vals.slice(0, space.length);
      alpha = vals[space.length];
   }
   else if (vals[space[0]] !== undefined) {
      // {r: 10, g: 10, b: 10}
      for (var i = 0; i < space.length; i++) {
        this.values[space][i] = vals[space[i]];
      }
      alpha = vals.a;
   }
   else if (vals[spaces[space][0]] !== undefined) {
      // {red: 10, green: 10, blue: 10}
      var chans = spaces[space];
      for (var i = 0; i < space.length; i++) {
        this.values[space][i] = vals[chans[i]];
      }
      alpha = vals.alpha;
   }
   this.values.alpha = Math.max(0, Math.min(1, alpha || this.values.alpha));
   if (space == "alpha") {
      return;
   }

   // convert to all the other color spaces
   for (var sname in spaces) {
      if (sname != space) {
         this.values[sname] = convert[space][sname](this.values[space])
      }

      // cap values
      for (var i = 0; i < sname.length; i++) {
         var capped = Math.max(0, Math.min(maxes[sname][i], this.values[sname][i]));
         this.values[sname][i] = Math.round(capped);
      }
   }
   return true;
}

Color.prototype.setSpace = function(space, args) {
   var vals = args[0];
   if (vals === undefined) {
      // color.rgb()
      return this.getValues(space);
   }
   // color.rgb(10, 10, 10)
   if (typeof vals == "number") {
      vals = Array.prototype.slice.call(args);
   }
   this.setValues(space, vals);
   return this;
}

Color.prototype.setChannel = function(space, index, val) {
   if (val === undefined) {
      // color.red()
      return this.values[space][index];
   }
   // color.red(100)
   this.values[space][index] = val;
   this.setValues(space, this.values[space]);
   return this;
}

});require.register("color-string", function(module, exports, require, global){
/* MIT license */
var convert = require("color-convert");

module.exports = {
   getRgba: getRgba,
   getHsla: getHsla,
   getRgb: getRgb,
   getHsl: getHsl,
   getAlpha: getAlpha,

   hexString: hexString,
   rgbString: rgbString,
   rgbaString: rgbaString,
   percentString: percentString,
   percentaString: percentaString,
   hslString: hslString,
   hslaString: hslaString,
   keyword: keyword
}

function getRgba(string) {
   if (!string) {
      return;
   }
   var abbr =  /^#([a-fA-F0-9]{3})$/,
       hex =  /^#([a-fA-F0-9]{6})$/,
       rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d\.]+)\s*)?\)$/,
       per = /^rgba?\(\s*([\d\.]+)\%\s*,\s*([\d\.]+)\%\s*,\s*([\d\.]+)\%\s*(?:,\s*([\d\.]+)\s*)?\)$/,
       keyword = /(\D+)/;

   var rgb = [0, 0, 0],
       a = 1,
       match = string.match(abbr);
   if (match) {
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = parseInt(match[i] + match[i], 16);
      }
   }
   else if (match = string.match(hex)) {
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = parseInt(match.slice(i * 2, i * 2 + 2), 16);
      }
   }
   else if (match = string.match(rgba)) {
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = parseInt(match[i + 1]);
      }
      a = parseFloat(match[4]);
   }
   else if (match = string.match(per)) {
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
      }
      a = parseFloat(match[4]);
   }
   else if (match = string.match(keyword)) {
      if (match[1] == "transparent") {
         return [0, 0, 0, 0];
      }
      rgb = convert.keyword2rgb(match[1]);
      if (!rgb) {
         return;
      }
   }

   for (var i = 0; i < rgb.length; i++) {
      rgb[i] = scale(rgb[i], 0, 255);
   }
   if (!a) {
      a = 1;
   }
   else {
      a = scale(a, 0, 1);
   }
   rgb.push(a);
   return rgb;
}

function getHsla(string) {
   if (!string) {
      return;
   }
   var hsl = /^hsla?\(\s*(\d+)\s*,\s*([\d\.]+)%\s*,\s*([\d\.]+)%\s*(?:,\s*([\d\.]+)\s*)?\)/;
   var match = string.match(hsl);
   if (match) {
      var h = scale(parseInt(match[1]), 0, 360),
          s = scale(parseFloat(match[2]), 0, 100),
          l = scale(parseFloat(match[3]), 0, 100),
          a = scale(parseFloat(match[4]) || 1, 0, 1);
      return [h, s, l, a];
   }
}

function getRgb(string) {
   var rgba = getRgba(string);
   return rgba && rgba.slice(0, 3);
}

function getHsl(string) {
  var hsla = getHsla(string);
  return hsla && hsla.slice(0, 3);
}

function getAlpha(string) {
   var vals = getRgba(string);
   if (vals) {
      return vals[3];
   }
   else if (vals = getHsla(string)) {
      return vals[3];
   }
}

// generators
function hexString(rgb) {
   return "#" + hexDouble(rgb[0]) + hexDouble(rgb[1])
              + hexDouble(rgb[2]);
}

function rgbString(rgba, alpha) {
   if (alpha < 1 || (rgba[3] && rgba[3] < 1)) {
      return rgbaString(rgba, alpha);
   }
   return "rgb(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2] + ")";
}

function rgbaString(rgba, alpha) {
   return "rgba(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2]
           + ", " + (alpha || rgba[3] || 1) + ")";
}

function percentString(rgba, alpha) {
   if (alpha < 1 || (rgba[3] && rgba[3] < 1)) {
      return percentaString(rgba, alpha);
   }
   var r = Math.round(rgba[0]/255 * 100),
       g = Math.round(rgba[1]/255 * 100),
       b = Math.round(rgba[2]/255 * 100);

   return "rgb(" + r + "%, " + g + "%, " + b + "%)";
}

function percentaString(rgba, alpha) {
   var r = Math.round(rgba[0]/255 * 100),
       g = Math.round(rgba[1]/255 * 100),
       b = Math.round(rgba[2]/255 * 100);
   return "rgba(" + r + "%, " + g + "%, " + b + "%, " + (alpha || rgba[3] || 1) + ")";
}

function hslString(hsla, alpha) {
   if (alpha < 1 || (hsla[3] && hsla[3] < 1)) {
      return hslaString(hsla, alpha);
   }
   return "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)";
}

function hslaString(hsla, alpha) {
   return "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, "
           + (alpha || hsla[3] || 1) + ")";
}

function keyword(rgb) {
   return convert.rgb2keyword(rgb.slice(0, 3));
}

// helpers
function scale(num, min, max) {
   return Math.min(Math.max(min, num), max);
}

function hexDouble(num) {
  var str = num.toString(16).toUpperCase();
  return (str.length < 2) ? "0" + str : str;
}

});require.register("color-convert", function(module, exports, require, global){
var conversions = require("conversions");

var convert = function() {
   return new Converter();
}

for (var func in conversions) {
  // export Raw versions
  convert[func + "Raw"] =  (function(func) {
    // accept array or plain args
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      return conversions[func](arg);
    }
  })(func);

  var pair = /(\w+)2(\w+)/.exec(func),
      from = pair[1],
      to = pair[2];

  // export rgb2hsl and ["rgb"]["hsl"]
  convert[from] = convert[from] || {};

  convert[from][to] = convert[func] = (function(func) {
    return function(arg) {
      if (typeof arg == "number") {
        arg = Array.prototype.slice.call(arguments);
      }

      var val = conversions[func](arg);
      if (typeof val == "string" || val === undefined) {
        return val; // keyword
      }

      round(val)
      return val;
    }
  })(func);
}


/* Converter does lazy conversion and caching */
var Converter = function() {
   this.space = "rgb";
   this.convs = {
     'rgb': [0, 0, 0]
   };
};

/* Either get the values for a space or
  set the values for a space, depending on args */
Converter.prototype.routeSpace = function(space, args) {
   var values = args[0];
   if (values === undefined) {
      // color.rgb()
      return this.getValues(space);
   }
   // color.rgb(10, 10, 10)
   if (typeof values == "number") {
      values = Array.prototype.slice.call(args);
   }

   return this.setValues(space, values);
};

/* Set the values for a space, invalidating cache */
Converter.prototype.setValues = function(space, values) {
   this.space = space;
   this.convs = {};
   this.convs[space] = values;
   return this;
};

/* Get the values for a space. If there's already
  a conversion for the space, fetch it, otherwise
  compute it */
Converter.prototype.getValues = function(space) {
   var vals = this.convs[space];
   if (!vals) {
      var fspace = this.space,
          from = this.convs[fspace];
      vals = convert[fspace][space](from);

      this.convs[space] = vals;
   }
   else {
      round(vals);
   }
  return vals;
};

function round(val) {
  for (var i = 0; i < val.length; i++) {
    val[i] = Math.round(val[i]);
  }
};

["rgb", "hsl", "hsv", "cmyk", "keyword"].forEach(function(space) {
   Converter.prototype[space] = function(vals) {
      return this.routeSpace(space, arguments);
   }
});

module.exports = convert;
});require.register("conversions", function(module, exports, require, global){
/* MIT license */

module.exports = {
  rgb2hsl: rgb2hsl,
  rgb2hsv: rgb2hsv,
  rgb2cmyk: rgb2cmyk,
  rgb2keyword: rgb2keyword,
  rgb2xyz: rgb2xyz,
  rgb2lab: rgb2lab,

  hsl2rgb: hsl2rgb,
  hsl2hsv: hsl2hsv,
  hsl2cmyk: hsl2cmyk,
  hsl2keyword: hsl2keyword,

  hsv2rgb: hsv2rgb,
  hsv2hsl: hsv2hsl,
  hsv2cmyk: hsv2cmyk,
  hsv2keyword: hsv2keyword,

  cmyk2rgb: cmyk2rgb,
  cmyk2hsl: cmyk2hsl,
  cmyk2hsv: cmyk2hsv,
  cmyk2keyword: cmyk2keyword,

  keyword2rgb: keyword2rgb,
  keyword2hsl: keyword2hsl,
  keyword2hsv: keyword2hsv,
  keyword2cmyk: keyword2cmyk,
  keyword2lab: keyword2lab,
  keyword2xyz: keyword2xyz,

  xyz2rgb: xyz2rgb,
  xyz2lab: xyz2lab,

  lab2xyz: lab2xyz,
}


function rgb2hsl(rgb) {
  var r = rgb[0]/255,
      g = rgb[1]/255,
      b = rgb[2]/255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, l;

  if (max == min)
    h = 0;
  else if (r == max)
    h = (g - b) / delta;
  else if (g == max)
    h = 2 + (b - r) / delta;
  else if (b == max)
    h = 4 + (r - g)/ delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  l = (min + max) / 2;

  if (max == min)
    s = 0;
  else if (l <= 0.5)
    s = delta / (max + min);
  else
    s = delta / (2 - max - min);

  return [h, s * 100, l * 100];
}

function rgb2hsv(rgb) {
  var r = rgb[0],
      g = rgb[1],
      b = rgb[2],
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, v;

  if (max == 0)
    s = 0;
  else
    s = (delta/max * 1000)/10;

  if (max == min)
    h = 0;
  else if (r == max)
    h = (g - b) / delta;
  else if (g == max)
    h = 2 + (b - r) / delta;
  else if (b == max)
    h = 4 + (r - g) / delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  v = ((max / 255) * 1000) / 10;

  return [h, s, v];
}

function rgb2cmyk(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      c, m, y, k;

  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k);
  m = (1 - g - k) / (1 - k);
  y = (1 - b - k) / (1 - k);
  return [c * 100, m * 100, y * 100, k * 100];
}

function rgb2keyword(rgb) {
  return reverseKeywords[JSON.stringify(rgb)];
}

function rgb2xyz(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255;

  // assume sRGB
  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

  var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
  var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
  var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

  return [x * 100, y *100, z * 100];
}

function rgb2lab(rgb) {
  var xyz = rgb2xyz(rgb),
        x = xyz[0],
        y = xyz[1],
        z = xyz[2],
        l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}


function hsl2rgb(hsl) {
  var h = hsl[0] / 360,
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      t1, t2, t3, rgb, val;

  if (s == 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5)
    t2 = l * (1 + s);
  else
    t2 = l + s - l * s;
  t1 = 2 * l - t2;

  rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * - (i - 1);
    t3 < 0 && t3++;
    t3 > 1 && t3--;

    if (6 * t3 < 1)
      val = t1 + (t2 - t1) * 6 * t3;
    else if (2 * t3 < 1)
      val = t2;
    else if (3 * t3 < 2)
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    else
      val = t1;

    rgb[i] = val * 255;
  }

  return rgb;
}

function hsl2hsv(hsl) {
  var h = hsl[0],
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      sv, v;
  l *= 2;
  s *= (l <= 1) ? l : 2 - l;
  v = (l + s) / 2;
  sv = (2 * s) / (l + s);
  return [h, sv * 100, v * 100];
}

function hsl2cmyk(args) {
  return rgb2cmyk(hsl2rgb(args));
}

function hsl2keyword(args) {
  return rgb2keyword(hsl2rgb(args));
}


function hsv2rgb(hsv) {
  var h = hsv[0] / 60,
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      hi = Math.floor(h) % 6;

  var f = h - Math.floor(h),
      p = 255 * v * (1 - s),
      q = 255 * v * (1 - (s * f)),
      t = 255 * v * (1 - (s * (1 - f))),
      v = 255 * v;

  switch(hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
}

function hsv2hsl(hsv) {
  var h = hsv[0],
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      sl, l;

  l = (2 - s) * v;
  sl = s * v;
  sl /= (l <= 1) ? l : 2 - l;
  l /= 2;
  return [h, sl * 100, l * 100];
}

function hsv2cmyk(args) {
  return rgb2cmyk(hsv2rgb(args));
}

function hsv2keyword(args) {
  return rgb2keyword(hsv2rgb(args));
}

function cmyk2rgb(cmyk) {
  var c = cmyk[0] / 100,
      m = cmyk[1] / 100,
      y = cmyk[2] / 100,
      k = cmyk[3] / 100,
      r, g, b;

  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
}

function cmyk2hsl(args) {
  return rgb2hsl(cmyk2rgb(args));
}

function cmyk2hsv(args) {
  return rgb2hsv(cmyk2rgb(args));
}

function cmyk2keyword(args) {
  return rgb2keyword(cmyk2rgb(args));
}


function xyz2rgb(xyz) {
  var x = xyz[0] / 100,
      y = xyz[1] / 100,
      z = xyz[2] / 100,
      r, g, b;

  r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
  g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
  b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

  // assume sRGB
  r = r > 0.0031308 ? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
    : r = (r * 12.92);

  g = g > 0.0031308 ? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
    : g = (g * 12.92);

  b = b > 0.0031308 ? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
    : b = (b * 12.92);

  r = (r < 0) ? 0 : r;
  g = (g < 0) ? 0 : g;
  b = (b < 0) ? 0 : b;

  return [r * 255, g * 255, b * 255];
}

function xyz2lab(xyz) {
  var x = xyz[0],
      y = xyz[1],
      z = xyz[2],
      l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}

function lab2xyz(lab) {
  var l = lab[0],
      a = lab[1],
      b = lab[2],
      x, y, z, y2;

  if (l <= 8) {
    y = (l * 100) / 903.3;
    y2 = (7.787 * (y / 100)) + (16 / 116);
  } else {
    y = 100 * Math.pow((l + 16) / 116, 3);
    y2 = Math.pow(y / 100, 1/3);
  }

  x = x / 95.047 <= 0.008856 ? x = (95.047 * ((a / 500) + y2 - (16 / 116))) / 7.787 : 95.047 * Math.pow((a / 500) + y2, 3);

  z = z / 108.883 <= 0.008859 ? z = (108.883 * (y2 - (b / 200) - (16 / 116))) / 7.787 : 108.883 * Math.pow(y2 - (b / 200), 3);

  return [x, y, z];
}

function keyword2rgb(keyword) {
  return cssKeywords[keyword];
}

function keyword2hsl(args) {
  return rgb2hsl(keyword2rgb(args));
}

function keyword2hsv(args) {
  return rgb2hsv(keyword2rgb(args));
}

function keyword2cmyk(args) {
  return rgb2cmyk(keyword2rgb(args));
}

function keyword2lab(args) {
  return rgb2lab(keyword2rgb(args));
}

function keyword2xyz(args) {
  return rgb2xyz(keyword2rgb(args));
}

var cssKeywords = {
  aliceblue:  [240,248,255],
  antiquewhite: [250,235,215],
  aqua: [0,255,255],
  aquamarine: [127,255,212],
  azure:  [240,255,255],
  beige:  [245,245,220],
  bisque: [255,228,196],
  black:  [0,0,0],
  blanchedalmond: [255,235,205],
  blue: [0,0,255],
  blueviolet: [138,43,226],
  brown:  [165,42,42],
  burlywood:  [222,184,135],
  cadetblue:  [95,158,160],
  chartreuse: [127,255,0],
  chocolate:  [210,105,30],
  coral:  [255,127,80],
  cornflowerblue: [100,149,237],
  cornsilk: [255,248,220],
  crimson:  [220,20,60],
  cyan: [0,255,255],
  darkblue: [0,0,139],
  darkcyan: [0,139,139],
  darkgoldenrod:  [184,134,11],
  darkgray: [169,169,169],
  darkgreen:  [0,100,0],
  darkgrey: [169,169,169],
  darkkhaki:  [189,183,107],
  darkmagenta:  [139,0,139],
  darkolivegreen: [85,107,47],
  darkorange: [255,140,0],
  darkorchid: [153,50,204],
  darkred:  [139,0,0],
  darksalmon: [233,150,122],
  darkseagreen: [143,188,143],
  darkslateblue:  [72,61,139],
  darkslategray:  [47,79,79],
  darkslategrey:  [47,79,79],
  darkturquoise:  [0,206,209],
  darkviolet: [148,0,211],
  deeppink: [255,20,147],
  deepskyblue:  [0,191,255],
  dimgray:  [105,105,105],
  dimgrey:  [105,105,105],
  dodgerblue: [30,144,255],
  firebrick:  [178,34,34],
  floralwhite:  [255,250,240],
  forestgreen:  [34,139,34],
  fuchsia:  [255,0,255],
  gainsboro:  [220,220,220],
  ghostwhite: [248,248,255],
  gold: [255,215,0],
  goldenrod:  [218,165,32],
  gray: [128,128,128],
  green:  [0,128,0],
  greenyellow:  [173,255,47],
  grey: [128,128,128],
  honeydew: [240,255,240],
  hotpink:  [255,105,180],
  indianred:  [205,92,92],
  indigo: [75,0,130],
  ivory:  [255,255,240],
  khaki:  [240,230,140],
  lavender: [230,230,250],
  lavenderblush:  [255,240,245],
  lawngreen:  [124,252,0],
  lemonchiffon: [255,250,205],
  lightblue:  [173,216,230],
  lightcoral: [240,128,128],
  lightcyan:  [224,255,255],
  lightgoldenrodyellow: [250,250,210],
  lightgray:  [211,211,211],
  lightgreen: [144,238,144],
  lightgrey:  [211,211,211],
  lightpink:  [255,182,193],
  lightsalmon:  [255,160,122],
  lightseagreen:  [32,178,170],
  lightskyblue: [135,206,250],
  lightslategray: [119,136,153],
  lightslategrey: [119,136,153],
  lightsteelblue: [176,196,222],
  lightyellow:  [255,255,224],
  lime: [0,255,0],
  limegreen:  [50,205,50],
  linen:  [250,240,230],
  magenta:  [255,0,255],
  maroon: [128,0,0],
  mediumaquamarine: [102,205,170],
  mediumblue: [0,0,205],
  mediumorchid: [186,85,211],
  mediumpurple: [147,112,219],
  mediumseagreen: [60,179,113],
  mediumslateblue:  [123,104,238],
  mediumspringgreen:  [0,250,154],
  mediumturquoise:  [72,209,204],
  mediumvioletred:  [199,21,133],
  midnightblue: [25,25,112],
  mintcream:  [245,255,250],
  mistyrose:  [255,228,225],
  moccasin: [255,228,181],
  navajowhite:  [255,222,173],
  navy: [0,0,128],
  oldlace:  [253,245,230],
  olive:  [128,128,0],
  olivedrab:  [107,142,35],
  orange: [255,165,0],
  orangered:  [255,69,0],
  orchid: [218,112,214],
  palegoldenrod:  [238,232,170],
  palegreen:  [152,251,152],
  paleturquoise:  [175,238,238],
  palevioletred:  [219,112,147],
  papayawhip: [255,239,213],
  peachpuff:  [255,218,185],
  peru: [205,133,63],
  pink: [255,192,203],
  plum: [221,160,221],
  powderblue: [176,224,230],
  purple: [128,0,128],
  red:  [255,0,0],
  rosybrown:  [188,143,143],
  royalblue:  [65,105,225],
  saddlebrown:  [139,69,19],
  salmon: [250,128,114],
  sandybrown: [244,164,96],
  seagreen: [46,139,87],
  seashell: [255,245,238],
  sienna: [160,82,45],
  silver: [192,192,192],
  skyblue:  [135,206,235],
  slateblue:  [106,90,205],
  slategray:  [112,128,144],
  slategrey:  [112,128,144],
  snow: [255,250,250],
  springgreen:  [0,255,127],
  steelblue:  [70,130,180],
  tan:  [210,180,140],
  teal: [0,128,128],
  thistle:  [216,191,216],
  tomato: [255,99,71],
  turquoise:  [64,224,208],
  violet: [238,130,238],
  wheat:  [245,222,179],
  white:  [255,255,255],
  whitesmoke: [245,245,245],
  yellow: [255,255,0],
  yellowgreen:  [154,205,50]
};

var reverseKeywords = {};
for (var key in cssKeywords) {
  reverseKeywords[JSON.stringify(cssKeywords[key])] = key;
}

});Color = require('color.js');
})();
var MAPJS = {};
/*global console*/
var observable = function (base) {
	'use strict';
	var listeners = [];
	base.addEventListener = function (types, listener, priority) {
		types.split(' ').forEach(function (type) {
			if (type) {
				listeners.push({
					type: type,
					listener: listener,
					priority: priority || 0
				});
			}
		});
	};
	base.listeners = function (type) {
		return listeners.filter(function (listenerDetails) {
			return listenerDetails.type === type;
		}).map(function (listenerDetails) {
			return listenerDetails.listener;
		});
	};
	base.removeEventListener = function (type, listener) {
		listeners = listeners.filter(function (details) {
			return details.listener !== listener;
		});
	};
	base.dispatchEvent = function (type) {
		var args = Array.prototype.slice.call(arguments, 1);
		listeners
			.filter(function (listenerDetails) {
				return listenerDetails.type === type;
			})
			.sort(function (firstListenerDetails, secondListenerDetails) {
				return secondListenerDetails.priority - firstListenerDetails.priority;
			})
			.some(function (listenerDetails) {
				try {
					return listenerDetails.listener.apply(undefined, args) === false;
				} catch (e) {
					console.log('dispatchEvent failed', e, listenerDetails);
				}

			});
	};
	return base;
};
/*global MAPJS */
MAPJS.URLHelper = {
	urlPattern: /(https?:\/\/|www\.)[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/i,
	containsLink : function (text) {
		'use strict';
		return MAPJS.URLHelper.urlPattern.test(text);
	},
	getLink : function (text) {
		'use strict';
		var url = text.match(MAPJS.URLHelper.urlPattern);
		if (url && url[0]) {
			url = url[0];
			if (!/https?:\/\//i.test(url)) {
				url = 'http://' + url;
			}
		}
		return url;
	},
	stripLink : function (text) {
		'use strict';
		return text.replace(MAPJS.URLHelper.urlPattern, '');
	}
};
/*jslint eqeq: true, forin: true, nomen: true*/
/*jshint unused:false, loopfunc:true */
/*global _, MAPJS, observable*/
MAPJS.content = function (contentAggregate, sessionKey) {
	'use strict';
	var cachedId,
		invalidateIdCache = function () {
			cachedId = undefined;
		},
		maxId = function maxId(idea) {
			idea = idea || contentAggregate;
			if (!idea.ideas) {
				return parseInt(idea.id, 10) || 0;
			}
			return _.reduce(
				idea.ideas,
				function (result, subidea) {
					return Math.max(result, maxId(subidea));
				},
				parseInt(idea.id, 10) || 0
			);
		},
		nextId = function nextId(originSession) {
			originSession = originSession || sessionKey;
			if (!cachedId) {
				cachedId =  maxId();
			}
			cachedId += 1;
			if (originSession) {
				return cachedId + '.' + originSession;
			}
			return cachedId;
		},
		init = function (contentIdea, originSession) {
			if (!contentIdea.id) {
				contentIdea.id = nextId(originSession);
			} else {
				invalidateIdCache();
			}
			if (contentIdea.ideas) {
				_.each(contentIdea.ideas, function (value, key) {
					contentIdea.ideas[parseFloat(key)] = init(value, originSession);
				});
			}
			if (!contentIdea.title) {
				contentIdea.title = '';
			}
            if (!contentIdea.oid) {
                contentIdea.oid = '';
            }
            if (!contentIdea.hidden) {
                contentIdea.hidden = false;
            }
            //alert(contentIdea.id + ' ' + contentIdea.isSelected);
			contentIdea.containsDirectChild = contentIdea.findChildRankById = function (childIdeaId) {
				return parseFloat(
					_.reduce(
						contentIdea.ideas,
						function (res, value, key) {
							return value.id == childIdeaId ? key : res;
						},
						undefined
					)
				);
			};
			contentIdea.findSubIdeaById = function (childIdeaId) {
				var myChild = _.find(contentIdea.ideas, function (idea) {
					return idea.id == childIdeaId;
				});
				return myChild || _.reduce(contentIdea.ideas, function (result, idea) {
					return result || idea.findSubIdeaById(childIdeaId);
				}, undefined);
			};
			contentIdea.findSubIdeaByOid = function (childIdeaOid) {
				var myChild = _.find(contentIdea.ideas, function (idea) {
					return idea.oid == childIdeaOid;
				});
				return myChild || _.reduce(contentIdea.ideas, function (result, idea) {
					return result || idea.findSubIdeaById(childIdeaOid);
				}, undefined);
			};
			contentIdea.find = function (predicate) {
				var current = predicate(contentIdea) ? [_.pick(contentIdea, 'id', 'title')] : [];
				if (_.size(contentIdea.ideas) === 0) {
					return current;
				}
				return _.reduce(contentIdea.ideas, function (result, idea) {
					return _.union(result, idea.find(predicate));
				}, current);
			};
			contentIdea.getAttr = function (name) {
				if (contentIdea.attr && contentIdea.attr[name]) {
					return _.clone(contentIdea.attr[name]);
				}
				return false;
			};
			contentIdea.sortedSubIdeas = function () {
				if (!contentIdea.ideas) {
					return [];
				}
				var result = [],
					childKeys = _.groupBy(_.map(_.keys(contentIdea.ideas), parseFloat), function (key) { return key > 0; }),
					sortedChildKeys = _.sortBy(childKeys[true], Math.abs).concat(_.sortBy(childKeys[false], Math.abs));
				_.each(sortedChildKeys, function (key) {
					result.push(contentIdea.ideas[key]);
				});
				return result;
			};
			contentIdea.traverse = function (iterator) {
				iterator(contentIdea);
				_.each(contentIdea.sortedSubIdeas(), function (subIdea) {
					subIdea.traverse(iterator);
				});
			};
			return contentIdea;
		},
		maxKey = function (kvMap, sign) {
			sign = sign || 1;
			if (_.size(kvMap) === 0) {
				return 0;
			}
			var currentKeys = _.keys(kvMap);
			currentKeys.push(0); /* ensure at least 0 is there for negative ranks */
			return _.max(_.map(currentKeys, parseFloat), function (x) {
				return x * sign;
			});
		},
		nextChildRank = function (parentIdea) {
			var newRank, counts, childRankSign = 1;
			/*
			if (parentIdea.id == contentAggregate.id) {
				counts = _.countBy(parentIdea.ideas, function (v, k) {
					return k < 0;
				});
				if ((counts['true'] || 0) < counts['false']) {
					childRankSign = -1;
				}
			}
			*/
			newRank = maxKey(parentIdea.ideas, childRankSign) + childRankSign;
			return newRank;
		},
		appendSubIdea = function (parentIdea, subIdea) {
			var rank;
			parentIdea.ideas = parentIdea.ideas || {};
			rank = nextChildRank(parentIdea);
			parentIdea.ideas[rank] = subIdea;
			return rank;
		},
		findIdeaById = function (ideaId) {
			return contentAggregate.id == ideaId ? contentAggregate : contentAggregate.findSubIdeaById(ideaId);
		},
		sameSideSiblingRanks = function (parentIdea, ideaRank) {
			return _(_.map(_.keys(parentIdea.ideas), parseFloat)).reject(function (k) {return k * ideaRank < 0; });
		},
		sign = function (number) {
			/* intentionally not returning 0 case, to help with split sorting into 2 groups */
			return number < 0 ? -1 : 1;
		},
		eventStacks = {},
		redoStacks = {},
		isRedoInProgress = false,
		batches = {},
		notifyChange = function (method, args, originSession) {
			if (originSession) {
				contentAggregate.dispatchEvent('changed', method, args, originSession);
			} else {
				contentAggregate.dispatchEvent('changed', method, args);
			}
		},
		appendChange = function (method, args, undofunc, originSession) {
			var prev;
			if (method === 'batch' || batches[originSession] || !eventStacks || !eventStacks[originSession] || eventStacks[originSession].length === 0) {
				logChange(method, args, undofunc, originSession);
				return;
			} else {
				prev = eventStacks[originSession].pop();
				if (prev.eventMethod === 'batch') {
					eventStacks[originSession].push({
						eventMethod: 'batch',
						eventArgs: prev.eventArgs.concat([[method].concat(args)]),
						undoFunction: function () {
							undofunc();
							prev.undoFunction();
						}
					});
				} else {
					eventStacks[originSession].push({
						eventMethod: 'batch',
						eventArgs: [[prev.eventMethod].concat(prev.eventArgs)].concat([[method].concat(args)]),
						undoFunction: function () {
							undofunc();
							prev.undoFunction();
						}
					});
				}
			}
			if (isRedoInProgress) {
				contentAggregate.dispatchEvent('changed', 'redo', undefined, originSession);
			} else {
				notifyChange(method, args, originSession);
				redoStacks[originSession] = [];
			}
		},
		logChange = function (method, args, undofunc, originSession) {
			var event = {eventMethod: method, eventArgs: args, undoFunction: undofunc};
			if (batches[originSession]) {
				batches[originSession].push(event);
				return;
			}
			if (!eventStacks[originSession]) {
				eventStacks[originSession] = [];
			}
			eventStacks[originSession].push(event);

			if (isRedoInProgress) {
				contentAggregate.dispatchEvent('changed', 'redo', undefined, originSession);
			} else {
				notifyChange(method, args, originSession);
				redoStacks[originSession] = [];
			}
		},
		reorderChild = function (parentIdea, newRank, oldRank) {
			if (oldRank && newRank && oldRank != newRank) {
				parentIdea.ideas[newRank] = parentIdea.ideas[oldRank];
				delete parentIdea.ideas[oldRank];
			}
		},
		upgrade = function (idea) {
			if (idea.style) {
				idea.attr = {};
				var collapsed = idea.style.collapsed;
				delete idea.style.collapsed;
				idea.attr.style = idea.style;
				if (collapsed) {
					idea.attr.collapsed = collapsed;
				}
				delete idea.style;
			}
			if (idea.ideas) {
				_.each(idea.ideas, upgrade);
			}
		},
		sessionFromId = function (id) {
			var dotIndex = String(id).indexOf('.');
			return dotIndex > 0 && id.substr(dotIndex + 1);
		},
		commandProcessors = {};
	contentAggregate.getSessionKey = function () {
		return sessionKey;
	};
	contentAggregate.nextSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsAfter;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsAfter = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) <= Math.abs(currentRank); });
		if (siblingsAfter.length === 0) { return false; }
		return parentIdea.ideas[_.min(siblingsAfter, Math.abs)].id;
	};
	contentAggregate.sameSideSiblingIds = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank = parentIdea.findChildRankById(subIdeaId);
		return _.without(_.map(_.pick(parentIdea.ideas, sameSideSiblingRanks(parentIdea, currentRank)), function (i) { return i.id; }), subIdeaId);
	};
	contentAggregate.getAttrById = function (ideaId, attrName) {
		var idea = findIdeaById(ideaId);
		return idea && idea.getAttr(attrName);
	};
	contentAggregate.previousSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsBefore;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsBefore = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) >= Math.abs(currentRank); });
		if (siblingsBefore.length === 0) { return false; }
		return parentIdea.ideas[_.max(siblingsBefore, Math.abs)].id;
	};
	contentAggregate.clone = function (subIdeaId) {
		var toClone = (subIdeaId && subIdeaId != contentAggregate.id && contentAggregate.findSubIdeaById(subIdeaId)) || contentAggregate;
		return JSON.parse(JSON.stringify(toClone));
	};
	contentAggregate.cloneMultiple = function (subIdeaIdArray) {
		return _.map(subIdeaIdArray, contentAggregate.clone);
	};
	contentAggregate.calculatePath = function (ideaId, currentPath, potentialParent) {
		if (contentAggregate.id == ideaId) {
			return [];
		}
		currentPath = currentPath || [contentAggregate];
		potentialParent = potentialParent || contentAggregate;
		if (potentialParent.containsDirectChild(ideaId)) {
			return currentPath;
		}
		return _.reduce(
			potentialParent.ideas,
			function (result, child) {
				return result || contentAggregate.calculatePath(ideaId, [child].concat(currentPath), child);
			},
			false
		);
	};
	contentAggregate.getSubTreeIds = function (rootIdeaId) {
		var result = [],
			collectIds = function (idea) {
				if (_.isEmpty(idea.ideas)) {
					return [];
				}
				_.each(idea.sortedSubIdeas(), function (child) {
					collectIds(child);
					result.push(child.id);
				});
			};
		collectIds(contentAggregate.findSubIdeaById(rootIdeaId) || contentAggregate);
		return result;
	};
	contentAggregate.findParent = function (subIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		if (parentIdea.containsDirectChild(subIdeaId)) {
			return parentIdea;
		}
		return _.reduce(
			parentIdea.ideas,
			function (result, child) {
				return result || contentAggregate.findParent(subIdeaId, child);
			},
			false
		);
	};

	/**** aggregate command processing methods ****/
	contentAggregate.startBatch = function (originSession) {
		var activeSession = originSession || sessionKey;
		contentAggregate.endBatch(originSession);
		batches[activeSession] = [];
	};
	contentAggregate.endBatch = function (originSession) {
		var activeSession = originSession || sessionKey,
			inBatch = batches[activeSession],
			batchArgs,
			batchUndoFunctions,
			undo;
		batches[activeSession] = undefined;
		if (_.isEmpty(inBatch)) {
			return;
		}
		if (_.size(inBatch) === 1) {
			logChange(inBatch[0].eventMethod, inBatch[0].eventArgs, inBatch[0].undoFunction, activeSession);
		} else {
			batchArgs = _.map(inBatch, function (event) {
				return [event.eventMethod].concat(event.eventArgs);
			});
			batchUndoFunctions = _.sortBy(
				_.map(inBatch, function (event) { return event.undoFunction; }),
				function (f, idx) { return -1 * idx; }
			);
			undo = function () {
				_.each(batchUndoFunctions, function (eventUndo) {
					eventUndo();
				});
			};
			logChange('batch', batchArgs, undo, activeSession);
		}
	};
	contentAggregate.execCommand = function (cmd, args, originSession) {
		if (!commandProcessors[cmd]) {
			return false;
		}
		return commandProcessors[cmd].apply(contentAggregate, [originSession || sessionKey].concat(_.toArray(args)));
	};

	contentAggregate.batch = function (batchOp) {
		contentAggregate.startBatch();
		try {
			batchOp();
		}
		finally {
			contentAggregate.endBatch();
		}
	};

	commandProcessors.batch = function (originSession) {
		contentAggregate.startBatch(originSession);
		try {
			_.each(_.toArray(arguments).slice(1), function (event) {
				contentAggregate.execCommand(event[0], event.slice(1), originSession);
			});
		}
		finally {
			contentAggregate.endBatch(originSession);
		}
	};
	contentAggregate.pasteMultiple = function (parentIdeaId, jsonArrayToPaste) {
		contentAggregate.startBatch();
		var results = _.map(jsonArrayToPaste, function (json) {
			return contentAggregate.paste(parentIdeaId, json);
		});
		contentAggregate.endBatch();
		return results;
	};

	contentAggregate.paste = function (parentIdeaId, jsonToPaste, initialId) {
		return contentAggregate.execCommand('paste', arguments);
	};
	commandProcessors.paste = function (originSession, parentIdeaId, jsonToPaste, initialId) {
		var pasteParent = (parentIdeaId == contentAggregate.id) ?  contentAggregate : contentAggregate.findSubIdeaById(parentIdeaId),
			cleanUp = function (json) {
				var result =  _.omit(json, 'ideas', 'id'), index = 1, childKeys, sortedChildKeys;
				if (json.ideas) {
					childKeys = _.groupBy(_.map(_.keys(json.ideas), parseFloat), function (key) { return key > 0; });
					sortedChildKeys = _.sortBy(childKeys[true], Math.abs).concat(_.sortBy(childKeys[false], Math.abs));
					result.ideas = {};
					_.each(sortedChildKeys, function (key) {
						result.ideas[index++] = cleanUp(json.ideas[key]);
					});
				}
				return result;
			},
			newIdea,
			newRank,
			oldPosition;
		if (initialId) {
			cachedId = parseInt(initialId, 10) - 1;
		}
		newIdea =  jsonToPaste && (jsonToPaste.title || jsonToPaste.attr) && init(cleanUp(jsonToPaste), sessionFromId(initialId));
		newIdea.oid = null;
		newIdea.user_role = null;
		newIdea.user_perms = null;
		newIdea.added_by = null;
		newIdea.privacy_mode = null;
		newIdea.hidden = null;
		if (!pasteParent || !newIdea) {
			return false;
		}
		newRank = appendSubIdea(pasteParent, newIdea);
		if (initialId) {
			invalidateIdCache();
		}
		updateAttr(newIdea, 'position');
		logChange('paste', [parentIdeaId, jsonToPaste, newIdea.id], function () {
			delete pasteParent.ideas[newRank];
		}, originSession);
		return newIdea.id;
	};
	contentAggregate.navigate = function (ideaId) {
		return contentAggregate.execCommand('navigate', arguments);
	};
	commandProcessors.navigate = function (originSession, ideaId) {
		logChange('navigate', [ideaId], function() {}, originSession);
		return ideaId;
	};
	contentAggregate.previewNode = function (ideaId) {
		return contentAggregate.execCommand('previewNode', arguments);
	};
	commandProcessors.previewNode = function (originSession, ideaId) {
		logChange('previewNode', [ideaId], function() {}, originSession);
		return ideaId;
	};
	contentAggregate.flip = function (ideaId) {
		return contentAggregate.execCommand('flip', arguments);
	};
	commandProcessors.flip = function (originSession, ideaId) {
		var newRank, maxRank, currentRank = contentAggregate.findChildRankById(ideaId);
		if (!currentRank) {
			return false;
		}
		maxRank = maxKey(contentAggregate.ideas, -1 * sign(currentRank));
		newRank = maxRank - 10 * sign(currentRank);
		reorderChild(contentAggregate, newRank, currentRank);
		logChange('flip', [ideaId], function () {
			reorderChild(contentAggregate, currentRank, newRank);
		}, originSession);
		return true;
	};
	contentAggregate.initialiseTitle = function (ideaId, title) {
		return contentAggregate.execCommand('initialiseTitle', arguments);
	};
	commandProcessors.initialiseTitle = function (originSession, ideaId, title) {
		var idea = findIdeaById(ideaId), originalTitle;
		if (!idea) {
			return false;
		}
		originalTitle = idea.title;
		if (originalTitle == title) {
			return false;
		}
		idea.title = title;
		appendChange('initialiseTitle', [ideaId, title], function () {
			idea.title = originalTitle;
		}, originSession);
		return true;
	};
	contentAggregate.updateTitle = function (ideaId, title) {
		return contentAggregate.execCommand('updateTitle', arguments);
	};
	commandProcessors.updateTitle = function (originSession, ideaId, title) {
		var idea = findIdeaById(ideaId), originalTitle;
		if (!idea) {
			return false;
		}
		originalTitle = idea.title;
		if (originalTitle == title) {
			return false;
		}
		idea.title = title;
		logChange('updateTitle', [ideaId, title], function () {
			idea.title = originalTitle;
		}, originSession);
		return true;
	};
	contentAggregate.addSubIdea = function (parentId, ideaTitle, optionalNewId) {
		return contentAggregate.execCommand('addSubIdea', arguments);
	};
	commandProcessors.addSubIdea = function (originSession, parentId, ideaTitle, optionalNewId) {
		var idea, parent = findIdeaById(parentId), newRank;
		if (!parent) {
			return false;
		}
		if (optionalNewId && findIdeaById(optionalNewId)) {
			return false;
		}
		idea = init({
			title: ideaTitle,
			id: optionalNewId,
            oid: ''
		});
		newRank = appendSubIdea(parent, idea);
		logChange('addSubIdea', [parentId, ideaTitle, idea.id], function () {
			delete parent.ideas[newRank];
		}, originSession);
		return idea.id;
	};
	contentAggregate.removeMultiple = function (subIdeaIdArray) {
		contentAggregate.startBatch();
		var results = _.map(subIdeaIdArray, contentAggregate.removeSubIdea);
		contentAggregate.endBatch();
		return results;
	};
	contentAggregate.removeSubIdea = function (subIdeaId) {
		return contentAggregate.execCommand('removeSubIdea', arguments);
	};
	commandProcessors.removeSubIdea = function (originSession, subIdeaId) {
		var parent = contentAggregate.findParent(subIdeaId), oldRank, oldIdea, oldLinks;
		if (parent) {
			oldRank = parent.findChildRankById(subIdeaId);
			oldIdea = parent.ideas[oldRank];
			delete parent.ideas[oldRank];
			oldLinks = contentAggregate.links;
			contentAggregate.links = _.reject(contentAggregate.links, function (link) { return link.ideaIdFrom == subIdeaId || link.ideaIdTo == subIdeaId; });
			logChange('removeSubIdea', [subIdeaId], function () {
				parent.ideas[oldRank] = oldIdea;
				contentAggregate.links = oldLinks;
			}, originSession);
			return true;
		}
		return false;
	};
	contentAggregate.insertIntermediateMultiple = function (idArray) {
		contentAggregate.startBatch();
		var newId = contentAggregate.insertIntermediate(idArray[0]);
		_.each(idArray.slice(1), function (id) {
			contentAggregate.changeParent(id, newId);
		});
		contentAggregate.endBatch();
		return newId;
	};
	contentAggregate.insertIntermediate = function (inFrontOfIdeaId, title, optionalNewId) {
		return contentAggregate.execCommand('insertIntermediate', arguments);
	};
	commandProcessors.insertIntermediate = function (originSession, inFrontOfIdeaId, title, optionalNewId) {
		if (contentAggregate.id == inFrontOfIdeaId) {
			return false;
		}
		var childRank, oldIdea, newIdea, parentIdea = contentAggregate.findParent(inFrontOfIdeaId);
		if (!parentIdea) {
			return false;
		}
		if (optionalNewId && findIdeaById(optionalNewId)) {
			return false;
		}
		childRank = parentIdea.findChildRankById(inFrontOfIdeaId);
		if (!childRank) {
			return false;
		}
		oldIdea = parentIdea.ideas[childRank];
		newIdea = init({
			title: title,
			id: optionalNewId,
            oid: ''
		});
		parentIdea.ideas[childRank] = newIdea;
		newIdea.ideas = {
			1: oldIdea
		};
		logChange('insertIntermediate', [inFrontOfIdeaId, title, newIdea.id], function () {
			parentIdea.ideas[childRank] = oldIdea;
		}, originSession);
		return newIdea.id;
	};
	contentAggregate.changeParent = function (ideaId, newParentId) {
		return contentAggregate.execCommand('changeParent', arguments);
	};
	commandProcessors.changeParent = function (originSession, ideaId, newParentId) {
		var oldParent, oldRank, newRank, idea, parent = findIdeaById(newParentId), oldPosition;
		if (ideaId == newParentId) {
			return false;
		}
		if (!parent) {
			return false;
		}
		idea = contentAggregate.findSubIdeaById(ideaId);
		if (!idea) {
			return false;
		}
		if (idea.findSubIdeaById(newParentId)) {
			return false;
		}
		if (parent.containsDirectChild(ideaId)) {
			return false;
		}
		oldParent = contentAggregate.findParent(ideaId);
		if (!oldParent) {
			return false;
		}
		oldRank = oldParent.findChildRankById(ideaId);
		newRank = appendSubIdea(parent, idea);
		oldPosition = idea.getAttr('position');
		updateAttr(idea, 'position');
		delete oldParent.ideas[oldRank];
		logChange('changeParent', [ideaId, newParentId], function () {
			updateAttr(idea, 'position', oldPosition);
			oldParent.ideas[oldRank] = idea;
			delete parent.ideas[newRank];
		}, originSession);
		return true;
	};
	var updateAttr = function (object, attrName, attrValue) {
		var oldAttr;
		if (!object) {
			return false;
		}
		oldAttr = _.extend({}, object.attr);
		object.attr = _.extend({}, object.attr);
		if (!attrValue || attrValue === 'false' || (_.isObject(attrValue) && _.isEmpty(attrValue))) {
			if (!object.attr[attrName]) {
				return false;
			}
			delete object.attr[attrName];
		} else {
			if (_.isEqual(object.attr[attrName], attrValue)) {
				return false;
			}
			object.attr[attrName] = JSON.parse(JSON.stringify(attrValue));
		}
		if (_.size(object.attr) === 0) {
			delete object.attr;
		}
		return function () {
			object.attr = oldAttr;
		};
	};
	contentAggregate.mergeAttrProperty = function (ideaId, attrName, attrPropertyName, attrPropertyValue) {
		var val = contentAggregate.getAttrById(ideaId, attrName) || {};
		if (attrPropertyValue) {
			val[attrPropertyName] = attrPropertyValue;
		} else {
			delete val[attrPropertyName];
		}
		if (_.isEmpty(val)) { val = false; }
		return contentAggregate.updateAttr(ideaId, attrName, val);
	};
	contentAggregate.updateAttr = function (ideaId, attrName, attrValue) {
		return contentAggregate.execCommand('updateAttr', arguments);
	};
	commandProcessors.updateAttr = function (originSession, ideaId, attrName, attrValue) {
		var idea = findIdeaById(ideaId), undoAction;
		undoAction = updateAttr(idea, attrName, attrValue);
		if (undoAction) {
			logChange('updateAttr', [ideaId, attrName, attrValue], undoAction, originSession);
		}
		return !!undoAction;
	};
	contentAggregate.moveRelative = function (ideaId, relativeMovement) {
		var parentIdea = contentAggregate.findParent(ideaId),
			currentRank = parentIdea && parentIdea.findChildRankById(ideaId),
			siblingRanks = currentRank && _.sortBy(sameSideSiblingRanks(parentIdea, currentRank), Math.abs),
			currentIndex = siblingRanks && siblingRanks.indexOf(currentRank),
			/* we call positionBefore, so movement down is actually 2 spaces, not 1 */
			newIndex = currentIndex + (relativeMovement > 0 ? relativeMovement + 1 : relativeMovement),
			beforeSibling = (newIndex >= 0) && parentIdea && siblingRanks && parentIdea.ideas[siblingRanks[newIndex]];
		if (newIndex < 0 || !parentIdea) {
			return false;
		}
		return contentAggregate.positionBefore(ideaId, beforeSibling && beforeSibling.id, parentIdea);
	};
	contentAggregate.positionBefore = function (ideaId, positionBeforeIdeaId, parentIdea) {
		return contentAggregate.execCommand('positionBefore', arguments);
	};
	commandProcessors.positionBefore = function (originSession, ideaId, positionBeforeIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var newRank, afterRank, siblingRanks, candidateSiblings, beforeRank, maxRank, currentRank;
		currentRank = parentIdea.findChildRankById(ideaId);
		if (!currentRank) {
			return _.reduce(
				parentIdea.ideas,
				function (result, idea) {
					return result || commandProcessors.positionBefore(originSession, ideaId, positionBeforeIdeaId, idea);
				},
				false
			);
		}
		if (ideaId == positionBeforeIdeaId) {
			return false;
		}
		newRank = 0;
		if (positionBeforeIdeaId) {
			afterRank = parentIdea.findChildRankById(positionBeforeIdeaId);
			if (!afterRank) {
				return false;
			}
			siblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
			candidateSiblings = _.reject(_.sortBy(siblingRanks, Math.abs), function (k) {
				return Math.abs(k) >= Math.abs(afterRank);
			});
			beforeRank = candidateSiblings.length > 0 ? _.max(candidateSiblings, Math.abs) : 0;
			if (beforeRank == currentRank) {
				return false;
			}
			newRank = beforeRank + (afterRank - beforeRank) / 2;
		} else {
			maxRank = maxKey(parentIdea.ideas, currentRank < 0 ? -1 : 1);
			if (maxRank == currentRank) {
				return false;
			}
			newRank = maxRank + 10 * (currentRank < 0 ? -1 : 1);
		}
		if (newRank == currentRank) {
			return false;
		}
		//newRank = Math.abs(newRank);
		reorderChild(parentIdea, newRank, currentRank);
		logChange('positionBefore', [ideaId, positionBeforeIdeaId], function () {
			reorderChild(parentIdea, currentRank, newRank);
		}, originSession);
		return true;
	};
	observable(contentAggregate);
	(function () {
		var isLinkValid = function (ideaIdFrom, ideaIdTo) {
			var isParentChild, ideaFrom, ideaTo;
			if (ideaIdFrom === ideaIdTo) {
				return false;
			}
			ideaFrom = findIdeaById(ideaIdFrom);
			if (!ideaFrom) {
				return false;
			}
			ideaTo = findIdeaById(ideaIdTo);
			if (!ideaTo) {
				return false;
			}
			isParentChild = _.find(
				ideaFrom.ideas,
				function (node) {
					return node.id === ideaIdTo;
				}
			) || _.find(
				ideaTo.ideas,
				function (node) {
					return node.id === ideaIdFrom;
				}
			);
			if (isParentChild) {
				return false;
			}
			return true;
		};
		contentAggregate.addLink = function (ideaIdFrom, ideaIdTo) {
			return contentAggregate.execCommand('addLink', arguments);
		};
		commandProcessors.addLink = function (originSession, ideaIdFrom, ideaIdTo) {
			var alreadyExists, link;
			if (!isLinkValid(ideaIdFrom, ideaIdTo)) {
				return false;
			}
			alreadyExists = _.find(
				contentAggregate.links,
				function (link) {
					return (link.ideaIdFrom === ideaIdFrom && link.ideaIdTo === ideaIdTo) || (link.ideaIdFrom === ideaIdTo && link.ideaIdTo === ideaIdFrom);
				}
			);
			if (alreadyExists) {
				return false;
			}
			contentAggregate.links = contentAggregate.links || [];
			link = {
				ideaIdFrom: ideaIdFrom,
				ideaIdTo: ideaIdTo,
				attr: {
					style: {
						color: '#486D98',
						lineStyle: 'dashed'
					}
				}
			};
			contentAggregate.links.push(link);
			logChange('addLink', [ideaIdFrom, ideaIdTo], function () {
				contentAggregate.links.pop();
			}, originSession);
			return true;
		};
		contentAggregate.removeLink = function (ideaIdOne, ideaIdTwo) {
			return contentAggregate.execCommand('removeLink', arguments);
		};
		commandProcessors.removeLink = function (originSession, ideaIdOne, ideaIdTwo) {
			var i = 0, link;

			while (contentAggregate.links && i < contentAggregate.links.length) {
				link = contentAggregate.links[i];
				if (String(link.ideaIdFrom) === String(ideaIdOne) && String(link.ideaIdTo) === String(ideaIdTwo)) {
					contentAggregate.links.splice(i, 1);
					logChange('removeLink', [ideaIdOne, ideaIdTwo], function () {
						contentAggregate.links.push(_.clone(link));
					}, originSession);
					return true;
				}
				i += 1;
			}
			return false;
		};
		contentAggregate.getLinkAttr = function (ideaIdFrom, ideaIdTo, name) {
			var link = _.find(
				contentAggregate.links,
				function (link) {
					return link.ideaIdFrom == ideaIdFrom && link.ideaIdTo == ideaIdTo;
				}
			);
			if (link && link.attr && link.attr[name]) {
				return link.attr[name];
			}
			return false;
		};
		contentAggregate.updateLinkAttr = function (ideaIdFrom, ideaIdTo, attrName, attrValue) {
			return contentAggregate.execCommand('updateLinkAttr', arguments);
		};
		commandProcessors.updateLinkAttr = function (originSession, ideaIdFrom, ideaIdTo, attrName, attrValue) {
			var link = _.find(
				contentAggregate.links,
				function (link) {
					return link.ideaIdFrom == ideaIdFrom && link.ideaIdTo == ideaIdTo;
				}
			), undoAction;
			undoAction = updateAttr(link, attrName, attrValue);
			if (undoAction) {
				logChange('updateLinkAttr', [ideaIdFrom, ideaIdTo, attrName, attrValue], undoAction, originSession);
			}
			return !!undoAction;
		};
	}());
	/* undo/redo */
	contentAggregate.undo = function () {
		return contentAggregate.execCommand('undo', arguments);
	};
	commandProcessors.undo = function (originSession) {
		contentAggregate.endBatch();
		var topEvent;
		topEvent = eventStacks[originSession] && eventStacks[originSession].pop();
		if (topEvent && topEvent.undoFunction) {
			topEvent.undoFunction();
			if (!redoStacks[originSession]) {
				redoStacks[originSession] = [];
			}
			redoStacks[originSession].push(topEvent);
			contentAggregate.dispatchEvent('changed', 'undo', [], originSession);
			return true;
		}
		return false;
	};
	contentAggregate.redo = function () {
		return contentAggregate.execCommand('redo', arguments);
	};
	commandProcessors.redo = function (originSession) {
		contentAggregate.endBatch();
		var topEvent;
		topEvent = redoStacks[originSession] && redoStacks[originSession].pop();
		if (topEvent) {
			isRedoInProgress = true;
			contentAggregate.execCommand(topEvent.eventMethod, topEvent.eventArgs, originSession);
			isRedoInProgress = false;
			return true;
		}
		return false;
	};
	if (contentAggregate.formatVersion != 2) {
		upgrade(contentAggregate);
		contentAggregate.formatVersion = 2;
	}
	init(contentAggregate);
	return contentAggregate;
};
/*jslint nomen: true*/
/*global _, Color, MAPJS*/
MAPJS.defaultStyles = {
	root: {background: '#486D98'},
	nonRoot: {background: '#FFFFFF'}
};
MAPJS.layoutLinks = function (idea, visibleNodes) {
	'use strict';
	var result = {};
	_.each(idea.links, function (link) {
		if (visibleNodes[link.ideaIdFrom] && visibleNodes[link.ideaIdTo]) {
			result[link.ideaIdFrom + '_' + link.ideaIdTo] = {
				ideaIdFrom: link.ideaIdFrom,
				ideaIdTo: link.ideaIdTo,
				attr: {style: {color: '#486D98', lineStyle: 'dashed'}}
			};
			//todo - clone
		}
	});
	return result;
};
MAPJS.calculateFrame = function (nodes, margin) {
	'use strict';
	margin = margin || 0;
	var result = {
		top: _.min(nodes, function (node) {return node.y; }).y - margin,
		left: _.min(nodes, function (node) {return node.x; }).x - margin
	};
	result.width = margin + _.max(_.map(nodes, function (node) { return node.x + node.width; })) - result.left;
	result.height = margin + _.max(_.map(nodes, function (node) { return node.y + node.height; })) - result.top;
	return result;
};
MAPJS.contrastForeground = function (background) {
	'use strict';
	/*jslint newcap:true*/
	var luminosity = Color(background).luminosity();
	if (luminosity < 0.5) {
		return '#EEEEEE';
	}
	if (luminosity < 0.9) {
		return '#4F4F4F';
	}
	return '#000000';
};
MAPJS.Outline = function (topBorder, bottomBorder) {
	'use strict';
	var shiftBorder = function (border, deltaH) {
		return _.map(border, function (segment) {
			return {
				l: segment.l,
				h: segment.h + deltaH
			};
		});
	};
	this.initialHeight = function () {
		return this.bottom[0].h - this.top[0].h;
	};
	this.borders = function () {
		return _.pick(this, 'top', 'bottom');
	};
	this.spacingAbove = function (outline) {
		var i = 0, j = 0, result = 0, li = 0, lj = 0;
		while (i < this.bottom.length && j < outline.top.length) {
			result = Math.max(result, this.bottom[i].h - outline.top[j].h);
			if (li + this.bottom[i].l < lj + outline.top[j].l) {
				li += this.bottom[i].l;
				i += 1;
			} else if (li + this.bottom[i].l === lj + outline.top[j].l) {
				li += this.bottom[i].l;
				i += 1;
				lj += outline.top[j].l;
				j += 1;
			} else {
				lj += outline.top[j].l;
				j += 1;
			}
		}
		return result;
	};
	this.indent = function (horizontalIndent, margin) {
		if (!horizontalIndent) {
			return this;
		}
		var top = this.top.slice(),
			bottom = this.bottom.slice(),
			vertCenter = (bottom[0].h + top[0].h) / 2;
		top.unshift({h: vertCenter - margin / 2, l: horizontalIndent});
		bottom.unshift({h: vertCenter + margin / 2, l: horizontalIndent});
		return new MAPJS.Outline(top, bottom);
	};
	this.stackBelow = function (outline, margin) {
		var spacing = outline.spacingAbove(this),
			top = MAPJS.Outline.extendBorder(outline.top, shiftBorder(this.top, spacing + margin)),
			bottom = MAPJS.Outline.extendBorder(shiftBorder(this.bottom, spacing + margin), outline.bottom);
		return new MAPJS.Outline(
			top,
			bottom
		);
	};
	this.expand = function (initialTopHeight, initialBottomHeight) {
		var topAlignment = initialTopHeight - this.top[0].h,
			bottomAlignment = initialBottomHeight - this.bottom[0].h,
			top = shiftBorder(this.top, topAlignment),
			bottom = shiftBorder(this.bottom, bottomAlignment);
		return new MAPJS.Outline(
			top,
			bottom
		);
	};
	this.insertAtStart = function (dimensions, margin) {
		var suboutlineHeight = this.initialHeight(),
			alignment = 0, //-1 * this.top[0].h - suboutlineHeight * 0.5,
			topBorder = shiftBorder(this.top, alignment),
			bottomBorder = shiftBorder(this.bottom, alignment),
			easeIn = function (border) {
				border[0].l *= 0.5;
				border[1].l += border[0].l;
			};
		topBorder[0].l += margin;
		bottomBorder[0].l += margin;
		topBorder.unshift({h: -0.5 * dimensions.height, l: dimensions.width});
		bottomBorder.unshift({h: 0.5 * dimensions.height, l: dimensions.width});
		if (topBorder[0].h > topBorder[1].h) {
			easeIn(topBorder);
		}
		if (bottomBorder[0].h < bottomBorder[1].h) {
			easeIn(bottomBorder);
		}
		return new MAPJS.Outline(topBorder, bottomBorder);
	};
	this.top = topBorder.slice();
	this.bottom = bottomBorder.slice();
};
MAPJS.Outline.borderLength = function (border) {
	'use strict';
	return _.reduce(border, function (seed, el) {
		return seed + el.l;
	}, 0);
};
MAPJS.Outline.borderSegmentIndexAt = function (border, length) {
	'use strict';
	var l = 0, i = -1;
	while (l <= length) {
		i += 1;
		if (i >= border.length) {
			return -1;
		}
		l += border[i].l;
	}
	return i;
};
MAPJS.Outline.extendBorder = function (originalBorder, extension) {
	'use strict';
	var result = originalBorder.slice(),
		origLength = MAPJS.Outline.borderLength(originalBorder),
		i = MAPJS.Outline.borderSegmentIndexAt(extension, origLength),
		lengthToCut;
	if (i >= 0) {
		lengthToCut = MAPJS.Outline.borderLength(extension.slice(0, i + 1));
		result.push({h: extension[i].h, l: lengthToCut - origLength});
		result = result.concat(extension.slice(i + 1));
	}
	return result;
};
MAPJS.Tree = function (options) {
	'use strict';
	_.extend(this, options);
	this.toLayout = function (level, x, y, parentId) {
		x = x || 0;
		y = y || 0;
		var result = {
			nodes: {},
			connectors: {}
		}, self;
		self = _.pick(this, 'id', 'title', 'attr', 'width', 'height', 'oid', 'isSelected');
		self.level = level || 1;
		if (self.level === 1) {
			self.x = -0.99 * this.width;
			self.y = -0.9 * this.height;
		} else {
			self.x = x + this.deltaX || 0;
			self.y = y + this.deltaY || 0;
		}
		result.nodes[this.id] = self;
		if (parentId !== undefined) {
			result.connectors[self.id] = {
				from: parentId,
				to: self.id
			};
		}
		if (this.subtrees) {
			this.subtrees.forEach(function (t) {
				var subLayout = t.toLayout(self.level + 1, self.x, self.y, self.id);
				_.extend(result.nodes, subLayout.nodes);
				_.extend(result.connectors, subLayout.connectors);
			});
		}
		return result;
	};
};
MAPJS.Outline.fromDimensions = function (dimensions) {
	'use strict';
	return new MAPJS.Outline([{
		h: -0.5 * dimensions.height,
		l: dimensions.width
	}], [{
		h: 0.5 * dimensions.height,
		l: dimensions.width
	}]);
};
MAPJS.calculateTree = function (content, dimensionProvider, margin, rankAndParentPredicate) {
	'use strict';
	var options = {
		id: content.id,
		title: content.title,
		attr: content.attr,
		deltaY: 0,
		deltaX: 0
	},
		setVerticalSpacing = function (treeArray,  dy) {
			var i,
				tree,
				oldSpacing,
				newSpacing,
				oldPositions = _.map(treeArray, function (t) { return _.pick(t, 'deltaX', 'deltaY'); }),
				referenceTree,
				alignment;
			for (i = 0; i < treeArray.length; i += 1) {
				tree = treeArray[i];
				if (tree.attr && tree.attr.position) {
					tree.deltaY = tree.attr.position[1];
					if (referenceTree === undefined || tree.attr.position[2] > treeArray[referenceTree].attr.position[2]) {
						referenceTree = i;
					}
				} else {
					tree.deltaY += dy;
				}
				if (i > 0) {
					oldSpacing = oldPositions[i].deltaY - oldPositions[i - 1].deltaY;
					newSpacing = treeArray[i].deltaY - treeArray[i - 1].deltaY;
					if (newSpacing < oldSpacing) {
						tree.deltaY += oldSpacing - newSpacing;
					}
				}
			}
			alignment =  referenceTree && (treeArray[referenceTree].attr.position[1] - treeArray[referenceTree].deltaY);
			if (alignment) {
				for (i = 0; i < treeArray.length; i += 1) {
					treeArray[i].deltaY += alignment;
				}
			}
		},
		shouldIncludeSubIdeas = function () {
			return !(_.isEmpty(content.ideas) || (content.attr && content.attr.collapsed));
		},
		includedSubIdeaKeys = function () {
			var allRanks = _.map(_.keys(content.ideas), parseFloat),
				includedRanks = rankAndParentPredicate ? _.filter(allRanks, function (rank) { return rankAndParentPredicate(rank, content.id); }) : allRanks;
			return _.sortBy(includedRanks, Math.abs);
		},
		includedSubIdeas = function () {
			var result = [];
			_.each(includedSubIdeaKeys(), function (key) {
				result.push(content.ideas[key]);
			});
			return result;
		},
		nodeDimensions = dimensionProvider(content),
		appendSubtrees = function (subtrees) {
			var suboutline, deltaHeight, subtreePosition, horizontal, treeOutline;
			_.each(subtrees, function (subtree) {
				subtree.deltaX = nodeDimensions.width + margin;
				subtreePosition = subtree.attr && subtree.attr.position && subtree.attr.position[0];
				if (subtreePosition && subtreePosition > subtree.deltaX) {
					horizontal = subtreePosition - subtree.deltaX;
					subtree.deltaX = subtreePosition;
				} else {
					horizontal = 0;
				}
				if (!suboutline) {
					suboutline = subtree.outline.indent(horizontal, margin);
				} else {
					treeOutline = subtree.outline.indent(horizontal, margin);
					deltaHeight = treeOutline.initialHeight();
					suboutline = treeOutline.stackBelow(suboutline, margin);
					subtree.deltaY = suboutline.initialHeight() - deltaHeight / 2 - subtree.height / 2;
				}
			});
			if (subtrees && subtrees.length) {
				setVerticalSpacing(subtrees, 0.5 * (nodeDimensions.height  - suboutline.initialHeight()));
				suboutline = suboutline.expand(
					subtrees[0].deltaY - nodeDimensions.height * 0.5,
					subtrees[subtrees.length - 1].deltaY + subtrees[subtrees.length - 1].height - nodeDimensions.height * 0.5
				);
			}
			options.outline = suboutline.insertAtStart(nodeDimensions, margin);
		},
		positionFixedSubtrees = function (subtrees) {
			_.each(subtrees, function (subtree) {
				subtree.deltaX = subtree.attr.position[0] + nodeDimensions.width * 0.5 - subtree.width * 0.5;
				subtree.deltaY = subtree.attr.position[1] + nodeDimensions.height * 0.5 - subtree.height * 0.5;
			});
		};
	_.extend(options, nodeDimensions);
	options.outline = new MAPJS.Outline.fromDimensions(nodeDimensions);
	if (shouldIncludeSubIdeas()) {
		options.subtrees = _.map(includedSubIdeas(), function (i) {
			return MAPJS.calculateTree(i, dimensionProvider, margin, rankAndParentPredicate);
		});
		if (!_.isEmpty(options.subtrees)) {
			appendSubtrees(options.subtrees);
		}
	}
	return new MAPJS.Tree(options);
};

MAPJS.calculateLayout = function (idea, dimensionProvider, margin) {
	'use strict';
	var positiveTree, negativeTree, layout, negativeLayout,
		setDefaultStyles = function (nodes) {
			_.each(nodes, function (node) {
				node.attr = node.attr || {};
				node.attr.style = _.extend({}, MAPJS.defaultStyles[(node.level === 1) ? 'root' : 'nonRoot'], node.attr.style);
			});
		},
		positive = function (rank, parentId) { return parentId !== idea.id || rank > 0; },
		negative = function (rank, parentId) { return parentId !== idea.id || rank < 0; };
	margin = margin || 20;
	positiveTree = MAPJS.calculateTree(idea, dimensionProvider, margin, positive);
	negativeTree = MAPJS.calculateTree(idea, dimensionProvider, margin, negative);
	layout = positiveTree.toLayout();
	negativeLayout = negativeTree.toLayout();
	_.each(negativeLayout.nodes, function (n) {
		n.x = -1 * n.x - n.width;
	});
	_.extend(negativeLayout.nodes, layout.nodes);
	_.extend(negativeLayout.connectors, layout.connectors);
	setDefaultStyles(negativeLayout.nodes);
	negativeLayout.links = MAPJS.layoutLinks(idea, negativeLayout.nodes);
	return negativeLayout;
};

/*jslint forin: true, nomen: true*/
/*global _, MAPJS, observable*/
MAPJS.MapModel = function (layoutCalculator, titlesToRandomlyChooseFrom, intermediaryTitlesToRandomlyChooseFrom) {
	'use strict';
	titlesToRandomlyChooseFrom = titlesToRandomlyChooseFrom || ['double click to edit'];
	intermediaryTitlesToRandomlyChooseFrom = intermediaryTitlesToRandomlyChooseFrom || titlesToRandomlyChooseFrom;
	var self = this,
		analytic,
		content_change,
		validationFn,
		currentLayout = {
			nodes: {},
			connectors: {}
		},
		idea,
		isInputEnabled = true,
		isCurrentlyEdited = false,
		isEditOldEnabled = true,
		isEditingEnabled = true,
		loading = false,
		uid = null,
		currentlySelectedIdeaId,
		activatedNodes = [],
		revertSelectionForUndo,
		revertActivatedForUndo,
		setActiveNodes = function (activated) {
			var wasActivated = _.clone(activatedNodes);
			activatedNodes = activated;
			self.dispatchEvent('activatedNodesChanged', _.difference(activatedNodes, wasActivated), _.difference(wasActivated, activatedNodes));
		},
		getRandomTitle = function (titles) {
			return titles[Math.floor(titles.length * Math.random())];
		},
		horizontalSelectionThreshold = 300,
		moveNodes = function (nodes, deltaX, deltaY) {
			if (deltaX || deltaY) {
				_.each(nodes, function (node) {
					node.x += deltaX;
					node.y += deltaY;
					self.dispatchEvent('nodeMoved', node);
				});
			}
		},
		isAddLinkMode,
		updateCurrentLayout = function (newLayout) {
			var nodeId, newNode, oldNode, newConnector, oldConnector, linkId, newLink, oldLink;
			var reposDetected = false;
			for (nodeId in currentLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!newConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorRemoved', oldConnector);
				}
			}
			for (nodeId in currentLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!newNode) {
					/*jslint eqeq: true*/
					if (nodeId == currentlySelectedIdeaId) {
						self.selectNode(nodeId);
					}
					self.dispatchEvent('nodeRemoved', oldNode, nodeId);
				}
			}
			for (nodeId in newLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!currentlySelectedIdeaId && newNode.isSelected) {
					self.selectNode(newNode.id, true);
					//currentlySelectedIdeaId = newNode.id;
				}
				if (!oldNode) {
					self.dispatchEvent('nodeCreated', newNode);
					reposDetected = true;
				} else {
					if (newNode.x !== oldNode.x || newNode.y !== oldNode.y) {
						self.dispatchEvent('nodeMoved', newNode);
						reposDetected = true;
					}
					if (newNode.title !== oldNode.title) {
						reposDetected = true;
						self.dispatchEvent('nodeTitleChanged', newNode);
					}
					if (!_.isEqual(newNode.attr || {}, oldNode.attr || {})) {
						self.dispatchEvent('nodeAttrChanged', newNode);
					}
				}
			}
			for (nodeId in newLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!oldConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorCreated', newConnector);
				}
			}
			for (linkId in newLayout.links) {
				newLink = newLayout.links[linkId];
				oldLink = currentLayout.links && currentLayout.links[linkId];
				if (oldLink) {
					if (!_.isEqual(newLink.attr || {}, (oldLink && oldLink.attr) || {})) {
						self.dispatchEvent('linkAttrChanged', newLink);
					}
				} else {
					self.dispatchEvent('linkCreated', newLink);
				}
			}
			for (linkId in currentLayout.links) {
				oldLink = currentLayout.links[linkId];
				newLink = newLayout.links && newLayout.links[linkId];
				if (!newLink) {
					self.dispatchEvent('linkRemoved', oldLink);
				}
			}
			currentLayout = newLayout;
			self.dispatchEvent('layoutChangeComplete');
			if (reposDetected && !loading && !isCurrentlyEdited) {
				content_change('editDone');
				loading = false;
			}
		},
		editNewIdea = function (newIdeaId) {
			self.setCurrentlyEdited(true);
			revertSelectionForUndo = currentlySelectedIdeaId;
			revertActivatedForUndo = activatedNodes.slice(0);
			self.selectNode(newIdeaId);
			self.editNode(false, true, true);
		},
		getCurrentlySelectedIdeaId = function () {
			return currentlySelectedIdeaId || idea.id;
		},
		onIdeaChanged = function (quickMode) {
			//revertSelectionForUndo = false;
			//revertActivatedForUndo = false;
			if (quickMode) {
				updateCurrentLayout(layoutCalculator(idea));
			} else {
				updateCurrentLayout(self.reactivate(layoutCalculator(idea)));
			}
		},
		currentlySelectedIdea = function () {
			return (idea.findSubIdeaById(currentlySelectedIdeaId) || idea);
		},
		ensureNodeIsExpanded = function (source, nodeId) {
			var node = idea.findSubIdeaById(nodeId) || idea;
			if (node.getAttr('collapsed')) {
				idea.updateAttr(nodeId, 'collapsed', false);
			}
		};
	observable(this);
	analytic = self.dispatchEvent.bind(self, 'analytic', 'mapModel');
	content_change = self.dispatchEvent.bind(self, 'content_change', 'mapModel');
	validationFn = self.dispatchEvent.bind(self, 'validationFn', 'mapModel');
	self.getIdea = function () {
		return idea;
	};
	self.isEditingEnabled = function () {
		return isEditingEnabled;
	};
	self.getCurrentLayout = function () {
		return currentLayout;
	};
	self.isLoading = function () {
		return loading;
	};
	self.setLoading = function (l) {
		loading = l;
	};
	self.analytic = analytic;
	self.getCurrentlySelectedIdeaId = getCurrentlySelectedIdeaId;
	this.setIdea = function (anIdea, quickMode) {
		loading = true;
		if (idea) {
			idea.removeEventListener('changed', onIdeaChanged);
			//self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			//currentlySelectedIdeaId = undefined;
		}
		idea = anIdea;
		idea.addEventListener('changed', onIdeaChanged);
		onIdeaChanged(quickMode);
		self.selectNode(idea.id, true);
		//self.selectNode(currentlySelectedIdeaId, true);
		loading = false;
		//self.dispatchEvent('mapViewResetRequested');
	};
	this.setUid = function(uid) {
		this.uid = uid;
	};
	this.setEditOldEnabled = function(b) {
        isEditOldEnabled = b;
    };
    this.getIdea = function() {
        return idea;
    };
	this.setEditingEnabled = function (value) {
		isEditingEnabled = value;
	};
	this.getEditingEnabled = function () {
		return isEditingEnabled;
	};
	this.setInputEnabled = function (value) {
		if (isInputEnabled !== value) {
			isInputEnabled = value;
			self.dispatchEvent('inputEnabledChanged', value);
		}
	};
	this.getCurrentlyEdited = function() {
		return isCurrentlyEdited;
	};
	this.setCurrentlyEdited = function (v) {
		isCurrentlyEdited = v;
	}
	this.getInputEnabled = function () {
		return isInputEnabled;
	};
	this.selectNodeByOid = function (oid) {
		var node = self.findIdeaByOid(oid);
		var id = null;
		if (node) {
			id = node.id;
		}
		if (id) {
			self.selectNode(id, false);
		}
	};
	this.selectNode = function (id, force) {
		if (force || (isInputEnabled && (id !== currentlySelectedIdeaId || !self.isActivated(id)))) {
			if (currentlySelectedIdeaId) {
				self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			}
			currentlySelectedIdeaId = id;
			self.dispatchEvent('nodeSelectionChanged', id, true);
		}
	};
	this.navigate = function (event) {
		var node = self.findIdeaById(currentlySelectedIdeaId);
		self.dispatchEvent('requestTree', node.oid);
	};
	this.previewNode = function (event) {
		var node = self.findIdeaById(currentlySelectedIdeaId);
		self.dispatchEvent('previewNode', node.oid);
	};
	this.clickNode = function (id, event) {
		var button = event && event.button;
		var node = self.findIdeaById(id);
		if (event && (event.metaKey)) {
			self.addLink('mouse', id);
		} else if (event && event.shiftKey) {
			/*don't stop propagation, this is needed for drop targets*/
			self.toggleActivationOnNode('mouse', id);
		} else if (isAddLinkMode && !button) {
			this.addLink('mouse', id);
			this.toggleAddLinkMode();
		} else {
			this.selectNode(id);
			if (isInputEnabled) {
				if (button) {
					self.dispatchEvent('contextMenuRequested', id, event.layerX, event.layerY);
				} else if (event) {
					if (node && node.oid) {
						if (event.ctrlKey) {
							self.dispatchEvent('navigateToNode', node.oid);
						} else if (event.altKey) {
							self.dispatchEvent('requestTree', node.oid);
						}
					}
				}
			} else {
				if (node && node.oid) {
					window.location = '/topic/' + node.oid;
				}
			}
		}
	};
	this.findIdeaById = function (id) {
		/*jslint eqeq:true */
		if (idea.id == id) {
			return idea;
		}
		return idea.findSubIdeaById(id);
	};
	this.findIdeaByOid = function (oid) {
		/*jslint eqeq:true */
		if (idea.oid == oid) {
			return idea;
		}
		return idea.findSubIdeaByOid(oid);
	};
	this.getSelectedStyle = function (prop) {
		return this.getStyleForId(currentlySelectedIdeaId, prop);
	};
	this.getStyleForId = function (id, prop) {
		var node = currentLayout.nodes && currentLayout.nodes[id];
		return node && node.attr && node.attr.style && node.attr.style[prop];
	};
	this.toggleCollapse = function (source) {
		var selectedIdea = currentlySelectedIdea(),
			isCollapsed;
		if (self.isActivated(selectedIdea.id) && _.size(selectedIdea.ideas) > 0) {
			isCollapsed = selectedIdea.getAttr('collapsed');
		} else {
			isCollapsed = self.everyActivatedIs(function (id) {
				var node = self.findIdeaById(id);
				if (node && _.size(node.ideas) > 0) {
					return node.getAttr('collapsed');
				}
				return true;
			});
		}
		this.collapse(source, !isCollapsed);
	};
	this.collapse = function (source, doCollapse) {
		analytic('collapse:' + doCollapse, source);
		var contextNodeId = getCurrentlySelectedIdeaId(),
			contextNode = function () {
				return contextNodeId && currentLayout && currentLayout.nodes && currentLayout.nodes[contextNodeId];
			},
			oldContext,
			newContext;
		oldContext = contextNode();
		if (isInputEnabled) {
			self.applyToActivated(function (id) {
				var node = self.findIdeaById(id);
				if (node && (!doCollapse || (node.ideas && _.size(node.ideas) > 0))) {
					idea.updateAttr(id, 'collapsed', doCollapse);
				}
			});
		}
		newContext = contextNode();
		if (oldContext && newContext) {
			moveNodes(
				currentLayout.nodes,
				oldContext.x - newContext.x,
				oldContext.y - newContext.y
			);
		}
		self.dispatchEvent('layoutChangeComplete');
	};
	this.updateStyle = function (source, prop, value) {
		/*jslint eqeq:true */
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			analytic('updateStyle:' + prop, source);
			self.applyToActivated(function (id) {
				if (self.getStyleForId(id, prop) != value) {
					idea.mergeAttrProperty(id, 'style', prop, value);
				}
			});
		}
	};
	this.updateLinkStyle = function (source, ideaIdFrom, ideaIdTo, prop, value) {
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			analytic('updateLinkStyle:' + prop, source);
			var merged = _.extend({}, idea.getLinkAttr(ideaIdFrom, ideaIdTo, 'style'));
			merged[prop] = value;
			idea.updateLinkAttr(ideaIdFrom, ideaIdTo, 'style', merged);
		}
	};
	this.addSubIdea = function (source, parentId) {
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		var target = parentId || currentlySelectedIdeaId, newId;
		analytic('addSubIdea', source);
		if (isInputEnabled) {
			idea.batch(function () {
				ensureNodeIsExpanded(source, target);
				newId = idea.addSubIdea(target, getRandomTitle(titlesToRandomlyChooseFrom));
			});
			if (newId) {
				editNewIdea(newId);
			} else {
				content_change('addSubIdea', source);
			}
		}

	};
	this.insertIntermediate = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled || currentlySelectedIdeaId === idea.id) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		var activeNodes = [], newId;
		analytic('insertIntermediate', source);
		self.applyToActivated(function (i) { activeNodes.push(i); });
		newId = idea.insertIntermediateMultiple(activeNodes);
		if (newId) {
			editNewIdea(newId);
		} else {
			content_change('insertIntermediate', source);
		}
	};
	this.addSiblingIdea = function (source) {
		var newId, parent;
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		analytic('addSiblingIdea', source);
		if (isInputEnabled) {
			parent = idea.findParent(currentlySelectedIdeaId) || idea;
			idea.batch(function () {
				ensureNodeIsExpanded(source, parent.id);
				newId = idea.addSubIdea(parent.id, getRandomTitle(titlesToRandomlyChooseFrom));
			});
			if (newId) {
				editNewIdea(newId);
			} else {
				content_change('addSiblingIdea', source);
			}
		}
	};
	this.removeSubIdea = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('removeSubIdea', source);
		if (isInputEnabled) {
			var shouldSelectParent,
				previousSelectionId = getCurrentlySelectedIdeaId(),
				parent = idea.findParent(previousSelectionId);
			self.applyToActivated(function (id) {
				var delIdea = self.findIdeaById(id);
				if (!delIdea) {
					return false;
				}
				var user_perms = delIdea.user_perms;
				if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('delete') == -1) {
					return false;
				} else {
					var removed  = idea.removeSubIdea(id);
					/*jslint eqeq: true*/
					if (previousSelectionId == id) {
						shouldSelectParent = removed;
					}
					content_change('removeSubIdea', delIdea);
				}
			});
			if (shouldSelectParent) {
				self.selectNode(parent.id);
			}
		}
	};
	this.updateTitle = function (ideaId, title, isNew) {
		if (isNew) {
			idea.initialiseTitle(ideaId, title);
		} else {
			idea.updateTitle(ideaId, title);
		}
	};
	this.editNode = function (source, shouldSelectAll, editingNew) {
		if (!isEditingEnabled) {
			isCurrentlyEdited = false;
			return false;
		}
		if (source) {
			analytic('editNode', source);
		}
		if (!isInputEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		var title = currentlySelectedIdea().title;
		if (title === 'Press Space or double-click to edit' || intermediaryTitlesToRandomlyChooseFrom.indexOf(title) !== -1 || titlesToRandomlyChooseFrom.indexOf(title) !== -1) {
			shouldSelectAll = true;
		}
		self.dispatchEvent('nodeEditRequested', currentlySelectedIdeaId, shouldSelectAll, !!editingNew);
	};
	this.editIcon = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (source) {
			analytic('editIcon', source);
		}
		if (!isInputEnabled) {
			return false;
		}
		self.dispatchEvent('nodeIconEditRequested', currentlySelectedIdeaId);
	};
	this.scaleUp = function (source) {
		self.scale(source, 1.25);
	};
	this.scaleDown = function (source) {
		self.scale(source, 0.8);
	};
	this.scale = function (source, scaleMultiplier, zoomPoint) {
		self.dispatchEvent('mapScaleChanged', scaleMultiplier, zoomPoint);
		analytic(scaleMultiplier < 1 ? 'scaleDown' : 'scaleUp', source);
	};
	this.move = function (source, deltaX, deltaY) {
		if (isInputEnabled) {
			self.dispatchEvent('mapMoveRequested', deltaX, deltaY);
			analytic('move', source);
		}
	};
	this.resetView = function (source) {
		//self.selectNode(idea.id);
		self.selectNode(currentlySelectedIdeaId || idea.id);
		self.dispatchEvent('mapViewResetRequested');
		analytic('resetView', source);
	};
	this.openAttachment = function (source, nodeId) {
		analytic('openAttachment', source);
		nodeId = nodeId || currentlySelectedIdeaId;
		var node = currentLayout.nodes[nodeId],
			attachment = node && node.attr && node.attr.attachment;
		if (node) {
			self.dispatchEvent('attachmentOpened', nodeId, attachment);
		}
	};
	this.openNode = function (source, nodeId) {
		analytic('openNode', source);
		nodeId = nodeId || currentlySelectedIdeaId;
		var node = self.findIdeaById(nodeId),
			oid = node ? node.oid : null;
		if (node) {
			self.dispatchEvent('navigateToNode', oid);
		}
	};
	this.setAttachment = function (source, nodeId, attachment) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('setAttachment', source);
		var hasAttachment = !!(attachment && attachment.content);
		idea.updateAttr(nodeId, 'attachment', hasAttachment && attachment);
		content_change('setAttachment', source);
	};
	this.addLink = function (source, nodeIdTo) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addLink', source);
		idea.addLink(currentlySelectedIdeaId, nodeIdTo);
		content_change('addLink', source);
	};
	this.selectLink = function (source, link, selectionPoint) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('selectLink', source);
		if (!link) {
			return false;
		}
		self.dispatchEvent('linkSelected', link, selectionPoint, idea.getLinkAttr(link.ideaIdFrom, link.ideaIdTo, 'style'));
	};
	this.removeLink = function (source, nodeIdFrom, nodeIdTo) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('removeLink', source);
		idea.removeLink(nodeIdFrom, nodeIdTo);
		content_change('removeLink', source);
	};

	this.toggleAddLinkMode = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled) {
			return false;
		}
		analytic('toggleAddLinkMode', source);
		isAddLinkMode = !isAddLinkMode;
		self.dispatchEvent('addLinkModeToggled', isAddLinkMode);
	};
	this.cancelCurrentAction = function (source) {
		if (!isInputEnabled) {
			return false;
		}
		if (!isEditingEnabled) {
			return false;
		}
		if (isAddLinkMode) {
			this.toggleAddLinkMode(source);
		}
	};
	self.invalid_text = function (source, oldText) {
		validationFn({type: 'invalid_text', source: source, oldText: oldText});
	};
	self.undo = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		analytic('undo', source);
		var undoSelectionClone = revertSelectionForUndo,
			undoActivationClone = revertActivatedForUndo;
		if (isInputEnabled) {
			var ret = idea.undo();
			if ('removeSubIdea' == ret.eventMethod) {
				content_change('undo', self.findIdeaById(ret.eventArgs));
			}
			if (undoSelectionClone) {
				self.selectNode(undoSelectionClone);
			}
			if (undoActivationClone) {
				setActiveNodes(undoActivationClone);
			}

		}
	};
	self.redo = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		analytic('redo', source);
		if (isInputEnabled) {
			var ret = idea.redo();
			var newIdea = ret.eventArgs;
			if (newIdea) {
				if ('removeSubIdea' == ret.eventMethod) {
					content_change('redo', newIdea);
				}
			}
		}
	};
	self.moveRelative = function (source, relativeMovement) {
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			idea.moveRelative(currentlySelectedIdeaId, relativeMovement);
			analytic('moveRelative', source);
		}
	};
	self.cut = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('delete') == -1) {
			return false;
		}
		analytic('cut', source);
		if (isInputEnabled) {
			var activeNodeIds = [], parents = [], firstLiveParent;
			self.applyToActivated(function (nodeId) {
				activeNodeIds.push(nodeId);
				parents.push(idea.findParent(nodeId).id);
			});
			self.clipBoard = idea.cloneMultiple(activeNodeIds);
			idea.removeMultiple(activeNodeIds);
			firstLiveParent = _.find(parents, idea.findSubIdeaById);
			self.selectNode(firstLiveParent || idea.id);
		}
	};
	self.copy = function (source) {
		var activeNodeIds = [];
		if (!isEditingEnabled) {
			return false;
		}
		analytic('copy', source);
		if (isInputEnabled) {
			self.applyToActivated(function (node) {
				activeNodeIds.push(node);
			});
			self.clipBoard = idea.cloneMultiple(activeNodeIds);
		}
	};
	self.paste = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		var user_perms = currentlySelectedIdea().user_perms;
		if (user_perms && user_perms[self.uid] && user_perms[self.uid].indexOf('edit') == -1) {
			return false;
		}
		if (isInputEnabled) {
			var result = idea.pasteMultiple(currentlySelectedIdeaId, self.clipBoard);
			if (result && result[0]) {
				self.selectNode(result[0]);
			}
			analytic('paste', source);
			content_change('paste', source);
		}
	};
	self.pasteStyle = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		if (isInputEnabled && self.clipBoard && self.clipBoard[0]) {
			var pastingStyle = self.clipBoard[0].attr && self.clipBoard[0].attr.style;
			self.applyToActivated(function (id) {
				idea.updateAttr(id, 'style', pastingStyle);
			});
			analytic('pasteStyle', source);
			content_change('pasteStyle', source);
		}
	};
	self.getIcon = function (nodeId) {
		var node = currentLayout.nodes[nodeId || currentlySelectedIdeaId];
		if (!node) {
			return false;
		}
		return node.attr && node.attr.icon;
	};
	self.setIcon = function (source, url, imgWidth, imgHeight, position, nodeId) {
		if (!isEditingEnabled) {
			return false;
		}
		nodeId = nodeId || currentlySelectedIdeaId;
		var nodeIdea = self.findIdeaById(nodeId);
		if (!nodeIdea) {
			return false;
		}
		if (url) {
			idea.updateAttr(nodeId, 'icon', {
				url: url,
				width: imgWidth,
				height: imgHeight,
				position: position
			});
		} else if (nodeIdea.title || nodeId === idea.id) {
			idea.updateAttr(nodeId, 'icon', false);
		} else {
			idea.removeSubIdea(nodeId);
		}
		analytic('setIcon', source);
		content_change('setIcon', source);
	};
	self.moveUp = function (source) { self.moveRelative(source, -1); };
	self.moveDown = function (source) { self.moveRelative(source, 1); };
	self.getSelectedNodeId = function () {
		return getCurrentlySelectedIdeaId();
	};
	//node activation and selection
	(function () {
			var isRootOrRightHalf = function (id) {
				if (!id) {
					currentlySelectedIdeaId = id = idea.id;
				}
				return currentLayout.nodes[id].x >= currentLayout.nodes[idea.id].x;
			},
			isRootOrLeftHalf = function (id) {
				if (!id) {
					currentlySelectedIdeaId = id = idea.id;
				}
				return currentLayout.nodes[id].x <= currentLayout.nodes[idea.id].x;
			},
			nodesWithIDs = function () {
				return _.map(currentLayout.nodes,
					function (n, nodeId) {
						return _.extend({ id: parseInt(nodeId, 10)}, n);
					});
			},
			applyToNodeLeft = function (source, analyticTag, method) {
				var node,
					rank,
					isRoot = currentlySelectedIdeaId === idea.id,
					targetRank = isRoot ? -Infinity : Infinity;
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (isRootOrLeftHalf(currentlySelectedIdeaId)) {
					node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
					ensureNodeIsExpanded(source, node.id);
					for (rank in node.ideas) {
						rank = parseFloat(rank);
						if ((isRoot && rank < 0 && rank > targetRank) || (!isRoot && rank > 0 && rank < targetRank)) {
							targetRank = rank;
						}
					}
					if (targetRank !== Infinity && targetRank !== -Infinity) {
						method.apply(self, [node.ideas[targetRank].id]);
					}
				} else {
					method.apply(self, [idea.findParent(currentlySelectedIdeaId).id]);
				}
			},
			applyToNodeRight = function (source, analyticTag, method) {
				var node, rank, minimumPositiveRank = Infinity;
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (isRootOrRightHalf(currentlySelectedIdeaId)) {
					node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
					ensureNodeIsExpanded(source, node.id);
					for (rank in node.ideas) {
						rank = parseFloat(rank);
						if (rank > 0 && rank < minimumPositiveRank) {
							minimumPositiveRank = rank;
						}
					}
					if (minimumPositiveRank !== Infinity) {
						method.apply(self, [node.ideas[minimumPositiveRank].id]);
					}
				} else {
					method.apply(self, [idea.findParent(currentlySelectedIdeaId).id]);
				}
			},
			applyToNodeUp = function (source, analyticTag, method) {
				var previousSibling = idea.previousSiblingId(currentlySelectedIdeaId),
					nodesAbove,
					closestNode,
					currentNode = currentLayout.nodes[currentlySelectedIdeaId];
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (previousSibling) {
					method.apply(self, [previousSibling]);
				} else {
					if (!currentNode) { return; }
					nodesAbove = _.reject(nodesWithIDs(), function (node) {
						return node.y >= currentNode.y || Math.abs(node.x - currentNode.x) > horizontalSelectionThreshold;
					});
					if (_.size(nodesAbove) === 0) {
						return;
					}
					closestNode = _.min(nodesAbove, function (node) {
						return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
					});
					method.apply(self, [closestNode.id]);
				}
			},
			applyToNodeDown = function (source, analyticTag, method) {
				var nextSibling = idea.nextSiblingId(currentlySelectedIdeaId),
					nodesBelow,
					closestNode,
					currentNode = currentLayout.nodes[currentlySelectedIdeaId];
				if (!isInputEnabled) {
					return;
				}
				analytic(analyticTag, source);
				if (nextSibling) {
					method.apply(self, [nextSibling]);
				} else {
					if (!currentNode) { return; }
					nodesBelow = _.reject(nodesWithIDs(), function (node) {
						return node.y <= currentNode.y || Math.abs(node.x - currentNode.x) > horizontalSelectionThreshold;
					});
					if (_.size(nodesBelow) === 0) {
						return;
					}
					closestNode = _.min(nodesBelow, function (node) {
						return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
					});
					method.apply(self, [closestNode.id]);
				}
			},
			applyFuncs = { 'Left': applyToNodeLeft, 'Up': applyToNodeUp, 'Down': applyToNodeDown, 'Right': applyToNodeRight };
		self.activateSiblingNodes = function (source) {
			var parent = idea.findParent(currentlySelectedIdeaId),
				siblingIds;
			analytic('activateSiblingNodes', source);
			if (!parent || !parent.ideas) {
				return;
			}
			siblingIds = _.map(parent.ideas, function (child) { return child.id; });
			setActiveNodes(siblingIds);
		};
		self.activateNodeAndChildren = function (source) {
			analytic('activateNodeAndChildren', source);
			var contextId = getCurrentlySelectedIdeaId(),
				subtree = idea.getSubTreeIds(contextId);
			subtree.push(contextId);
			setActiveNodes(subtree);
		};
		_.each(['Left', 'Right', 'Up', 'Down'], function (position) {
			self['activateNode' + position] = function (source) {
				applyFuncs[position](source, 'activateNode' + position, function (nodeId) {
					self.activateNode(source, nodeId);
					currentlySelectedIdeaId = nodeId;
				});
			};
			self['selectNode' + position] = function (source) {
				applyFuncs[position](source, 'selectNode' + position, self.selectNode);
			};
		});
		self.toggleActivationOnNode = function (source, nodeId) {
			analytic('toggleActivated', source);
			if (!self.isActivated(nodeId)) {
				setActiveNodes([nodeId].concat(activatedNodes));
			} else {
				setActiveNodes(_.without(activatedNodes, nodeId));
			}
		};
		self.activateNode = function (source, nodeId) {
			analytic('activateNode', source);
			if (!self.isActivated(nodeId)) {
				activatedNodes.push(nodeId);
				self.dispatchEvent('activatedNodesChanged', [nodeId], []);
			}
		};
		self.activateChildren = function (source) {
			analytic('activateChildren', source);
			var context = currentlySelectedIdea();
			if (!context || _.isEmpty(context.ideas) || context.getAttr('collapsed')) {
				return;
			}
			setActiveNodes(idea.getSubTreeIds(context.id));
		};
		self.activateSelectedNode = function (source) {
			analytic('activateSelectedNode', source);
			setActiveNodes([getCurrentlySelectedIdeaId()]);
		};
		self.isActivated = function (id) {
			/*jslint eqeq:true*/
			return _.find(activatedNodes, function (activeId) { return id == activeId; });
		};
		self.applyToActivated = function (toApply) {
			idea.batch(function () {_.each(activatedNodes, toApply); });
		};
		self.everyActivatedIs = function (predicate) {
			return _.every(activatedNodes, predicate);
		};
		self.activateLevel = function (source, level) {
			analytic('activateLevel', source);
			var toActivate = _.map(
				_.filter(
					currentLayout.nodes,
					function (node) {
						/*jslint eqeq:true*/
						return node.level == level;
					}
				),
				function (node) {return node.id; }
			);
			if (!_.isEmpty(toActivate)) {
				setActiveNodes(toActivate);
			}
		};
		self.reactivate = function (layout) {
			_.each(layout.nodes, function (node) {
				if (_.contains(activatedNodes, node.id)) {
					node.activated = true;
				}
			});
			return layout;
		};
		self.addEventListener('nodeSelectionChanged', function (id, isSelected) {
			if (!isSelected) {
				setActiveNodes([]);
				return;
			}
			setActiveNodes([id]);
		}, 1);
	}());
};
/*global _, MAPJS, jQuery*/
/*jslint forin:true*/
MAPJS.dragdrop = function (mapModel, stage, imageInsertController) {
	'use strict';
	var currentDroppable,
		findNodeOnStage = function (nodeId) {
			return stage.get('#node_' + nodeId)[0];
		},
		showAsDroppable = function (nodeId, isDroppable) {
			var node = findNodeOnStage(nodeId);
			node.setIsDroppable(isDroppable);
		},
		updateCurrentDroppable = function (nodeId) {
			if (currentDroppable !== nodeId) {
				if (currentDroppable) {
					showAsDroppable(currentDroppable, false);
				}
				currentDroppable = nodeId;
				if (currentDroppable) {
					showAsDroppable(currentDroppable, true);
				}
			}
		},
		isPointOverNode = function (x, y, node) { //move to mapModel candidate
			/*jslint eqeq: true*/
			return x >= node.x &&
				y >= node.y &&
				x <= node.x + node.width &&
				y <= node.y + node.height;
		},
		canDropOnNode = function (id, x, y, node) {
			/*jslint eqeq: true*/
			return id != node.id && isPointOverNode(x, y, node);
		},
		tryFlip = function (rootNode, nodeBeingDragged, nodeDragEndX) {

			var flipRightToLeft = rootNode.x < nodeBeingDragged.x && nodeDragEndX < rootNode.x,
				flipLeftToRight = rootNode.x > nodeBeingDragged.x && rootNode.x < nodeDragEndX;
			if (flipRightToLeft || flipLeftToRight) {
				return mapModel.getIdea().flip(nodeBeingDragged.id);
			}
			return false;
		},
		nodeDragMove = function (id, x, y) {
			var nodeId, node;
			if (!mapModel.isEditingEnabled()) {
				return;
			}
			for (nodeId in mapModel.getCurrentLayout().nodes) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					updateCurrentDroppable(nodeId);
					return;
				}
			}
			updateCurrentDroppable(undefined);
		},
		getRootNode = function () {
			return mapModel.getCurrentLayout().nodes[mapModel.getIdea().id];
		},
		nodeDragEnd = function (id, x, y, nodeX, nodeY, shouldCopy, shouldPositionAbsolutely) {
			var nodeBeingDragged = mapModel.getCurrentLayout().nodes[id],
				nodeId,
				node,
				rootNode = getRootNode(),
				verticallyClosestNode = {
					id: null,
					y: Infinity
				},
				clone,
				idea = mapModel.getIdea(),
				parentIdea = idea.findParent(id),
				parentNode = mapModel.getCurrentLayout().nodes[parentIdea.id],
				maxSequence = 1,
				validReposition = function () {
					return nodeBeingDragged.level === 2 ||
						((nodeBeingDragged.x - parentNode.x) * (x - parentNode.x) > 0);
				};
			if (!mapModel.isEditingEnabled()) {
				mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
				return;
			}
			updateCurrentDroppable(undefined);
			mapModel.dispatchEvent('nodeMoved', nodeBeingDragged);
			for (nodeId in mapModel.getCurrentLayout().nodes) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					if (shouldCopy) {
						clone = mapModel.getIdea().clone(id);
						if (!clone || !mapModel.getIdea().paste(nodeId, clone)) {
							mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
							mapModel.analytic('nodeDragCloneFailed');
						}
					} else if (!mapModel.getIdea().changeParent(id, nodeId)) {
						mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
						mapModel.analytic('nodeDragParentFailed');
						idea.updateAttr(id, 'position');
					}
					return;
				}

			}
			idea.startBatch();
			if (nodeBeingDragged.level === 2) {
				tryFlip(rootNode, nodeBeingDragged, x);
			}
			_.each(idea.sameSideSiblingIds(id), function (nodeId) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (y < node.y && node.y < verticallyClosestNode.y) {
					verticallyClosestNode = node;
				}
			});
			idea.positionBefore(id, verticallyClosestNode.id);
			if (shouldPositionAbsolutely && validReposition()) {
				mapModel.analytic('nodeManuallyPositioned');
				mapModel.selectNode(id);
				maxSequence = _.max(_.map(parentIdea.ideas, function (i) { return (i.id !== id && i.attr && i.attr.position && i.attr.position[2]) || 0; }));
				idea.updateAttr(
					id,
					'position',
					[Math.abs(nodeX - parentNode.x), nodeY - parentNode.y, maxSequence + 1]
				);
			}
			idea.endBatch();
		},
		screenToStageCoordinates = function (x, y) {
			return {
				x: (x - stage.getX()) / (stage.getScale().x || 1),
				y: (y - stage.getY()) / (stage.getScale().y || 1)
			};
		},
		getInteractionPoint = function (evt) {
			if (evt.changedTouches && evt.changedTouches[0]) {
				return screenToStageCoordinates(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
			}
			return screenToStageCoordinates(evt.layerX, evt.layerY);
		},
		dropImage =	function (dataUrl, imgWidth, imgHeight, evt) {
			var node,
				nodeId,
				content = mapModel.getIdea(),
				point = getInteractionPoint(evt),
				dropOn = function (ideaId, position) {
					var scaleX = Math.min(imgWidth, 300) / imgWidth,
						scaleY = Math.min(imgHeight, 300) / imgHeight,
						scale = Math.min(scaleX, scaleY);
					mapModel.setIcon('drag and drop', dataUrl, Math.round(imgWidth * scale), Math.round(imgHeight * scale), position, ideaId);
				},
				addNew = function () {
					content.startBatch();
					dropOn(content.addSubIdea(mapModel.getSelectedNodeId()), 'center');
					content.endBatch();
				};
			for (nodeId in mapModel.getCurrentLayout().nodes) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (isPointOverNode(point.x, point.y, node)) {
					return dropOn(nodeId, 'left');
				}
			}
			addNew();
		};
	jQuery(stage.getContainer()).imageDropWidget(imageInsertController);
	imageInsertController.addEventListener('imageInserted', dropImage);
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = findNodeOnStage(n.id), shouldPositionAbsolutely;
		node.on('dragstart', function (evt) {
			shouldPositionAbsolutely = evt.shiftKey;
			node.moveToTop();
			node.setShadowOffset(8);
			node.setOpacity(0.3);
		});
		node.on('dragmove', function (evt) {
			var stagePoint = getInteractionPoint(evt);
			nodeDragMove(
				n.id,
				stagePoint.x,
				stagePoint.y
			);
		});
		node.on('dragend', function (evt) {
			var stagePoint = getInteractionPoint(evt);
			node.setShadowOffset(4);
			node.setOpacity(1);
			nodeDragEnd(
				n.id,
				stagePoint.x,
				stagePoint.y,
				node.getX(),
				node.getY(),
				evt.shiftKey,
				shouldPositionAbsolutely
			);
		});
	});
};
/*global _, Kinetic, MAPJS*/
/*jslint nomen: true*/
(function () {
	'use strict';
	var horizontalConnector, calculateConnector, calculateConnectorInner;
	Kinetic.Connector = function (config) {
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Connector';
		Kinetic.Shape.call(this, config);
		this._setDrawFuncs();
	};
	horizontalConnector = function (parentX, parentY, parentWidth, parentHeight,
			childX, childY, childWidth, childHeight) {
		var childHorizontalOffset = parentX < childX ? 0.1 : 0.9,
			parentHorizontalOffset = 1 - childHorizontalOffset;
		return {
			from: {
				x: parentX + parentHorizontalOffset * parentWidth,
				y: parentY + 0.5 * parentHeight
			},
			to: {
				x: childX + childHorizontalOffset * childWidth,
				y: childY + 0.5 * childHeight
			},
			controlPointOffset: 0
		};
	};
	calculateConnector = function (parent, child) {
		return calculateConnectorInner(parent.getX(), parent.getY(), parent.getWidth(), parent.getHeight(),
			child.getX(), child.getY(), child.getWidth(), child.getHeight());
	};
	calculateConnectorInner = _.memoize(function (parentX, parentY, parentWidth, parentHeight,
			childX, childY, childWidth, childHeight) {
		var tolerance = 10,
			childMid = childY + childHeight * 0.5,
			parentMid = parentY + parentHeight * 0.5,
			childHorizontalOffset;
		if (Math.abs(parentMid - childMid) + tolerance < Math.max(childHeight, parentHeight * 0.75)) {
			return horizontalConnector(parentX, parentY, parentWidth, parentHeight, childX, childY, childWidth, childHeight);
		}
		childHorizontalOffset = parentX < childX ? 0 : 1;
		return {
			from: {
				x: parentX + 0.5 * parentWidth,
				y: parentY + 0.5 * parentHeight
			},
			to: {
				x: childX + childHorizontalOffset * childWidth,
				y: childY + 0.5 * childHeight
			},
			controlPointOffset: 0
		};
	}, function () {
		return Array.prototype.join.call(arguments, ',');
	});
	Kinetic.Connector.prototype = {
		isVisible: function (offset) {
			var stage = this.getStage(),
				conn = calculateConnector(this.shapeFrom, this.shapeTo),
				x = Math.min(conn.from.x, conn.to.x),
				y = Math.min(conn.from.y, conn.to.y),
				rect = new MAPJS.Rectangle(x, y, Math.max(conn.from.x, conn.to.x) - x, Math.max(conn.from.y, conn.to.y) - y);
			return stage && stage.isRectVisible(rect, offset);
		},
		drawFunc: function (canvas) {
			var context = canvas.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				conn,
				offset,
				maxOffset;
			if (!this.isVisible()) {
				return;
			}
			conn = calculateConnector(shapeFrom, shapeTo);
			if (!conn) {
				return;
			}
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			offset = conn.controlPointOffset * (conn.from.y - conn.to.y);
			maxOffset = Math.min(shapeTo.getHeight(), shapeFrom.getHeight()) * 1.5;
			offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
			context.quadraticCurveTo(conn.from.x, conn.to.y - offset, conn.to.x, conn.to.y);
			canvas.stroke(this);
		}
	};
	Kinetic.Util.extend(Kinetic.Connector, Kinetic.Shape);
}());
/*global _, Kinetic*/
/*jslint nomen: true*/
(function () {
	'use strict';
	Kinetic.Link = function (config) {
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Link';
		Kinetic.Shape.call(this, config);
		this._setDrawFuncs();
	};
	var calculateConnectorInner = _.memoize(
		function (parentX, parentY, parentWidth, parentHeight, childX, childY, childWidth, childHeight) {
			var parent = [
				{
					x: parentX + 0.5 * parentWidth,
					y: parentY
				},
				{
					x: parentX + parentWidth,
					y: parentY + 0.5 * parentHeight
				},
				{
					x: parentX + 0.5 * parentWidth,
					y: parentY + parentHeight
				},
				{
					x: parentX,
					y: parentY + 0.5 * parentHeight
				}
			], child = [
				{
					x: childX + 0.5 * childWidth,
					y: childY
				},
				{
					x: childX + childWidth,
					y: childY + 0.5 * childHeight
				},
				{
					x: childX + 0.5 * childWidth,
					y: childY + childHeight
				},
				{
					x: childX,
					y: childY + 0.5 * childHeight
				}
			], i, j, min = Infinity, bestParent, bestChild, dx, dy, current;
			for (i = 0; i < parent.length; i += 1) {
				for (j = 0; j < child.length; j += 1) {
					dx = parent[i].x - child[j].x;
					dy = parent[i].y - child[j].y;
					current = dx * dx + dy * dy;
					if (current < min) {
						bestParent = i;
						bestChild = j;
						min = current;
					}
				}
			}
			return {
				from: parent[bestParent],
				to: child[bestChild]
			};
		},
		function () {
			return Array.prototype.join.call(arguments, ',');
		}
	),
		calculateConnector = function (parent, child) {
			return calculateConnectorInner(parent.getX(), parent.getY(), parent.getWidth(), parent.getHeight(),
				child.getX(), child.getY(), child.getWidth(), child.getHeight());
		};
	Kinetic.Link.prototype = {
		drawHitFunc: function (canvas) {
			var context = canvas.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				conn,
				strokeWidth = this.getStrokeWidth();
			this.setStrokeWidth(strokeWidth * 9);
			conn = calculateConnector(shapeFrom, shapeTo);
			context.fillStyle = this.getStroke();
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			context.lineTo(conn.to.x, conn.to.y);
			canvas.stroke(this);
			this.setStrokeWidth(strokeWidth);
		},
		drawFunc: function (canvas) {
			var context = canvas.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				conn,
				n = Math.tan(Math.PI / 9);
			conn = calculateConnector(shapeFrom, shapeTo);
			this.setStrokeWidth(5);
			context.fillStyle = this.getStroke();
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			context.lineTo(conn.to.x, conn.to.y);
			canvas.stroke(this);
			if (this.attrs.arrow) {
				var a1x, a1y, a2x, a2y, len = 14, iy, m,
					dx = conn.to.x - conn.from.x,
					dy = conn.to.y - conn.from.y;
				if (dx === 0) {
					iy = dy < 0 ? -1 : 1;
					a1x = conn.to.x + len * Math.sin(n) * iy;
					a2x = conn.to.x - len * Math.sin(n) * iy;
					a1y = conn.to.y - len * Math.cos(n) * iy;
					a2y = conn.to.y - len * Math.cos(n) * iy;
				} else {
					m = dy / dx;
					if (conn.from.x < conn.to.x) {
						len = -len;
					}
					a1x = conn.to.x + (1 - m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
					a1y = conn.to.y + (m + n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
					a2x = conn.to.x + (1 + m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
					a2y = conn.to.y + (m - n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				}
				context.moveTo(a1x, a1y);
				context.lineTo(conn.to.x, conn.to.y);
				context.lineTo(a2x, a2y);
				context.lineTo(a1x, a1y);
				context.fill();
			}
		}
	};
	Kinetic.Util.extend(Kinetic.Link, Kinetic.Shape);
}());
Kinetic.Link.prototype.setMMAttr = function (newMMAttr) {
	'use strict';
	var style = newMMAttr && newMMAttr.style,
		dashTypes = {
			solid: [],
			dashed: [8, 8]
		};
	this.setStroke(style && style.color || 'red');
	this.setDashArray(dashTypes[style && style.lineStyle || 'dashed']);
	this.attrs.arrow = style && style.arrow || false;
};
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
/*global _, Kinetic, MAPJS*/
if (Kinetic.Stage.prototype.isRectVisible) {
	throw ('isRectVisible already exists, should not mix in our methods');
}

Kinetic.Tween.prototype.reset = function () {
	'use strict';
	this.tween.reset();
	return this;
};

MAPJS.Rectangle = function (x, y, width, height) {
	'use strict';
	this.scale = function (scale) {
		return new MAPJS.Rectangle(x * scale, y * scale, width * scale, height * scale);
	};
	this.translate = function (dx, dy) {
		return new MAPJS.Rectangle(x + dx, y + dy, width, height);
	};
	this.inset = function (margin) {
		return new MAPJS.Rectangle(x + margin, y + margin, width - (margin * 2), height - (margin * 2));
	};
	this.xscale = function (scale) {
		this.x *= scale;
		this.y *= scale;
		this.width *= scale;
		this.height *= scale;
		return this;
	};
	this.xtranslate = function (dx, dy) {
		this.x += dx;
		this.y += dy;
		return this;
	};
	this.xinset = function (margin) {
		this.x += margin;
		this.y += margin;
		this.width -= margin * 2;
		this.height -= margin * 2;
		return this;
	};
	this.x = x;
	this.y = y;
	this.height = height;
	this.width = width;
};
Kinetic.Stage.prototype.isRectVisible = function (rect, offset) {
	'use strict';
	offset = offset || {x: 0, y: 0, margin: 0};
	var scale = this.getScale().x || 1;
	rect = rect.xscale(scale).xtranslate(offset.x, offset.y).xinset(offset.margin);
	return !(
		rect.x + this.getX() > this.getWidth() ||
		rect.x + rect.width + this.getX() < 0  ||
		rect.y + this.getY() > this.getHeight() ||
		rect.y + rect.height + this.getY() < 0
	);
};

MAPJS.KineticMediator = function (mapModel, stage) {
	'use strict';
	window.stage = stage;
	var layer = new Kinetic.Layer(),
		nodeByIdeaId = {},
		connectorByFromIdeaIdToIdeaId = {},
		connectorKey = function (fromIdeaId, toIdeaId) {
			return fromIdeaId + '_' + toIdeaId;
		},
		atLeastOneVisible = function (list, deltaX, deltaY) {
			var margin = Math.min(stage.getHeight(), stage.getWidth()) * 0.1;
			return _.find(list, function (node) {
				return node.isVisible({x: deltaX, y: deltaY, margin: margin});
			});
		},
		moveStage = function (deltaX, deltaY) {
			var visibleAfterMove, visibleBeforeMove;
			if (!stage) {
				return;
			}

			visibleBeforeMove = atLeastOneVisible(nodeByIdeaId, 0, 0) || atLeastOneVisible(connectorByFromIdeaIdToIdeaId, 0, 0);
			visibleAfterMove = atLeastOneVisible(nodeByIdeaId, deltaX, deltaY) || atLeastOneVisible(connectorByFromIdeaIdToIdeaId, deltaX, deltaY);
			if (visibleAfterMove || (!visibleBeforeMove)) {
				if (deltaY !== 0) { stage.setY(stage.getY() + deltaY); }
				if (deltaX !== 0) { stage.setX(stage.getX() + deltaX); }
				stage.draw();
			}
		},
		resetStage = function () {
			new Kinetic.Tween({
				node: stage,
				x: 0.5 * stage.getWidth(),
				y: 0.5 * stage.getHeight(),
				scaleX: 1,
				scaleY: 1,
				easing: Kinetic.Easings.EaseInOut,
				duration: 0.05,
				onFinish: function () {
					stage.fire(':scaleChangeComplete');
				}
			}).play();
		},
		ensureSelectedNodeVisible = function (node) {
			var scale = stage.getScale().x || 1,
				offset = 100,
				move = { x: 0, y: 0 };
			if (!node.getIsSelected()) {
				return;
			}
			if (node.getAbsolutePosition().x + node.getWidth() * scale + offset > stage.getWidth()) {
				move.x = stage.getWidth() - (node.getAbsolutePosition().x + node.getWidth() * scale + offset);
			} else if (node.getAbsolutePosition().x < offset) {
				move.x  = offset - node.getAbsolutePosition().x;
			}
			if (node.getAbsolutePosition().y + node.getHeight() * scale + offset > stage.getHeight()) {
				move.y = stage.getHeight() - (node.getAbsolutePosition().y + node.getHeight() * scale + offset);
			} else if (node.getAbsolutePosition().y < offset) {
				move.y = offset - node.getAbsolutePosition().y;
			}
			new Kinetic.Tween({
				node: stage,
				x: stage.getX() + move.x,
				y: stage.getY() + move.y,
				duration: 0.4,
				easing: Kinetic.Easings.EaseInOut
			}).play();
		};
	stage.add(layer);
	layer.on('mouseover', function () {
		stage.getContainer().style.cursor = 'pointer';
	});
	layer.on('mouseout', function () {
		stage.getContainer().style.cursor = 'auto';
	});
	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
		stage.getContainer().style.cursor = isOn ? 'crosshair' : 'auto';
		layer.off('mouseover mouseout');
		layer.on('mouseover', function () {
			stage.getContainer().style.cursor = isOn ? 'alias' : 'pointer';
		});
		layer.on('mouseout', function () {
			stage.getContainer().style.cursor = isOn ? 'crosshair' : 'auto';
		});
	});
	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
		var node = nodeByIdeaId[nodeId];
		if (node) {
			node.editNode(shouldSelectAll, editingNew);
		}
	});
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = new Kinetic.Idea({
			level: n.level,
			x: n.x,
			y: n.y,
			text: n.title,
			mmAttr: n.attr,
			opacity: 1,
			id: 'node_' + n.id,
			activated: n.activated
		});
		node.on('click tap', function (evt) { mapModel.clickNode(n.id, evt); });
		node.on('dblclick dbltap', function () {
			if (!mapModel.getEditingEnabled()) {
				mapModel.toggleCollapse('mouse');
				return;
			}
			mapModel.editNode('mouse', false, false);
		});
		node.on(':textChanged', function (event) {
			mapModel.setInputEnabled(true);
			mapModel.setCurrentlyEdited(false);
			mapModel.updateTitle(n.id, event.text, event.isNew);
		});
		node.on(':editing', function () {
			mapModel.setInputEnabled(false);
			mapModel.setCurrentlyEdited(true);
		});
		node.on(':request', function (event) {
			mapModel[event.type](event.source, n.id);
		});
		node.on(':invalid_text', function (event) {
			mapModel['invalid_text'](event.source, event.oldText);
		});
		if (n.level > 1) {
			node.on('mouseover touchstart', stage.setDraggable.bind(stage, false));
			node.on('mouseout touchend', stage.setDraggable.bind(stage, true));
		}
		layer.add(node);
		stage.on(':scaleChangeComplete', function () {
			node.setupShadows();
		});
		nodeByIdeaId[n.id] = node;
	}, 1);
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = nodeByIdeaId[ideaId];
		if (!node) {
			return;
		}
		node.setIsSelected(isSelected);
		if (!isSelected) {
			return;
		}
		ensureSelectedNodeVisible(node);
	});
	mapModel.addEventListener('nodeAttrChanged', function (n) {
		var node = nodeByIdeaId[n.id];
		node.setMMAttr(n.attr);
	});
	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
		var node = nodeByIdeaId[ideaId];
		node.setIsDroppable(isDroppable);
	});
	mapModel.addEventListener('nodeRemoved', function (n) {
		var node = nodeByIdeaId[n.id];
		delete nodeByIdeaId[n.id];
		node.off('click dblclick tap dbltap dragstart dragmove dragend mouseover mouseout touchstart touchend :openAttachmentRequested :editing :textChanged ');
	//	node.destroy();
		new Kinetic.Tween({
			node: node,
			opacity: 0.25,
			easing: Kinetic.Easings.EaseInOut,
			duration: 0.2,
			onFinish: node.destroy.bind(node)
		}).play();
	});
	mapModel.addEventListener('nodeMoved', function (n, reason) {
		var node = nodeByIdeaId[n.id];
		new Kinetic.Tween({
			node: node,
			x: n.x,
			y: n.y,
			easing: reason === 'failed' ? Kinetic.Easings.BounceEaseOut: Kinetic.Easings.EaseInOut,
			duration: 0.4,
			onFinish: ensureSelectedNodeVisible.bind(undefined, node)
		}).play();
	});
	mapModel.addEventListener('nodeTitleChanged', function (n) {
		var node = nodeByIdeaId[n.id];
		node.setText(n.title);
	});
	mapModel.addEventListener('connectorCreated', function (n) {
		var connector = new Kinetic.Connector({
			id: 'connector_' + n.to,
			shapeFrom: nodeByIdeaId[n.from],
			shapeTo: nodeByIdeaId[n.to],
			stroke: '#486D98',
			strokeWidth: 1,
			opacity: 0
		});
		connectorByFromIdeaIdToIdeaId[connectorKey(n.from, n.to)] = connector;
		layer.add(connector);
		connector.moveToBottom();
		new Kinetic.Tween({
			node: connector,
			opacity: 1,
			easing: Kinetic.Easings.EaseInOut,
			duration: 0.1
		}).play();
	});
	mapModel.addEventListener('layoutChangeComplete', function () {
		stage.draw();
	});
	mapModel.addEventListener('connectorRemoved', function (n) {
		var key = connectorKey(n.from, n.to),
			connector = connectorByFromIdeaIdToIdeaId[key];
		delete connectorByFromIdeaIdToIdeaId[key];
		new Kinetic.Tween({
			node: connector,
			opacity: 0,
			easing: Kinetic.Easings.EaseInOut,
			duration: 0.1,
			onFinish: connector.destroy.bind(connector)
		}).play();
	});
	mapModel.addEventListener('linkCreated', function (l) {
		var link = new Kinetic.Link({
			id: 'link_' + l.ideaIdFrom + '_' + l.ideaIdTo,
			shapeFrom: nodeByIdeaId[l.ideaIdFrom],
			shapeTo: nodeByIdeaId[l.ideaIdTo],
			dashArray: [8, 8],
			stroke: '#486D98',
			strokeWidth: 1.5
		});
		link.on('click tap', function (event) {
			mapModel.selectLink('mouse', l, { x: event.layerX, y: event.layerY });
		});
		layer.add(link);
		link.moveToBottom();
		link.setMMAttr(l.attr);
	});
	mapModel.addEventListener('linkRemoved', function (l) {
		var link = layer.get('#link_' + l.ideaIdFrom + '_' + l.ideaIdTo)[0];
		link.destroy();
//		layer.draw();
	});
	mapModel.addEventListener('linkAttrChanged', function (l) {
		var link = layer.get('#link_' + l.ideaIdFrom + '_' + l.ideaIdTo)[0];
		link.setMMAttr(l.attr);
	});
	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier, zoomPoint) {
		var currentScale = stage.getScale().x || 1,
			targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2);
		if (currentScale === targetScale) {
			return;
		}
		zoomPoint = zoomPoint || {x:  0.5 * stage.getWidth(), y: 0.5 * stage.getHeight()};
		new Kinetic.Tween({
			node: stage,
			x: zoomPoint.x + (stage.getX() - zoomPoint.x) * targetScale / currentScale,
			y: zoomPoint.y + (stage.getY() - zoomPoint.y) * targetScale / currentScale,
			scaleX: targetScale,
			scaleY: targetScale,
			easing: Kinetic.Easings.EaseInOut,
			duration: 0.01,
			onFinish: function () {
				stage.fire(':scaleChangeComplete');
			}
		}).play();
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		resetStage();
	});
	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
		moveStage(deltaX, deltaY);
	});
	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {
		var setActivated = function (active, id) {
			var node = nodeByIdeaId[id];
			if (!node) {
				return;
			}
			node.setIsActivated(active);
		};
		_.each(activatedNodes, setActivated.bind(undefined, true));
		_.each(deactivatedNodes, setActivated.bind(undefined, false));
		stage.draw();
	});
	(function () {
		var x, y;
		stage.on('dragmove', function () {
			var deltaX = x - stage.getX(),
				deltaY = y - stage.getY(),
				visibleAfterMove = atLeastOneVisible(nodeByIdeaId, 0, 0) || atLeastOneVisible(connectorByFromIdeaIdToIdeaId, 0, 0),
				shouldMoveBack = !visibleAfterMove && !(atLeastOneVisible(nodeByIdeaId, deltaX, deltaY) || atLeastOneVisible(connectorByFromIdeaIdToIdeaId, deltaX, deltaY));
			if (shouldMoveBack) {
				moveStage(deltaX, deltaY);
			} else {
				x = stage.getX();
				y = stage.getY();
			}
		});
	}());
};
MAPJS.calculateMergedBoxSize = function (box1, box2) {
	'use strict';
	if (box2.position === 'bottom' || box2.position === 'top') {
		return {
			width: Math.max(box1.width, box2.width),
			height: box1.height + box2.height
		};
	}
	if (box2.position === 'left' || box2.position === 'right') {
		return {
			width: box1.width + box2.width,
			height: Math.max(box1.height, box2.height)
		};
	}
	return {
		width: Math.max(box1.width, box2.width),
		height: Math.max(box1.height, box2.height)
	};
};
MAPJS.KineticMediator.dimensionProvider = _.memoize(
	function (content) {
		'use strict';
		var shape = new Kinetic.Idea({
			text: content.title,
			mmAttr: content.attr
		});
		return {
			width: shape.getWidth(),
			height: shape.getHeight()
		};
	},
	function (content) {
		'use strict';
		var iconSize = (content.attr && content.attr.icon && (':' + content.attr.icon.width + 'x' + content.attr.icon.height + 'x' + content.attr.icon.position)) || ':0x0x0';
		return content.title + iconSize;
	}
);

MAPJS.KineticMediator.layoutCalculator = function (idea) {
	'use strict';
	return MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
};
/*global jQuery*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	var clickMethodNames = ['insertIntermediate', 'scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea', 'toggleCollapse', 'addSiblingIdea', 'undo', 'redo',
			'copy', 'cut', 'paste', 'resetView', 'openAttachment', 'openNode', 'toggleAddLinkMode', 'activateChildren', 'activateNodeAndChildren', 'activateSiblingNodes', 'editIcon', 'navigate', 'previewNode'],
		changeMethodNames = ['updateStyle'];
	return this.each(function () {
		var element = jQuery(this), preventRoundtrip = false;
		mapModel.addEventListener('nodeSelectionChanged', function () {
			preventRoundtrip = true;
			element.find('.updateStyle[data-mm-target-property]').val(function () {
				return mapModel.getSelectedStyle(jQuery(this).data('mm-target-property'));
			}).change();
			preventRoundtrip = false;
		});
		mapModel.addEventListener('addLinkModeToggled', function () {
			element.find('.toggleAddLinkMode').toggleClass('active');
		});
		clickMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});
		changeMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).change(function () {
				if (preventRoundtrip) {
					return;
				}
				var tool = jQuery(this);
				if (tool.data('mm-target-property')) {
					mapModel[methodName]('toolbar', tool.data('mm-target-property'), tool.val());
				}
			});
		});
	});
};
/*jslint nomen: true*/
/*global _, jQuery, MAPJS, Kinetic */
MAPJS.pngExport = function (idea) {
	'use strict';
	var deferred = jQuery.Deferred(),
		layout = MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider),
		frame = MAPJS.calculateFrame(layout.nodes, 10),
		hiddencontainer = jQuery('<div></div>').css('visibility', 'hidden')
			.appendTo('body').width(frame.width).height(frame.height).attr('id', 'hiddencontainer'),
		hiddenstage = new Kinetic.Stage({ container: 'hiddencontainer' }),
		layer = new Kinetic.Layer(),
		backgroundLayer = new Kinetic.Layer(),
		nodeByIdeaId = {},
		bg = new Kinetic.Rect({
			fill: '#ffffff',
			x: frame.left,
			y: frame.top,
			width: frame.width,
			height: frame.height
		});
	hiddenstage.add(backgroundLayer);
	backgroundLayer.add(bg);
	hiddenstage.add(layer);
	hiddenstage.setWidth(frame.width);
	hiddenstage.setHeight(frame.height);
	hiddenstage.setX(-1 * frame.left);
	hiddenstage.setY(-1 * frame.top);
	_.each(layout.nodes, function (n) {
		var node = new Kinetic.Idea({
			level: n.level,
			x: n.x,
			y: n.y,
			text: n.title,
			mmAttr: n.attr
		});
		nodeByIdeaId[n.id] = node;
		layer.add(node);
	});
	_.each(layout.connectors, function (n) {
		var connector = new Kinetic.Connector({
			shapeFrom: nodeByIdeaId[n.from],
			shapeTo: nodeByIdeaId[n.to],
			stroke: '#888',
			strokeWidth: 1
		});
		layer.add(connector);
		connector.moveToBottom();
	});
	_.each(layout.links, function (l) {
		var link = new Kinetic.Link({
			shapeFrom: nodeByIdeaId[l.ideaIdFrom],
			shapeTo: nodeByIdeaId[l.ideaIdTo],
			dashArray: [8, 8],
			stroke: '#800',
			strokeWidth: 1.5
		});
		layer.add(link);
		link.moveToBottom();
		link.setMMAttr(l.attr);
	});
	hiddenstage.draw();
	hiddenstage.toDataURL({
		callback: function (url) {
			deferred.resolve(url);
			hiddencontainer.remove();
		}
	});
	return deferred.promise();
};
/*global _, jQuery, Kinetic, MAPJS, window, document, $*/
jQuery.fn.mapWidget = function (activityLog, mapModel, touchEnabled, imageInsertController) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			stage = new Kinetic.Stage({
				container: this.id,
				draggable: true
			}),
			mediator = new MAPJS.KineticMediator(mapModel, stage),
			setStageDimensions = function () {
				stage.setWidth(element.width());
				stage.setHeight(element.height());
				stage.draw();
			},
			lastGesture,
			actOnKeys = true,
			discrete = function (gesture) {
				var result = (lastGesture && lastGesture.type !== gesture.type && (gesture.timeStamp - lastGesture.timeStamp < 250));
				lastGesture = gesture;
				return !result;
			},
			hotkeyEventHandlers = {
				'return': 'addSiblingIdea',
				'del backspace': 'removeSubIdea',
				'tab insert': 'addSubIdea',
				'left': 'selectNodeLeft',
				'up': 'selectNodeUp',
				'right': 'selectNodeRight',
				'shift+right': 'activateNodeRight',
				'shift+left': 'activateNodeLeft',
				'shift+up': 'activateNodeUp',
				'shift+down': 'activateNodeDown',
				'down': 'selectNodeDown',
				'space f2': 'editNode',
				'f': 'toggleCollapse',
				'c meta+x ctrl+x': 'cut',
				'p meta+v ctrl+v': 'paste',
				'y meta+c ctrl+c': 'copy',
				'u meta+z ctrl+z': 'undo',
				'shift+tab': 'insertIntermediate',
				'Esc 0 meta+0 ctrl+0': 'resetView',
				'r meta+shift+z ctrl+shift+z meta+y ctrl+y': 'redo',
				'meta+plus ctrl+plus z': 'scaleUp',
				'meta+minus ctrl+minus shift+z': 'scaleDown',
				'meta+up ctrl+up': 'moveUp',
				'meta+down ctrl+down': 'moveDown',
				'ctrl+shift+v meta+shift+v': 'pasteStyle',
				'Esc': 'cancelCurrentAction',
				'g': 'navigate',
				'v': 'previewNode'
			},
			charEventHandlers = {
				'[' : 'activateChildren',
				'{'	: 'activateNodeAndChildren',
				'='	: 'activateSiblingNodes',
				'.'	: 'activateSelectedNode',
				'/' : 'toggleCollapse',
				'a' : 'openAttachment',
				'i' : 'editIcon'
			},
			onScroll = function (event, delta, deltaX, deltaY) {
				deltaX = deltaX || 0; /*chromebook scroll fix*/
				deltaY = deltaY || 0;
				if (event.target === jQuery(stage.getContainer()).find('canvas')[0]) {
					if (Math.abs(deltaX) < 5) {
						deltaX = deltaX * 5;
					}
					if (Math.abs(deltaY) < 5) {
						deltaY = deltaY * 5;
					}
					mapModel.move('mousewheel', -1 * deltaX, deltaY);
					if (event.preventDefault) { // stop the back button
						event.preventDefault();
					}
				}
			};
		_.each(hotkeyEventHandlers, function (mappedFunction, keysPressed) {
			jQuery(document).keydown(keysPressed, function (event) {
				if (actOnKeys) {
					event.preventDefault();
					mapModel[mappedFunction]('keyboard');
				}
			});
		});
		MAPJS.dragdrop(mapModel, stage, imageInsertController);
		$(document).on('keypress', function (evt) {
			if (!actOnKeys) {
				return;
			}
			if (/INPUT|TEXTAREA/.test(evt && evt.target && evt.target.tagName)) {
				return;
			}
			var unicode = evt.charCode || evt.keyCode,
				actualkey = String.fromCharCode(unicode),
				mappedFunction = charEventHandlers[actualkey];
			if (mappedFunction) {
				evt.preventDefault();
				mapModel[mappedFunction]('keyboard');
			} else if (Number(actualkey) <= 9 && Number(actualkey) >= 1) {
				evt.preventDefault();
				mapModel.activateLevel('keyboard', Number(actualkey) + 1);
			}
		});
		element.data('mm-stage', stage);
		mapModel.addEventListener('inputEnabledChanged', function (canInput) {
			actOnKeys = canInput;
		});
		setStageDimensions();
		stage.setX(0.5 * stage.getWidth());
		stage.setY(0.5 * stage.getHeight());
		jQuery(window).bind('orientationchange resize', setStageDimensions);
		$(document).on('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); return false; });
		element.on('mousedown touch', function (e) {
			window.focus();
			if (document.activeElement !== e.target) {
				document.activeElement.blur();
			}
		});
		if (!touchEnabled) {
			jQuery(window).mousewheel(onScroll);
		} else {
			element.find('canvas').hammer().on('pinch', function (event) {
				if (discrete(event)) {
					mapModel.scale('touch', event.gesture.scale, {
						x: event.gesture.center.pageX - element.offset().left,
						y: event.gesture.center.pageY - element.offset().top
					});
				}
			}).on('swipe', function (event) {
				if (discrete(event)) {
					mapModel.move('touch', event.gesture.deltaX, event.gesture.deltaY);
				}
			}).on('doubletap', function () {
				mapModel.resetView();
			}).on('touch', function () {
				jQuery('.topbar-color-picker:visible').hide();
				jQuery('.ideaInput:visible').blur();
			});
		}
	});
};
/*global jQuery*/
jQuery.fn.linkEditWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), currentLink, width, height, colorElement, lineStyleElement, arrowElement;
		colorElement = element.find('.color');
		lineStyleElement = element.find('.lineStyle');
		arrowElement = element.find('.arrow');
		mapModel.addEventListener('linkSelected', function (link, selectionPoint, linkStyle) {
			currentLink = link;
			element.show();
			width = width || element.width();
			height = height || element.height();
			element.css({
				top: (selectionPoint.y - 0.5 * height - 15) + 'px',
				left: (selectionPoint.x - 0.5 * width - 15) + 'px'
			});
			colorElement.val(linkStyle.color).change();
			lineStyleElement.val(linkStyle.lineStyle);
			arrowElement[linkStyle.arrow ? 'addClass' : 'removeClass']('active');
		});
		mapModel.addEventListener('mapMoveRequested', function () {
			element.hide();
		});
		element.find('.delete').click(function () {
			mapModel.removeLink('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		colorElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'color', jQuery(this).val());
		});
		lineStyleElement.find('a').click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'lineStyle', jQuery(this).text());
		});
		arrowElement.click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'arrow', !arrowElement.hasClass('active'));
		});
		element.mouseleave(element.hide.bind(element));
	});
};
/*global observable, jQuery, FileReader, Image, MAPJS, document, _ */
MAPJS.getDataURIAndDimensions = function (src, corsProxyUrl) {
	'use strict';
	var isDataUri = function (string) {
			return (/^data:image/).test(string);
		},
		convertSrcToDataUri = function (img) {
			if (isDataUri(img.src)) {
				return img.src;
			}
			var canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0);
			return canvas.toDataURL('image/png');
		},
		deferred = jQuery.Deferred(),
		domImg = new Image();

	domImg.onload = function () {
		try {
			deferred.resolve({dataUri: convertSrcToDataUri(domImg), width: domImg.width, height: domImg.height});
		} catch (e) {
			deferred.reject();
		}
	};
	domImg.onerror = function () {
		deferred.reject();
	};
	if (!isDataUri(src)) {
		if (corsProxyUrl) {
			domImg.crossOrigin = 'Anonymous';
			src = corsProxyUrl + encodeURIComponent(src);
		} else {
			deferred.reject('no-cors');
		}
	}
	domImg.src = src;
	return deferred.promise();
};
MAPJS.ImageInsertController = function (corsProxyUrl) {
	'use strict';
	var self = observable(this),
		readFileIntoDataUrl = function (fileInfo) {
			var loader = jQuery.Deferred(),
				fReader = new FileReader();
			fReader.onload = function (e) {
				loader.resolve(e.target.result);
			};
			fReader.onerror = loader.reject;
			fReader.onprogress = loader.notify;
			fReader.readAsDataURL(fileInfo);
			return loader.promise();
		};
	self.insertDataUrl = function (dataUrl, evt) {
		self.dispatchEvent('imageLoadStarted');
		MAPJS.getDataURIAndDimensions(dataUrl, corsProxyUrl).then(
			function (result) {
				self.dispatchEvent('imageInserted', result.dataUri, result.width, result.height, evt);
			},
			function (reason) {
				self.dispatchEvent('imageInsertError', reason);
			}
		);
	};
	self.insertFiles = function (files, evt) {
		jQuery.each(files, function (idx, fileInfo) {
			if (/^image\//.test(fileInfo.type)) {
				jQuery.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) { self.insertDataUrl(dataUrl, evt); });
			}
		});
	};
	self.insertHtmlContent = function (htmlContent, evt) {
		var images = htmlContent.match(/img[^>]*src="([^"]*)"/);
		if (images && images.length > 0) {
			_.each(images.slice(1), function (dataUrl) { self.insertDataUrl(dataUrl, evt); });
		}
	};
};
jQuery.fn.imageDropWidget = function (imageInsertController) {
	'use strict';
	this.on('dragenter dragover', function (e) {
		if (e.originalEvent.dataTransfer) {
			return false;
		}
	}).on('drop', function (e) {
		var dataTransfer = e.originalEvent.dataTransfer,
			htmlContent;
		e.stopPropagation();
		e.preventDefault();
		if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
			imageInsertController.insertFiles(dataTransfer.files, e.originalEvent);
		} else if (dataTransfer) {
			htmlContent = dataTransfer.getData('text/html');
			imageInsertController.insertHtmlContent(htmlContent, e.originalEvent);
		}
	});
	return this;
};
