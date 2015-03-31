'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();

    this.log(yosay(
      'So you want a ' + chalk.red('kitchen sink?')
    ));

    var prompts = [
      {
        type: 'input',
        name: 'projectName',
        message: 'What\'s your project\'s name?',
        default: this.appname
      },
      {
        type: 'confirm',
        name: 'usesCompass',
        message: 'Would you like to use Compass?',
        default: true
      },
      {
        type: 'confirm',
        name: 'usesFoundation',
        message: 'Would you like to use Foundation?',
        default: true
      }
    ];

    this.prompt(prompts, function (props) {
      this.projectName = props.projectName;
      this.usesCompass = props.usesCompass;
      this.usesFoundation = props.usesFoundation;

      done();
    }.bind(this));
  },

  writing: {
    app: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        { projectName: this.projectName }
      );

      this.fs.copyTpl(
        this.templatePath('_bower.json'),
        this.destinationPath('bower.json'),
        { usesjQuery: this.usesjQuery, projectName: this.projectName, usesOutdatedBrowser: this.usesOutdatedBrowser }
      );
    },

    projectfiles: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );

      this.fs.copy(
        this.templatePath('jshintrc'),
        this.destinationPath('.jshintrc')
      );

      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore')
      );

      this.fs.copyTpl(
        this.templatePath('jade/_index.jade'),
        this.destinationPath('src/index.jade'),
        { usesjQuery: this.usesjQuery, usesOutdatedBrowser: this.usesOutdatedBrowser, usesGoogleAnalytics: this.usesGoogleAnalytics }
      );

      this.fs.copyTpl(
        this.templatePath('jade/_header.jade'),
        this.destinationPath('src/partials/_header.jade'),
        { projectName: this.projectName, usesOutdatedBrowser: this.usesOutdatedBrowser }
      );

      this.fs.copy(
        this.templatePath('scss/'),
        this.destinationPath('src/scss/')
      );
    },

    gruntFile: function () {
      var gruntConfig = {

        sass: {
          dist: {
            options: {
              style: 'compressed',
              quiet: false
            },
            files: {
              '<%= dist %>/css/styles.css': '<%= src %>/scss/styles.scss'
            }
          }
        },

        jade: {
          compile: {
            options: {
              pretty: true,
              data: {
                debug: false
              }
            },
            files: [{
              expand: true,
              cwd: '<%= src %>/',
              src: ['index.jade'],
              ext: '.html',
              dest: '<%= dist %>/'
            }]
          }
        },

        copy: {
          dist: {
            files: [{
              expand: true,
              flatten: true,
              cwd:'./',
              src: ['bower_components/jquery/dist/jquery.js', 'bower_components/modernizer/modernizr.js', 'bower_components/outdated-browser/outdatedbrowser/outdatedbrowser.js', 'bower_components/outdated-browser/outdatedbrowser/outdatedbrowser.css'],
              dest: '<%= dist %>/vendor/'
            }]
          },
        },

        watch: {
          grunt: {
            files: ['Gruntfile.js'],
            tasks: ['sass', 'jshint']
          },
          sass: {
            files: '<%= src %>/scss/**/*.scss',
            tasks: ['sass']
          },
          jade: {
            files: '<%= src %>/**/*.jade',
            tasks: ['jade']
          },
          livereload: {
            files: ['<%= src %>/**/*.jade', '!<%= src %>/bower_components/**', '<%= src %>/js/**/*.js', '<%= src %>/scss/**/*.scss', '<%= src %>/images/**/*.{jpg,gif,svg,jpeg,png}'],
            options: {
              livereload: true
            }
          }
        },

        connect: {
          dist: {
            options: {
              port: 9001,
              base: '<%= dist %>/',
              open: true,
              keepalive: false,
              livereload: true,
              hostname: '127.0.0.1'
            }
          }
        },

        defaultTask: ['jade', 'sass', 'copy', 'connect', 'watch']
      };

      gruntConfig.sass.dist.options.compass = this.usesCompass;

      if (this.usesFoundation) {
        gruntConfig.sass.dist.options.loadPath = '<%= src %>/bower_components/foundation/scss';
      }

      this.fs.copy(
        this.templatePath('_Gruntfile.js'),
        this.destinationPath('Gruntfile.js')
      );

      this.gruntfile.insertConfig('sass', JSON.stringify(gruntConfig.sass));
      this.gruntfile.insertConfig('jade', JSON.stringify(gruntConfig.jade));
      this.gruntfile.insertConfig('copy', JSON.stringify(gruntConfig.copy));
      this.gruntfile.insertConfig('watch', JSON.stringify(gruntConfig.watch));
      this.gruntfile.insertConfig('connect', JSON.stringify(gruntConfig.connect));

      this.gruntfile.registerTask('default', gruntConfig.defaultTask);
    },

  },

  install: function () {
    this.installDependencies({
      skipInstall: this.options['skip-install']
    });
  }
});
