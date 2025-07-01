Draw Steel fully supports the use of active effects to modify actor attributes.

The Foundry [Knowledge Base](https://foundryvtt.com/article/active-effects/) has more info on the basics of active effects; this page is focused on system-specific information.

## Legend

`[number]` - These square brackets mean "replace this with your value of the type within the brackets". So this example: `[number]` would mean you input `3`. If roll data is allowed, you can input any roll data that would _evaluate_ to a number (no dice allowed).

`[formula]` - When `formula` is mentioned in this document it means this value can be populated with any dice formula. For example, an ability could add an effect with the Effect Value of `1d6`. These fields always allow for the use of roll data.

> **Sheet Modes**
> The Actor and Item sheets in the system support both Play and Edit modes. One important difference between the two is that the Edit mode prioritizes showing the "source" data, which is *before* active effects are applied. To see values with active effects calculated, switch back to play mode.

## Actor's 'Effects' tab

On the actor sheet, at the top of 'Effects' tab is now a new section with butttons for the DS core conditions. Clicking any of these will aply those conditions to the actor linked to the actor sheet. Applying them this way will set no duration for them.

Applying any of these DS core conditions applies a active effect, details for which can be found in the `System Automations` section.

When creating a new temporary active effect by clicking on the `+ New Effect` button on the right of a active effect section header on this page, the duration is by default set to EoT (End of Turn).

## Active Effect Config

At any given time you can change the icon and name of an active effect.

### Details

On the details page, you can give an effect a informative description. If you tick the `Effect Suspended` tick box, the effect will exist, but not take effect until activated. If you tick the `Apply Effect to Actor` tick box, the effect will be applied to the actor themselves. Effects are also automatically suppressed if they have a conventional duration (e.g. in rounds & turns) that has run over.

The Draw Steel System uses the "Apply Effect to Actor" as a way to decide if an effect on an item is an "Applied Effect"; if the tickbox is unchecked means the effect is available as an apoplied effect in ability usage, but the system won't have that application handling until 0.8 at least.

#### Linking status effects

At the bottom of the Details page is the `Status Condition` dropdown menu. This allows you to link on of the system's default Status Conditions to the effect. If it is one of the automated conditions (see **System Automations**) then this effect will include that condition in it's functionality a token will behave as if that status condition is applied to it.

For example if an Active Effect is linked to the `Prone` condition and is applied to an actor, this actor's movement becomes crawling and abilities against them gain an edge, and their abilities have a bane.

If it is one of the automated conditions that require a targeted token as the source (`Frightened`, `Grabbed`, `Taunted`), and a token is targeted while applying the Active Effect, this targeted token will function as source for those conditions, applying edges and banes accordingly.

### Duration

Draw Steel has three different predefined effect durations `End of Turn (EoT)`, `Save Ends`, and `End of Encounter`.
Additionally, the Save Ends duration allows for defining the saving throw formula. The default is `1d10 + @combat.save.bonus`.

+ `EoT` will automatically self-disable when a combatant ends their turn with the `End turn` button in the initiative tracker or a new combatant's turn begins.
+ `Save Ends` will at the end of an actor's turn create prompts for owners that allow to change the save threshold (e.g. due to Ancestry effects) and a text field to enter situational bonuses. The roll message has a button to spend a hero token to automatically succeed. If multiple players own an actor, the active GM will receive a dialog to help delegate rolls.
+ `End of Encounter` effects will automatically self-disable alongside the encounter.

Additional options for duration are timed durations, and durations base don rounds and turns, however, as these are not part of the Draw Steel rules, it is recommended not to utilise these.

### Changes

The last tab includes the Active Effect changes of an effect. Here you can add bonuses and maluses, or stat changes, and determine how they affect a actor.

#### Active effect change modes

|Change Mode|Description|
|:-----------:|--------|
|Add|Adds the provided value to the specified attribute. For attributes, this can be used to both add and subtract from a particular value by specifying 1 or -1 as the value to add.|
|Multiply|Multiplies the defined attribute by the value in the Effect Value field.|
|Override|Replaces the defined attribute with the value provided in the Effect Value field.|
|Downgrade|Reduces the defined attribute only in cases where the current the value of that attribute would be greater than value specified in the Effect Value field.|
|Upgrade|Increases the defined attribute only in cases where the current value of that attribute would be less than value specified in the Effect Value field.|
|Custom|The Custom change mode applies logic defined by a game system or add-on module. The Draw Steel system does not utilize the Custom Change Mode.|

While there are similarities with roll data, active effects generally lead with `system.` instead of `@`. To add a temporary bonus to stability via an active effect, the active effect will need to look as the following example:

|system.combat.stability|Add|[value]|
|---|---|---|

#### Characteristic Keys

|Characteristic|Attribute Key|
|:---:|---|
|Agility value|`system.characteristics.agility.value`|
|Intuition value|`system.characteristics.intuition.value`|
|Might value|`system.characteristics.might.value`|
|Presence value|`system.characteristics.presence.value`|
|Reason value|`system.characteristics.reason.value`|

#### Common bonus effect examples

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
> **!**: Current Stamina (`system.stamina.value`) and Temporary Stamina (`system.stamina.temporary`) must *not* be targeted with an active effect. These are meant to regularly change, which is why they're exposed in play mode.

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

