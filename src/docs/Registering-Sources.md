Developers who wish to incorporate new books and licenses into the system listing with their module can do it by implementing any of these flags in their module manifest (`module.json`). Below is an example of that.

```json
{
  "flags": {
    "draw-steel": {
      "books": {
        "Book Key": {
          "label": "My Book Label",
          "title": "My Book Full Title",
        },
      },
      "defaultBook": "MyBook",
      "licenses": {
        "CC-BY-4.0": {
          "label": "Creative Commons BY-4.0"
        }
      },
      "defaultLicense": "CC-BY-4.0"
    }
  }
}
```

The `books` object allows you to define any number of books. The "Book Key" is what will display in the "Update Source" application. The `label` property is used on the actual NPC and Item sheets, potentially in conjunction with a provided page number. For longer book names, consider using an abbreviation for the label. The `page` property in the "Update Source" config, if not given as a pure number, will not prefix with `pg.`; for example, a source of "ARCADIA" and a page of "#3" would simply display "ARCADIA #3". The `title` property is the full title of the relevant source.

The license info is not displayed in the sheet, and is only visible in the "Update Source" application. You do not have to provide a license; most commercial products are expected to be unlicensed. However, for developers wishing to share their works collaboratively, we have established the license property so content can be delineated on the document level.

The `label` and `title` properties of the books and licenses accept i18n strings if your module has those set up.

Both of these have corresponding defaults; `defaultBook` will set the default value of the `book` property of any item or NPC created within a compendium associated with your module, while `defaultLicense` does the same for `license`. Both of these properties expect to line up with the keys of one of your registered books or licenses respectively.
