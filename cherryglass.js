var express = require('express'),
		http = require('http'),
		path = require('path'),
		cheerio = require('cheerio'),
		fs = require('fs'),
		ncp = require('ncp'),
		cons = require('consolidate'),
		swig = require('swig'),
		marked = require('marked'),
		rimraf = require('rimraf'),
		extend = require('extend');

var app = express();

var cherryglass = {
	data : {
		// defualts
		config : {
			src_dir : "/example",
			site_dir : "/../site",
			data_file : "/data.json"
		},
		attr : {
			'text': 'value',
			'blob': 'value',
			'markdown': 'value',
			'href': 'href'
		},
		files : {}
	}
};

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('.html', cons.swig);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use('/static', express.static(__dirname + '/static'));
app.use('/', express.static(__dirname + cherryglass.data.config.site_dir));



// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// configure the markdown options
marked.setOptions({
	gfm: true,
	tables: true,
	breaks: true,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false,
	langPrefix: 'lang-'
});


/*
	Recursively walk a directory structure
 */
cherryglass.walk = function(dir, done) {
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err) return done(err);
		var pending = list.length;
		if (!pending) return done(null, results);
		list.forEach(function(file) {
			file = dir + '/' + file;
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					cherryglass.walk(file, function(err, res) {
						results = results.concat(res);
						if (!--pending) done(null, results);
					});
				} else {
					results.push(file);
					if (!--pending) done(null, results);
				}
			});
		});
	});
};



/*
	Render the resultant site.
 */
cherryglass.site = function(req, res){
	res.send("Serve the site at: " + __dirname + cherryglass.src_dir);
};


/*
	Render the main admin page.
 */
cherryglass.admin = function(req, res){
	res.render('admin', { title: 'CherryCMS', content: cherryglass.data });
};


/*
	Render the main admin page.
 */
cherryglass.docs = function(req, res){
	res.render('docs');
};


/*
	Render the admin form for a given page
 */
cherryglass.showDataForm = function(req, res){
	res.render('page', { title: 'Cherry CMS', message: req.params[0], file: req.params[0], content: cherryglass.data.files });
};


/*
	update the values on a given page
*/
cherryglass.contentSubmission = function(req, res){

	var file = { name: req.params[0] };

	// inspect each field posted from the form and update it in the store.
	for(var node in req.body) {
		var type = node.split(":")[0];
		var id = node.split(":")[1];
		var cherry = {
			id: id
		};
		cherry[cherryglass.data.attr[type]] = req.body[node];
		cherryglass.setCherry(file, cherry);
	}

	// save the new data to the file.
	cherryglass.writeData(cherryglass.data.config.data_file);

	// render a confirmation
	res.render('page', { title: 'cherry cms', message: "saved", file: file.name, content: cherryglass.data.files });
};



/*
	Generate the CMS Admin by ingesting the HTML or JSOM file
*/
cherryglass.ingest = function(req, res){

	var message = "ingested";

	// store the config options from the form
	cherryglass.data.config.data_file = req.body['datafile'];
	cherryglass.data.config.src_dir = req.body['source'];
	cherryglass.data.config.site_dir = req.body['output'];

	if (req.body['html']) {
		console.log("Generating CMS from site source....");
		cherryglass.pick();
	} else {
		fs.readFile(__dirname + cherryglass.data.config.data_file, 'utf-8', function(err, contents) {
			if(err) {
				var message = "ingest-error";
				console.log("There was a problem ingesting you data.json file.");
				return;
			}
			console.log("Using data.json as the source for the CMS.");
		});
	}

	res.redirect('/cms');
};


/*
	Parse the src of the site.
 */
cherryglass.pick = function() {

	cherryglass.walk(__dirname + cherryglass.data.config.src_dir, function(err, results) {
		if (err) throw err;
			results.filter( function(file) {
				return file.substr(-5) == '.html';
			})
			.forEach( function(file) {
				console.log("...", file);
				fs.readFile(file, 'utf-8', function(err, contents) {
					if (err) throw err;
					var $ = cheerio.load(contents);
					var title = $('title').text();

					$('[data-cherry-id]').each(function(i, elem) {
						var cherry_obj = {
							id:     $(this).attr('data-cherry-id'),
							type:   $(this).attr('data-cherry-type'),
							label:  $(this).attr('data-cherry-label'),
							help:   $(this).attr('data-cherry-help'),
							value:  $(this).html().trim()
						};

						//  handle link types
						if(cherry_obj.type == 'link'){
							cherry_obj.href = $(this).attr('href');
						}
						// or handle collection types
						else if (cherry_obj.type == 'collection') {
							cherry_obj.template = cherry_obj.value;
							cherry_obj.entries = [];
							cherry_obj.entries.push(cherryglass.inspect(cherry_obj.template));
							// cherry_obj.cherries = cherry.inspect(cherry_obj.template);
							cherry_obj.value = null;
						}

						// ignore first class cherries which are actually in a collection
						var collection_member = $(this).parents('[data-cherry-type=collection]');
						if(collection_member.length === 0) {

							var f = { name:  file.replace(__dirname + cherryglass.data.config.src_dir + "/", "")};
							cherryglass.setCherry(f, cherry_obj);
							cherryglass.writeData(cherryglass.data.config.data_file);
						}

					});
				});
			});
	});
};


