var express = require('express'),
		http = require('http'),
		path = require('path'),
		cheerio = require('cheerio'),
		fs = require('fs'),
		cons = require('consolidate'),
		swig = require('swig'),
		ncp = require('ncp').ncp;

var app = express();

var cherry = {
		data : {},
		src_dir : __dirname + "/../src/",
		site_dir : __dirname + "/../site/"
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


app.use(express.static(path.join(__dirname, 'public')));



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
	Render the main admin page
 */
cherry.admin = function(req, res){
	res.render('admin', { title: 'cherry cms', message: "Welcome", content: cherry.data });

	ncp.limit = 16;
	ncp(cherry.src_dir, cherry.site_dir, function (err) {
		if (err) {
			return console.error(err);
		}
		console.log('Site files copied');
	});
};


/*
	update the values on a given page
*/
cherry.update = function(req, res){
	res.render('admin', { title: 'cherry cms', message: "Updated", content: cherry.data });//
};


/*
	lodge an element in the model for management
 */
cherry.lodge = function(file, title, type, id, value) {
	if(!cherry.data[file]) {
		cherry.data[file] = {"pagetitle": title, "cherries":[]};
	}
	cherry.data[file].cherries.push({
		"id" : id,
		"type" : type,
		"value" : value
	});
};


/*
	Parse the src of the site and create the model, ready for use.
 */
cherry.pick = function() {

	fs.readdir(cherry.src_dir, function(err, files) {

		files.filter( function(file) {
			return file.substr(-5) == '.html';
		})
		.forEach( function(file) {

			fs.readFile(cherry.src_dir + file, 'utf-8', function(err, contents) {
				if (err) throw err;

				console.log("Reading",file,"...");
				var $ = cheerio.load(contents);
				var title = $('title').text();

				// parse a data cherry and lodge it in the model.
				$('[data-cherry]').each(function(i, elem) {
					var cherrytag = $(this).attr('data-cherry').split(":");
					cherry.lodge(
						file,
						title,
						cherrytag[0],
						cherrytag[1],
						$(this).text()
					);
				});

			});

		});

	});

};




//
// Define routes
//
// app.get('/', cherry.site); 				// TODO: Add wildcard routing for all other than /cherrycms/*
app.get('/cherrycms', cherry.admin);  	// TODO: Add wildcard routing
app.post('/cherrycms', cherry.update);	// TODO: Add wildcard routing





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


