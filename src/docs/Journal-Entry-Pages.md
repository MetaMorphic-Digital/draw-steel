The Foundry [Knowledge Base](<https://foundryvtt.com/article/journal/>) has more info on the basics of journals; this page is focused on system-specific information.

## New Page Subtypes

In addition to the page subtypes provided by core like Text, PDF, and Image, the Draw Steel system adds several unique page types.

### Configuration

The Configuration page allows you to add new languages and monster types to your game without writing any code. Any configuration page inside of a compendium is read as part of the initial world load, adding its listed skills and monster types. Edits to a configuration page will show up in the list of languages and monster keywords after refreshing the page. Configuration pages in the journal directory are ignored; a Configuration page must exist in a JournalEntry within a compendium. They do not allow for removing existing languages; a small module script is necessary to fully replace the list of languages.

### Reference

The reference page provides a rich tooltip for links to the page, which is especially useful in conjunction with the reference system. Setting up references requires code. The `tooltip` property is optional; if it is not defined, the base content of the page will be used instead.

### Power Roll Outcome

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

## Journal Styling

The Draw Steel system has added a number of unique classes that can be used to style journals.

```html
<h3 class="left"></h3>
<h3 class="center"></h3>
<h3 class="right"></h3>
```

The "left", "center", and "right" classes align the contained text content accordingly.

```html
<p class="hanging-indent">Secrets and room information</p>
```

The "hanging-indent" class provides text that is indented on the second and later lines in a paragraph.

```html
<span class="glyph">x</span>
```

The "glyph" class switches the font to "Draw Steel Glyphs", a special font covering various special symbols used in the core books.

```html
<table class="compact">
  <caption><strong>Table Caption</strong></caption>
</table>
```

The `table.compact` element and class removes the additional padding Foundry adds to `th` and `td` elements. Wrapping the caption inside `strong` tags will surround it with gold-colored laser lines that extend horizontally to match the width of the table. This can be replicated on embedded tables by passing `captionPosition=top` to the internal configuration.

```html
<aside class="boxed">
  <p>Text Here</p>
</aside>
<aside class="boxed">
  <div class="inverse">
    <p>Text Here</p>
  </div>
</aside>
```

The `aside.boxed` element and class provides a sidebar that can be used for rules reminders, design clarification, and other pieces of information that don't belong in the standard text flow. The `div.inverse` interior switches the interior color for additional contrast, such as those used by the rules diagrams in *Draw Steel: Heroes*.

```html
<aside class="callout">
  <img class="icon" src="icons/vtt-512.png">
  <p></p>
</aside>
```

The `aside.callout` element and class provides a callout box with special formatting for an `img.icon` element inside, allowing for platform-specific clarifications and other information that should be understood to be separate from the normal journal flow.

```html
<div class="ability-bordered">
  <h5>@UUID[Compendium.draw-steel.abilities.Item.ufMtQ8Vjk69ZaB6E]{Halt Miscreant!}</h5>
  <p>@Embed[Compendium.draw-steel.abilities.Item.ufMtQ8Vjk69ZaB6E includeName=false]</p>
</div>
<div class="ability-bordered quick">
  <h5>@UUID[Compendium.draw-steel.abilities.Item.zMsvZ08yT9oEdp8h]{Your Allies Cannot Save You!}</h5>
  <p>@Embed[Compendium.draw-steel.abilities.Item.zMsvZ08yT9oEdp8h includeName=false]</p>
</div>
```

The `div.ability-bordered` element and class pads the left side of the container with an art deco style icon. The `div.ability-bordered.quick` alternative uses a gold icon to indicate a "quick pick".

```html
<div class="class-spread">
  <img src="some/file/path.webp"/>
  <blockquote>
    <p class="pull-quote">“Quote Start</p>
    <p class="pull-quote">Quote End”</p>
    <cite>Speaker</cite>
  </blockquote>
  <div class="class-intro-wrapper">
    <p class="class-intro">Text here</p>
  </div>
</div>
```

The "class-spread" block and its descendant elements puts together a contained image with a pull quote positioned in the top left and a class intro positioned in the bottom left.

```html
<aside class="malice">
  <div>@Embed[Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6]</div>
  <div>@Embed[Compendium.draw-steel.abilities.Item.eqUobBcm81mqZVgJ]</div>
</aside>
```

The "aside.malice" element and class provides a gray-shaded block for displaying malice abilities and features.
