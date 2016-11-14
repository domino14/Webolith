/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import gulp from 'gulp';
import babel from 'gulp-babel';
import del from 'del';
import eslint from 'gulp-eslint';
import webpack from 'webpack-stream';
import gzip from 'gulp-gzip';
import rjs from 'gulp-requirejs';
import uglify from 'gulp-uglify';

import webpackConfig from './webpack.config.babel';
import webpackProdConfig from './webpack.config-prod.babel';

const paths = {
  wordwallsSrcJS: 'djAerolith/wordwalls/static/js/wordwalls/reactapp/**/*.js?(x)',
  libDir: 'djAerolith/static/built',
  gulpFile: 'gulpfile.babel.js',
  webpackFile: 'webpack.config.babel.js',
  webpackProdFile: 'webpack.config-prod.babel.js',
  distDir: 'djAerolith/static/dist',
  clientEntryPoint: 'djAerolith/wordwalls/static/js/wordwalls/reactapp/index.js',
  clientBundle: 'djAerolith/static/dist/table-client-bundle.js?(.map)',
};

gulp.task('clean', () => del([
  paths.libDir,
  paths.clientBundle,
  paths.distDir,
]));

gulp.task('build', ['lint', 'clean'], () =>
  gulp.src(paths.wordwallsSrcJS)
    .pipe(babel())
    .pipe(gulp.dest(paths.libDir)));

gulp.task('main', ['lint', 'clean'], () =>
  gulp.src(paths.clientEntryPoint)
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(paths.distDir)));

gulp.task('lint', () =>
  gulp.src([
    paths.wordwallsSrcJS,
    paths.gulpFile,
    paths.webpackFile,
    paths.webpackProdFile,
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError()));

gulp.task('watch', () => {
  gulp.watch(paths.wordwallsSrcJS, ['main']);
});

// Build the main "wordwalls" table production app.
gulp.task('build-production', ['lint'], () =>
  gulp.src(paths.clientEntryPoint)
    .pipe(babel())
    .pipe(webpack(webpackProdConfig))
    .pipe(gzip())
    .pipe(gulp.dest(paths.distDir)));

gulp.task('default', ['watch', 'main']);

// Other gulp tasks for legacy apps that haven't been migrated to ES6/
// react/etc.

gulp.task('createTableBuild', () =>
  rjs({
    baseUrl: 'djAerolith/wordwalls/static/js/wordwalls',
    mainConfigFile: 'djAerolith/wordwalls/static/js/wordwalls/create_table_main.js',
    name: 'create_table_main',
    out: 'create-table-main-built.js',
  })
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest(paths.distDir)));

gulp.task('flashcardsBuild', () =>
  rjs({
    baseUrl: 'djAerolith/flashcards/static/js/flashcards',
    mainConfigFile: 'djAerolith/flashcards/static/js/flashcards/main.js',
    name: 'main',
    out: 'flashcards-built.js',
  })
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest(paths.distDir)));

gulp.task('full-prod-build', ['build-production', 'createTableBuild', 'flashcardsBuild']);