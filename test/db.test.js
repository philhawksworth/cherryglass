
var cherryglass = require("../db.js"),
    assert = require('should');


// setup the fixtures
cherryglass.data.config.data_file = "test/fixtures/db.test.json";





describe('Defaults', function(){

  it("should have a data and config properties", function(){
    cherryglass.should.have.property('data');
    cherryglass.data.should.have.property('config');
  });

  it('should have defaults stored', function(){
    var config = cherryglass.data.config;
    config.should.have.property("data_file", "test/fixtures/db.test.json");
  });

});


describe('cherryglass.loadData()', function(){

  setup(function(){
    cherryglass.loadData(cherryglass.data.config.data_file);
  });

  it("should add a files object to cherryglass.data", function(){
    // cherryglass.loadData(cherryglass.data.config.data_file);
    cherryglass.data.should.have.property('files');
    var type = typeof cherryglass.data.files;
    type.should.equal('object');
  });

  it("should populate the data object with a file object", function(){
    // cherryglass.loadData(cherryglass.data.config.data_file);
    cherryglass.data.files.should.have.property('fixture-page-one.html');
  });

});


describe('cherryglass.getCherry()', function(){

  setup(function(){
    cherryglass.loadData(cherryglass.data.config.data_file);
  });

  it("should return an object when passed a file name and a cherry id", function(){
    // cherryglass.loadData(cherryglass.data.config.data_file);
    var cherry = cherryglass.getCherry('fixture-page-one.html', 'cherry-one');
    var type = typeof cherry;
    type.should.equal('object');
  });

  it("should return a cherry object with the correct attributes", function(){
    // cherryglass.loadData(cherryglass.data.config.data_file);
    var cherry = cherryglass.getCherry('fixture-page-one.html', 'cherry-one');
    cherry.id.should.equal("cherry-one");
    cherry.type.should.equal("text");
    cherry.value.should.equal("text value of cherry one");
  });

});










