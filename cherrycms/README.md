GlassCherry CMS
===============

A very light CMS for adding manageable content to your static sites.


## Dependencies

- NodeJS
- NPM


## Installation

- Clone this repo into your site's project directory
- `cd cherrycms`
- install the dependancies with `npm install`



## Usage

- in the project route, run `node cherrycms` to start the admin site
- open your browser at `localhost:3000/cherrycms` to access the admin site
- GlassCherry will inspect your static html files and create a CMS admin site tailored to the "data cherries" that it finds in your markup. Details of the supported data-types and syntax are listed below and from within the admin site at `/cherrycsc/docs`



## Development

- A backlog of thoughts and features is on [trello](https://trello.com/b/N7FFSlle/cherry-cms)
- [Release notes](https://github.com/philhawksworth/cherrycms/wiki/Release-notes) availble on the wiki.


## Syntax

CherryCMS generates an admin site for you to manage the content in specific areas of your site. You can define content-manageable areas in your site by decorating your chose HTML elements with `data-cherry` attributes.

Different types of content types are available to specify in this way. For example:

The format for the <code>data-cherry</code> attributes is:

`data-cherry='{"name": "value", "name": "value", ...}'`

  For example:

`<h1 data-cherry='{"id": "page-title", "type": "text"}'>Placeholder text</h1>`
<p>
  <code>id</code> and <code>type</code> are the only mandatory attributes in cherries.
</p>

<h3>Cherry attributes</h3>
<dl>
  <dt><code>"id": "any string"</code></dt><dd>A unique identifier on the page for this content. Displayed as a label for the field in the admin pages if no label is explicitly provided.</dd>
  <dt><code>"label": "any string"</code></dt><dd>A label for displaying with the field in the admin pages.</dd>
  <dt><code>"help": "any string"</code></dt><dd>Descriptive content displayed in the admin pages to give guidance for the purpose or usage of this field.</dd>
</dl>
<h3>Cherry types</h3>
<dl>
  <dt><code>"type": "text"</code></dt><dd>Provides a simple text element for management. Good for short string substitutions.</dd>
  <dt><code>"type": "blob"</code></dt><dd>Provides a larger text element for management. Shows as a textarea in the admin pages. Good for longer sections of text but supports no formatting other than paragraphs.</dd>
  <dt><code>"type": "markdown"</code></dt><dd>Provides a larger text element for management. Shows as a textarea in the admin pages and supports markdown for simple formatting.</dd>
  <dt><code>"type": "img"</code></dt><dd>Provides management of the source of an image asset. THe admin pages will show an image upload form.</dd>
  <dt><code>"type": "collection"</code></dt><dd>Provides a nested, repeatable set of elements. The admin pages give the option to add new elements within that collection</dd>

</dl>

Content is managed within the context of the page it appears on.
