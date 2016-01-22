uglifyjs -c -m -o vjs.autoresume.min.js vjs.autoresume.js
uglifyjs -c -m -o vjs.analytics.min.js vjs.analytics.js
uglifyjs -c -m -o vjs.hotkeys.min.js vjs.hotkeys.js
uglifyjs -c -m -o videojs-overlay.min.js videojs-overlay.js
cat ../../vendor/video.js/dist/video-js/video.js ../../vendor/videojs-youtube/dist/vjs.youtube.js ../../vendor/videojs-vimeo/vjs.vimeo.js vjs.autoresume.min.js vjs.analytics.min.js vjs.hotkeys.min.js videojs-overlay.min.js > video.all.js
