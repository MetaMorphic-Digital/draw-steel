The Draw Steel system can be modified by users with edits to the CONFIG.DRAW_STEEL object. The full object can be viewed in [the repository](https://github.com/MetaMorphic-Digital/draw-steel/blob/main/src/module/config.mjs); this is a list of the most commonly requested adjustments. These edits should be performed by a module script; you can make a personal module by using the built-in [Module Maker from the setup screen](https://foundryvtt.com/article/module-maker/).

## Languages

The default list of languages for Draw Steel comes from the core books; if you're not playing in Orden, you probably want to adjust this list.

```js
Hooks.once("init", () => {
  // Add a language
  CONFIG.DRAW_STEEL.languages.foo = { label: "Foo" };
  // Remove a language
  delete CONFIG.DRAW_STEEL.languages.anjali
  // Remove all default languages
  for (const key in CONFIG.DRAW_STEEL.languages) delete CONFIG.DRAW_STEEL.languages[key];
  // Add many languages
  Object.assign(CONFIG.DRAW_STEEL.languages, {
    foo: { label: "Foo" },
    bar: { label: "Bar" }
  })
});
```

## Skills

The official rules suggest Directors customize the skill list for their own purposes. The default skill groups are "crafting", "exploration", "interpersonal", "intrigue", and "lore".

```js
Hooks.once("init", () => {
  // Add a new skill
  CONFIG.DRAW_STEEL.skills.list.painting = {
    label: "Painting",
    group: "crafting"
  }
  // Remove a skill
  delete CONFIG.DRAW_STEEL.skills.list.flirt
  // Add a skill group
  CONFIG.DRAW_STEEL.skills.groups.technology = {
    label: "Technology"
  }
})
```
