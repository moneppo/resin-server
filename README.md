Configure
---------

1. `npm install` to pull all dependencies 
2. Versions of the binaries are included in bin/<platform>, however you may consider building the right Resin for each platform to get the latest update and place it in this folder.
3. For Mac OS support, install png2icns for generating the icns files. On Mac OSX use homebrew: `brew install libicns`, for Debian/Ubuntu `apt-get install icnsutils`, Redhat `yum update libicns`, etc.

Usage
-----

	var server = require('resin-server')

	server.file('macosx', 'http://www.example.com/app', function(error, filePath) {
		if (error) {
			console.log(error);
			return;
		}

		console.log("You can find your shiny download at " + filePath);
	});

This function is mostly meant to be served in a RESTful API. for example, using [hapi](http://hapijs.com/)

	hapi.route({
    path: "getapp/macosx",
    method: "GET",
    handler: function(request, reply) {
    	server.file('macosx', 'http://www.example.app' function(error, filePath) {
    		if (error) {
					return reply("Something went wrong: " + error);
				}

    		return reply.file(filePath);
    	});
    }
	});

resin-server automatically caches the generated binaries to improve performance for multiple calls. If you need to force the regeneration of a binary, use `forceUpdate` exactly like you would use the `file` function.



