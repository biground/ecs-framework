'use strict';
const gulp = require('gulp');
const { series } = require('gulp');
const minify = require('gulp-minify');
const ts = require('gulp-typescript');
const merge = require('merge2');
const tsProject = ts.createProject('tsconfig.json');

function copy() {
  return merge([
    gulp.src('bin/framework.min.js')
      .pipe(gulp.dest('../../SnakeSurvivor/bin/libs/min/')),
    gulp.src('bin/framework.js')
      .pipe(gulp.dest('../../SnakeSurvivor/bin/libs/')),
    gulp.src('bin/*.ts')
      .pipe(gulp.dest('../../SnakeSurvivor/libs/'))
  ]);
}

function buildJs() {
  return tsProject.src()
    .pipe(tsProject())
    .pipe(minify({ ext: { min: ".min.js" } }))
    .pipe(gulp.dest('./bin'));
}

function buildDts() {
  return tsProject.src()
    .pipe(tsProject())
    // .dts.pipe(inject.append('import e = framework;'))
    .pipe(gulp.dest('./bin'));
}

exports.buildJs = buildJs;
exports.buildDts = buildDts;
exports.build = series(buildJs, buildDts, copy);