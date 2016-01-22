var style = "style-newspaper";
var size = "size-large";
var margin = "margin-wide";

var baseHref = window.location.toString().match(/.*\//);


var linkStringStart = "javascript:(function(){";
var linkStringEnd   = "';_readability_script=document.createElement('SCRIPT');_readability_script.type='text/javascript';_readability_script.src='" + baseHref + "js/readability.js?x='+(Math.random());document.getElementsByTagName('head')[0].appendChild(_readability_script);_readability_css=document.createElement('LINK');_readability_css.rel='stylesheet';_readability_css.href='" + baseHref + "css/readability.css';_readability_css.type='text/css';_readability_css.media='screen';document.getElementsByTagName('head')[0].appendChild(_readability_css);_readability_print_css=document.createElement('LINK');_readability_print_css.rel='stylesheet';_readability_print_css.href='" + baseHref + "css/readability-print.css';_readability_print_css.media='print';_readability_print_css.type='text/css';document.getElementsByTagName('head')[0].appendChild(_readability_print_css);})();";

$(document).ready(function() {

	function applyChange(s,y) {
		var example = document.getElementById("example");
		var article = document.getElementById("articleContent");

		switch(s){
			case "style":
				style = y;
				break
			case "size":
				size = y;
				break
			case "margin":
				margin = y;
				break
		}
		example.className = style;
		article.className = margin + " " + size;
		$("#bookmarkletLink").attr("href", linkStringStart + "readStyle='" + style + "';readSize='" + size + "';readMargin='" + margin + linkStringEnd);
	}

	$("#settings input").bind("click", function(){
		applyChange(this.name, this.value);
	});
	$("#settings input").bind("click", function(){
		applyChange(this.name, this.value);
	});

});

