uglifyjs -c -m -o summernote-ext-embed.min.js summernote-ext-embed.js
uglifyjs -c -m -o summernote-ext-notes.min.js summernote-ext-notes.js
uglifyjs -c -m -o summernote-ext-video.min.js summernote-ext-video.js
cat summernote-ext-embed.js summernote-ext-notes.js summernote-ext-video.js > summernote-ext.js
cat ../../vendor/summernote/dist/summernote.js summernote-ext.js  > summernote.all.js
