uglifyjs -c -m -o summernote-ext-embed.min.js summernote-ext-embed.js
uglifyjs -c -m -o summernote-ext-notes.min.js summernote-ext-notes.js
uglifyjs -c -m -o summernote-ext-video.min.js summernote-ext-video.js
uglifyjs -c -m -o summernote-emoji.min.js ../../vendor/summernote-emoji/summernote-emoji.js

cat summernote-ext-embed.min.js summernote-ext-notes.min.js summernote-ext-video.min.js summernote-emoji.min.js > summernote-ext.min.js
cat ../../vendor/summernote/dist/summernote.min.js summernote-ext.min.js  > summernote.all.js

