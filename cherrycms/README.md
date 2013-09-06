# Cherry CMS

A very lightweight CMS for your static sites.


## Installation

- clone the repo
- `npm install`


## Dependencies

- NodeJS
- NPM


## Usage

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
