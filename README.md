# Relink

By default in Tiddlywiki5, when you rename a tiddler, it gives you the option to
automatically update the `list` and `tags` field of all other tiddlers.

But what about updating a tiddler's text? What about other fields like
`list-before` and `list-after`. What about other fields that are unique to
my project?

This is what Relink is for. It expands on TW5's bulk updating to allow for
any customizable fields to be updated, whether they're lists, filters, macros,
or single-tiddler fields. In addition, relink parses through the text of all
relevant tiddlers and updates prettyLinks, transclusions, widgets, and other
syntax patterns to properly reflect the title change. All of this is fully
customizable.

For a demonstration, and for documentation, see the [tiddlywiki demo site](https://flibbles.github.io/tw5-relink/).

## How to install

Visit the [demo site](https://flibbles.github.io/tw5-relink/). It will have a little thingy you can drag onto your tiddlywiki project. (The demo site will explain it better.)

### For Node.js

The contents of the `plugins` directory must be copied into the `plugins`
directory in your tiddlywiki installation. This is likely in:

`/usr/local/lib/node_modules/tiddlywiki/flibbles`

You will likely need to make the `flibbles` directory. If you've installed it correctly, the path to the `plugin.info` file should look something like:

`/usr/local/lib/node_modules/tiddlywiki/flibbles/relink/plugin.info`

Afterward, add the plugin inside your projects' `tiddlywiki.info` file.
The plugins section will look something like:
```
{
   ...
   "plugins": [
      ...
      "flibbles/relink"
   ],
   ...
}
```

Alternatively, you can also copy the `plugins` directly into your projects'
root directory. Though this makes the install local only to those specific
projects.

## How to test

Make sure you have `tiddlywiki` available on your PATH. Then from the project root directory, type:

`tiddlywiki --build test`
