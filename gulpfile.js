'use strict';

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    include = require('gulp-include'),
    ejs = require('gulp-ejs'),
    gutil = require('gulp-util'),
    rev = require('gulp-rev'),
    rimraf = require('gulp-rimraf'),
    revall = require('gulp-rev-all'),
    livereload = require('gulp-livereload'),
    serveStatic = require('serve-static'),
    flatten = require('gulp-flatten');

// Define paths
var paths = {
  scripts:   ['public/javascripts/*.js', '!public/javascripts/*.min.js', '!public/javascripts/*-min.js', '!public/javascripts/*combined.js'],
  styles:    ['public/stylesheets/*.scss', 'public/stylesheets/*.sass'],
  templates: ['views/**/*.ejs']
};

// CSS
gulp.task('css', function() {
  return sass('public/stylesheets/**/*.scss', {
    precision: 6,
    loadPath: [
      process.cwd() + '/public/stylesheets/includes',
      process.cwd() + '/public/vendor'
    ]})
    .on('error', sass.logError)
    .pipe(gulp.dest('public/dist/stylesheets'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest('public/dist/stylesheets'));
});

// Javascript
gulp.task('js', function() {
  return gulp.src(paths.scripts)
    .pipe(include())
    //.pipe(jshint('.jshintrc'))
    //.pipe(jshint.reporter('default'))
    .pipe(gulp.dest('public/dist/javascripts'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('public/dist/javascripts'));
});

// Templates
gulp.task('templates', function() {
  return gulp.src(paths.templates)
    .pipe(ejs().on('error', gutil.log))
    .pipe(gulp.dest('dist'));
});

// Clean up
gulp.task('clean', function() {
  return gulp.src(['public/dist/stylesheets', 'public/dist/javascripts', 'public/dist/fonts', 'dist/*.html'], {read: false})
      .pipe(rimraf());
});

// Rev all files
gulp.task('rev', function () {
  gulp.src('dist/**')
    .pipe(revall({ ignore: [/^\/favicon.ico$/g, '.html'] }))
    .pipe(gulp.dest('rev'));
});

// Copy fonts
gulp.task('fonts', function() {
  gulp.src('public/fonts/**/*.{eot,svg,ttf,woff}')
    .pipe(flatten())
    .pipe(gulp.dest('public/dist/fonts'));
});

// Default task
gulp.task('default', ['clean'], function() {
  gulp.start('css', 'js', 'templates', 'fonts');
});

// Setup connect server
gulp.task('connect', function() {
  var connect = require('connect');
  var app = connect()
      .use(require('connect-livereload')({ port: 35729 }))
      .use(serveStatic('dist'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function() {
      console.log('Started connect web server on http://localhost:9000');
    });
});

// Serve
gulp.task('serve', ['connect'], function() {
  require('opn')('http://localhost:9000');
});

// Watch
gulp.task('watch', ['connect', 'serve'], function() {

  // Watch SASS files
  gulp.watch('public/stylesheets/**/*.scss', ['css']);

  // Watch JS files
  gulp.watch('public/javascripts/**/*.js', ['js']);

  // Watch template files
  gulp.watch('views/**/*.ejs', ['templates']);

  // Watch for fonts
  gulp.watch('public/fonts/**/*.{eot,svg,ttf.woff}', ['fonts']);

  // Create LiveReload server
  var server = livereload();

  // Watch any files in assets folder reload on change
  gulp.watch(['public/dist/**', 'dist/*.html']).on('change', function(file) {
    server.changed(file.path);
  });

});
