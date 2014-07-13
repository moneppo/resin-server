var plist = require('plist');
var fs = require('fs');
var http = require('http');
var request = require("request");
var cheerio = require('cheerio');
var url = require('url');
var path = require('path');
var spawn = require('child_process').spawn;
var ncp = require('ncp').ncp;
var archiver = require('archiver');

module.exports = function(uri, identifer, callback) {

	// Examples:
	// Regular Expressions - JavaScript | MDN		: Regular Expressions
	// Flying Sphinx | Add-ons | Heroku 				: Flying Sphinx
	function cleanTitle(fullTitle) {
		var title = fullTitle.replace(/[\'\"]/, '');
		return title.split(/[\:\?\;\!\(\)\[\]\{\}\<\>\/\\\|\*\"\'\-]/)[0].trim();
	}

	function png2icns(filename, destDir, callback) {
		console.log('in:' + filename);
		var outfilename = path.basename(filename, '.png') + '.icns';
		console.log('out: ' + outfilename);
		var proc = spawn('png2icns', [destDir + outfilename, filename]);

		proc.stdout.on('data', function (data) {
  		console.log('stdout: ' + data);
		});

		proc.stderr.on('data', function (data) {
  		console.log('stderr: ' + data);
		});

		proc.on('exit', function(code) {
			if (code != 0) {
				return callback("Error generating icns file");
			}

			callback(null, outfilename);
		})
	}

	function writeZip(dir, name, callback) {
		var output = fs.createWriteStream(name);
		var archive = archiver('zip');

		output.on('close', function () {
    	console.log(archive.pointer() + ' total bytes');
		});

		archive.on('error', callback);

		archive.pipe(output);
		archive.bulk([{ expand: true, cwd: dir, src: ['**'], dest: dir}]);
		archive.finalize();
		callback(null, name);
	}



	function createIcns($, destDir, callback) {
		var possibleLinks = [
			'link[rel=icon]',
			'link[rel=apple-touch-icon-precomposed]',
			'link[rel=apple-touch-icon]'
		];

		var href = undefined;
		for (var i in possibleLinks) {
			var link = $(possibleLinks[i]);
			if (link.length > 0) {
				href = link.attr('href')
				break;
			}
		}

		if (href === undefined) {
			return callback(null, undefined);
		}

		if (path.extname(href) != '.png') {
			return callback("Sorry, only PNG touch icons are supported.");
		}

		var parsed = url.parse(href);
		var fullPath = url.resolve(uri, href);
		http.get(fullPath, function(res) {
			var filename = path.basename(parsed.path);
			var file = fs.createWriteStream(filename);
			res.pipe(file);
			res.on('end', function() {
				file.close();
				png2icns(filename, destDir, callback);
			});
		});
	}

	request({uri: uri}, function(err, response, body) {
		if (err) {
			return callback(err);
		}

  	var $ = cheerio.load(body);
  	var fullTitle = $('title').text();
		var title = cleanTitle(fullTitle);
		var appDir = title + '.app';

		ncp('Resin.app', appDir, function (err) {
			if (err) {
				return callback(err);
			}

 			createIcns($, appDir + '/Contents/Resources/', function(err, iconfilename) {
 				if (err) {
  				return callback(err);
  			}

  			var obj = plist.parse(fs.readFileSync(appDir + '/Contents/Info.plist', 'utf8'));
  			obj.CFBundleName = title;
  			obj.CFBundleIconFile = iconfilename;
  			obj.CFBundleIdentifier = identifer;
  			obj.HomePath = uri;
  			fs.writeFileSync(appDir + '/Contents/Info.plist', plist.build(obj));
    		writeZip(appDir, title + '.zip', callback);
 			});
		});
	});
}