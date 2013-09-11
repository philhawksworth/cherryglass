var express = require('express'),
		http = require('http'),
		path = require('path'),
		cheerio = require('cheerio'),
		fs = require('fs'),
		cons = require('consolidate'),
    swig = require('swig'),
    marked = require('marked'),
		extend = require('extend');

var app = express();

var cherry = {
  data : {
    // defualts.
    config : {
      src_dir : "/../src/",
      site_dir : "/../site/",
      data_file : "/data.json"
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
app.use('/', express.static(__dirname + cherry.data.config.site_dir));

swig.init({ root: __dirname + '/views' });



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
	Render the resultant site.
 */
cherry.site = function(req, res){
	res.send("Serve the site at: " + __dirname + cherry.src_dir);
};


/*
	Render the main admin page.
 */
cherry.admin = function(req, res){
	res.render('admin', { title: 'CherryCMS', content: cherry.data });
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
  Generate the CMS Admin by ingesting the HTML or JSOM file
*/
cherry.ingest = function(req, res){

  var message = "ingested";

  if (req.body['html']) {
    console.log("Generating CMS from site source....");
    cherry.pick();
  } else {
    fs.readFile(__dirname + cherry.data.config.data_file, 'utf-8', function(err, contents) {
      if(err) {
        var message = "ingest-error";
        console.log("There was a problem ingesting you data.json file.");
        return;
      }
      console.log("Using data.json as the source for the CMS.");
    });

  }

  // render a confirmation
  // res.render('admin', { title: 'cherry cms', message: message, content: cherry.data });
  res.redirect('/cherrycms');
};




/*
	Parse the src of the site.
 */
cherry.pick = function() {

	fs.readdir(__dirname + cherry.data.config.src_dir, function(err, files) {

		files.filter( function(file) {
			return file.substr(-5) == '.html';
		})
		.forEach( function(file) {

			fs.readFile(__dirname + cherry.data.config.src_dir + file, 'utf-8', function(err, contents) {
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
	fs.readdir(__dirname + cherry.data.config.src_dir, function(err, files) {

		files.filter( function(file) {
			return file.substr(-5) == '.html';
		})
		.forEach( function(file) {

			fs.readFile(__dirname + cherry.data.config.src_dir + file, 'utf-8', function(err, contents) {
				if (err) throw err;
				var $ = cheerio.load(contents);

				// parse a data cherry and replace its content with that found in the model.
				// also remove the data-cherry attribute to eliminate any smells
				$('[data-cherry]').each(function(i, elem) {
					var cherrytag = JSON.parse($(this).attr('data-cherry'));
					var data = cherry.pluck(file, cherrytag.id);

          console.log("templating... ", cherrytag.type );

          // markdown or text
          if(cherrytag.type == 'markdown') {
            data = marked(data);
            $(this).html(data);
          } else {
            $(this).text(data);
          }

					$(this).attr('data-cherry', null);
				});
				fs.writeFile(__dirname + cherry.data.config.site_dir + file, $.html(), function (err) {
					if (err) throw err;
					console.log(file, "saved.");
				});
			});

		});

	});
  res.render('page', { title: 'Cherry cms', message: "generated", file: req.params.file, content: cherry.data });
};



/*
	Save the data as a JSON file
 */
cherry.saveData = function() {

	var file = __dirname + cherry.data.config.data_file;
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
app.post('/cherrycms/ingest', cherry.ingest);



/*
	Spin up the server
 */
http.createServer(app).listen(app.get('port'), function(){
  console.log('Starting the CherryCMS server');
	console.log('Visit http://localhost:' + app.get('port') + '/cherrycms to manage your content.');
});


