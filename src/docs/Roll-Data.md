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

### Recoveries
+ Recovery value - `@recoveries.recoveryValue`
+ Current recovery amount - `@recoveries.value`
+ Maximum amount of recoveries - `@recoveries.max`
+ Bonus to recovery value - `@recoveries.bonus`

### Movement speeds
+ Speed - `@movement.value`
+ Teleport - `@movement.teleport` (Unaffected by most speed adjustments)

## Hero specific roll data and values

### Heroic Resource
+ Heroic resource label - `@hero.primary.label`
+ Heroic resource value - `@hero.primary.value`

### Other Hero values
+ Renown - `@hero.renown`
+ Skills - `@hero.skills`
+ Current amount of Surges - `@hero.surges`
+ Current Victory Points - `@hero.victories`
+ Accumulated XP - `@hero.xp`

### Immunities and Weaknesses

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

## NPC Actor Roll Data

### Monster Roll data
+ Free Strike damage: - `@monster.freeStrike`

### Monster Negotiation Roll Data
+ Impression Score - `@negotiation.impression`
+ Interest - `@negotiation.interest`
+ Patience - `@negotiation.patience`

## Item Roll Data

#### Downtime Project roll data
+ Project Goal - `@item.project.goal`

### Abilities

+ Ability primary distance  - `@item.distance.primary`
+ Ability secondary distance - `@item.distance.secondary`
+ Ability tertiary distance - `@item.distance.tertiary`
+ Ability Power Roll Characteristic - `@item.powerRoll.characteristics`
+ Ability Power Roll Characteristic formula - `@item.powerRoll.formula`
+ Ability Heroic Resource/Malice Cost -`@item.resource`
+ Ability Additional Heroic Resource/Malice Cost - `@item.spend.value`
+ Number of targets - `@item.target.value`
