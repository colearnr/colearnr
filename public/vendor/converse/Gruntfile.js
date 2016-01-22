module.exports = function(grunt) {
    var cfg = require('./package.json');
    grunt.initConfig({
        jst: {
            compile: {
                options: {
                    templateSettings: {
                        evaluate : /\{\[([\s\S]+?)\]\}/g,
                        interpolate : /\{\{([\s\S]+?)\}\}/g
                    },
                    processName: function (filepath) {
                        // E.g. src/templates/trimmed_chat.html
                        return filepath.match(/src\/templates\/([a-z_]+)\.html/)[1];

                    }
                },
                files: {
                    "builds/templates.js": ["src/templates/*.html"]
                },
            }
        },

        jshint: {
            options: {
                trailing: true
            },
            target: {
                src : [
                    'converse.js',
                    'mock.js',
                    'main.js',
                    'tests_main.js',
                    'spec/*.js'
                ]
            }
        },
        cssmin: {
            options: {
                banner: "/*"+
                        "* Converse.js (Web-based XMPP instant messaging client) \n"+
                        "* http://conversejs.org \n"+
                        "* Copyright (c) 2012, Jan-Carel Brand <jc@opkode.com> \n"+
                        "* Dual licensed under the MIT and GPL Licenses \n"+
                        "*/"
            },
            minify: {
                dest: 'css/converse.min.css',
                src: ['css/converse.css']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.registerTask('test', 'Run Tests', function () {
        var done = this.async();
        var child_process = require('child_process');
        var exec = child_process.exec;
        exec('./node_modules/.bin/phantomjs '+
             'node_modules/jasmine-reporters/test/phantomjs-testrunner.js '+
             __dirname+'/tests.html',
             function (err, stdout, stderr) {
                if (err) {
                    grunt.log.write('Tests failed with error code '+err.code);
                    grunt.log.write(stderr);
                }
                grunt.log.write(stdout);
                done();
        });
    });

    grunt.registerTask('fetch', 'Set up the development environment', function () {
        var done = this.async();
        var child_process = require('child_process');
        var exec = child_process.exec;
        exec('./node_modules/.bin/bower update',
             function (err, stdout, stderr) {
                if (err) {
                    grunt.log.write('build failed with error code '+err.code);
                    grunt.log.write(stderr);
                }
                grunt.log.write(stdout);
                done();
        });
    });

    grunt.registerTask('jsmin', 'Create a new release', function () {
        var done = this.async();
        var child_process = require('child_process');
        var exec = child_process.exec;
        var callback = function (err, stdout, stderr) {
            if (err) {
                grunt.log.write('build failed with error code '+err.code);
                grunt.log.write(stderr);
            }
            grunt.log.write(stdout);
            done();
        };
        exec('./node_modules/requirejs/bin/r.js -o src/build.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build.js optimize=none out=builds/converse.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-jquery.js &&' +
             './node_modules/requirejs/bin/r.js -o src/build-no-jquery.js optimize=none out=builds/converse.nojquery.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-locales-no-otr.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-locales-no-otr.js optimize=none out=builds/converse-no-locales-no-otr.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-otr.js &&' +
             './node_modules/requirejs/bin/r.js -o src/build-no-otr.js optimize=none out=builds/converse-no-otr.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-website-no-otr.js &&' +
             './node_modules/requirejs/bin/r.js -o src/build-website.js', callback);
        // XXX: It might be possible to not have separate build config files. For example:
        // 'r.js -o src/build.js paths.converse-dependencies=src/deps-no-otr paths.locales=locale/nolocales out=builds/converse-no-locales-no-otr.min.js'
    });

    grunt.registerTask('jsmin_custom', 'Create a new release', function () {
        var done = this.async();
        var child_process = require('child_process');
        var exec = child_process.exec;
        var callback = function (err, stdout, stderr) {
            if (err) {
                grunt.log.write('build failed with error code '+err.code);
                grunt.log.write(stderr);
            }
            grunt.log.write(stdout);
            done();
        };
        exec(
             './node_modules/requirejs/bin/r.js -o src/build-no-locales-no-otr.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-locales-no-otr.js optimize=none out=builds/converse-no-locales-no-otr.js', callback);
    });

    grunt.registerTask('minify', 'Create a new minified builds', ['cssmin', 'jsmin']);

    grunt.registerTask('minify_custom', 'Create a new minified builds', ['cssmin', 'jsmin_custom']);

    grunt.registerTask('check', 'Perform all checks (e.g. before releasing)', function () {
        grunt.task.run('jshint', 'test');
    });
};
