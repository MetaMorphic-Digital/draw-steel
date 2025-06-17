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

# Actor Roll Data

## Characteristics
+ Agility value -`@characteristics.agility.value`
+ Intuition value - `@characteristics.intuition.value`
+ Might value - `@characteristics.might.value`
+ Presence value - `@characteristics.presence.value`
+ Reason value - `@characteristics.reason.value`

### Combat Data
+ Save Bonus - `@combat.save.bonus`
+ Save Threshold - `@combat.save.threshold`
+ Size (1/2/3/4) `@combat.size.value`
+ Stability - `@combat.stability`
+ Total amount of turns per round of specific actor (e.g. Solos would have 2) `@combat.turns`

## Potencies
+ Strong Potency (= highest characteristic) - `@potency.strong`
+ Average Potency (= highest characteristic -1) - `@potency.average`
+ Weak Potency (= highest characteristic -2) - `@potency.weak`
+ Bonus to Potency - `@potency.bonuses`

## Stamina
+ Maximum Stamina - `@stamina.max`
+ Temporary Stamina - `@stamina.temporary`
+ Current Stamina value - `@stamina.value`
+ Winded (<50%) Stamina Value - `@stamina.winded`
+ Is currently winded? (1/yes, 0/no) - `@statuses.winded`

### Movement speeds
+ Speed - `@movement.value`
+ Teleport - `@movement.teleport` (Unaffected by most speed adjustments)

## Hero specific roll data and values
### Heroic Resource
+ Heroic resource label - `@hero.primary.label`
+ Heroic resource value - `@hero.primary.value`

### Recoveries
+ Recovery value - `@hero.recoveries.value`
+ Maximum amount of recoveries - `@hero.recoveries.max`
+ Bonus to max amount - `@hero.recoveries.bonus`
+ Current recovery amount - `@hero.recoveries.recoveryValue`

### Other Hero values
+ Renown - `@hero.renown`
+ Skills - `@hero.skills`
+ Current amount of Surges - `@hero.surges`
+ Current Victory Points - `@hero.victories`
+ Accumulated XP - `@hero.xp`

### Kit
The below bonuses come from a kit, but can be addressed this way in any case:
+ Bonus to Tier 1 Melee damage - `@abilityBonuses.melee.damage.tier1`
+ Bonus to Tier 2 Melee damage - `@abilityBonuses.melee.damage.tier2`
+ Bonus to Tier 3 Melee damage - `@abilityBonuses.melee.damage.tier3`
+ Bonus to Tier 1 Ranged damage - `@abilityBonuses.ranged.damage.tier1`
+ Bonus to Tier 2 Ranged damage - `@abilityBonuses.ranged.damage.tier2`
+ Bonus to Tier 3 Ranged damage - `@abilityBonuses.ranged.damage.tier3`
+ Bonus to melee distance - `@abilityBonuses.melee.distance`
+ Bonus to ranged distance - `@abilityBonuses.ranged.distance`


### Immunities and Weaknesses
The below roll data entries work add damage immunities and weaknesses, for example added in effects. The numerical value determines how much of a weakness of immunity the actor has

#### Immunities
+ Acid damage -`@damage.immunities.acid`
+ All damage (including untyped)- `@damage.immunities.all`
+ Cold damage - `@damage.immunities.cold`
+ Corruption damage - `@damage.immunities.corruption`
+ Fire damage - `@damage.immunities.fire`
+ Holy damage - `@damage.immunities.holy`
+ Lightning damage - `@damage.immunities.lightning`
+ Poison damage - `@damage.immunities.poison`
+ Psychic Damage - `@damage.immunities.psychic`
+ Sonic Damage - `@damage.immunities.sonic`

#### Weaknesses
+ Acid - `@damage.weaknesses.acid`
+ All damage (including untyped) - `@damage.weaknesses.all`
+ Cold damage -	`@damage.weaknesses.cold`
+ Corruption damage - `@damage.weaknesses.corruption`
+ Fire damage - `@damage.weaknesses.fire`
+ Holy damage - `@damage.weaknesses.holy`
+ Lightning damage - `@damage.weaknesses.lightning`
+ Poison damage - `@damage.weaknesses.poison`
+ Psychic Damage - `@damage.weaknesses.psychic`
+ Sonic Damage - `@damage.weaknesses.sonic`

### Statuses
Value indicates if actor currently has status (1/yes, 0/no)
+ Asleep -`@statuses.sleep`
+ Bleeding - `@statuses.bleeding`
+ Burning - `@statuses.burning`
+ Dazed - `@statuses.dazed`
+ Dead - `@statuses.dead`
+ Deaf - `@statuses.deaf`
+ Dying - `@statuses.dying`
+ Frozen - `@statuses.frozen`
+ Frightened - `@statuses.frightened`
+ Grabbed - `@statuses.grabbed`
+ Invisible - `@statuses.invisible`
+ Marked - `@statuses.eye`
+ Prone - `@statuses.prone`
+ Restrained - `@statuses.restrained`
+ Slowed - `@statuses.slowed`
+ Targeted - `@statuses.target`
+ Taunted - `@statuses.taunted`
+ Weakened - `@statuses.weakened`
+ Winded - `@statuses.winded`

