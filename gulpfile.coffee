gulp = require 'gulp'
coffee = require 'gulp-coffee'
stylus = require 'gulp-stylus'
plumber = require 'gulp-plumber'
path =
  coffee: './coffee/*.coffee'
  stylus: './stylus/*.styl'

gulp.task 'coffee', ->
  gulp.src path.coffee
    .pipe plumber()
    .pipe coffee()
    .pipe gulp.dest './js'

gulp.task 'stylus', ->
  gulp.src path.stylus
    .pipe plumber()
    .pipe stylus()
    .pipe gulp.dest './css'

gulp.task 'watch', ->
  gulp.watch path.coffee, ['coffee']
  gulp.watch path.stylus, ['stylus']

gulp.task 'default', ['coffee','stylus','watch'], ->

    
