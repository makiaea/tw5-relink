/*\
module-type: relinkoperator
title: $:/plugins/flibbles/relink/js/relinkoperations/title.js
type: application/javascript

Renames tiddlers which have titles derived from fromTitle. Then it makes
sure that those tiddlers are properly relinked too.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var configTiddler = "$:/config/flibbles/relink/titles/filter"; 
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');
var language = require("$:/plugins/flibbles/relink/js/language.js");

var TitleEntry = EntryNode.newType("ghost");

TitleEntry.prototype.report = function() {
	return ["title: " + this.output];
};

exports['title'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var filter = getFilter(fromTitle, toTitle, options);
	var widget = getWidget(fromTitle, toTitle, options);
	var outTitle = filter.call(options.wiki, [tiddler.fields.title], widget);
	if (outTitle[0]) {
		var entry = new TitleEntry();
		entry.output = outTitle[0];
		changes.title = entry;
	}
};

function getWidget(fromTitle, toTitle, options) {
	// we cache the dummy widget in options, so we only need one for an entire
	// relink operation
	if (!options.__titlesWidget) {
		var parentWidget = options.wiki.makeWidget();
		parentWidget.setVariable('fromTiddler', fromTitle);
		parentWidget.setVariable('toTiddler', toTitle);
		options.__titlesWidget = options.wiki.makeWidget(null, {parentWidget: parentWidget});
	}
	return options.__titlesWidget;
};

function getFilter(fromTitle, toTitle, options) {
	return options.wiki.getCacheForTiddler(configTiddler, "relinkFilter", function() {
		var tiddler = options.wiki.getTiddler(configTiddler);
		if (tiddler && tiddler.fields.text) {
			var compiled = options.wiki.compileFilter(tiddler.fields.text);
			var widget = getWidget(fromTitle, toTitle, options);
			var testOutput = compiled.call(options.wiki, [configTiddler], widget);
			if (testOutput.length > 0) {
				// If this filter would even change the tiddler containing
				// the filter, then it's GOT to be wrong.
				language.alert("This filter is dangerous");
			} else {
				return compiled;
			}
		}
		return function() { return []; };
	});
};
