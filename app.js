var url = require("url");
var fs = require("fs");
var path = require("path");
var http = require('http');
var mime = require('./mime').types;
var utils = require("./utils");

var server = http.createServer(function(request, response) {

    var pathname = url.parse(request.url).pathname;
	console.log("```````````````"+pathname);
	if ("/"===pathname) {
		pathname = "/index.html"
	}
    var realPath = "assets" + pathname;
	console.log("====="+realPath);
	
	var ext = path.extname(realPath);
	ext = ext ? ext.slice(1) : 'unknown';
	var contentType = mime[ext] || "text/plain";
	
    fs.exists(realPath, function (exists) {

        if (!exists) {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write("This request URL " + pathname + " was not found on this server.");
            response.end();
        } else {
			if ("mp4" === ext) {
				response.setHeader("Content-Type",contentType);
				
				var stats = fs.statSync(realPath);
				if (request.headers["range"]) {
                    console.log(request.headers["range"])
                    var range = utils.parseRange(request.headers["range"], stats.size);
                    console.log(range)
                    if (range) {
                        response.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stats.size);
                        response.setHeader("Content-Length", (range.end - range.start + 1));
                        var stream = fs.createReadStream(realPath, {
                            "start": range.start,
                            "end": range.end
                        });

                        response.writeHead('206', "Partial Content");
                        stream.pipe(response);
                    } else {
                        response.removeHeader("Content-Length");
                        response.writeHead(416, "Request Range Not Satisfiable");
                        response.end();
                    }
				} else {
						var stream = fs.createReadStream(realPath);
						response.writeHead('200', "Partial Content");
						stream.pipe(response);
				}
			} else {
				fs.readFile(realPath, "binary", function(err, file) {
					if (err) {
						response.writeHead(500, {'Content-Type': 'text/plain'});
						response.end(err);
					} else {
						response.writeHead(200, {'Content-Type': contentType});
						response.write(file, "binary");
						response.end();
					}
				});
			}
          }
      });

});

server.listen(3000);

console.log("Server runing at port: 3000");