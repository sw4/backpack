var http = require('http'),
    fs = require('fs'),
	open = require('open'),
	backpack = require('backpack-js'),
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
server.listen(8080, 'localhost', function(){
	open('http://localhost:8080');
});
