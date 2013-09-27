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
    extend = require('extend'),
    DataStore = require("node-datastore");

var app = express();

var cherryglass = {
  data : {
    // defualts
    config : {
      src_dir : "/example",
      site_dir : "/../site",
      data_file : "/data.json"
    },
    files : {}
  }
};

module.exports = cherryglass;


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

  var file = req.params[0];

	// inspect the content posted from the form
	for(var node in req.body) {
		var cherrytag = node.split(":");
    var href = null;
    if(cherrytag[0] == "href") {
      href = req.body[node];
    } else if (cherrytag[0] == "collection") {

    }

    // files[file].cherries[id].entry[index].cherries[childid].value = foo;


    cherryglass.update(file, cherrytag[1], req.body[node], href);
	}

	// render a confirmation
	res.render('page', { title: 'cherry cms', message: "saved", file: file, content: cherryglass.data.files });
};


/**
*	lodge an element in the model for management
*
*  @param {String} file
*  @param {String} title
*  @param {Object} data
*/
cherryglass.lodge = function(file, title, data) {

  // Defaults to extend.
  var obj = {
     "type": null,
     "id": null,
     "value": ""
  };
  obj = extend(obj, data);

	if(!cherryglass.data.files[file]) {
		cherryglass.data.files[file] = {"pagetitle": title, "cherries": {}};
	}
  cherryglass.data.files[file].cherries[obj.id] = obj;
  cherryglass.saveData();
};


/*
  update the stored value of a data cherry
 */
cherryglass.update = function(file, id, value, href, entry) {

  targetCherry = cherryglass.data.files[file].cherries[id];

  targetCherry.value = value;
  if (href) {
    targetCherry.href = href;
  }
  if (entry) {
   targetCherry.entries[entry.index].cherries[entry.cherry.id].value = entry.cherry.value;
  }


  cherryglass.saveData();
};


/**
*	pluck the data for a cherry from the data store
*
* @param {String} file
* @para, {String} id
* @return {Object}
*/
cherryglass.pluck = function(file, id) {
	return cherryglass.data.files[file].cherries[id];
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
              cherryglass.lodge(file.replace(__dirname + cherryglass.data.config.src_dir + "/", ""), title, cherry_obj);
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
  Clone a directory
 */
// cherry.clone = function(source, dest) {
//   console.log("Clone: ", source, dest );
//   ncp(source, dest, function (err) {
//     if (err) {
//       return console.error(err);
//     }
//   });
// };


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
        // also remove the data-cherry attributes to eliminate any smells
        $('[data-cherry-id]').each(function(i, elem) {
          var cherrytag = {
            id: $(this).attr('data-cherry-id'),
            type: $(this).attr('data-cherry-type')
          };
          var data = cherryglass.pluck(file, cherrytag.id);

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


/*
	Save the data as a JSON file
 */
cherryglass.saveData = function() {
	var file = __dirname + cherryglass.data.config.data_file;
	var data = JSON.stringify(cherryglass.data);
	fs.writeFile(file, data, function (err) {
		if (err) throw err;
	});
};


/*
 Add a cherry to the data store
 */
cherryglass.addCherry = function(obj) {
  db.insertRow(obj);
  var r = getRowByIndex(obj.id);
  console.log("new row: ", r);
};


cherryglass.initdb = function() {

  var store = {
    files: {},
    globals: {}
  };
  cherryglass.db = new DataStore(store);

};


/*
   Define routes
*/
app.get('/cms', cherryglass.admin);
app.get('/cms/page/*', cherryglass.showDataForm);
app.post('/cms/page/*', cherryglass.contentSubmission);
app.get('/cms/generate', cherryglass.generate);
app.get('/cms/docs', cherryglass.docs);
app.post('/cms/ingest', cherryglass.ingest);

cherryglass.initdb();


/*
	Spin up the server
 */
http.createServer(app).listen(app.get('port'), function(){
  console.log('Starting the CherryCMS server');
	console.log('Visit http://localhost:' + app.get('port') + '/cms to manage your content.');
});
