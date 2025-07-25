"Enrichers" refer to specialized text syntax that can be used in any rich text editor (such as an actor description, journal entry, or chat message). Enriched content displays simply in the editor but can represent large and complex displays in the rendered text.

## Item Embeds

All items support the @Embed<s></s>[uuid] syntax, which by default share the description of the item. For abilities, kits, and projects, their embeds feature additional information.

## Damage Enrichers

You can have inline damage enrichers by using `[[/damage]]`; this is the intended way to handle abilities that do damage as part of their effect, such as the Censor's Judgment. The damage is a formula that is evaluated when the text is rendered; closing and re-opening a sheet will recalculate the values. A roll does not have to include dice; Draw Steel frequently involves static damage values.

**Examples:**
<!-- Extra &ZeroWidthSpace; characters are to prevent these from enriching in the in-game journal or rendering as wiki internal links -->

- [&ZeroWidthSpace;[/damage 2*@P]]: You can use roll data in the formula. The available values depend on where the enriched text lies, such as an Ability Description.
- [&ZeroWidthSpace;[/damage 1d6+@level]]{Bleeding}: Brackets will replace the default text for the roll.
- [&ZeroWidthSpace;[/damage 3d6 acid]]: You can include damage types, which are not case sensitive.
- [&ZeroWidthSpace;[/damage formula=3d6 type=acid]]: You can also specify which parts are which to avoid ambiguity.
- [&ZeroWidthSpace;[/damage 3d6 type=acid/poison]]: If you specify the `type` parameter you can use a `/` or `|` to indicate "or".
- [&ZeroWidthSpace;[/damage 3d6 fire & 2d6 cold]]: You can join any number of damage rolls together in one enricher by using &.

### Healing Enrichers

Healing enrichers work similarly to damage enrichers, except the leading command is `[[/heal]]` or `[[/healing]]`.

*Valid healing types*
- Current Stamina: "value", "heal", or "healing".
- Temporary Stamina: "temporary", "temp", or "temphp".

**Examples:**

- [&ZeroWidthSpace;[/heal 10]]: If no healing type is specified it will default to current stamina.
- [&ZeroWidthSpace;[/heal 10 type=temporary]]: Like damage you can specify the healing type. You must be precise and use "value" or "temporary" here.
- [&ZeroWidthSpace;[/heal 5 heal & 10 temp]]: Also like damage you can combine healing types.
- [&ZeroWidthSpace;[/heal @recoveries.recoveryValue]]: will provide healing equal to the owner's recovery value, e.g. for using a healing potion.

## HTML-mode to clean up text
If an enricher is not working as intended, in the text editor in which you are trying to add the enricher try the following (see screenshot):
1. click on the `Ⱦ` symbol to "clear formatting" from any selected text (or the whole text box if nothing is selected), this usually fixes the issue. If not, then
2. click on the `</>` symbol to enter HTML mode and make sure, there is not unnecessary characters or code interfering with the enricher.

![HTML clean-up mode explainer](draw-steel/assets/docs/HTML-mode-explainer.png?raw=true "HTML Mode explainer")