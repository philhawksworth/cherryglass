
var cherryglass = require("../"),
    fs = require('fs'),
    read = fs.readFileSync,
    assert = require('should');



// setup fixtures to use example site.
// cherryglass.data.config.src_dir = "/example";
// cherryglass.data.config.site_dir = "/../site";
// cherryglass.data.config.data_file = "/data.json";


// describe('Defaults', function(){

//   it("should have a data and config properties", function(){
//     cherryglass.should.have.property('data');
//     cherryglass.data.should.have.property('config');
//   });

//   it('should have defaults stored', function(){
//     var config = cherryglass.data.config;
//     config.should.have.property("src_dir", "/example");
//     config.should.have.property("site_dir", "/../site");
//     config.should.have.property("data_file", "/data.json");
//   });

// });




/*

Routes

Parsing
  text
  blob
  markdown
  link
  image
  collection

Storage
  Save cherry
  Update cherry
  Get cherry

Files
  Read source directory
  Write site directory
  Replicate source directory
  Output datastore as json

Manipulation
  Replace
  Cleanup


 */







