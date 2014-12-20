gulp = require 'gulp'
coffee = require 'gulp-coffee'
plumber = require 'gulp-plumber'
coffeePath = './coffee/*.coffee'

gulp.task 'coffee', ->
  gulp.src coffeePath
    .pipe plumber()
    .pipe coffee()
    .pipe gulp.dest './js'

gulp.task 'watch', ->
  gulp.watch coffeePath, ['coffee']

gulp.task 'default', ['coffee','watch'], ->

    
