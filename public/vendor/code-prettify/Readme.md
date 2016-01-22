# Code Prettify

Initially ported from http://google-code-prettify.googlecode.com/svn/trunk/

## Usage

The prettify script is AMD compatible and can be used modularly. Here is an example of it in an AMD module:

```javascript
define(['jquery', 'prettify'], function($, prettify){
	var code = null;
	$('pre').addClass('prettyprint').each(function(idx, el){
			code = el.firstChild;
			code.innerHTML = prettify.prettyPrintOne(code.innerHTML);
		})
	);
});
```

This version of code-prettify defines an anonymous module, which is more flexible.  To allow your AMD loader to find code-prettify with a more convenient name, map a path to it as follows:

```js
// using RequireJS
require.config({
	prettify: 'bower_components/code-prettify/prettify'
});

// using curl.js
curl.config({
	prettify: 'bower_components/code-prettify/prettify'
});
```

Or it may just be used in a global context like the following:

```javascript
(function(){
	$('pre').addClass('prettyprint');
	prettyPrint();
})();
```

More information can be found in the original [README.html](http://google-code-prettify.googlecode.com/svn/trunk/README.html)
