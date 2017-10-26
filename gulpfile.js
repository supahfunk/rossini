var fs = require('fs'),
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    merge = require("merge-stream"),
    autoprefixer = require('gulp-autoprefixer'),
    coffee = require('gulp-coffee'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    html2js = require('gulp-html2js'),
    livereload = require('gulp-livereload'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    webserver = require('gulp-webserver');

// COMPILE
gulp.task('compile:sass', function() {
    var tasks = getCompilers('.scss').map(function(compile) {
        console.log(compile.inputFile);
        return gulp.src(compile.inputFile, { base: '.' })
            .pipe(sass().on('compile:sass.error', function(error) {
                console.log('compile:sass.error', error);
            }))
            .pipe(autoprefixer()) // autoprefixer
            .pipe(rename(compile.outputFile))
            .pipe(gulp.dest('./'));
    });
    return merge(tasks);
});
gulp.task('compile', ['compile:sass']);

// BUNDLE
gulp.task('bundle:css', function() {
    var tasks = getBundles('.css').map(function(bundle) {
        return gulp.src(bundle.inputFiles, { base: '.' })
            .pipe(concat(bundle.outputFileName))
            .pipe(gulp.dest('.'))
            .pipe(gulpif(bundle.minify && bundle.minify.enabled, cssmin()))
            .pipe(rename({ extname: '.min.css' }))
            .pipe(gulp.dest('.'));
    });
    return merge(tasks);
});
gulp.task('bundle:js', function() {
    var tasks = getBundles('.js').map(function(bundle) {
        return gulp.src(bundle.inputFiles, { base: '.' })
            .pipe(concat(bundle.outputFileName))
            .pipe(gulp.dest('.'))
            .pipe(sourcemaps.init())
            .pipe(gulpif(bundle.minify && bundle.minify.enabled, uglify()))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('.'));
    });
    return merge(tasks);
});
gulp.task('bundle:partials', function() {
    return gulp.src('./partials/**/*.html', {
            base: '.'
        })
        .pipe(rename(function(path) {
            path.dirname = path.dirname.split('partials/').join('partials/framework/');
            // path.basename += "-partial";
            path.extname = '';
        }))
        .pipe(html2js('framework.partials.js', {
            adapter: 'angular',
            base: '.',
            name: 'framework',
            // fileHeaderString: '/* global angular: false */',
            indentString: '\t',
            // quoteChar: '\'',
            singleModule: true,
            useStrict: true,
        }))
        .pipe(gulp.dest('./docs/dist')) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify()) // { preserveComments: 'license' }
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(sourcemaps.write('./')) // save .map
        .pipe(gulp.dest('./docs/dist')); // save .min.js
});
gulp.task('bundle', ['bundle:css', 'bundle:js', 'bundle:partials']);

// WEBSERVER
gulp.task('webserver', function() {
    return gulp.src('./')
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            port: 5556,
            open: 'http://localhost:5556/docs/index.html',
            fallback: 'docs/index.html'
        }));
});

// WATCH
gulp.task('watch', function(done) {
    function log(e) {
        console.log(e.type, e.path);
    }
    getCompilers('.scss').forEach(function(compiler) {
        gulp.watch(compiler.inputFile, ['compile:sass']).on('change', log);
    });
    getBundles('.css').forEach(function(bundle) {
        gulp.watch(bundle.inputFiles, ['bundle:css']).on('change', log);
    });
    getBundles('.js').forEach(function(bundle) {
        gulp.watch(bundle.inputFiles, ['bundle:js']).on('change', log);
    });
    gulp.watch('./partials/**/*.html', ['bundle:partials']).on('change', log);
    gulp.watch('./compilerconfig.json', ['compile', 'bundle']).on('change', log);
    gulp.watch('./bundleconfig.json', ['bundle']).on('change', log);
    done();
});

gulp.task('default', ['compile', 'bundle', 'webserver', 'watch']);

// UTILS
function getCompilers(ext) {
    var data = getJson('./compilerconfig.json');
    return data.filter(function(compile) {
        return new RegExp(`${ext}$`).test(compile.inputFile);
    });
}

function getBundles(ext) {
    var data = getJson('./bundleconfig.json');
    return data.filter(function(bundle) {
        return new RegExp(`${ext}$`).test(bundle.outputFileName);
    });
}

function stripBom(text) {
    text = text.toString()
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }
    return text;
}

function getJson(path) {
    var text = fs.readFileSync(path, 'utf8');
    // console.log('getJson', path, text);
    return JSON.parse(stripBom(text));
}