/**
*  inspect an html fragement and return the cherries it contains
*
* @param {String} html
* @return {Object}
*/
cherryglass.inspect = function(html) {

	var $ = cheerio.load(html);
	var bits = {
		cherries : {}
	};

	$('[data-cherry-id]').each(function(i, elem) {

		var obj = {
			id:     $(this).attr('data-cherry-id'),
			type:   $(this).attr('data-cherry-type'),
			label:  $(this).attr('data-cherry-label'),
			help:   $(this).attr('data-cherry-help'),
			value:  $(this).html().trim()
		};

		//  handle link types
		if(obj.type == 'link'){
			obj.href = $(this).attr('href');
		}

		bits.cherries[obj.id] = obj;
	});

	return bits;
};


/*
	Make the content subsitution into the file.
 */
cherryglass.inject = function() {

	var out_dir = __dirname + cherryglass.data.config.site_dir + "/";

	fs.readdir(out_dir, function(err, files) {
		if (err) {
			return console.error(err);
		}
		files.filter( function(file) {
			return file.substr(-5) == '.html';
		})
		.forEach( function(file) {

			fs.readFile(out_dir + file, 'utf-8', function(err, contents) {
				if (err) throw err;
				var $ = cheerio.load(contents);

				// parse a data cherry and replace its content with that found in the model.
				$('[data-cherry-id]').each(function(i, elem) {
					cherryid = $(this).attr('data-cherry-id');
					cherry = cherryglass.getCherry(file, cherryid);

					// output the correct format for this element type
					if("text" == cherry.type) {
						$(this).text(cherry.value);
					} else if ("link" == cherry.type) {
						$(this).text(cherry.value);
						$(this).attr('href', cherry.href );
					} else if('markdown' == cherry.type) {
						$(this).html(marked(cherry.value));
					}

					// clean up so that we leave no smells in the markup
					$(this).attr('data-cherry-id', null);
					$(this).attr('data-cherry-type', null);
					$(this).attr('data-cherry-help', null);
					$(this).attr('data-cherry-label', null);
				});

				// write the file
				fs.writeFile(out_dir + file, $.html(), function (err) {
					if (err) throw err;
					console.log(out_dir + file, "saved.");
				});
			});

		});

	});

};


/*
	Generate the site from the source and the managed values.
 */
cherryglass.generate = function(req, res){

	var out_dir = __dirname + cherryglass.data.config.site_dir;
	var source_dir = __dirname + cherryglass.data.config.src_dir;

	// clean up or create the output directory and
	// replicate the source directory as the initial output
	if (fs.existsSync(out_dir)) {
		console.log("CLeaning output directory.");
			rimraf(out_dir, function() {
				console.log("output cleaned");
				ncp(source_dir, out_dir, function (err) {
					if (err) {
						return console.error(err);
					}
					cherryglass.inject();
				});

		});
	} else {
		ncp(source_dir, out_dir, function (err) {
			if (err) {
				return console.error(err);
			}
			cherryglass.inject();
		});
	}
	res.render('admin', { title: 'Cherry cms', message: "generated", content: cherryglass.data });
};


/**
* getCherry : get the cherry data from the store
* The optional entry parameter alows us to access child cherries in collections.
*
* @param {String} file
* @param {String} id
* @param {Int} entry
*/
cherryglass.getCherry = function(file, id, entry) {
	return cherryglass.data.files[file].cherries[id];
};


/**
* setFile : add a new file into the json data if needed.
*
* @param {Object} file
*/
cherryglass.setFile = function(file) {
	if(cherryglass.data.files[file.name] === undefined){
		cherryglass.data.files[file.name] = {
			"cherries" : {},
			"pagetitle" : file.title ? file.title : file.name
		};
	}
};



/**
* setCherry : set the cherry data in the store*
* The optional entry parameter alows us to access child cherries in collections.
* The cherry object contains all cherry data.
*
* @param {Object} file
* @param {Object} cherry
* @param {Int} entry
*/
cherryglass.setCherry = function(file, cherry, entry) {

	// ensure that the file has a corresponding object in the data store.
	cherryglass.setFile(file);

	var target = cherryglass.data.files[file.name].cherries[cherry.id];
	if(!target) {
		cherryglass.data.files[file.name].cherries[cherry.id] = cherry;
	} else {
		target = extend(target, cherry);
	}
	cherryglass.writeData(cherryglass.data.config.data_file);
};


/**
* loadData : read the data store from the file system into the data object.
*
* @param {String} file
*/
cherryglass.loadData = function(file) {
	var contents = fs.readFileSync(__dirname + "/" + file, 'utf-8');
	cherryglass.data = JSON.parse(contents);
};


/**
* writeData : wrote the data store back to the file system
*
* @param {String} file
*/
cherryglass.writeData = function(file) {
	var path = __dirname + "/" + file;
	var data = JSON.stringify(cherryglass.data);
	fs.writeFile(path, data, function (err) {
		if (err) throw err;
	});
};


// expose the cherryglass object.
module.exports = cherryglass;


/*
	Define routes
*/
app.get('/cms', cherryglass.admin);
app.get('/cms/page/*', cherryglass.showDataForm);
app.post('/cms/page/*', cherryglass.contentSubmission);
app.get('/cms/generate', cherryglass.generate);
app.get('/cms/docs', cherryglass.docs);
app.post('/cms/ingest', cherryglass.ingest);


/*
	Spin up the server
 */
http.createServer(app).listen(app.get('port'), function(){
	console.log('Starting the CherryCMS server');
	console.log('Visit http://localhost:' + app.get('port') + '/cms to manage your content.');
});


