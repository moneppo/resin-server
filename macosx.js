var plist = require('plist');
var fs = require('fs');
var dmg = require('appdmg');
var http = require('http');
var request = require("request");
var cheerio = require('cheerio');
var url = require('url');
var path = require('path');
var spawn = require('child_process').spawn;

module.exports = function(uri, callback) {

	// Examples:
	// Regular Expressions - JavaScript | MDN		: Regular Expressions
	// Flying Sphinx | Add-ons | Heroku 				: Flying Sphinx
	function cleanTitle(title) {
		var title = fullTitle.replace(/[\'\"]/, '');
		return title.split(/[\:\?\;\!\(\)\[\]\{\}\<\>\/\\\|\*\"\'\-]/)[0].trim();
	}

	function png2icns(filename, callback) {
		var outfilename = path.basename(filename, '.png') + '.icns';
		grep = spawn('png2icns', [filename, outfilename]);
		grep.on('exit', function(code) {
			if (code != 0) {
				return callback("Error generating icns file");
			}

			callback(null, outfilename);
		})
	}

	function createIcns($, callback) {
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

		var parsed = href.parse();
		var fullPath = url.resolve(uri, href);
		http.get(fullPath, function(res) {
			var filename = path.basename(parsed.path);
			var file = fs.createWriteStream(filename);
			res.pipe(file);
			res.on('end', function() {
				file.close();
				png2icns(filename, callback);
			});
			});
		});
	}
 
	var dmgConfig = {
	  title: "Default App",
	  app: "Resin.app",
	  icon: "Resin.app/Contents/Resources/resin.icns",
	  icons: {
	    size: 80,
	    app: [192, 344],
	    alias: [448, 344]
	  }
	};

	request({uri: uri}, function(err, response, body) {
		if (err) {
			return callback(err);
		}

  	var $ = cheerio.load(body);

  	createIcns($, function(err, iconPath) {
  		if (err) {
  			return callback(err);
  		}

  		var fullTitle = $('title').text();
			dmgConfig.title = cleanTitle(fullTitle);

			dmgConfig.icon = iconPath || dmgConfig.icon;

			fs.writeFile('appdmg.json', JSON.stringify(dmgConfig), function(err) {
				if (err) {
					return callback(err);
				}

				dmg('appdmg.json', dmgConfig.title + '.dmg', function(err, path) {
  				if (err) {
  					return callback(err);
  				}

  				callback(null, path);
				});
  		});
		});
	});
}