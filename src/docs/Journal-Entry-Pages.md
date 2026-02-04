The Foundry [Knowledge Base](<https://foundryvtt.com/article/journal/>) has more info on the basics of journals; this page is focused on system-specific information.

## Configuration

The Configuration page allows you to add new languages and monster types to your game without writing any code. Any configuration page inside of a compendium is read as part of the initial world load, adding its listed skills and monster types. Edits to a configuration page will show up in the list of languages and monster keywords after refreshing the page. Configuration pages in the journal directory are ignored; a Configuration page must exist in a JournalEntry within a compendium. They do not allow for removing existing languages; a small module script is necessary to fully replace the list of languages.

## Reference

The reference page provides a rich tooltip for links to the page, which is especially useful in conjunction with the reference system. Setting up references requires code. The `tooltip` property is optional; if it is not defined, the base content of the page will be used instead.

## Power Roll Outcome

The power roll outcome page allows specifying three tiers of results in rich HTML, which can be combined with the `resultSource` parameter of a test enricher and/or as an embed to format the three tiers with the appropriate structure and glyphs.

```html
<dl class="power-roll-display">
    <dt class="tier1">
        <p>!</p>
    </dt>
    <dd>
        <p>Tier 1 Outcome HTML.</p>
    </dd>
    <dt class="tier2">
        <p>@</p>
    </dt>
    <dd>
        <p>Tier 2 Outcome HTML.</p>
    </dd>
    <dt class="tier3">
        <p>#</p>
    </dt>
    <dd>
        <p>Tier 3 Outcome HTML.</p>
    </dd>
</dl>
```
