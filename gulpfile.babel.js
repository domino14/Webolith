/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import gulp from 'gulp';
import babel from 'gulp-babel';
import del from 'del';
import eslint from 'gulp-eslint';
import webpack from 'webpack-stream';
import webpackConfig from './webpack.config.babel';

const paths = {
  wordwallsSrcJS: 'djAerolith/wordwalls/static/js/wordwalls/reactapp/**/*.js?(x)',
  libDir: 'djAerolith/static/built',
  gulpFile: 'gulpfile.babel.js',
  webpackFile: 'webpack.config.babel.js',
  distDir: 'dist',
  clientEntryPoint: 'djAerolith/wordwalls/static/js/wordwalls/reactapp/index.js',
  clientBundle: 'dist/client-bundle.js?(.map)',
};

gulp.task('clean', () => del([
  paths.libDir,
  paths.clientBundle,
]));

gulp.task('build', ['lint', 'clean'], () =>
  gulp.src(paths.wordwallsSrcJS)
    .pipe(babel())
    .pipe(gulp.dest(paths.libDir))
);
// add 'lint' to the list below.
gulp.task('main', ['clean'], () =>
  gulp.src(paths.clientEntryPoint)
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(paths.distDir))
);

gulp.task('lint', () =>
  gulp.src([
    paths.wordwallsSrcJS,
    paths.gulpFile,
    paths.webpackFile,
  ])
  .pipe(eslint())
  .pipe(eslint.format())
 // .pipe(eslint.failAfterError())
);

gulp.task('watch', () => {
  gulp.watch(paths.wordwallsSrcJS, ['main']);
});

gulp.task('default', ['watch', 'main']);
