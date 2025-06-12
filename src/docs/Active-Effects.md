Draw Steel fully supports the use of active effects to modify actor attributes.

 The Foundry [Knowledge Base](https://foundryvtt.com/article/active-effects/) has more info on the basics of active effects; this page is focused on system-specific information.

## Legend

`[number]` - These square brackets mean "replace this with your value of the type within the brackets". So this example: `[number]` would mean you input `3`. If roll data is allowed, you can input any roll data that would _evaluate_ to a number (no dice allowed).

`[formula]` - When `formula` is mentioned in this document it means this value can be populated with any dice formula. For example, an ability could adds an effect with the Effect Value of `1d6`. These fields always allow for the use of roll data.

  > **Sheet Modes**
> The Actor and Item sheets in the system support both Play and Edit modes. One important difference between the two is that the Edit mode prioritizes showing the "source" data, which is *before* active effects are applied. To see values with active effects calculated, switch back to play mode.

See the [Actor's Rolldata](https://github.com/MetaMorphic-Digital/draw-steel/blob/develop/src/docs/Roll-Data.md) article for what is available for use as roll data.

While the [Actor's Rolldata](https://github.com/MetaMorphic-Digital/draw-steel/blob/develop/src/docs/Roll-Data.md) article outlines the code how to call upon a value (example, adding @level to an ability's damage to add the hero's level to the total damage for a final formula`3 + @level`), if you wish to alter an attribute, you have to add `system.` in front of it. To add a temporary bonus to stability via an active effect, the active effect will need to look as the following example:

|system.combat.stability|Add|[value]|
|---|---|---|

### Active effect change modes

|Change Mode|Description|
|:-----------:|--------|
|Add|Adds the provided value to the specified attribute. For numerical attributes, this can be used to both add and subtract from a particular value by specifying `1` or `-1` as the value to add.|
|Multiply|Multiplies the defined attribute by the numeric value in the Effect Value field.|
|Override|Replaces the defined attribute with the value provided in the Effect Value field. If applied to a text value such as a name or description a pair of curly brackets like `{}` can be used to include the value being overriden in the final output. So overriding on the name of "Breastplate" with `Arcane Propulsive {}` will result in the final name of "Arcane Propulsive Breastplate".|
|Downgrade|Reduces the defined attribute only in cases where the current value of that attribute would be greater than value specified in the Effect Value field.|
|Upgrade|Increases the defined attribute only in cases where the current value of that attribute would be less than value specified in the Effect Value field.|
|Custom|The Custom change mode applies logic defined by a game system or add-on module. The dnd5e system does not utilize the Custom Change Mode.|  

## Duration

Draw Steel has two different predefined effect durations `End of Turn (EoT)` and `save ends`. Additionally, the `save ends` duration allows to define the saving throw formula, the default is `1d10`.

Currently these are only for book keeping and the effect will not end if either of those two conditions is reached.

### Characteristic Keys

|Characteristic|system. address|
|:---:|---|
|Agility value |`system.characteristics.agility.value`|
|Intuition value | `system.characteristics.intuition.value`|
| Might value | `system.characteristics.might.value`|
| Presence value | `system.characteristics.presence.value`|
|Reason value| `system.characteristics.reason.value`|

### Common bonus effect examples

|Value Name|system. address|
|:---:|---|
|Save Bonus|`system.combat.save.bonus`|
|Actor Size (on sheet, not token size)|`system.combat.size`|
|Stability|`system.combat.stability`|
|Bonus to Potencies|`system.potency.bonuses`|
|Maximum Stamina|`system.stamina.max`|
|Current Stamina|`system.stamina.value`|
|Temporary Stamina|`system.stamina.temporary`|
|Speed|`system.movment.value`|
|Bonus to Tier X Melee Damage (X=1/2/3)|`system.abilityBonuses.melee.damage.tierX`|
|Bonus to Melee Distance|`system.abilityBonuses.melee.distance`|
|Bonus to Tier X Ranged Damage (X=1/2/3)|`system.abilityBonuses.ranged.damage.tierX`|
|Bonus to Ranged Distance|`system.abilityBonuses.ranged.distance`|
|Damage [Type] Immunity|`system.damage.immunities.[type]`|
|Damage [Type] Weakness|`system.damage.weaknesses.[type]`|

> <details><summary>The viable damage [types] for Immunities and Weaknesses are:</summary>
>
> |Damage Type|Active Effect address|
> |:---:|---|
> |Acid damage|`acid`
> |All damage (including untyped)|`all`
> |Cold damage|`cold`
> |Corruption damage|`corruption`
> |Fire damage|`fire`
> |Holy damage|`holy`
> |Lightning damage|`lightning`
> |Poison damage|`poison`
> |Psychic Damage|`psychic`
> |Sonic Damage|`sonic`
>
>An Example to add fire immunity 3 would be
>
> |system.damage.immunities.fire|Add|`3`|
> |---|---|---|
>
></details>
