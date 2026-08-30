# Templ-a-lot — Everything Edition

A userscript for Wikimedia wikis that lets you add or remove a template
across many pages at once — files, articles, or a mix of both — instead
of editing each page by hand.

It started as a Commons-only tool for bulk-tagging files, and has since
grown to work on article pages too, with a recursive category scanner so
you don't have to hunt down every page manually.

---

## What it does

- Adds a template to many pages in one batch, or removes one that's
  already there.
- Works on Wikimedia Commons file pages and on ordinary article pages —
  on the same wiki or across different wikis, depending on where you
  install it.
- Understands that files and articles need the template inserted in
  different places, and handles that automatically per page rather than
  needing you to pick one setting for an entire batch.
- Lets you review exactly what's about to be edited before anything is
  saved, and gives you one click to undo the whole batch afterward.

## Where you can select pages from

- **Category pages** — click the checkbox next to a file thumbnail or an
  article link to add it to the batch. Clicking the page's own title or
  thumbnail still opens it normally; only the small checkbox selects it.
- **Special:ListFiles** — a checkbox column is added to the file list
  table.
- **Search results** — the same checkbox-based selection works on
  Special:Search, for both file and article results.
- **Recursive category scan** — give it a category name and a depth, and
  it will walk that category and its subcategories automatically,
  collecting every article and/or file it finds along the way, and
  select them all for you. No need to click through pages one at a time
  or manually list them out. A Stop button lets you cancel a scan early
  if it's taking longer than you'd like — whatever was found up to that
  point stays selected.
- **Manual list** — as a fallback, you can paste in a list of page
  titles directly (useful for lists that come from an external tool or
  a maintenance page rather than a browsable category).

## Where the template gets inserted

By default the script uses an "Auto" setting: files get the template
placed just before the Licensing section, and articles get it placed
just before the page's categories. This means a mixed batch of files
and articles can be processed in a single run without needing separate
settings for each type.

If you'd rather force one specific position for everything in a batch —
top of the page, before "See also," before "References," before
categories, or the very bottom — that's available too from the same
dropdown.

## Safety behavior

- Adding a template skips any page that already has it, rather than
  duplicating it.
- Removing a template skips any page that doesn't have it.
- Pages that don't exist (for example, a mistyped title in a pasted
  list) are reported as errors rather than silently ignored.
- The recursive category scanner has built-in limits on how many
  categories it will walk and how many pages it will collect in one go,
  so it won't run away on an unexpectedly large or cyclical category
  tree. If a limit is hit, or the scan is stopped manually, you still
  get to keep and use whatever was found up to that point.
- After a batch finishes, a one-click Revert option restores every page
  in that batch to its previous version, in case something needs to be
  undone.

## Wiki-specific defaults

On Wikimedia Commons, the recursive scanner defaults to including files
rather than articles, since that's what Commons categories are mostly
used for. On other wikis, it defaults to articles instead. Either
checkbox can be toggled regardless of which wiki you're on.

## Installation

The script itself lives on a userscript subpage (in this case,
`User:Suyash.dwivedi/userscripts/Templ-a-lot-Everything.js` on
Meta-Wiki). To actually run it, you load that page's raw JavaScript
from your own personal JS file — the same mechanism used for any
cross-wiki userscript.

**Where to put the load command depends on how widely you want it
active:**

- **`Special:MyPage/global.js`** (on Meta-Wiki) — makes the tool panel
  appear on *every* Wikimedia wiki you're logged into: Commons,
  Wikipedia, Wikidata, Wikisource, all of it. This is the usual choice
  for a tool meant to work on both files and articles.
- **`Special:MyPage/common.js`** on a single wiki (e.g. Commons or
  English Wikipedia) — limits the panel to that one wiki only.

Add this line to whichever of those pages fits, then save:

```js
mw.loader.load('https://meta.wikimedia.org/w/index.php?title=User:Suyash.dwivedi/userscripts/Templ-a-lot-Everything.js&action=raw&ctype=text/javascript');
```

A couple of things worth knowing about that line, since it looks a bit
different from a plain `importScript()`:

- **`action=raw&ctype=text/javascript`** fetches the page's wikitext
  directly as a JavaScript file (with the correct content type),
  rather than as a rendered wiki page. This is what makes it possible
  to load a script from Meta-Wiki while browsing a completely different
  wiki — `importScript()` only works for pages on the *same* wiki, so
  it can't be used here.
- Because the URL points at **meta.wikimedia.org**, this works
  regardless of which wiki you're currently on — the browser fetches
  the script from Meta and runs it locally, wherever your `global.js`
  or `common.js` happens to be loaded.
- After saving `global.js` or `common.js`, do a hard refresh
  (**Ctrl+Shift+R**, or **Cmd+Shift+R** on a Mac) on the next page you
  load. Browsers cache JavaScript aggressively, so a normal reload
  sometimes won't pick up the change right away.

Once it's loaded, the tool panel appears as a small floating box in the
bottom-right corner of category pages, search results, and file
listing pages. It can be dragged to a different position, and it
remembers where you leave it between page loads.

## Basic usage

1. Open a category page, a search results page, or Special:ListFiles —
   or use the recursive scanner to gather pages from an entire category
   tree.
2. Select the pages you want to change, either by clicking checkboxes
   directly on the page or by reviewing the results list after a scan.
3. Type the template name into the panel (without the curly braces).
4. Choose where it should be inserted, or leave it on "Auto."
5. Click **Add** to insert the template, or **Remove** to take it out.
6. Watch the per-page status report as it runs — added, removed,
   skipped, or errored — and use **Revert** afterward if needed.

## License

MIT.
