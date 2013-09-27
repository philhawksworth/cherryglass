SRC = tests/db.test.js

test:
	@./node_modules/.bin/mocha \
		--reporter spec

.PHONY: test