import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import sloc from 'gulp-sloc';
import bump from 'gulp-bump';
import runSequence from 'run-sequence';
import del from 'del';
import todo from 'gulp-todo';
import git from 'gulp-git';


/* ************************************************************************* */
/* Helpers                                                                   */
/* ************************************************************************* */

/*
* Generate and add todo task before committing.
*/

gulp.task('gittodo', () => gulp.src('./TODO.md')
  .pipe(git.add()));

gulp.task('todo', () => gulp.src('src/**/*.js')
  .pipe(todo())
  .pipe(gulp.dest('./')));

gulp.task('gentodo', () => runSequence(
  'todo',
  'gittodo'
));

/*
* CLean whatever directory is passed in.
*/
const cleany = distGlob => (
  del([
    distGlob
  ])
);

/*
* Copy necessary files to the /dist folder for publishing after transpiling.
*/
const copyey = (fileGlob, destDir) => gulp.src(fileGlob)
  .pipe(gulp.dest(destDir));

/*
* Hook transpiling step to gulpSrc passed in.
*/
const transpily = (fileGlob, destDir) => gulp.src(fileGlob)
  .pipe(sourcemaps.init())
  .pipe(babel({
    sourceMaps: 'inline',
    presets: ['es2015'],
    plugins: [
      'transform-runtime',
      'transform-strict-mode'
    ]
  }))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(destDir));

/*
* Count lines. Not implemented.
*/
gulp.task('sloc', () => gulp.src(['src/**/*.js']).pipe(sloc()));

/*
* Linter. Not implemented.
*/
gulp.task('lint', () => (
  gulp.src(['src/**/*.js', '!./node_modules/**'])
  .pipe(eslint({
    extends: 'airbnb/base',
    parser: 'babel-eslint',
    plugins: [
      'babel'
    ],
    rules: {
      'comma-dangle': [2, 'never'],
      'babel/object-shorthand': 1,
      'new-cap': [2, { capIsNew: false }],
      'arrow-body-style': 0
    }
  }))
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
));

/* ************************************************************************* */
/* Perf Tasks                                                                */
/* ************************************************************************* */

/*
* Clean/create the perf_runner directory.
*/
gulp.task('clean-perf', () => cleany('./perf_runner/*'));

/*
* Copy any json files in perf directory.
*/
gulp.task('copy-perf', () => (
  copyey(['perf/**/*.json'], 'perf_runner'))
);

/*
* Transpile source and copy important json to build-perf.
*/
gulp.task('transpile-perf', () => transpily(
  ['src/**/*.js', 'perf/**/*.js'],
'perf_runner'));

/*
* Build the directory which includes transpiling, cleaning and copying.
*/
gulp.task('build-perf', () =>
runSequence(
  'clean-perf',
  ['transpile-perf', 'copy-perf']
)
);


/* ************************************************************************* */
/* Main Tasks                                                                */
/* ************************************************************************* */

/*
* Transpile main source to /dist.
*/
gulp.task('transpile-main', () => transpily('src/**/*.js', 'dist'));

/*
* Clean/create the dist directory.
*/
gulp.task('clean-main', () => cleany('./dist/*'));

/*
* Copy package.json and README.md to new dist directory.
*/
gulp.task('copy-main', () => (
  copyey(['./package.json', './README.md'], 'dist'))
);

/*
* Bump package.json.
* #These are not exposed in any npm script. Used by release tasks.
*/
const bumpy = (importance, tag) => gulp.src('./*.json')
  .pipe(bump({ type: importance, preid: tag }))
  .pipe(gulp.dest('./'));

/*
* Release tasks.
*/
gulp.task('prerelease', () => bumpy('prerelease', 'beta'));
gulp.task('patch', () => bumpy('patch'));
gulp.task('major', () => bumpy('major'));
gulp.task('minor', () => bumpy('minor'));

/*
* Release task that update package.json according to what the release does
* according to SemVer and transpile the code.
*/
const releasy = importance => runSequence(
  importance,
  'clean-main',
  ['transpile-main', 'copy-main']
);

/*
* Core release tasks.
*/
gulp.task('release-patch', () => releasy('patch'));
gulp.task('release-minor', () => releasy('minor'));
gulp.task('release-major', () => releasy('major'));
gulp.task('release-prerelease', () => releasy('prerelease'));

/*
* Default build for main. No bump.
*/
gulp.task('default', () => runSequence(
  'clean-main',
  ['transpile-main', 'copy-main']
));
