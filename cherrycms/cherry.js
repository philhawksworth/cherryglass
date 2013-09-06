var express = require('express'),
		http = require('http'),
		path = require('path'),
		cheerio = require('cheerio'),
		fs = require('fs'),
		cons = require('consolidate'),
    swig = require('swig'),
		extend = require('extend');

var app = express();

var cherry = {
  data : {
    config : {
      src_dir : __dirname + "/../src/",
      site_dir : __dirname + "/../site/"
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
app.use('/', express.static(cherry.data.config.site_dir));

swig.init({ root: __dirname + '/views' });



// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}


/*
	Render the resultant site.
 */
cherry.site = function(req, res){
	res.send("Serve the site at: " + cherry.src_dir);
};


/*
	Render the main admin page.
 */
cherry.admin = function(req, res){
	res.render('admin', { title: 'CherryCMS', content: cherry.data.files });
};


/*
	Render the main admin page.
 */
cherry.docs = function(req, res){
	res.render('docs');
};


/*
	Render the admin form for a given page
 */
cherry.showDataForm = function(req, res){
	res.render('page', { title: 'Cherry CMS', message: req.params.file, file: req.params.file, content: cherry.data.files });
};


/*
	update the values on a given page
*/
cherry.contentSubmission = function(req, res){

	// inspect the content posted from the form
	for(var node in req.body) {
		console.log("nodes", node, req.body[node] );
		var cherrytag = node.split(":");
    cherry.update(req.params.file, cherrytag[1], req.body[node]);
	}

	// render a confirmation
	res.render('page', { title: 'cherry cms', message: "saved", file: req.params.file, content: cherry.data.files });
};


/*
	lodge an element in the model for management
 */
cherry.lodge = function(file, title, data) {

  // Defaults to extend.
  var obj = {
     "type": null,
     "id": null,
     "value": "",
     "label": null,
     "help": null
  };
  obj = extend(obj, data);

	if(!cherry.data.files[file]) {
		cherry.data.files[file] = {"pagetitle": title, "cherries": {}};
	}

  cherry.data.files[file].cherries[obj.id] = obj;
  cherry.saveData();
};


/*
  update the stored value of a data cherry
 */
cherry.update = function(file, id, value) {
  cherry.data.files[file].cherries[id].value = value;
  cherry.saveData();
};


/*
	pluck the data for a cherry from the data store
 */
cherry.pluck = function(file, id) {
	return cherry.data.files[file].cherries[id].value;
};


/*
	Parse the src of the site.
 */
cherry.pick = function() {

	fs.readdir(cherry.data.config.src_dir, function(err, files) {

		files.filter( function(file) {
			return file.substr(-5) == '.html';
		})
		.forEach( function(file) {

			fs.readFile(cherry.data.config.src_dir + file, 'utf-8', function(err, contents) {
				if (err) throw err;

				console.log("Cherry-picking content from",file);
				var $ = cheerio.load(contents);
				var title = $('title').text();

				// parse a data cherry and lodge it in the model.
				$('[data-cherry]').each(function(i, elem) {
					var str = $(this).attr('data-cherry');
					var cherrytag = JSON.parse(str);
          var cherry_obj = extend(cherrytag, {"value": $(this).text()});
          cherry.lodge(file, title, cherry_obj);
				});

			});
		});
	});
};


/*
	Generate the site from the source and the managed values.
 */
cherry.generate = function(req, res){

	// make the substitutions
	fs.readdir(cherry.data.config.src_dir, function(err, files) {

		files.filter( function(file) {
			return file.substr(-5) == '.html';
		})
		.forEach( function(file) {

			fs.readFile(cherry.data.config.src_dir + file, 'utf-8', function(err, contents) {
				if (err) throw err;
				var $ = cheerio.load(contents);

				// parse a data cherry and replace its content with that found in the model.
				// also remove the data-cherry attribute to eliminate any smells
				$('[data-cherry]').each(function(i, elem) {
					var cherrytag = JSON.parse($(this).attr('data-cherry'));
					var data = cherry.pluck(file, cherrytag.id);
					$(this).text(data);
					$(this).attr('data-cherry', null);
				});
				fs.writeFile(cherry.data.config.site_dir + file, $.html(), function (err) {
					if (err) throw err;
					console.log(file, "saved.");
				});
			});

		});

	});
  res.render('page', { title: 'Cherry cms', message: "generated", file: req.params.file, content: cherry.data.files });
};



/*
	Save the data as a JSON file
 */
cherry.saveData = function() {

	var file = __dirname + "/data.json";
	var data = JSON.stringify(cherry.data);
	fs.writeFile(file, data, function (err) {
		if (err) throw err;
		console.log(file, "Data saved.");
	});

};


//
// Define routes
//
app.get('/cherrycms', cherry.admin);
app.get('/cherrycms/page/:file', cherry.showDataForm);
app.post('/cherrycms/page/:file', cherry.contentSubmission);
app.get('/cherrycms/generate', cherry.generate);
app.get('/cherrycms/docs', cherry.docs);


/*
	Let's get started
 */
cherry.pick();


/*
	Spin up the server
 */
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});


