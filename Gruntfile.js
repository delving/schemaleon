'use strict';

/*global language, console, $, _ */

var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var path = require('path');
var fs = require('fs');

if (!fs.existsSync('../oscr-data')) {
    throw 'Data directory not found: ../oscr-data. Clone https://github.com/delving/oscr-data there';
}

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist'
    };

    try {
        yeomanConfig.app = require('./component.json').appPath || yeomanConfig.app;
    } catch (e) {
    }

    grunt.initConfig({
        yeoman: yeomanConfig,
        watch: {
            less: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.less'],
                tasks: ['less']
            },
            livereload: {
                files: [
                    '<%= yeoman.app %>/{,**/}*.html',
                    '{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
                    '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/img/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ],
                tasks: ['livereload']
            }
        },
        connect: {
            options: {
                port: 8888,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost'
            }
        },
        express: {
            livereload: {
                options: {
                    port: 9000,
                    bases: path.resolve('app'),
                    monitor: {},
                    debug: true,
                    server: path.resolve('server/rest')
                }
            },
            prod: {
                options: {
                    port: 9000,
                    bases: path.resolve('dist'),
                    monitor: {},
                    debug: true,
                    server: path.resolve('server/rest')
                }
            }
        },
        open: {
            server: {
                url: 'http://localhost:<%= express.livereload.options.port %>'
            }
        },
        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            '.tmp',
                            '<%= yeoman.dist %>/*',
                            '!<%= yeoman.dist %>/.git*'
                        ]
                    }
                ]
            },
            server: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/{,*/}*.js'
            ]
        },
        karma: {
            client: {
                configFile: 'karma.conf.js',
                singleRun: true
            },
            e2e: {
                configFile: 'karma-e2e.conf.js',
                singleRun: true
            }
        },
        less: {
            server: {
                options: {
                    paths: ["<%= yeoman.app %>/styles"],
                    ieCompat: true
                },
                files: {
                    '<%= yeoman.app %>/styles/main.css': '<%= yeoman.app %>/styles/less/main.less',
                    '<%= yeoman.app %>/styles/theme-admin.css': '<%= yeoman.app %>/styles/less/theme-admin.less'
                }
            },
            dist: {
                options: {
                    paths: ["<%= yeoman.app %>/styles"],
                    yuicompress: true,
                    ieCompat: true
                },
                files: {
                    "<%= yeoman.dist %>/styles/main.css": "<%= yeoman.app %>/styles/less/main.less"
                }
            }
        },
        concat: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/scripts/scripts.js': [
                        '.tmp/scripts/{,*/}*.js',
                        '<%= yeoman.app %>/scripts/{,*/}*.js'
                    ]
                }
            }
        },
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>'
            }
        },
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                dirs: ['<%= yeoman.dist %>']
            }
        },
        imagemin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.app %>/img',
                        src: '{,*/}*.{png,jpg,jpeg}',
                        dest: '<%= yeoman.dist %>/img'
                    }
                ]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                     // https://github.com/yeoman/grunt-usemin/issues/44
                     //collapseWhitespace: true,
                     collapseBooleanAttributes: true,
                     removeAttributeQuotes: true,
                     removeRedundantAttributes: true,
                     useShortDoctype: true,
                     removeEmptyAttributes: true,
                     removeOptionalTags: true*/
                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.app %>',
                        src: ['*.html', 'views/*.html', 'template/*.html'],
                        dest: '<%= yeoman.dist %>'
                    }
                ]
            }
        },
        cdnify: {
            dist: {
                html: ['<%= yeoman.dist %>/*.html']
            }
        },
        ngmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.dist %>/scripts',
                        src: '*.js',
                        dest: '<%= yeoman.dist %>/scripts'
                    }
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/scripts/scripts.js': [
                        '<%= yeoman.dist %>/scripts/scripts.js'
                    ]
                }
            }
        },
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                        '<%= yeoman.dist %>/styles/fonts/*'
                    ]
                }
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            '*.{ico,txt}',
                            '.htaccess',
                            'components/**/*',
                            'views/**/*',
                            'template/**/*',
//                            'img/{,*/}*.{gif,webp}',
                            'img/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                            'styles/fonts/*'
                        ]
                    }
                ]
            }
        },
        nodeunit: {
            all: [
                'test/server/*.js'
            ],
            authenticate: [
                'test/server/test-authenticate.js'
            ],
            image: [
                'test/server/test-storage-image.js'
            ]
        }
    });

    grunt.renameTask('regarde', 'watch');

    grunt.registerTask('run', [
        'clean:server',
        'less:server',
        'livereload-start',
        'express:livereload', // port 9000
        'open',
        'watch'
    ]);

    grunt.registerTask('prod', [
        'clean:server',
        'express:prod',
        'open',
        'watch'
    ]);

    grunt.registerTask('test-client', [
        'clean:server',
        'karma:client'
    ]);

    grunt.registerTask('test-server', [
        'nodeunit:all'
    ]);

    grunt.registerTask('test-image', [
        'nodeunit:image'
    ]);

    grunt.registerTask('test-e2e', [
        'clean:server',
        'livereload-start',
        'express:livereload',
        'karma:e2e'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
//        'jshint',
//        'test',
//        'compass:dist',
        'less:dist',
        'useminPrepare',
        'imagemin',
        'cssmin',
        'htmlmin',
        'concat',
        'copy',
        'cdnify',
//        'ngmin',
//        'uglify',
        'rev',
        'usemin'
    ]);

    grunt.registerTask('default', ['build']);
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
};
