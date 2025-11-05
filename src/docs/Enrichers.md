"Enrichers" refer to specialized text syntax that can be used in any rich text editor (such as an actor description, journal entry, or chat message). Enriched content displays simply in the editor but can represent large and complex displays in the rendered text.

## Item Embeds

All items support the @Embed<s></s>[uuid] syntax, which by default share the description of the item. For abilities, kits, and projects, their embeds feature additional information.

## Damage and Healing

You can have inline damage enrichers by using `[[/damage]]`; this is the intended way to handle abilities that do damage as part of their effect, such as the Censor's Judgment. The damage is a formula that is evaluated when the text is rendered; closing and re-opening a sheet will recalculate the values. A roll does not have to include dice; Draw Steel frequently involves static damage values.

**Examples:**
<!-- Extra &ZeroWidthSpace; characters are to prevent these from enriching in the in-game journal or rendering as wiki internal links -->

- [&ZeroWidthSpace;[/damage 2*@P]]: You can use roll data in the formula. The available values depend on where the enriched text lies, such as an Ability Description.
- [&ZeroWidthSpace;[/damage 1d6+@level]]{Bleeding}: Brackets will replace the default text for the roll.
- [&ZeroWidthSpace;[/damage 3d6 acid]]: You can include damage types, which are not case sensitive.
- [&ZeroWidthSpace;[/damage formula=3d6 type=acid]]: You can also specify which parts are which to avoid ambiguity.
- [&ZeroWidthSpace;[/damage 3d6 type=acid/poison]]: If you specify the `type` parameter you can use a `/` or `|` to indicate "or".
- [&ZeroWidthSpace;[/damage 3d6 fire & 2d6 cold]]: You can join any number of damage rolls together in one enricher by using &.
- [&ZeroWidthSpace;[/damage @monster.freeStrike]]: This will display the selected actors free strike damage as an `Apply Damage` button, which can be used multiple times for example for a minion squad. You can also use [&ZeroWidthSpace;[/damage 8*monster.freeStrike]] to display the selected actor's free strike damage times 8 (or any other number) to emulate multiple minions striking at once.

### Healing and Temporary Stamina

Healing enrichers work similarly to damage enrichers, except the leading command is `[[/heal]]` or `[[/healing]]`.

*Valid healing types*
- Current Stamina: "value", "heal", or "healing".
- Temporary Stamina: "temporary", "temp", or "temphp".

**Examples:**

- [&ZeroWidthSpace;[/heal 10]]: If no healing type is specified it will default to current stamina.
- [&ZeroWidthSpace;[/heal 10 type=temporary]]: Like damage you can specify the healing type. You must be precise and use "value" or "temporary" here.
- [&ZeroWidthSpace;[/heal 5 heal & 10 temp]]: Also like damage you can combine healing types.
- [&ZeroWidthSpace;[/heal @recoveries.recoveryValue]]: will provide healing equal to the owner's recovery value, e.g. for using a healing potion.

## Gain Heroic Resources and Surges

The `[[/gain]]` enricher allows you to grant heroic resources (like Ferocity, Focus, Insight, etc.), epic resources (like Virtue, Divine Power, Breath, etc.), surges, or other progression resources (renown, wealth, victories) to selected hero actors. This is useful for abilities or effects that provide resources to party members.

**Syntax:**
- `[[/gain formula heroic]]` - Modifies heroic resources
- `[[/gain formula surge]]` - Modifies surges
- `[[/gain formula epic]]` - Modifies epic resources
- `[[/gain formula renown]]` - Modifies renown
- `[[/gain formula wealth]]` - Modifies wealth
- `[[/gain formula victories]]` - Modifies victories
- `[[/heroic formula]]` - Equivalent to `/gain formula heroic`
- `[[/surge formula]]` - Equivalent to `/gain formula surge`

**Note:** You must specify the resource type (`heroic`, `surge`, `epic`, `renown`, `wealth`, or `victories`).

**Examples:**

- [&ZeroWidthSpace;[/gain 2 heroic]]: Gain 2 heroic resources.
- [&ZeroWidthSpace;[/gain 2 hr]]: Gain 2 heroic resources.
- [&ZeroWidthSpace;[/heroic 2]]: Gain 2 heroic resources.
- [&ZeroWidthSpace;[/gain 1 surge]]: Gain 1 surge.
- [&ZeroWidthSpace;[/surge 1]]: Gain 1 surge.
- [&ZeroWidthSpace;[/gain 2 epic]]: Gain 2 epic resources.
- [&ZeroWidthSpace;[/gain 3 renown]]: Gain 3 renown.
- [&ZeroWidthSpace;[/gain 5 wealth]]: Gain 5 wealth.
- [&ZeroWidthSpace;[/gain 1 victories]]: Gain 1 victory.
- [&ZeroWidthSpace;[/gain 1d6 heroic]]: Gain a random amount of heroic resources based on a roll.
- [&ZeroWidthSpace;[/gain 1d6 surge]]: Gain a random amount of surges based on a roll.
- [&ZeroWidthSpace;[/gain @level heroic]]: Gain heroic resources equal to the owner's level.
- [&ZeroWidthSpace;[/gain @level surge]]: Gain surges equal to the owner's level.
- [&ZeroWidthSpace;[/gain 3 heroic]]{Gain Focus}: Brackets will replace the default text for the command.

**Notes:**
- Gain enrichers only work on hero actors (characters with heroic resources).
- The roll is made once and the total is applied to all selected tokens.
- Non-hero actors will be skipped when gaining resources.
- When using /gain, you must specify the type (e.g. "heroic", "surge", "renown").

## Apply Effect

The `[[/apply]]` enricher allows you to link status effects, either from an item or the canonical status effects. This can be especially useful for items like the Censor's Judgment that have an effect but no power roll.

- [&ZeroWidthSpace;[/apply bleeding]]: Apply Bleeding.
- [&ZeroWidthSpace;[/apply dazed save]]: Apply Dazed (save ends). The valid endings are `encounter`, `respite`, `save`, and `turn`.
- [&ZeroWidthSpace;[/apply slowed end=save]]: Apply Slowed (save ends).
- [&ZeroWidthSpace;[/apply Judged]]: Apply Judged. This only works inside an item (e.g. an ability's Effect text) and matches the exact name from the item's effects. Multi-word names must be wrapped in quotation marks.
- [&ZeroWidthSpace;[/apply Rage stacking=true]]: Apply "Rage" and allow stacking multiple copies of the effect.
- [&ZeroWidthSpace;[/apply xww2tw1knkZ9x4A3]]: Apply the effect with an ID of `xww2tw1knkZ9x4A3`. You can grab an effect's ID by right clicking the passport icon in the top right of the active effect config.
- [&ZeroWidthSpace;[/apply Item.uU7qrouU5PlbLWIM.ActiveEffect.xww2tw1knkZ9x4A3]]: Apply an effect by UUID, which can be grabbed by left clicking the passport icon in the top right of the active effect config.. Unlike the ID and name matching, this allows referencing a custom active effect without being inside the parent's html fields.

## HTML-mode to clean up text
If an enricher is not working as intended, in the text editor in which you are trying to add the enricher try the following (see screenshot):
1. click on the `Ⱦ` symbol to "clear formatting" from any selected text (or the whole text box if nothing is selected), this usually fixes the issue. If not, then
2. click on the `</>` symbol to enter HTML mode and make sure, there is not unnecessary characters or code interfering with the enricher.

![HTML clean-up mode explainer](https://github.com/MetaMorphic-Digital/draw-steel/blob/develop/assets/docs/HTML-mode-explainer.png)
