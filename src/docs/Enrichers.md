"Enrichers" refer to specialized text syntax that can be used in any rich text editor (such as an actor description, journal entry, or chat message). Enriched content displays simply in the editor but can represent large and complex displays in the rendered text.

## Item Embeds

All items support the @Embed<s></s>[uuid] syntax, which by default share the description of the item. For abilities, kits, and projects, their embeds feature additional information.

## Lookup

The `[[lookup]]` enricher allows dynamic display of actor, item, and effect data as plain text. It supports both text and numerical values, and uses roll data syntax.

**Examples:**
<!-- Extra &ZeroWidthSpace; characters are to prevent these from enriching in the in-game journal or rendering as wiki internal links -->
- [&ZeroWidthSpace;[lookup @name]] Prints the actor's name.
- [&ZeroWidthSpace;[lookup @item.name]] Prints the item's name (Requires the context of an item or an effect on an item, e.g. the description)
- [&ZeroWidthSpace;[lookup @effect.name]] Prints the effect's name (Requires the context of an Active Effect, e.g. the description)
- [&ZeroWidthSpace;[lookup @name lowercase]] Prints the actor's name but lowercase. Valid options are `capitalize`, `lowercase`, and `uppercase`.
- [&ZeroWidthSpace;[lookup @name style=uppercase]] The style property can be defined explicitly.
- [&ZeroWidthSpace;[lookup @A+3 evaluate]] Evaluates the lookup value as a formula. Non-deterministic values like dice are treated as 0.
- [&ZeroWidthSpace;[lookup formula=@A+3 evaluate=true]] The formula and evaluate parameters can be defined explicitly.
- [&ZeroWidthSpace;[lookup formula="@A + 3" evaluate=true]] You must use quotes for formulas with spaces

## Damage and Healing

You can have inline damage enrichers by using `[[/damage]]`; this is the intended way to handle abilities that do damage as part of their effect, such as the Censor's Judgment. The damage is a formula that is evaluated when the text is rendered; closing and re-opening a sheet will recalculate the values. A roll does not have to include dice; Draw Steel frequently involves static damage values.

**Examples:**

- [&ZeroWidthSpace;[/damage 2*@P]]: You can use roll data in the formula. The available values depend on where the enriched text lies, such as an Ability Description.
- [&ZeroWidthSpace;[/damage 1d6+@level]]{Bleeding}: Brackets will replace the default text for the roll.
- [&ZeroWidthSpace;[/damage 3d6 acid]]: You can include damage types, which are not case sensitive.
- [&ZeroWidthSpace;[/damage formula=3d6 type=acid]]: You can also specify which parts are which to avoid ambiguity.
- [&ZeroWidthSpace;[/damage 3d6 type=acid/poison]]: If you specify the `type` parameter you can use a `/` or `|` to indicate "or".
- [&ZeroWidthSpace;[/damage 3d6 fire & 2d6 cold]]: You can join any number of damage rolls together in one enricher by using &.
- [&ZeroWidthSpace;[/damage 2 type=poison ignoredImmunities=poison]]: You can specify ignoring immunities by individual types or by passing `all`.
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

**Examples:**

- [&ZeroWidthSpace;[/gain 2 heroic]]: Gain 2 of a heroic resource. The basic structure is `/gain formula type`.
- [&ZeroWidthSpace;[/gain formula=2 type=heroic]]: You can explicitly assign the `type` and `formula`.
- [&ZeroWidthSpace;[/heroic 2]]: You can use the type in place of `/gain`.
- [&ZeroWidthSpace;[/gain 2 epic]]: Gain 2 epic resources.
- [&ZeroWidthSpace;[/gain 1 surge]]: Gain 1 surge. (Alias: `surges`)
- [&ZeroWidthSpace;[/gain 3 renown]]: Gain 3 renown.
- [&ZeroWidthSpace;[/gain 5 wealth]]: Gain 5 wealth.
- [&ZeroWidthSpace;[/gain 1 victory]]: Gain 1 victory. (Alias: `victories`)
- [&ZeroWidthSpace;[/gain 2 hr]]: `hr` is a valid alias of `heroic`.
- [&ZeroWidthSpace;[/gain 1d6 heroic]]: Rolls are made when the enricher is clicked.
- [&ZeroWidthSpace;[/gain @A surge]]: The gain enricher supports roll data.
- [&ZeroWidthSpace;[/gain 3 heroic]]{Gain Focus}: Brackets will replace the default text for the command.

**Notes:**
- Gain enrichers only work on hero actors.
- The roll is made once and the total is applied to all selected tokens.
- Non-hero actors will be skipped when gaining resources.

