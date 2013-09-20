CherryGlass CMS
===============

A very light CMS for adding manageable content to your static sites.


## Dependencies

- NodeJS
- NPM


## Installation

- Clone this repo into your site's project directory
- `cd cherryglass`
- install the dependancies with `npm install`



## Usage

- in the project route, run `node cherryglass` to start the admin site
- open your browser at `localhost:3000/cms` to access the admin site
- CherryGlass will inspect your static html files and create a CMS admin site tailored to the "data cherries" that it finds in your markup. Details of the supported data-types and syntax are listed below and from within the admin site at `/cms/docs`



## Development

- [Release notes](https://github.com/philhawksworth/cherryglass/wiki/Release-notes) availble on the wiki.


## Syntax

CherryGlass CMS generates an admin site for you to manage the content in specific areas of your site. You can define content-manageable areas in your site by decorating your chose HTML elements with `data-cherry` attributes.

Different types of content types are available to specify in this way. For example:

The format for the <code>data-cherry</code> attributes are:

<pre>&lt;h1 data-cherry-id="page-title" data-cherry-type="text"&gt;Placeholder text&lt;/h1&gt;</pre>

<code>id</code> and <code>type</code> are the only mandatory attributes in cherries.


### Cherry attributes

<dl>
  <dt><code>data-cherry-id="any string"<code></dt><dd>(required) A unique identifier on the page for this content. Displayed as a label for the field in the admin pages if no label is explicitly provided.</dd>
  <dt><code>data-cherry-type="[text | blob | markdown | img | link | collection]"</code></dt><dd>(required) Defining the type of content to deliver through the admin UI. Details below</dd>
  <dt><code>data-cherry-label="any string"</code></dt><dd>(optional) A label for displaying with the field in the admin pages.</dd>
  <dt><code>data-cherry-help="any string"</code></dt><dd>(optional) Descriptive content displayed in the admin pages to give guidance for the purpose or usage of this field.</dd>
</dl>

### Cherry types

<dl>
  <dt><code>data-cherry-type="text"</code></dt><dd>Provides a simple text element for management. Good for short string substitutions.</dd>
  <dt><code>data-cherry-type="blob"</code></dt><dd>Provides a larger text element for management. Shows as a textarea in the admin pages. Good for longer sections of text but supports no formatting other than paragraphs.</dd>
  <dt><code>data-cherry-type="markdown"</code></dt><dd>Provides a larger text element for management. Shows as a textarea in the admin pages and supports markdown for simple formatting.</dd>
  <dt><code>data-cherry-type="link"</code></dt><dd>Provides management of the href and text of a link. The admin pages will show two text input fields as appropriate</dd>
  <dt><code>data-cherry-type="img"</code></dt><dd>(Not yet implemented) Provides management of the source of an image asset. The admin pages will show an image upload form.</dd>
  <dt><code>data-cherry-type="collection"</code></dt><dd>(Not yet implemented) Provides a nested, repeatable set of elements. The admin pages give the option to add new elements within that collection</dd>
</dl>

Content is managed within the context of the page it appears on.
