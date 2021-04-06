var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var sassPaths = [
  'node_modules/foundation-sites/scss',
  'node_modules/motion-ui/src'
];

// Add or remove plugins here after mediaQuery.
var jsFoundationPlugins = [
  'node_modules/foundation-sites/dist/js/plugins/foundation.core.js',
  'node_modules/foundation-sites/dist/js/plugins/foundation.util.mediaQuery.min.js'
];

gulp.task('sass', function() {
  return gulp.src('dist/scss/app.scss')
    .pipe($.sassGlob())
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'expanded' // if css compressed **file size**
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/css'))
    .pipe($.livereload());
});
gulp.task('customsass', function() {
  return gulp.src('dist/scss/styles.scss')
    .pipe($.sassGlob())
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'expanded' // if css compressed **file size**
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/css'))
    .pipe($.livereload());
});

gulp.task('javascript', function() {
  return gulp.src(jsFoundationPlugins)
    .pipe($.concat('foundation.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('default', gulp.series('sass', 'javascript', function() {
  $.livereload.listen();
  gulp.task('watch', function() {
    gulp.watch('dist/scss/**/*.scss', gulp.series('sass'));
    gulp.watch('dist/scss/**/*.scss', gulp.series('customsass'));
  });
}));
