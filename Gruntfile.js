/*global grunt */
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        force: true
      },
      files: [
        'lib/**/*.js',
        'test/*.js',
        'test/artifacts/*.js'
      ]
    },

    mochacov: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/*.js']
      },
      cov: {
        options: {
          reporter: 'html-cov'
        },
        src: ['test/*.js', '!test/integration.js']
      },
      options: {
        require: ['./test/lib/mocha-sinon']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('test', ['jshint', 'mochacov:test']);
  grunt.registerTask('cov', ['mochacov:cov']);
};
