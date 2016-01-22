(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  videojs.plugin('videoAnalytics', function(options) {
    var dataSetupOptions, defaultsEventsToTrack, end, error, eventCategory, eventLabel, eventsToTrack, fullscreen, loaded, parsedOptions, pause, percentsAlreadyTracked, percentsPlayedInterval, play, resize, seekEnd, seekStart, seeking, sendbeacon, timeupdate, volumeChange;
    if (options == null) {
      options = {};
    }
    dataSetupOptions = {};
    if (this.options()["data-setup"]) {
      parsedOptions = JSON.parse(this.options()["data-setup"]);
      if (parsedOptions.videoAnalytics) {
        dataSetupOptions = parsedOptions.videoAnalytics;
      }
    }
    defaultsEventsToTrack = ['loaded', 'percentsPlayed', 'start', 'srcType', 'ended', 'seek', 'play', 'pause', 'resize', 'volumeChange', 'error', 'fullscreen', 'close', 'firstplay'];
    eventsToTrack = options.eventsToTrack || dataSetupOptions.eventsToTrack || defaultsEventsToTrack;
    percentsPlayedInterval = options.percentsPlayedInterval || dataSetupOptions.percentsPlayedInterval || 5;
    eventCategory = options.eventCategory || dataSetupOptions.eventCategory || 'Video';
    eventLabel = options.eventLabel || dataSetupOptions.eventLabel;
    lbit_id = options.lbit_id || dataSetupOptions.lbit_id;
    topic_id = options.topic_id || dataSetupOptions.topic_id;
    techName = 'video';
    lastValue = null;
    percentsAlreadyTracked = [];
    seekStart = seekEnd = 0;
    seeking = false;
    loaded = function() {
      var sourceType, techName, tmpSrcArray;
      if (!eventLabel) {
        eventLabel = this.currentSrc().split("/").slice(-1)[0].replace(/\.(\w{3,4})(\?.*)?$/i, '');
      }
      if (__indexOf.call(eventsToTrack, "loadedmetadata") >= 0) {
        sendbeacon('loadedmetadata', true);
      }
      if (__indexOf.call(eventsToTrack, "srcType") >= 0) {
        tmpSrcArray = this.currentSrc().split(".");
        sourceType = tmpSrcArray[tmpSrcArray.length - 1];
        techName = this.contentEl().getElementsByClassName("vjs-tech")[0].id;
        sendbeacon('source type - ' + ("" + techName + "/" + sourceType), true);
      }
    };
    timeupdate = function() {
      var currentTime, duration, percent, percentPlayed, _i;
      currentTime = Math.round(this.currentTime());
      duration = Math.round(this.duration());
      percentPlayed = Math.round(currentTime / duration * 100);
      percentsPlayedInterval = (20 / duration) * 100;

      for (percent = _i = 0; _i <= 99; percent = _i += percentsPlayedInterval ) {
        if (percentPlayed >= percent && __indexOf.call(percentsAlreadyTracked, percent) < 0) {
          if (__indexOf.call(eventsToTrack, "start") >= 0 && percent === 0 && percentPlayed > 0) {
            tmpSrcArray = this.currentSrc().split(".");
            sourceType = tmpSrcArray[tmpSrcArray.length - 1];
            techName = this.contentEl().getElementsByClassName("vjs-tech")[0].id;
            sendbeacon('start', true, currentTime);
          } else if (__indexOf.call(eventsToTrack, "percentsPlayed") >= 0 && percentPlayed !== 0) {
            //sendbeacon('percent played', true, percent);
            sendbeacon('play', true, currentTime);
          }
          if (percentPlayed > 0) {
            percentsAlreadyTracked.push(percent);
          }
        }
      }
      if (__indexOf.call(eventsToTrack, "seek") >= 0) {
        seekStart = seekEnd;
        seekEnd = currentTime;
        if (Math.abs(seekStart - seekEnd) > 1) {
          seeking = true;
          //sendbeacon('seek start', false, seekStart);
          sendbeacon('cue', false, seekEnd);
          //sendbeacon('play', true, currentTime);
        }
      }
    };
    end = function() {
      var currentTime = Math.round(this.currentTime());
      sendbeacon('end', true, currentTime);
      if ($('.embed-title').length) {
        $('.embed-title').fadeIn(200);
      }
      if ($('.embed-description').length) {
        $('.embed-description').fadeIn(200);
      }
    };
    play = function() {
      var currentTime;
      currentTime = Math.round(this.currentTime());
      if (currentTime > 0 && !seeking) {
        sendbeacon('play', true, currentTime);
      }
      if ($('.embed-title').length) {
        $('.embed-title').fadeOut();
      }
      if ($('.embed-description').length) {
        $('.embed-description').fadeOut();
      }
      seeking = true;
    };
    pause = function() {
      var currentTime, duration;
      currentTime = Math.round(this.currentTime());
      duration = Math.round(this.duration());
      sendbeacon('pause', false, currentTime);
      if ($('.embed-title').length) {
        $('.embed-title').fadeIn(200);
      }
      if ($('.embed-description').length) {
        $('.embed-description').fadeIn(200);
      }
    };
    close = function() {
      var currentTime, duration;
      currentTime = Math.round(this.currentTime());
      duration = Math.round(this.duration());
      if (currentTime !== duration && !seeking) {
        sendbeacon('close', false, currentTime);
      }
    };
    volumeChange = function() {
      var volume;
      volume = this.muted() === true ? 0 : this.volume();
      sendbeacon('volume change', false, volume);
    };
    resize = function() {
      sendbeacon('resize - ' + this.width() + "*" + this.height(), true);
    };
    error = function() {
      var currentTime;
      currentTime = Math.round(this.currentTime());
      sendbeacon('error', true, currentTime);
    };
    fullscreen = function() {
      var currentTime;
      currentTime = Math.round(this.currentTime());
      if (this.isFullscreen()) {
        sendbeacon('enter fullscreen', false, currentTime);
      } else {
        sendbeacon('exit fullscreen', false, currentTime);
      }
    };
    sendbeacon = function(action, nonInteraction, value) {
      switch (action) {
        case 'play':
        case 'pause':
        case 'cue':
          if ($.postMessage) {
              var commsFrame = document.getElementById('lbit-discuss-frame');
              if (commsFrame && commsFrame.contentWindow) {
                $.postMessage(JSON.stringify({techName: this.techName, lbit_id: lbit_id,
                  topic_id: topic_id, currentTime: value}), '*', commsFrame.contentWindow);
              }
          }
          break;
      }
      try {
        if (lastValue && lastValue == value) {
          return;
        }
        var url = '/vid_track';
        if (this.techName && this.techName.indexOf('youtube') != -1) {
          url = '/yt_track';
        } else if (this.techName && this.techName.indexOf('vimeo') != -1) {
          url = '/vim_track';
        }
        $.get(url + '?lbit_id=' + lbit_id + '&topic_id=' + topic_id + '&e=' + action + '&t='+value);
        if (value) {
          lastValue = value;
        }
      } catch (_error) {}
    };
    this.on("loadedmetadata", loaded);
    this.on("timeupdate", timeupdate);
    if (__indexOf.call(eventsToTrack, "ended") >= 0) {
      this.on("ended", end);
    }
    if (__indexOf.call(eventsToTrack, "play") >= 0) {
      this.on("play", play);
    }
    if (__indexOf.call(eventsToTrack, "firstplay") >= 0) {
      this.on("firstplay", play);
    }
    if (__indexOf.call(eventsToTrack, "pause") >= 0) {
      this.on("pause", pause);
    }
    if (__indexOf.call(eventsToTrack, "volumeChange") >= 0) {
      this.on("volumechange", volumeChange);
    }
    if (__indexOf.call(eventsToTrack, "resize") >= 0) {
      this.on("resize", resize);
    }
    if (__indexOf.call(eventsToTrack, "error") >= 0) {
      this.on("error", error);
    }
    if (__indexOf.call(eventsToTrack, "fullscreen") >= 0) {
      this.on("fullscreenchange", fullscreen);
    }
    if (__indexOf.call(eventsToTrack, "close") >= 0) {
      this.on("close", close);
    }
  });

}).call(this);
