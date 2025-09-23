const fs = require('fs');
const UglifyJS = require('uglify-js');

const code = fs.readFileSync('../src/io.js', 'utf8');
const minified = UglifyJS.minify(code);
fs.writeFileSync('../dist/io.min.js', minified.code);
