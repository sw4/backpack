var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
	backpack = require('./backpack.js'),
	port=8080,
	server = http.createServer(function(req, res) {
			// make backpack listen to requests..	
			backpack(req, res);
			// GET request....serving a page....
			if(req.method==="GET"){
				fs.readFile('./index.html', function(error, data) {
					res.end(data);
				});
			}
	});	
server.listen(8080);
