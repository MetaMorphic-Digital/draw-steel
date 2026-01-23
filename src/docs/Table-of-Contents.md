Draw Steel offers an alternative display for Journal compendiums that mimics the Table of Contents (ToC) page of a book.

## Pack Registration

The first step to setting up the ToC is to add a flag to whichever journal compendium pack needs it. In your module's manifest (`module.json` or `world.json`) add a flags object to the pack definition and add a `draw-steel.display` flag set to `table-of-contents`:

```json
{
  "id": "draw-steel",
  "packs": [
    {
      "name": "journals",
      "label": "DRAW_STEEL.COMPENDIUM.journals",
      "type": "JournalEntry",
      "flags": {
        "draw-steel": {
          "display": "table-of-contents"
        }
      }
    }
  ]
}
```

Once you have reloaded Foundry to ensure the manifest changes take effect and launched into your world, you should now find that opening the compendium results in a blank page with "Contents" at the top. Perfect! That means everything is working so far, but you will need to set some additional flags to indicate to the system what journal entries should appear in the table of contents and in what order.

## Configuring Journal Entry Flags

The data for configuring pages is stored in `flags.draw-steel.table-of-contents` for each JournalEntry and JournalEntryPage. While unlocked, the header buttons for the compendium include a "Configure Table of Contents" option that will allow you to manage the Journal Entries contained within.

### Type

The type flag indicates how the journal entry will be sorted and displayed on the ToC. There are four types supported by the system:

- `chapter`: Chapters are sorted first and the entry name is displayed as a large heading. They will automatically list all of their pages below.
- `appendix`: Appendices are sorted last and also displayed as a large header. By default they do not display their individual pages, but that can be overridden using the `showPages` flag (see below).
- `special`: Special is used for journal entries that should appear as if they are pages beneath a chapter or appendix. They also hide their pages by default.
- `header`: The first page of this journal entry will be displayed inline at the top of the table of contents.

The configuration app also includes "Hidden", which is stored as `""`. These will not display in the ToC and are useful for pages you want to use for embeds and references rather than direct viewing by users.

## Title

The `title` flag provides an override to the Journal Entry's name for display in the ToC.

### Show Pages

The `showPages` flag on entries controls whether the individual pages are listed beneath the entry name in the list with their own links. This defaults to `true` for entries with the chapter type, and `false` for entries with the appendix or special types.

### Order

The `order` flag is used to control where chapters and appendices appear in the list. It is usually as simple as setting the first chapter to have a `1`, the second chapter to have `2`, and so on. The order is independent between chapters, appendices, and special pages, so you can have appendix A also have a order of `1`.

### Append

The `append` flag is only used by special entries. This flag specifies which chapter the special entry will be added to based on ID. If marked standalone (`append` is empty), then a special entry will be added after all of the other chapters and appendices as a top-level entry.

If the append flag is set, the `order` flag will be used to position the special entry relative to the `sort` value of the other pages in the main entry. This is likely to be a fairly large value in the hundreds of thousands.

## Individual Pages

Individual pages do not have a configuration application to assist. Instead, these adjustments must be made programmatically. One example is given below; the UUID can be acquired by opening the given page in edit mode and left-clicking the header button.

```js
const page = await fromUuid('PASTE_HERE');
await page.setFlag("draw-steel", "table-of-contents." + "FLAG_KEY_HERE", newValue)
```

### Title

The `title` flag provides an override to the page's name for display in the ToC.

### Show

The `show` flag controls whether the individual page is shown. The order of priority is as follows.

1. If the journal does not show pages (see above), then no pages will be shown.
2. The explicit value of the `show` flag if set.
3. If the page's `title.level` value is equal to `1` it will show by default.

So `show: false` will hide a level 1 title, and `show: true` will display a level 2 or 3 title.
