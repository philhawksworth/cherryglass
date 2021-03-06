
var cherryglass = require("../cherryglass.js"),
		assert = require('should');


// setup the fixtures
cherryglass.data.config.data_file = "test/fixtures/test.out.json";
cherryglass.data.config.fixtures = "test/fixtures/test.json";



describe('Defaults', function(){

	it("should have a data and config properties", function(){
		cherryglass.should.have.property('data');
		cherryglass.data.should.have.property('config');
	});

	it('should have defaults stored', function(){
		var config = cherryglass.data.config;
		config.should.have.property("data_file", "test/fixtures/test.out.json");
	});

});


describe('cherryglass.loadData()', function(){

	setup(function(){
		cherryglass.loadData("test/fixtures/test.json");
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
		cherryglass.loadData("test/fixtures/test.json");
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


describe("cherryglass.setFile()", function(){

	var existing_file, new_file, title;
	setup(function(){
		cherryglass.loadData("test/fixtures/test.json");
		existing_file = {
			name : "fixture-page-two.html",
			title : "Fixture page two title change"
		};
		new_file = {
			name : "fixture-page-three.html",
			title : "Fixture page three is new"
		};
	});

	it("should do nothing if a file is already in the json", function(){
		cherryglass.setFile(existing_file);
		cherryglass.data.files[existing_file.name].should.have.property("pagetitle","Fixture page two");
	});

	it("should add a file to the json if it not currently present ", function(){
		cherryglass.setFile(new_file);
		cherryglass.data.files[new_file.name].should.have.property("pagetitle","Fixture page three is new");
	});

});



describe('cherryglass.setCherry()', function(){

	var file, new_cherry;

	setup(function(){
		cherryglass.loadData("test/fixtures/test.json");
	});

	it("should update a cherry value", function(){
		new_cherry = {
			id: "cherry-one",
			value: "updated cherry one value"
		};
		file = {
			name: "fixture-page-one.html"
		};
		cherryglass.setCherry(file, new_cherry);
		var cherry = cherryglass.getCherry(file.name, new_cherry.id);
		cherry.value.should.equal(new_cherry.value);
	});

	it("should update a cherry link href and text", function(){
		file = {
			name: "fixture-page-one.html"
		};
		new_cherry = {
			value: "updated cherry one link text",
			href: "http://alink.test"
		};
		cherryglass.setCherry(file, new_cherry);
		var cherry = cherryglass.getCherry(file.name, new_cherry.id);
		cherry.value.should.equal(new_cherry.value);
		cherry.href.should.equal(new_cherry.href);
	});

	it("should update a label if provided", function(){
		file = {
			name: "fixture-page-one.html"
		};
		new_cherry = {
			value: "updated cherry one with label",
			label: "a label value to display"
		};
		cherryglass.setCherry(file, new_cherry);
		var cherry = cherryglass.getCherry(file.name, new_cherry.id);
		cherry.value.should.equal(new_cherry.value);
		cherry.label.should.equal(new_cherry.label);
	});
	
	it("should update help text if provided", function(){
		file = {
			name: "fixture-page-one.html"
		};
		new_cherry = {
			value: "updated cherry one with help",
			help: "a help value to display"
		};
		cherryglass.setCherry(file, new_cherry);
		var cherry = cherryglass.getCherry(file.name, new_cherry.id);
		cherry.value.should.equal(new_cherry.value);
		cherry.help.should.equal(new_cherry.help);
	});
	
	it("should add a cherry if it is not present in the data", function(){
		file = {
			name: "fixture-page-one.html"
		};
		new_cherry = {
			id: "cherry-three",
			value: "a newly added cherry called three",
		};
		cherryglass.setCherry(file, new_cherry);
		var cherry = cherryglass.getCherry(file.name, new_cherry.id);
		cherry.should.have.property("id", new_cherry.id);
	});
	
	it("should add a fle object to the data store if it doesn not exist", function(){
		file = {
			name : "file-four.html",
			title : "File four"
		};
		new_cherry = {
			id: "cherry-three",
			value: "a newly added cherry called three",
		};
		cherryglass.setCherry(file, new_cherry);
		cherryglass.data.files[file.name].should.have.property("pagetitle", file.title);
	});
	
	it("should update a collection entry");
	
});



describe("cherryglass.inspect()", function() {

	it("should return an empty array when no cherries are found", function(){
		var chs = cherryglass.inspect("<p>foo</p>");
		chs.should.have.property("length", 0);
	});
	
	it("should detect data-cherry-id attributes and return a cherry", function(){
		var chs = cherryglass.inspect("<p data-cherry-id='foo-cherry'>foo</p>");
		chs[0].id.should.equal("foo-cherry");
	});
	
	it("should detect data-cherry-id attributes and return a cherry with the inner html as the value", function(){
		var chs = cherryglass.inspect("<p data-cherry-id='foo-cherry'>foo</p>");
		chs[0].value.should.equal("foo");
	});

	it("should detect data-cherry-id and data-cherry-type attributes and return a cherry with the correct properties", function(){
		var chs = cherryglass.inspect("<p data-cherry-id='foo-cherry' data-cherry-type='the-type'>foo</p>");
		chs[0].type.should.equal("the-type");
	});

	it("should detect data-cherry-id and data-cherry-label attributes and return a cherry with the correct properties", function(){
		var chs = cherryglass.inspect("<p data-cherry-id='foo-cherry' data-cherry-label='the label'>foo</p>");
		chs[0].label.should.equal("the label");
	});

	it("should detect data-cherry-id and data-cherry-help attributes and return a cherry with the correct properties", function(){
		var chs = cherryglass.inspect("<p data-cherry-id='foo-cherry' data-cherry-help='some help text'>foo</p>");
		chs[0].help.should.equal("some help text");
	});

	it("should add an href attribute to cherries which are of the type, link", function(){
		var chs = cherryglass.inspect("<a data-cherry-id='foo-cherry' data-cherry-type='link' href='link-url'>link text</a>");
		chs[0].href.should.equal("link-url");
		chs[0].value.should.equal("link text");
	});

});












