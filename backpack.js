var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
	Promise = require('promise'),
	mkdirp = require('mkdirp'),
    config = require('./backpack.json'),
    pkg = require('./package.json'),
	archiver = require('archiver'),
	rmdir = require('rimraf'),
	colors = require('colors'),
	log='',
	port=config.port || 8080,
	server = http.createServer(function(req, res) {
		var url_parts = url.parse(req.url, true),
			body = '';
		if (req.method === 'POST') {
			// backpack module form submitted
			req.on('data', function(data) {
				body += data;
				if (url_parts.pathname == '/backpack') {			
					log='Data found: ' + decodeURIComponent(data);
					console.log('Build process started...'.bgCyan.black);
					console.log(log.cyan);
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
					console.log('Build page requested...'.yellow);
					res.end(data);
				});
			}
		}
		
	});
server.listen(port);
log='Build server started at localhost:'+port;
console.log(log.bgWhite.black);

function backpack(data, res, req) {

	// Create lookup array of selected modules
	var modules=[],
		querystring = decodeURIComponent(data),
		assets=[];
		
    querystring.split('&').forEach(function(kv, index, array) {
        var pair = kv.split('=');
        if (pair[0].indexOf('backpack') > -1 && pair[1]) {
			modules.push(pair[1]);
		}
    });	
	
	var session=pkg.name+'_'+Date.now();
	log='Build session '+session+' requested...';
	console.log(log.yellow);
	
	function concat(src, dest) {	 
		var out = src.map(function(filePath){
			return fs.readFileSync(filePath, 'utf-8');
		});	 
		fs.writeFileSync(session+'/'+dest, out.join('\n'), 'utf-8');
		console.log('SUCCESS: '+dest +' built.');
	}	
	
	function doInit(){
		return new Promise(function(resolve, reject) {
			var mkdirp = require('mkdirp');
				mkdirp(session, function(err) { 
					if(!err){
						resolve('Build session created');
					}else{
						reject('Unable to create build session, filesystem write access denied');
					}
				});	
		});	
	}
	
	function doCompile(){
		return new Promise(function(resolve, reject) {
			// Cross reference against configures modules
			var bundleRef=[], bundles=[];
			config.modules.forEach(function(module, index, array){
				// Module found
				if(modules.indexOf(module.name)>-1){
					// resolve(module.name + ' detected...compiling');
					// module found...so compile the assets...
					// loop through source assets
					module.src.forEach(function(asset, index, array){
						if (!fs.existsSync(asset.src)) {
							log="ERROR: "+asset.src+" in "+module.name+" not found..skipping...";
							console.log(log.red);
							return;
						}
						var dest=asset.dest || asset.src, bundle;
						bundle=bundleRef.indexOf(dest);
						if(bundle<0){
						    // add to lookup
							bundleRef.push(dest);
							// init new bundle config
							bundles.push({
								"dest":dest,
								src:[]								
							})
							bundle=bundleRef.length-1;
						}						
						bundles[bundle].src.push(asset.src);
						assets.push(session+'/'+dest);
						log="PROCESS: "+asset.src+" in "+module.name+" linked to "+asset.dest;
						console.log(log.grey);
					});
					
				};
			});
			if(bundles.length>0){
				bundles.forEach(function(bundle){
					concat(bundle.src, bundle.dest);
				});
				resolve('Module bundling complete');
			}else{
				reject("No assets could be resolved, please check each src entry in backpack.json");
			}
			
		});
	}
	
	function doZip(){	
		return new Promise(function(resolve, reject) {	
			var archive = archiver('zip'),
				output = fs.createWriteStream(session + '/'+pkg.name+'.zip');				
			output.on('close', function() {
				log='Successfully zipped assets into ('+archive.pointer()+'bytes)';
				console.log(log.green);
				resolve('Successfully zipped assets into ('+archive.pointer()+'bytes)');
			});
			archive.on('error', function(err) {
				log='Error compiling archive: '+err;
				console.log(log.red);
				reject('Error compiling archive: '+session+', '+err);
			});			
			archive.pipe(output);	
			archive.bulk([
			  {src: assets}
			]);
			archive.finalize();		
		});
	}
	
	function doDownload(){		
		res.setHeader('Content-disposition', 'attachment; filename='+session);
		res.setHeader('Content-type', 'application/zip');
		var file = fs.createReadStream(session+'/'+pkg.name+'.zip');
		file.pipe(res);
		rmdir(session+'/', function(error){});// clean-up generated files. TODO: utilise streams
		log='Build session finalized: '+session;
		console.log(log.yellow);
		console.log('Build process completed'.bgCyan.black);
		req.end();				
	}

	doInit()
		.then(function(result){
			console.log(result.green);
			return doCompile();
		}, function(err) {
			console.log(err.bgRed.white); 		
		})		
		.then(function(result){
			console.log(result.green);
			return doZip();
		}, function(err) {
			console.log(err.bgRed.white); 
		})
		.then(doDownload);
		
}
