var http = require('http'),
	compressor = require('node-minify'),
	zip = new require('node-zip')(),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
	Promise = require('promise'),
    config = require('./backpack.json'),
    pkg = require('./package.json'),
	archiver = require('archiver'),
	rmdir = require('rimraf'),
	colors = require('colors'),
    modules = {};
	
var server = http.createServer(function(req, res) {

    var url_parts = url.parse(req.url, true),
		body = '';
    if (req.method === 'POST') {
		// backpack module form submitted
        req.on('data', function(data) {
            body += data;
			if (url_parts.pathname == '/backpack') {			
				var str='Data found: ' + decodeURIComponent(data);
				console.log('Backpack started...'.bgCyan.black);
				console.log(str.cyan);
				backpack(data, res, req);
			}else{
				res.end(data);
			}
        });

    } else {
		// GET request....serving a page....
        req.on('data', function(data) {
            res.end(' data event: ' + data);
        });
        if (url_parts.pathname == '/'){
            fs.readFile('./backpack.html', function(error, data) {
				console.log('Serving backpack.html'.yellow);
				res.end(data);
			});
		}
    }

});
server.listen(8080);
console.log('Backpack server listening at localhost:8080'.bgWhite.black);

function backpack(data, res, req) {

	config.modules.forEach(function(module, index, array) {
		var type = module.type;
		if (!module.type) {
			type = module.name.split('.')[1];
		}
		modules[module.name] = {
			src: module.src || module.name,
			type: module.type || module.name.split('.')[1]
		};
	});

    var src = {
            js: [],
            css: []
        },
        querystring = decodeURIComponent(data),
        keyval = querystring.split('&');
		
    keyval.forEach(function(kv, index, array) {
        var pair = kv.split('=');
        if (pair[0].indexOf('backpack') > -1 && pair[1] && modules[pair[1]]) {
			var str='Module found, resolving...'+pair[1];
			console.log(str.grey);
            if (modules[pair[1]].type === "js") {
                src.js.push(modules[pair[1]].src);
            } else {
                src.css.push(modules[pair[1]].src);
            }
        }
    });
	
	var session=pkg.name+'_'+Date.now();
	var str='Session established: '+session;
	console.log(str.yellow);
	
	function doCompile(type){
		return new Promise(function(resolve, reject) {
			if(src[type].length>0){
				new compressor.minify({
					type: (type === 'js' ? 'uglifyjs' : 'clean-css'),
					fileIn: src[type],
					fileOut: session+'/'+pkg.name+'.min.'+type,
					callback: function(err, min){
						if(err){
							reject(Error(type + ' compilation error for: '+src[type]+', '+err));
						}else{
							resolve(type + ' compiled ('+src[type]+')');
						}
					}
				});
			}else{
				resolve(type + ' skipped (none found)');
			}
		});
	};
	
	function doZip(){	
		return new Promise(function(resolve, reject) {	
			var archive = archiver('zip'),
				output = fs.createWriteStream(session + '/'+pkg.name+'.zip');				
			output.on('close', function() {
				var str='Successfully zipped assets into '+archive.pointer()+' bytes';
				console.log(str.green);
				resolve('Successfully zipped assets into '+archive.pointer())+' bytes';
			});
			archive.on('error', function(err) {
				var str='Error compiling archive: '+err;
				console.log(str.red);
				reject(Error('Error compiling archive: '+session+', '+err));
			});			
			archive.pipe(output);			
			archive.bulk([
			  {src: [session+'/'+pkg.name+'.min.js', session+'/'+pkg.name+'.min.css']}
			]);
			archive.finalize();		
		});
	};	
	
	function doDownload(){		
		res.setHeader('Content-disposition', 'attachment; filename='+session);
		res.setHeader('Content-type', 'application/zip');
		var file = fs.createReadStream(session+'/'+pkg.name+'.zip');
		file.pipe(res);
		rmdir(session+'/', function(error){});// clean-up generated files. TODO: utilise streams
		// rmdir('backpack_*/', function(error){});// clean-up files from a spamming session. TODO: utilise streams
		var str='Session closed: '+session;
		console.log(str.yellow);
		console.log('Backpack completed'.bgCyan.black);
		req.end();				
	};	
	
	doCompile('js')
		.then(function(result) {
			console.log(result.green);
			return doCompile('css');
		}, function(err) {
			console.log(err.red);
		})
		.then(function(result){
			console.log(result.green);
			return doZip();
		}, function(err) {
			console.log(err.red); 
		})
		.then(doDownload);
}
