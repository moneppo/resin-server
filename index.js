var cache = {};

var platformGenerators = {
	macosx: require('./macosx.js')
};

function generateLink(platform, url, callback) {
	if (platformGenerators[platform] === undefined) {
		return callback("Platform is not supported.");
	}

	platformGenerators[platform](url, function(error, filePath) {
		if (error) {
			return callback(error);
		}
		
		cache[platform] = filePath;
		callback(null, filePath);
	});
}

function file(platform, url, callback) {
	if (cache[platform] !== undefined) {
		return callback(null, links[platform]);
	}

	return generateLink(platform, url, callback);
}


module.exports = {
	file: file,
	forceUpdate: generateLink
}