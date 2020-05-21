/*\
module-type: relinkmarkdowntextrule

Handles markdown links

[caption](#link)

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");
var settings = require("$:/plugins/flibbles/relink/js/settings");
var wikitext = settings.getType('wikitext');

function MarkdownLinkEntry() {};
MarkdownLinkEntry.prototype.name = "markdownlink";
MarkdownLinkEntry.prototype.report = function() {
	var output = [];
	if (this.captionEntry) {
		var link = this.link;
		$tw.utils.each(this.captionEntry.report(), function(report) {
			output.push("[" + (report || '') + "](#" + link + ")");
		});
	};
	if (this.linkChanged) {
		var safeCaption = this.caption.replace(/\s+/mg, ' ');
		if (safeCaption.length > exports.reportCaptionLength) {
			safeCaption = safeCaption.substr(0, exports.reportCaptionLength) + "...";
		}
		output.push("[" + safeCaption + "](#)");
	}
	return output;
};

MarkdownLinkEntry.prototype.eachChild = function(method) {
	if (this.captionEntry) {
		method(this.captionEntry);
	}
};

exports.name = "markdownlink";
exports.types = {inline: true};

// This is the maximum length a reported caption may be
exports.reportCaptionLength = 15;

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	this.start = startPos-1;
	this.endMatch = undefined;
	do {
		this.start = this.parser.source.indexOf('[', this.start+1);
		if (this.start < 0) {
			return undefined;
		}
		this.caption = this.getEnclosed(this.parser.source, this.start, '[', ']');
		if (this.caption === undefined) {
			continue;
		}
		var linkStart = this.start + this.caption.length+2;
		if (this.parser.source[linkStart] !== '(') {
			continue;
		}
		var internalStr = this.getEnclosed(this.parser.source, linkStart, '(', ')');
		if (internalStr === undefined) {
			continue;
		}
		this.closeRegExp = /^(\s*#)([\S]+)(\s*)$/;
		this.endMatch = this.closeRegExp.exec(internalStr);
	} while (!this.endMatch);
	return this.start;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = new MarkdownLinkEntry(),
		em = this.endMatch,
		modified = false,
		fromEncoded = utils.encodeLink(fromTitle),
		caption = this.caption,
		link = em[2];
	this.parser.pos = this.start + this.caption.length + em[0].length + 4;
	var newCaption = wikitext.relink(caption, fromTitle, toTitle, options);
	if (newCaption) {
		modified = true;
		entry.captionEntry = newCaption;
		if (newCaption.output) {
			if (this.canBeCaption(newCaption.output)) {
				caption = newCaption.output;
			} else {
				newCaption.impossible = true;
			}
		}
	}
	if (link === fromEncoded) {
		modified = true;
		entry.linkChanged = true;
		link = toTitle;
	}
	if (modified) {
		entry.link = link;
		entry.caption = caption;
		// This way preserves whitespace
		entry.output = "["+caption+"]("+em[1]+utils.encodeLink(link)+em[3]+")";
		return entry;
	}
	return undefined;
};

exports.canBeCaption = function(caption) {
	return this.indexOfClose(caption+']', -1, '[', ']') === caption.length;
};

exports.getEnclosed = function(text, pos, openChar, closeChar) {
	var capEnd = this.indexOfClose(text, pos, openChar, closeChar);
	if (capEnd < 0) {
		return undefined;
	}
	var enclosed = text.substring(pos+1, capEnd);
	if (enclosed.match(/\n\s*\n/)) {
		// Paragraph breaks are not allowed
		return undefined;
	}
	return enclosed;
};

exports.indexOfClose = function(text, pos, openChar, closeChar) {
	var close = pos-1,
		open = pos; // First char is open
	do {
		close = text.indexOf(closeChar, close+1);
		if (close < 0) {
			return -1;
		}
		open = text.indexOf(openChar, open+1);
	} while (open >= 0 && open <= close);
	return close;
};