## Echelon and Level
+ Echelon - `@echelon`
+ Level - `@level`

## Item Roll Data
**First example: a craftable consumable**
#### Item Descriptors
+ Item category - `@item.category `
+ Item GM description - `@item.description.gm`
+ Item Type - `@item.kind`
+ Item Name - `@item.name`
#### Downtime Project roll data
+ Project Prerequisites - `@item.prerequisites`
+ Project Goal - `@item.project.goal`
+ Project Roll Characteristic - `@item.project.rollCharacteristic`
+ Project Source - `@item.project.source`
+ Project Yield - `@item.project.yield`
#### Source data
+ Source Book - `@item.source.book`
+ Source Book Placeholder - `@item.source.bookPlaceholder`
+ Source Label - `@item.source.label`
+ Source License - `@item.source.license`
+ Source Page - `@item.source.page`
+ Source Revision - `@item.source.revision`
+ Source Slug - `@item.source.slug`
+ Source Value - `@item.source.value`

**Second example: An equipment kit**
+ Item Bonus on Disengage distance - `@item.bonuses.disengage`
+ Item Bonus on Melee Damage Tier 1 - `@item.bonuses.melee.damage.tier1`
+ Item Bonus on Melee Damage Tier 2 - `@item.bonuses.melee.damage.tier2`
+ Item Bonus on Melee Damage Tier 3 - `@item.bonuses.melee.damage.tier3`
+ Item Bonus on Melee Distance - `@item.bonuses.melee.distance`
+ Item Bonus on Ranged Damage Tier 1 - `@item.bonuses.ranged.damage.tier1`
+ Item Bonus on Ranged Damage Tier 2 - `@item.bonuses.ranged.damage.tier2`
+ Item Bonus on Ranged Damage Tier 3 - `@item.bonuses.ranged.damage.tier3`
+ Item Bonus on Ranged Distance - `@item.bonuses.ranged.distance`
+ Item Bonus on Speed - `@item.bonuses.speed`
+ Item Bonus on Stability - `@item.bonuses.stability`
+ Item Bonus on Stamina - `@tem.bonuses.stamina`
+ Item GM description - `@item.description.gm`
+ Item description - `@item.description.value`
+ Item Armor type - `@item.equipment.armor`
+ Item is/has shield (true/false) - `@item.equipment.shield`
+ Item Keywords - `@item.equipment.weapon`


### Abilities

+ Ability Bonus on Disengage distance - `@abilityBonuses.disengage`
+ Ability Bonus on Melee Damage Tier 1 - `@abilityBonuses.melee.damage.tier1`
+ Ability Bonus on Melee Damage Tier 2 - `@abilityBonuses.melee.damage.tier2`
+ Ability Bonus on Melee Damage Tier 3 - `@abilityBonuses.melee.damage.tier3`
+ Ability Bonus on Melee Distance - `@abilityBonuses.melee.distance`
+ Ability Bonus on Ranged Damage Tier 1 - `@abilityBonuses.ranged.damage.tier1`
+ Ability Bonus on Ranged Damage Tier 2 - `@abilityBonuses.ranged.damage.tier2`
+ Ability Bonus on Ranged Damage Tier 3 - `@abilityBonuses.ranged.damage.tier3`
+ Ability Bonus on Ranged Distance - `@abilityBonuses.ranged.distance`
+ Ability Category - `@item.category`
+ Ability damage display (Melee/Ranged) - `@item.damageDisplay`
+ Ability Story Text - `@item.story`
+ Ability primary distance (distance/AoE size eg Burst **5**) - `@item.distance.primary`
+ Ability secondary distance (AoE distance eg. Cube 3 within **10**) - `@item.distance.secondary`
+ Ability tertiary distance (secondary AoE distance eg. 1x10 line within **1**)- `@item.distance.tertiary`
+ Ability Distance type - `@item.distance.type`
+ Ability Effect (Before) - `@item.effect.before`
+ Ability Effect (After) - `@item.effect.after`
+ Ability Name - `@item.name`
+ Ability Power Roll Characteristic - `@item.powerRoll.characteristics`
+ Ability has Power Roll (true/false) - `@item.powerRoll.enabled`
+ Ability Power Roll Characteristic formula - `@item.powerRoll.formula`
+ Ability Heroic Resource/Malice Cost -`@item.resource`
+ Ability Additional Heroic Resource/Malice spent effect - `@item.spend.text`
+ Ability Additional Heroic Resource/Malice Cost - `@item.spend.value`
+ Type of Target - `@item.target.type`
+ Number of targets - `@item.target.value`
+ Trigger (if triggered action) - `@item.trigger`
+ Ability type - `@item.type`
