"Enrichers" refer to specialized text syntax that can be used in any rich text editor (such as an actor description, journal entry, or chat message). Enriched content displays simply in the editor but can represent large and complex displays in the rendered text.

## Item Embeds

All items support the @Embed<s></s>[uuid] syntax, which by default share the description of the item. For abilities, kits, and projects, their embeds feature additional information.

## Damage Enrichers

You can have inline damage enrichers by using `[[/damage]]`; this is the intended way to handle abilities that do damage as part of their effect, such as the Censor's Judgment. The damage is a formula that is evaluated when the text is rendered; closing and re-opening a sheet will recalculate the values. A roll does not have to include dice; Draw Steel frequently involves static damage values.

**Examples:**

- `[[ /damage 2*@P]]`: You can use roll data in the formula. The available values depend on where the enriched text lies, such as an Ability Description.
- `[[ /damage 1d6+@level]]{Bleeding}`: Brackets will replace the default text for the roll.
- `[[ /damage 3d6 acid]]`: You can include damage types, which are not case sensitive.
- `[[ /damage formula=3d6 type=acid]]`: You can also specify which parts are which to avoid ambiguity.
- `[[ /damage 3d6 type=acid/poison]]`: If you specify the `type` parameter you can use a `/` or `|` to indicate "or".
- `[[ /damage 3d6 fire & 2d6 cold]]`: You can join any number of damage rolls together in one enricher by using &.

### Healing Enrichers

Healing enrichers work similarly to damage enrichers, except the leading command is `[[/heal]]` or `[[/healing]]`.

*Valid healing types*
- Current Stamina: "value", "heal", or "healing".
- Temporary Stamina: "temporary", "temp", or "temphp".

**Examples:**
- `[[ /heal 10]]`: If no healing type is specified it will default to current stamina.
- `[[ /heal 10 type=temporary]]`: Like damage you can specify the healing type. You must be precise and use "value" or "temporary" here.
- `[[ /heal 5 heal & 10 temp]]`: Also like damage you can combine healing types.
