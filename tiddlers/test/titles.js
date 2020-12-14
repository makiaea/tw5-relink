/*\

Tests relinking titles of other tiddlers.

\*/

var utils = require("test/utils");


function test(target, expected, options) {
	var text = target;
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	options.target = target
	var results = utils.relink({text: text}, options);
	var changed = options.wiki.getTiddler(expected);
	expect(changed).withContext("Expected tiddler '"+expected+"' to exist").not.toBeUndefined();
	expect(changed.fields.text).toBe(target); // the text should be the old target name
	expect(changed.fields.title).toEqual(expected);
	if (expected !== target) {
		expect(options.wiki.getTiddler(target)).toBeUndefined();
	}
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

function configTiddler(filter) {
	return {title: "$:/config/flibbles/relink-titles/filter", text: filter};
};

describe("titles", function() {

it("works at all", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(configTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>]"));
	test("$:/prefix/from here", "$:/prefix/to there", {wiki: wiki});
});

it("ignores unrelated tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(configTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>]"));
	test("$:/prefix/nothing", "$:/prefix/nothing", {wiki: wiki});
});

it("only takes first result from tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(configTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>] [removesuffix<fromTiddler>addsuffix[bad]]"));
	test("$:/prefix/from here", "$:/prefix/to there", {wiki: wiki});
});

/*
it("tries not to let you rename every single tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(configTiddler("[[Agent Smith]]"));
	test("bystander", "bystander", {wiki: wiki});
});
*/

it("doesn't infinitely loop over tiddlers", function() {
	var wiki = new $tw.Wiki();
	// The resulting tiddler from this would be applicable for renaming,
	// thus it might rename ad-infinitum if it doesn't check itself.
	wiki.addTiddler(configTiddler("[prefix<fromTiddler>addsuffix[-changed]]"));
	test("from here/sub", "from here/sub-changed", {wiki: wiki});
});

it("doesn't wipe the content of changed tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		configTiddler("[removeprefix<fromTiddler>prefix[/]addprefix<toTiddler>]"),
		{title: "from here/path"}]);
	test("from here/path/end", "to there/path/end", {wiki: wiki});
});

it("doesn't clobber existing tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		configTiddler("[match[A]addsuffix[B]]"),
		{title: "A"},
		{title: "AB", text: "original text"}]);
	var r = test("A", "A", {wiki: wiki, fails: 1});
	expect(r.wiki.getTiddler("AB").fields.text).toBe("original text");
});

"maybe handles malformed tiddlers gracefully??";

});