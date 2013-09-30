
var cherryglass = require("../cherryglass.js"),
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
		cherryglass.data.should.have.property('files');
		var type = typeof cherryglass.data.files;
		type.should.equal('object');
	});

	it("should populate the data object with a file object", function(){
		cherryglass.data.files.should.have.property('fixture-page-one.html');
	});

});


describe('cherryglass.getCherry()', function(){

	setup(function(){
		cherryglass.loadData(cherryglass.data.config.data_file);
	});

	it("should return an object when passed a file name and a cherry id", function(){
		var cherry = cherryglass.getCherry('fixture-page-one.html', 'cherry-one');
		var type = typeof cherry;
		type.should.equal('object');
	});

	it("should return a cherry object with the correct attributes", function(){
		var cherry = cherryglass.getCherry('fixture-page-one.html', 'cherry-one');
		cherry.id.should.equal("cherry-one");
		cherry.type.should.equal("text");
		cherry.value.should.equal("text value of cherry one in file one");
	});

});


describe('cherryglass.setCherry()', function(){

	var file, id, new_cherry;

	setup(function(){
		cherryglass.loadData(cherryglass.data.config.data_file);
		file = "fixture-page-one.html";
		id = "cherry-one";
	});

	it("should update a cherry value", function(){
		new_cherry = {
			value: "updated cherry one value"
		};
		cherryglass.setCherry(file, id, new_cherry);
		var cherry = cherryglass.getCherry(file, id);
		cherry.value.should.equal(new_cherry.value);
	});
	
	it("should update a cherry link href and text", function(){
		new_cherry = {
			value: "updated cherry one link text",
			href: "http://alink.test"
		};
		cherryglass.setCherry(file, id, new_cherry);
		var cherry = cherryglass.getCherry(file, id);
		cherry.value.should.equal(new_cherry.value);
		cherry.href.should.equal(new_cherry.href);
	});

	it("should update a label if provided", function(){
		new_cherry = {
			value: "updated cherry one with label",
			label: "a label value to display"
		};
		cherryglass.setCherry(file, id, new_cherry);
		var cherry = cherryglass.getCherry(file, id);
		cherry.value.should.equal(new_cherry.value);
		cherry.label.should.equal(new_cherry.label);
	});
	
	it("should update a help if provided", function(){
		new_cherry = {
			value: "updated cherry one with help",
			help: "a help value to display"
		};
		cherryglass.setCherry(file, id, new_cherry);
		var cherry = cherryglass.getCherry(file, id);
		cherry.value.should.equal(new_cherry.value);
		cherry.help.should.equal(new_cherry.help);
	});
	
	it("should add a cherry if it is not present in the data", function(){
		new_cherry = {
			id: "cherry-three",
			value: "a newly added cherry called three",
		};
		cherryglass.setCherry(file, new_cherry.id, new_cherry);
		var cherry = cherryglass.getCherry(file, id);
		cherry.should.have.property("id", id);
	});
	


	it("should update a collection entry");
	

});


describe("cherryglass.setFile()", function(){

	var existing_file, new_file, title;
	setup(function(){
		cherryglass.loadData(cherryglass.data.config.data_file);
		existing_file = "fixture-page-two.html";
		new_file = "fixture-page-three.html";
	});

	it("should do nothing if a file is already in the json", function(){
		cherryglass.setFile(existing_file, "a different title");
		cherryglass.data.files[existing_file].should.have.property("pagetitle","Fixture page two");
	});

	it("should add a file to the json if it not currently present ", function(){
		cherryglass.setFile(new_file, "Fixture page three is new");
		cherryglass.data.files[new_file].should.have.property("pagetitle","Fixture page three is new");
	});

	it("should enter an html file's title into the json");
	
	
	

});


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











