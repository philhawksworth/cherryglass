GlassCherry CMS
===============

A very light CMS for adding manageable content to your static sites.


## Installation

- Clone this repo into your site's project directory
- `cd cherrycms`
- install the dependancies with `npm install`


## Usage

- from the project route the `src` directory contains the static site which is to be cherry picked.
- in the project route, run `node cherrycms/cherry.js` to build a model of the manageble data and start the server
- open your browser at `localhost:3000/cherrycms` to access the admin site
- Accessing `localhost:3000/generate` will generate a static site from your managed content.



## Development

- A backlog of thoughts and features is on [trello](https://trello.com/b/N7FFSlle/cherry-cms)
- [Release notes](https://github.com/philhawksworth/cherrycms/wiki/Release-notes) availble on the wiki.



## Installation

- clone the repo
- `npm install`


## Dependencies

- NodeJS
- NPM


## Syntax

CherryCMS generates an admin site for you to manage the content in specific areas of your site. You can define content-manageable areas in your site by decorating your chose HTML elements with `data-cherry` attributes.

Different types of content types are available to specify in this way. For example:

<table>
  <tr>
    <td>`data-cherry="text:Page-title"`</td><td>Plain text field, identified as Page title</td>
  </tr>
  <tr>
    <td>`data-cherry="markdown:Intro"`</td><td>A text field capable of interpreting markdown, identified as Intro</td>
  </tr>
  <tr>
    <td>`data-cherry="img:Hero"`</td><td>An image asset, identified on the page as Hero</td>
  </tr>
</table>


Content is managed within the context of the page it appears on.
