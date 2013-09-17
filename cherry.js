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

var cherry = {
  data : {
    // defualts.
    config : {
      src_dir : "/example",
      site_dir : "/../site",
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
  Recursively walk a directory structure
 */
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
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
	res.render('page', { title: 'Cherry CMS', message: req.params[0], file: req.params[0], content: cherry.data.files });
};


/*
	update the values on a given page
*/
cherry.contentSubmission = function(req, res){

  var file = req.params[0];

	// inspect the content posted from the form
	for(var node in req.body) {
		var cherrytag = node.split(":");
    var href = null;
    if(cherrytag[0] == "href") {
      href = req.body[node];
    }

    console.log("element",  cherrytag[1], href);


    cherry.update(file, cherrytag[1], req.body[node], href);
	}

	// render a confirmation
	res.render('page', { title: 'cherry cms', message: "saved", file: file, content: cherry.data.files });
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
     "href" : null,
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
cherry.update = function(file, id, value, href) {
  cherry.data.files[file].cherries[id].value = value;

console.log("args:", arguments);


  if (href) {
    cherry.data.files[file].cherries[id].href = href;
  }
  cherry.saveData();
};


/*
	pluck the data for a cherry from the data store
 */
cherry.pluck = function(file, id) {
	return cherry.data.files[file].cherries[id];
};


/*
  Generate the CMS Admin by ingesting the HTML or JSOM file
*/
cherry.ingest = function(req, res){

  var message = "ingested";

  // store the config options from the form
  cherry.data.config.data_file = req.body['datafile'];
  cherry.data.config.src_dir = req.body['source'];
  cherry.data.config.site_dir = req.body['output'];

  // TODO : create the output directory if it doesn't already exist.

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

  walk(__dirname + cherry.data.config.src_dir, function(err, results) {
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
              value:  $(this).html()
            };

            // also handle link types
            if(cherry_obj.type == 'link'){
              cherry_obj.href = $(this).attr('href');
            }

            cherry.lodge(file.replace(__dirname + cherry.data.config.src_dir + "/", ""), title, cherry_obj);
          });

        });
      });
  });

};

/*
  Clone a directory
 */
cherry.clone = function(source, dest) {
  console.log("Clone: ", source, dest );
  ncp(source, dest, function (err) {
    if (err) {
      return console.error(err);
    }
  });
};


cherry.inject = function() {


  var out_dir = __dirname + cherry.data.config.site_dir;
  var source_dir = __dirname + cherry.data.config.src_dir;

  // make the substitutions
  fs.readdir(out_dir, function(err, files) {

    if (err) {
      return console.error(err);
    }

    files.filter( function(file) {
      return file.substr(-5) == '.html';
    })
    .forEach( function(file) {

      fs.readFile(out_dir + "/" + file, 'utf-8', function(err, contents) {
        if (err) throw err;
        var $ = cheerio.load(contents);

        // parse a data cherry and replace its content with that found in the model.
        // also remove the data-cherry attributes to eliminate any smells
        $('[data-cherry-id]').each(function(i, elem) {
          var cherrytag = {
            id:     $(this).attr('data-cherry-id'),
            type:   $(this).attr('data-cherry-type')
          };
          var data = cherry.pluck(file, cherrytag.id);

          // markdown or text or link
          if(cherrytag.type == 'markdown') {
            data = marked(data.value);
            $(this).html(data);
          } else if (cherrytag.type == 'link') {
            $(this).text(data.value);
            $(this).attr('href', data.href );
          } else {
            $(this).text(data.value);
          }

          // clean up so that we leave no smellsin the markup
          $(this).attr('data-cherry-id', null);
          $(this).attr('data-cherry-type', null);
          $(this).attr('data-cherry-help', null);
          $(this).attr('data-cherry-label', null);
        });

        // write the file
        fs.writeFile(out_dir + "/" + file, $.html(), function (err) {
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
cherry.generate = function(req, res){

  var out_dir = __dirname + cherry.data.config.site_dir;
  var source_dir = __dirname + cherry.data.config.src_dir;

  // clean up or create the output directory and
  // replicate the source directory as the output
  if (fs.existsSync(out_dir)) {
    console.log("CLeaning output directory.");
      rimraf(out_dir, function() {
        console.log("output cleaned");
        ncp(source_dir, out_dir, function (err) {
          if (err) {
            return console.error(err);
          }
          cherry.inject();
        });

     });
  } else {
    ncp(source_dir, out_dir, function (err) {
      if (err) {
        return console.error(err);
      }
      cherry.inject();
    });
  }

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
	});
};


/*
   Define routes
*/
app.get('/cherrycms', cherry.admin);
app.get('/cherrycms/page/*', cherry.showDataForm);
app.post('/cherrycms/page/*', cherry.contentSubmission);
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
