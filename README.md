Configure
---------

1. `npm install` to pull all dependencies 
2. Go build yourself the flavors of [Resin](http://github.com/moneppo/resin) you need and place them in the base directory.
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

Future Features
---------------
* Windows version. MSIs are tricky to do in a platform independent way. If you have a solution, fork me!
* Proper DMG support. Platform independence is also pretty tricky with DMGs. One lead I have is [this](http://hogliux.github.io/bomutils/tutorial.html).



