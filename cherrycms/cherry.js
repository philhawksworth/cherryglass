
var express = require('express'),
    http = require('http'),
    path = require('path'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    cons = require('consolidate'),
    swig = require('swig');

var app = express();

var cherry = {
    data : [],
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
  Render the main admin page
 */
cherry.admin = function(req, res){
  res.render('admin', { title: 'cherry cms', content: cherry.data });//
};




/*
  Find the targets in the inspected files.
 */
cherry.findtargets = function(contents) {
    var $ = cheerio.load(contents);
    var targets = $("[data-cherry]");

    var content_api = {
        'text': function(el) { return el.children[0].data; },
        'markdown': function(el) { return el.children[0].data; },
        'img': function(el) { return el.src; }
        // 'markdown': function(el) { return el.children[0].data; },

    };


    for (var i = 0; i < targets.length; i++) {
        var ch = targets[i].attribs['data-cherry'].split(":");

        // console.log("targets", targets[i]);
        // console.log("this", content_api[ch[0]](targets[i]));
        var item = {
            "id" : ch[1],
            "type" : ch[0]
        };
        cherry.data.push(item);
    }
    console.log("data", cherry.data);
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
          // console.log(file);
          fs.readFile(cherry.src_dir + file, 'utf-8', function(err, contents) {
              if (err) throw err;
              // console.log(contents);
              cherry.findtargets(contents);
          });
      });
  });
};




//
// Define routes
//
app.get('/cherrycms', cherry.admin);




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


