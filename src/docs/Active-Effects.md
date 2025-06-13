Draw Steel fully supports the use of active effects to modify actor attributes.

The Foundry [Knowledge Base](https://foundryvtt.com/article/active-effects/) has more info on the basics of active effects; this page is focused on system-specific information.

## Legend

`[number]` - These square brackets mean "replace this with your value of the type within the brackets". So this example: `[number]` would mean you input `3`. If roll data is allowed, you can input any roll data that would _evaluate_ to a number (no dice allowed).

`[formula]` - When `formula` is mentioned in this document it means this value can be populated with any dice formula. For example, an ability could add an effect with the Effect Value of `1d6`. These fields always allow for the use of roll data.

> **Sheet Modes**
> The Actor and Item sheets in the system support both Play and Edit modes. One important difference between the two is that the Edit mode prioritizes showing the "source" data, which is *before* active effects are applied. To see values with active effects calculated, switch back to play mode.

While there are similarities with roll data, active effects generally lead with `system.` instead of `@`. To add a temporary bonus to stability via an active effect, the active effect will need to look as the following example:

|system.combat.stability|Add|[value]|
|---|---|---|

### Active effect change modes

|Change Mode|Description|
|:-----------:|--------|
|Add|Adds the provided value to the specified attribute. For attributes, this can be used to both add and subtract from a particular value by specifying 1 or -1 as the value to add.|
|Multiply|Multiplies the defined attribute by the value in the Effect Value field.|
|Override|Replaces the defined attribute with the value provided in the Effect Value field.|
|Downgrade|Reduces the defined attribute only in cases where the current the value of that attribute would be greater than value specified in the Effect Value field.|
|Upgrade|Increases the defined attribute only in cases where the current value of that attribute would be less than value specified in the Effect Value field.|
|Custom|The Custom change mode applies logic defined by a game system or add-on module. The Draw Steel system does not utilize the Custom Change Mode.|

## Duration

Draw Steel has three different predefined effect durations `End of Turn (EoT)`, `Save Ends`, and `End of Encounter`.
Additionally, the Save Ends duration allows for defining the saving throw formula. The default is `1d10 + @combat.save.bonus`.

+ End of Turn will automatically self-disable when an affected actor ends their turn.
+ Saving Throws will create prompts for owners that allow to change the save threshold (e.g. due to Ancestry effects) and a text field to enter situational bonuses. The roll message has a button to spend a hero token to automatically succeed. If multiple players own an actor, the active GM will receive a dialog to help delegate rolls.
+ End of Encounter effects will automatically self-disable alongside the encounter.

### Characteristic Keys

|Characteristic|Attribute Key|
|:---:|---|
|Agility value|`system.characteristics.agility.value`|
|Intuition value|`system.characteristics.intuition.value`|
|Might value|`system.characteristics.might.value`|
|Presence value|`system.characteristics.presence.value`|
|Reason value|`system.characteristics.reason.value`|

### Common bonus effect examples

|Value Name|Attribute Key|
|:---:|---|
|Save Bonus|`system.combat.save.bonus`|
|Actor Size (on sheet, not token size)|`system.combat.size`|
|Stability|`system.combat.stability`|
|Bonus to Potencies|`system.potency.bonuses`|
|Maximum Stamina|`system.stamina.max`|
|Speed|`system.movement.value`|
|Bonus to Tier X Melee Damage (X=1, 2, 3)|`system.abilityBonuses.melee.damage.tierX`|
|Bonus to Melee Distance|`system.abilityBonuses.melee.distance`|
|Bonus to Tier X Ranged Damage (X=1, 2, 3)|`system.abilityBonuses.ranged.damage.tierX`|
|Bonus to Ranged Distance|`system.abilityBonuses.ranged.distance`|
|Damage [Type] Immunity|`system.damage.immunities.[type]`|
|Damage [Type] Weakness|`system.damage.weaknesses.[type]`|

> Common Mistakes
> **!**: Current Stamina (`system.stamina.value`) and Tempoorary Stamina (`system.stamina.temporary`) must *not* be targeted with an active effect. These are meant to regularly change, which is why they're exposed in play mode.

> <details><summary>The viable damage [types] for Immunities and Weaknesses are:</summary>
>
> |Damage Type|Active Effect Attribute Key|
> |:---:|---|
> |All damage (including untyped)|`all`
> |Acid damage|`acid`
> |Cold damage|`cold`
> |Corruption damage|`corruption`
> |Fire damage|`fire`
> |Holy damage|`holy`
> |Lightning damage|`lightning`
> |Poison damage|`poison`
> |Psychic Damage|`psychic`
> |Sonic Damage|`sonic`
>
> An Example to add fire immunity 3 would be
>
> |`system.damage.immunities.fire`|Add|`3`|
> |---|---|---|
>
></details>
