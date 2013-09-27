var fs = require('fs'),
		extend = require('extend'),
		path = require('path');


var cherryglass = {
	data: {
		config: {
			data_file: "db.test.json"
		}
	}
};



/**
* getCherry : get the cherry data from the store
* The optional entry parameter alows us to access child cherries in collections.
*
* @param {String}	file
* @param {String} id
* @param {Int} entry
*/
cherryglass.getCherry = function(file, id, entry) {
	return cherryglass.data.files[file].cherries[id];
};


/**
* setCherry : set the cherry data in the store*
* The optional entry parameter alows us to access child cherries in collections.
* The cherry object contains all cherry data.
*
* @param {String}	file
* @param {String} id
* @param {Object} cherry
* @param {Int} entry
*/
cherryglass.setCherry = function(file, id, cherry, entry) {

};


/**
* loadData : read the data store from the file system into the data object.
*
* @param {String}	file
*/
cherryglass.loadData = function(file) {
	var contents = fs.readFileSync(__dirname + "/" + file, 'utf-8');
	cherryglass.data.files = JSON.parse(contents);
};


/**
* writeData : wrote the data store back to the file system
*
* @param {String}	data
* @param {String}	file
*/
cherryglass.writeData = function(data) {

};


module.exports = cherryglass;








