var cache = {};

var platformGenerators = {
	macosx: require('./macosx.js')
};

function generateLink(platform, url, identifier, callback) {
	if (platformGenerators[platform] === undefined) {
		return callback("Platform is not supported.");
	}

	platformGenerators[platform](url, identifier, function(error, filePath) {
		if (error) {
			return callback(error);
		}
		
		cache[platform] = filePath;
		callback(null, filePath);
	});
}

function file(platform, url, identifier, callback) {
	if (cache[platform] !== undefined) {
		return callback(null, cache[platform]);
	}

	return generateLink(platform, url, identifier, callback);
}


module.exports = {
	file: file,
	forceUpdate: generateLink
}