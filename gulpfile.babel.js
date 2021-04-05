/*eslint strict: ["error", "global"]*/
'use strict';

// Include gulp helpers.
const { series, src, dest, parallel, watch } = require('gulp');




// Include Pattern Lab and config.
const config = require('./patternlab-config.json');
const patternlab = require('@pattern-lab/core')(config);

// Include Our tasks.
//
// Each task is broken apart to it's own node module.
// Check out the ./gulp-tasks directory for more.
const { compileSass, compileJS } = require('./gulp-tasks/compile.js');
const { lintJS, lintSass } = require('./gulp-tasks/lint.js');
const { compressAssets } = require('./gulp-tasks/compress.js');
const { cleanCSS, cleanJS } = require('./gulp-tasks/clean.js');
const { concatCSS } = require('./gulp-tasks/concat.js');
const { moveFonts, movePatternCSS } = require('./gulp-tasks/move.js');
const server = require('browser-sync').create();
//const webpack = require('webpack-stream');
const jsonCss = require('gulp-json-css');


// Compile Our Sass and JS
exports.compile = parallel(compileSass, compileJS, moveFonts, movePatternCSS);

// Lint Sass and JavaScript
exports.lint = parallel(lintSass, lintJS);

// Compress Files
exports.compress = compressAssets;

// Concat all CSS and JS files into a master bundle.
exports.concat = parallel(concatCSS);

// Clean all directories.
exports.clean = parallel(cleanCSS, cleanJS);

/**
 * Start browsersync server.
 * @param {function} done callback function.
 * @returns {undefined}
 */
function serve(done) {
  // See https://browsersync.io/docs/options for more options.
  server.init({
    // We want to serve both the patternlab directory, so it gets
    // loaded by default AND three directories up which is the
    // Drupal core directory. This allows urls that reference
    // Drupal core JS files to resolve correctly.
    // i.e. /core/misc/drupal.js
    server: ['./patternlab/', '../../../'],
    notify: false,
    open: false
  });
  done();
}

/**
 * Start Pattern Lab build watch process.
 * @param {function} done callback function.
 * @returns {undefined}
 */
function watchPatternlab(done) {
  patternlab
    .build({
      cleanPublic: config.cleanPublic,
      watch: true
    })
    .then(() => {
      done();
    });
}

/**
 * Build Pattern Lab.
 * @param {function} done callback function.
 * @returns {undefined}
 */
function buildPatternlab(done) {
  patternlab
    .build({
      cleanPublic: config.cleanPublic,
      watch: false
    })
    .then(() => {
      done();
    });
}

function buildVariables(){

    return src('src/_patterns/global/base/**/*.json')
        .pipe(jsonCss({
            keepObjects: true
        }))
        .pipe(dest('src/assets/scss/variables/'));

}

/**
 * Watch Sass and JS files.
 * @returns {undefined}
 */
function watchFiles() {
  // Watch all my sass files and compile sass if a file changes.
  watch(['./src/_patterns/global/base/**/*.json'],
    series(buildVariables, compileSass, concatCSS, (done) => {
      server.reload('*.css');
      done();
    })
  )
  watch(
    ['./src/_patterns/**/**/*.scss','./src/assets/**/*.scss'],
    series(compileSass, concatCSS, (done) => {
      server.reload('*.css');
      done();
    })
  );

  // Watch all my JS files and compile if a file changes.
  watch(
    ['./src/_patterns/**/**/*.js', './src/assets/js/**/*.js'],
    series(parallel(lintJS, compileJS), (done) => {
      server.reload('*.js');
      done();
    })
  );

  // Reload the browser after patternlab updates.
  patternlab.events.on('patternlab-build-end', () => {
    server.reload('*.html');
  });
}

// Watch task that runs a browsersync server.
exports.watch = series(
  buildVariables,
  parallel(cleanCSS, cleanJS),
  parallel(
    lintSass,
    compileSass,
    lintJS,
    compileJS,
    compressAssets,
    moveFonts,
    movePatternCSS
  ),
  concatCSS,
  series(watchPatternlab, serve, watchFiles)
);

// Build task for Pattern Lab.
exports.styleguide = buildPatternlab;

// Default Task
exports.default = series(
  parallel(cleanCSS, cleanJS),
  parallel(
    lintSass,
    compileSass,
    lintJS,
    compileJS,
    compressAssets,
    moveFonts,
    movePatternCSS
  ),
  concatCSS,
  buildPatternlab
);
