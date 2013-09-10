cherrycms
=========

A very light CMS for adding manageable content to your static sites.

[Release notes](https://github.com/philhawksworth/cherrycms/wiki/Release-notes) availble on the wiki.


## Installation

- Clone this repo
- `cd cherrycms`
- install the dependancies with `npm install`


## Usage

- from the project route the `src` directory contains the static site which is to be cherry picked.
- in the project route, run `node cherrycms/cherry.js` to build a model of the manageble data and start the server
- open your browser at `localhost:3000/cherrycms` to access the admin site
- Accessing `localhost:3000/generate` will generate a static site from your managed content.



## Development

A backlog of thoughts and features is on [trello](https://trello.com/b/N7FFSlle/cherry-cms)

