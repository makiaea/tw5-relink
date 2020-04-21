/*\

Tests macros.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options.wiki.addTiddlers([
		utils.macroConf("test", "Btitle"),
		utils.macroConf("test", "Clist", "list"),
		utils.macroConf("test", "Dref", "reference"),
		utils.macroConf("test", "Ewiki", "wikitext"),
		{title: "testMacro", tags: "$:/tags/Macro",
		 text: "\\define test(A, Btitle, Clist, Dref, Ewiki) stuff\n"}
	]);
	var fields = Object.assign({text: text}, options.fields);
	var results = utils.relink(fields, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(options.fails || 0);
	return results;
};

describe("macro", function() {

it('argument orders', function() {
	testText("Macro <<test stuff 'from here' '[[from here]]' 'from here!!f'>>.");
	testText("Macro <<test stuff Clist:'[[from here]]' 'from here'>>.");
	testText("Macro <<test Btitle:'from here' stuff '[[from here]]'>>.");
	testText("Macro <<test Dref:'from here!!f' stuff 'from here'>>.");
	testText("Macro <<test Clist:'[[from here]]' stuff 'from here'>>.");
	testText("Macro <<test Dref:'from here!!f' Clist:'[[from here]]' stuff 'from here'>>.");
	testText("Macro <<test Ewiki: 'a [[from here]] b'>>.");
	testText("Macro <<test Ewiki: {{from}}>>.", "Macro <<test Ewiki: '{{to there}}'>>.", {from: "from"});
});

it("the '>' character", function() {
	// It's a tricky character. Allowed in some places, but not others
	// Allowed in standalone macrocalls
	testText("Macro <<test stuff My>val>>.", {from: "My>val", to: "to"});
	testText("Macro <<test stuff 'from here'>>.", "Macro <<test stuff 'My>val'>>.", {to: "My>val"} );
	testText("Macro <<test stuff from>>.", "Macro <<test stuff 'My>val'>>.", {from: "from", to: "My>val"});
});

it("block or inline", function() {
	// These ensure that trailing newlines are preserved if present
	// These are really tests that inline and block rules both work
	// in their own ways.
	testText("<<test stuff 'from here'>>\nOther text");
	testText("<<test stuff 'from here'>>\r\nOther text");
	testText("<<test stuff 'from here'>> Other text");
});

it("doesn't choke if attribute string == macro name", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("jsontiddlers", "filter", "filter"));
	testText("<<jsontiddlers jsontiddlers>>", "<<jsontiddlers to>>",
	         {wiki: wiki, from: "jsontiddlers", to: "to"});
});

it('core javascript macros', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("jsontiddlers", "filter", "filter"));
	wiki.addTiddler(utils.macroConf("testmodulemacro", "param", "filter"));
	testText("<<jsontiddlers '[title[from here]]'>>", {wiki: wiki});
	// look in macro-module.js for the custom macro module we're calling
	testText("<<testmodulemacro '[title[from here]]'>>", {wiki: wiki});
});

it('whitespace', function() {
	testText("Macro <<test\n  d\n  'from here'\n  '[[from here]]'\n>>.");
	testText("<<test\r\nd\r\n'from here'\r\n'[[from here]]'\r\n>>\r\n");
	testText("Macro <<test Clist   :   '[[from here]]'>>.");
	testText("Macro\n\n<<test stuff 'from here' '[[from here]]'>>\n\n");
});

it('quotation for new value', function() {
	function test(value, quotedOut) {
		testText("<<test Btitle:from>>",
		         "<<test Btitle:"+quotedOut+">>",
		         {from: "from", to: value});
	};
	test("cd", "cd");
	test("c\"\"' ]d", `"""c\"\"' ]d"""`);
	test('c"""\' d', '[[c"""\' d]]');
	test('c"""\' d', '[[c"""\' d]]');
	test('c""" ]d', '\'c""" ]d\'');
});

it('quotation of originalValue', function() {
	testText("<<test Btitle:'from here'>>");
	testText("<<test Btitle:[[from here]]>>");
	testText('<<test Btitle:"from here">>');
	testText('<<test Btitle:from>>', {from: "from", to: "to"});
	testText("<<test Btitle:from>>", "<<test Btitle:'to there'>>", {from: "from"});
	testText("<<test Btitle:    from    >>", {from: "from", to: "to"});
	testText('<<test Btitle:"""from here""">>');
	// Trick title. Old param parser choked on this.
	testText('<<test Btitle:from]] >>', {from: "from]]", to: "tothere"});
	// Doesn't use quotes when slashes present. This is important to me.
	testText('<<test Btitle:from/here>>', {from: "from/here", to: "to/there"});
	// they allow unquoted '<' as well, while attributes don't
	testText('<<test Btitle:from>>', {from: "from", to: "to<there"});
});

it('unquotable titles', function() {
	var to = `to''[]there"`;
	var ph = utils.placeholder;
	testText("Macro <<test stuff 'from here'>>.", ph(1,to)+"Macro <$macrocall $name=test A=stuff Btitle=<<relink-1>>/>.", {to: to});
	testText("<$link to=<<test stuff 'from here'>> />", {fails: 1, ignored: true, to: to});

	// This one is tricky because an unrelated attribute can't be quoted
	// the way it was in a macro invocation
	testText('X<<test A:g>t "from here">>Y', ph(1,to)+"X<$macrocall $name=test A='g>t' Btitle=<<relink-1>>/>Y", {to: to});

	// Even if the toTitle is okay. It can make a list unquotable
	var apos = "M[]'s";
	testText('X<<test Clist: \'[[from here]] C"\'>>Y',
	         ph("list-1",apos+' C"')+'X<$macrocall $name=test Clist=<<relink-list-1>>/>Y',
	         {to: apos});
});

it('unquotable wikitext', function() {
	// wikitext takes care of placeholding itself when it can.
	var to = "' ]]}}\"";
	var macro = utils.placeholder;
	testText("X<<test Ewiki: 'T <$link to=\"from here\" />'>>",
	         macro(1, to)+"X<<test Ewiki: 'T <$link to=<<relink-1>> />'>>",
	         {to: to});

	// but wikitext will still be wrapped if necessary
	to = "' \"]]}}"; // This can be wrapped in triple-quotes
	testText("X<<test Ewiki: 'T <$link to=\"from here\" />'>>",
	         macro("wikitext-1", 'T <$link to="""'+to+'""" />')+"X<$macrocall $name=test Ewiki=<<relink-wikitext-1>>/>",
	         {to: to});
});

it('undefined macros', function() {
	// Relink will try it's best to tolerate macro settings that have
	// no coreesponding macro definition, but it'll fail if there's a
	// chance it's not relinking when it should.
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("undef", "param", "title"));
	testText("<<undef something>> [[from here]]", {wiki: wiki});
	testText("<<undef param:'from here'>>", {wiki: wiki});
	testText("<<undef A B C D param:'from here'>>", {wiki: wiki});
	testText("<<undef 'from here'>>", {wiki: wiki,ignored: true,fails: 1});
	var to = `to''[]there"`;
	testText("<<undef param:'from here'>>", utils.placeholder(1,to)+"<$macrocall $name=undef param=<<relink-1>>/>", {wiki: wiki, to: to});
	// Relink CAN resolve the argument, since it's named, but it needs to
	// convert into a widget, which it can't do unless ALL arguments can
	// be named (which you can't do without the macro definition).
	// ALSO: it shouldn't make a placeholder if there's no point.
	testText("<<undef something param:'from here'>> [[from here]]",
	         "<<undef something param:'from here'>> [[A] '\"]]",
	         {wiki: wiki, to: "A] '\"", fails: 1});
});

it("undefined macros, multiple active parameters", function() {
	var to = `to''[]there"`;
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("undef", "param", "title"),
		utils.macroConf("undef", "list", "list")]);

	// Relink continues if one param couldn't resolve. Others might.
	testText("<<undef 'from here' param:'from here'>>",
	         "<<undef 'from here' param:'to there'>>",
	         {wiki: wiki, fails: 1});

	// Two failures, one can't be resolved. The other needs to downgrade
	// into a widget, but it can't because an unnamed parameter can't be
	// resolved.
	testText("<<undef 'from here' param:'from here'>>",
	         "<<undef 'from here' param:'from here'>>",
	         {wiki: wiki, fails: 2, to: to});

	// Super tricky. Both parameters can relink, but 'param' requires a
	// downgrade. But there's an unresolved anonymous param, so no
	// downgrade possible. Therefore, fail that, but process the other.
	testText("<<undef list:'[[from]]' param:'from' anon>> [[from]]",
	         `<<undef list:"""[[A] '\"]]""" param:'from' anon>> [[A] '\"]]`,
	         {wiki: wiki, fails: 1, from: "from", to: "A] '\""});
});

it('undefined macros, no anonymous params', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("undef", "A"));
	wiki.addTiddler(utils.macroConf("undef", "B"));

	// Relink should not find B, and that should be okay. Because there
	// aren't any anonymous parameters, so B can't be there, despite
	// there being no definition.
	testText("<<undef A:'from here'>>", {wiki: wiki});
});

it('imported macros', function() {
	function test(text, options) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			utils.macroConf("other", "param", "title"),
			utils.macroConf("ptr", "tiddler", "title"),
			utils.attrConf("$importvariables", "filter", "filter"),
			{title: "otherTiddler", text: "\\define other(A, param) X\n"},
			{title: "ptr", tags: "$:/tags/Macro", text: "\\define ptr(tiddler) $tiddler$\n"},
			{title: "otherRef", pointer: "otherTiddler"},
			{title: "newTest", text: "\\define test(Dref) X\n"}
		]);
		options = Object.assign({wiki: wiki}, options);
		testText(text, options);
	};
	test("\\import otherTiddler\n\n<<other Z [[from here]]>>");
	test("<$importvariables filter='A otherTiddler B'><<other Z [[from here]]>></$importvariables>");
	test("<$importvariables filter={{otherRef!!pointer}}><<other Z [[from here]]>></$importvariables>");
	test("<$importvariables filter={{{[all[current]get[pointer]]}}}><<other Z [[from here]]>></$importvariables>", {fields: {pointer: "otherTiddler"}});
	test("<$importvariables filter={{!!pointer}}><<other Z [[from here]]>></$importvariables>", {fields: {pointer: "otherTiddler"}});
	test("<$importvariables filter=<<ptr otherTiddler>>><<other Z [[from here]]>></$importvariables>");
	// If macro not imported. Arguments aren't resolved
	test("<<other Z [[from here]]>>", {ignored: true, fails: 1});
	// But arguments can be resolved anyway if they're named
	test("<<other Z param:[[from here]]>>");
	//imported takes priority over global
	test("\\import newTest\n\n<<test 'from here##index'>>");
	test("<$importvariables filter=newTest><<test 'from here##index'>></$importvariables>");
	//imported doesn't take priority if it's not imported though
	test("<<test Z 'from here'>>");
	//And importing something else doesn't goof up the lookup chain
	test("\\import otherTiddler\n\n<<test Z 'from here'>>");
	test("<$importvariables filter='otherTiddler'>\n\n<<test Z 'from here'>>\n\n</$importvariables>");

	// These are for when the importvariables needs updating before it
	// can be referenced. A rare scenario, but it could happen.
	test("\\import otherTiddler\n\n<<other Z otherTiddler>>", {from: "otherTiddler", to: "tothere"});
	test("<$importvariables filter='otherTiddler'><<other Z otherTiddler>></$importvariables>", {from: "otherTiddler", to: "toThereAgain"});
	test("<$importvariables filter={{otherRef!!pointer}}><<other Z otherRef>></$importvariables>", {from: "otherRef", to: "toThereAgain"});
	test("<$importvariables filter=<<ptr otherTiddler>>><<other Z otherTiddler>></$importvariables>", {from: "otherTiddler", to: "toThereAgain"});
});

it('local macros', function() {
	function test(text, options) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			utils.macroConf("method", "Btitle", "title")
		]);
		options = Object.assign({wiki: wiki}, options);
		testText(text, options);
	};
	test("\\define method(A, Btitle, C) stuff\n\n<<method X 'from here'>>");
	// Can override existing macros
	test("\\define test(Dref) stuff\n\n<<test 'from here##index'>>");
});

it('local macros work in nested wikitext', function() {
	// The `text` parameter uses a different wikiparser than the one
	// parsing the tiddler. That parser might not have access to definitions
	// in the tiddler, but it should.
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("outer", "text", "wikitext"),
		utils.macroConf("inner", "title", "title")]);
	testText('\\define inner(title) content\n<$macrocall $name=outer text="""<<inner "from here">>""" />', {wiki: wiki});
});

it('slashes in macro name', function() {
	// non/attr is a legal macro name, but not a legal
	// unquoted attribute
	// Also, it might goof up our settings system
	var wiki = new $tw.Wiki();
	var to = `to''[]there"`;
	wiki.addTiddler(utils.macroConf("non/attr", "param", "title"));
	testText('X<<non/attr param:"from here">>Y', utils.placeholder(1,to)+"X<$macrocall $name='non/attr' param=<<relink-1>>/>Y", {to: to, wiki: wiki});
});

it('$macrocall', function() {
	testText("<$macrocall $name=test A=stuff Btitle='from here' Clist='[[from here]]' Dref='from here##index' />");
	testText("\n\n<$macrocall $name=test\n\nBtitle='from here'/>\n\n");
});

it('attribute invocations', function() {
	testText("Before <$a b=<<test stuff 'from here'>>/> After");
	testText("Before <$a b   =    <<test stuff 'from here'>> /> After");
	testText("Before <$a b\n=\n<<test stuff 'from here'>>\n/> After");
});

it('keeps up to date with macro changes', function() {
	var wiki = new $tw.Wiki();
	var t = testText("Macro <<test stuff 'from here'>>.", {wiki: wiki});
	utils.monkeyPatch($tw.utils, "nextTick", (fn) => fn(), function() {
		wiki.eventsTriggered = false;
		wiki.addTiddler({ title: "testMacro", tags: "$:/tags/Macro",
			text: "\\define test(Btitle) title is first now\n"});
	});

	// Btitle is the first argument now. Relink should realize that.
	// DON'T USE testText, because that'll reoverwrite the new testMacro
	t = utils.relink({text: "Macro <<test 'from here'>>."}, {wiki: wiki});
	expect(t.tiddler.fields.text).toEqual("Macro <<test 'to there'>>.");
});

});