## Test

The `[[/test]]` enricher allows requesting specific rolls without users needing to open the individual sheet for the actor.

**Examples:**

- [&ZeroWidthSpace;[/test might]]: A might test. The valid keys are "might", "agility", "intuition", "reason", and "presence".
- [&ZeroWidthSpace;[/test A]]: The single capital letter abbreviations are also accepted.
- [&ZeroWidthSpace;[/test R easy]]: You can specify a difficulty for the test, "easy", "medium", or "hard".
- [&ZeroWidthSpace;[/test characteristic=intuition difficulty=hard]]: The characteristic and difficulty can be explicitly specified.
- [&ZeroWidthSpace;[/test characteristic=presence|might]]: You can specify multiple characteristics with | or / to offer an "or" choice.
- [&ZeroWidthSpace;[/test A reason]]: You can also just include multiple valid characteristic keys in the brackets.
- [&ZeroWidthSpace;[/test I edges=1 banes=1]]: You can specify edges and banes for the roll
- [&ZeroWidthSpace;[/test P]]{A presence test}: Brackets will replace the default text for the command.
- [&ZeroWidthSpace;[/test R I P resultSource=JournalEntry.abcdef.JournalEntryPage.ghijklmn]]: The "resultSource" parameter allows specifiying a UUID pointing to a Power Roll Tier Outcome page.

A test enricher produces two buttons. The first performs a test with all selected actors. The second, only visible to GMs, looks like a chat message bubble and produces a request test message in chat. If the resultSource parameter is used, clicking the first button will integrate the result tier into the test roll. If the request test button was used, the results will show in the request message in a secret block. If the secret block is in a revealed state, then the tests rolled from the part will also integrate the result tier into their display.

## Apply Effect

The `[[/apply]]` enricher allows you to link status effects, either from an item or the canonical status effects. This can be especially useful for items like the Censor's Judgment that have an effect but no power roll.

- [&ZeroWidthSpace;[/apply bleeding]]: Apply Bleeding.
- [&ZeroWidthSpace;[/apply dazed save]]: Apply Dazed (save ends). The valid endings are `encounter`, `respite`, `save`, and `turn`.
- [&ZeroWidthSpace;[/apply slowed end=save]]: Apply Slowed (save ends).
- [&ZeroWidthSpace;[/apply Judged]]: Apply Judged. This only works inside an item (e.g. an ability's Effect text) and matches the exact name from the item's effects. Multi-word names must be wrapped in quotation marks.
- [&ZeroWidthSpace;[/apply Rage stacking=true]]: Apply "Rage" and allow stacking multiple copies of the effect.
- [&ZeroWidthSpace;[/apply xww2tw1knkZ9x4A3]]: Apply the effect with an ID of `xww2tw1knkZ9x4A3`. You can grab an effect's ID by right clicking the passport icon in the top right of the active effect config.
- [&ZeroWidthSpace;[/apply Item.uU7qrouU5PlbLWIM.ActiveEffect.xww2tw1knkZ9x4A3]]: Apply an effect by UUID, which can be grabbed by left clicking the passport icon in the top right of the active effect config.. Unlike the ID and name matching, this allows referencing a custom active effect without being inside the parent's html fields.

## Potency

The `[[potency]]` enricher allows you to construct enriched potency displays using the Draw Steel Glyphs. The a strength of `weak`, `average`, or `strong` is provided and the item is on an actor, it will pull the actor's potency value.

- [&ZeroWidthSpace;[potency M weak]]: Displays `M<weak` without an actor or `M<[number]` with an actor.
- [&ZeroWidthSpace;[potency A 2]]: Displays `A<2`.
- [&ZeroWidthSpace;[potency reason 2]]: Displays `R<2`.
- [&ZeroWidthSpace;[potency characteristic=I strength=weak]]: Displays `I<weak` without an actor or `I<[number]` with an actor.
- [&ZeroWidthSpace;[potency characteristic=presence strength=1]]: Displays `P<1`.

## HTML-mode to clean up text
If an enricher is not working as intended, in the text editor in which you are trying to add the enricher try the following (see screenshot):
1. click on the `Ⱦ` symbol to "clear formatting" from any selected text (or the whole text box if nothing is selected), this usually fixes the issue. If not, then
2. click on the `</>` symbol to enter HTML mode and make sure, there is not unnecessary characters or code interfering with the enricher.

![HTML clean-up mode explainer](https://github.com/MetaMorphic-Digital/draw-steel/blob/develop/assets/docs/HTML-mode-explainer.png)
