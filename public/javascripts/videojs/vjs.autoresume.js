(function() {

  videojs.plugin('autoResume', function(options) {
    var MIN_DURATION = 60,
      MAX_PERCENT_FOR_RESUME = 90,
      resumed = false,
      startHandled = false,
      endHandled = false,
      skipResume = false,
      techName = this.contentEl().getElementsByClassName("vjs-tech")[0].id,
      self = this,

      lbit_id = options.lbit_id,
      topic_id = options.topic_id,
      start = options.start ? parseInt(options.start, 10) : null,
      end = options.end ? parseInt(options.end, 10) : null,
      autoplay = (options.autoplay !== undefined) ? options.autoplay : true;

    if (!autoplay) {
      skipResume = true;
    }

    this.autoResume.getLastPosition = function(currentTime, duration, callback) {
      if (duration && duration > MIN_DURATION) {
        $.get('/video/position?lbit_id=' + lbit_id + '&topic_id=' + topic_id).done(function(data) {
          callback((data && data.lastPosition) ? data.lastPosition : null);
        });
      }
      else {
        callback(null);
      }
    };

    this.autoResume.controlPlay = function(self) {
      if (!autoplay || resumed || (startHandled && endHandled) || !self.duration()) {
        return;
      }
      var currentTime = Math.round(self.currentTime());
      if (start && currentTime >= start && end && currentTime < end) {
        return;
      }
      else if (!startHandled && start && currentTime < start) {
        startHandled = true;
        self.currentTime(start);
      }
      else if (!endHandled && end && currentTime > end) {
        endHandled = true;
        self.currentTime(end);
        self.player().pause();
      }
      else {
        return;
      }
    }

    this.autoResume.resume = function(self) {
      if (resumed || skipResume) {
        return;
      }
      else if ((start && end && ((end - start) > MIN_DURATION)) || !start) {
        var currentTime = Math.round(self.currentTime());
        var duration = Math.round(self.duration());
        var lastPositionPercent = 0;
        self.autoResume.getLastPosition(currentTime, duration, function(lastPosition) {
          if (lastPosition && !resumed) {
            lastPosition = Math.round(lastPosition);
            if (duration) {
              lastPositionPercent = Math.round(lastPosition / duration * 100);
              if (!isNaN(lastPosition) && lastPositionPercent < MAX_PERCENT_FOR_RESUME) {
                self.currentTime(lastPosition);
                resumed = true;
              }
              else {
                skipResume = true;
              }
            }
          }
          else if (duration) {
            skipResume = true;
          }
          else {
            skipResume = false;
            resumed = false;
          }
        });
      }
      else {
        skipResume = true;
      }
    };

    this.on("play", function() {
      self.autoResume.resume(self);
    });

    this.on("firstplay", function() {
      self.autoResume.resume(self);
    });

    if (start || end) {
      this.on("timeupdate", function() {
        self.autoResume.controlPlay(self);
      });
    }

    if (techName && (techName.indexOf('vimeo') != -1 || techName.indexOf('ownvideo') != -1 || techName.indexOf('hlslive') != -1)) {
      this.on("timeupdate", function() {
        if (!resumed && !skipResume) {
          self.autoResume.resume(self);
        }
      });
    }

    if ($.receiveMessage) {
      $.receiveMessage(function(msg) {
        if (msg && msg.data && typeof msg.data == "string" && msg.data.indexOf('#t=') > -1) {
          var seekTime = msg.data.split('#t=')[1];
          var seekTimeSec = parseInt(seekTime, 10);
          if (seekTime && !isNaN(seekTimeSec)) {
            self.currentTime(seekTimeSec);
          }
        }
      });
    }

    $(window).bind('hashchange', function() {
      if (window.location.hash && window.location.hash.indexOf('t=') != -1) {
        var tindex = window.location.hash.indexOf('t=');
        var seekTime = window.location.hash.substring(tindex + 2);
        var seekTimeSec = parseInt(seekTime, 10);
        if (seekTime && !isNaN(seekTimeSec)) {
          self.currentTime(seekTimeSec);
        }
      }
    });
  });
})();
