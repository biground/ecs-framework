'use strict';
const gulp = require('gulp');
const { series } = require('gulp');
const inject = require('gulp-inject-string');
const minify = require('gulp-minify');
const ts = require('gulp-typescript');
const merge = require('merge2');
const tsProject = ts.createProject('tsconfig.json');
const sourcemaps = require('gulp-sourcemaps');

function copy() {
    return merge([
        gulp.src('bin/framework.min.js').pipe(gulp.dest('../../SnakeSurvivor/bin/libs_pkg/libs/min/')),
        gulp.src('bin/*.js.map').pipe(gulp.dest('../../SnakeSurvivor/bin/libs_pkg/libs/min/')),
        gulp.src('bin/framework.js').pipe(gulp.dest('../../SnakeSurvivor/bin/libs_pkg/libs/min')),
        gulp.src('bin/*.ts').pipe(gulp.dest('../../SnakeSurvivor/libs/')).pipe(gulp.dest('../../SnakeSurvivor/sub-proj/libs/')),
    ]);
}

function buildJs() {
    return tsProject
        .src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .js.pipe(inject.replace('var es;', ''))
        .pipe(inject.replace(/ \|\| \(es = \{\}\)/, ''))
        .pipe(inject.prepend(';window.es = {};'))
        .pipe(minify({ ext: { min: '.min.js' } }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest('./bin'));
}

function buildDts() {
    return (
        tsProject
            .src()
            .pipe(tsProject())
            // .dts.pipe(inject.append('import e = framework;'))
            .pipe(gulp.dest('./bin'))
    );
}

exports.buildJs = buildJs;
exports.buildDts = buildDts;
exports.build = series(buildJs, buildDts, copy);
