backpack
======

[![Build Status](https://img.shields.io/travis/sw4/backpack.svg?style=flat-square)](https://travis-ci.org/sw4/backpack)
[![Dependency Status](https://img.shields.io/david/sw4/backpack.svg?style=flat-square)](https://david-dm.org/sw4/backpack)
[![devDependency Status](https://img.shields.io/david/dev/sw4/backpack.svg?style=flat-square)](https://david-dm.org/sw4/backpack#info=devDependencies)
[![License](http://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](https://github.com/sw4/backpack/blob/master/LICENSE-MIT.md)
[![Issues](https://img.shields.io/github/issues/sw4/backpack.svg?style=flat-square)](https://github.com/sw4/backpack/issues)
[![Release](https://img.shields.io/github/release/sw4/backpack.svg?style=flat-square)](https://github.com/sw4/backpack/releases)
[![Status](https://badge.fury.io/gh/sw4%2Fbackpack.png)](https://github.com/sw4/backpack)
[![NPM](https://badge.fury.io/js/backpack.png)](https://www.npmjs.org/package/backpack)

backpack.js (backpack-js, Backpack, backpack) is a Node.js module to allow users to create custom builds of your project from your website. Backpack is designed to run on a Node.js server deployment, and listens for a custom build selection to be requested, assembles it, and pushes it back to the client in `.ZIP` form.

`$ npm install backpack-js --save-dev`

How to use
---


Backpack Configuration (backpack.json)
-----

You will need to create a `backpack.json` file in your project directory. This file contains all settings related to your project's modules, and how to conduct a customised build. An example can be found in `examples\backpack.json`, the structure is e.g.:

```
{
    "url": "/backpack",
	"method":"POST",
    "modules": [
        {
            "name": "module1",
            "src": [
                {
                    "src": "location/of/a/script.js",
                    "dest": "javascript.js"
                }
            ]
        }
	]
}
```


####`url`
######(string) optional, defaults to `/backpack`

This is the URL backpack will listen to in order to trigger a custom build.

####`method` 
######(string) optional, defaults to `POST`

Either POST or GET. In conjunction with the URL, backpack will also check if the correct request method is being used (in case you want to use GET to serve the custom build page, and POST with the same URL to trigger it).

####`modules` 
######(array) required

Array of module definitions, here you set your module mappings, related assets and bundling.

####`modules/name` 
######(string) required

Name of the module, this is mapped to incoming requests to determine which modules are included in a build.

####`modules/src` 
######(array) required

List of files which constitute the module

####`modules/src/src` 
######(string) 

Path to file

####`modules/src/dest` 
######(string) optional, defaults to src value

Path/name to give the output file within the custom build. It is important to note that you can give multiple `src` entries accross different modules the same `dest` entry. Where two or more files are given the same `dest`, they are bundled together into a single file.


Server Configuration
-----
Assuming you have a node based server already set up, you will need to require backpack, then simply add `backpack(request, response)` within you `http.createServer` function, where `request` and `response` are the respective objects passed through that function.

An example of this can be found in `examples\server.js`

This will ensure backpack is listening to requests made from the client, and will pick up and respond to only those relating to a custom build request.


Client Configuration
-----
To launch a new custom build, you will need to create a request which matches the `url` and `method` in your `backpack.json`. At the simplest level, this would constitute an HTML form which POSTs data to `/backpack`

Backpack looks for the variable `backpack` in the request, representing an array of modules mapped to entries in `backpack.json`. An example form may look like (also see `example/index.html`):

```(html)
   <form method="post" action="backpack">
      <h1>Available Modules</h1>
      <label>Module 1
      <input type="checkbox" name="backpack[]" value="module1"/>
      </label>
      <label>Module 2
      <input type="checkbox" name="backpack[]" value="module2" />
      </label>
      <label>Module 3
      <input type="checkbox" name="backpack[]" value="module3"/>
      </label>
      <input type="submit"  id="submit" value="Build!" />
   </form>
```

Here, `module1`, `module2` etc relate to module name values in `backpack.json`. Backpack finds the correct module entry, then creates a build based on the `src` definitions of that module.
   
 ---------------------------------------------

<sup>[backpack](https://github.com/sw4/backpack), written by [SW4](https://github.com/sw4)</sup>
