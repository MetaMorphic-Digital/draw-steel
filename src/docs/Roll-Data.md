Foundry's rolls support variable substitution through roll data, as explained in the [Advanced Dice](https://foundryvtt.com/article/dice-advanced/) article in the Knowledge Base.

> <details><summary>To explore the data model within Foundry to find the properties detailed below, here are a few approaches:</summary>
>
> • Select a token, then open up the dev tools (F12 on Win; ⌥⌘I on Mac), and paste this into the Console (or save it as a Script macro in your hotbar):
`console.log(_token.actor.getRollData());`
>
> • Or: Open an actor or item's sheet, left click on the book icon in the top right to copy the UUID, then in the Console run the following command, pasting the copied UUID in: `(await fromUuid('PASTE_HERE')).getRollData()`
>
> • Or: Right-click an actor in the sidebar and choose Export Data, which will get you a JSON file you can browse through. (This won’t contain any values that are derived at roll-time.)
></details>

## Actor Roll Data

### Characteristics

### Statuses

### Echelon

## Item Roll Data

### Abilities
