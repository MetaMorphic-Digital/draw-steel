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

## Characteristics and Potencies

+ Agility value				-	`characteristics.agility.value`
+ Intuition value				-	`characteristics.intuition.value`
+ Might value					-	`characteristics.might.value`
+ Presence value				-	`characteristics.presence.value`
+ Reason value				-	`characteristics.reason.value`

## Potencies
+ Strong Potency (= highest characteristic)	-	potency.strong:		2
+ Average Potency (= highest characteristic -1)	-	potency.average:	1
+ Weak Potency (= highest characteristic -2)	-	potency.weak:		0
+ Bonus to Potency				-	potency.bonuses:	0

## Hero specific roll data and values
### Heroic Resource
+ Heroic resource label				-	`hero.primary.label:			"Wrath"`
+ Heroic resource value				-	`hero.primary.value:			5`

### Stamina
+ Maximum Stamina				-	`stamina.max:				33`
+ Temporary Stamina				-	`stamina.temporary:			0`
+ Current Stamina value				-	`stamina.value:				7`
+ Winded (<50%) Stamina Value			-	`stamina.winded:			16`
+ Is currently winded? (1/yes, 0/no)		-	`statuses.winded: 			1`

### Recoveries
+ Recovery value				-	`hero.recoveries.value:			7`
+ Maximum amnount of recoveries			-	`hero.recoveries.max:			12`
+ Bonus to max ammount				-	`hero.recoveries.bonus:			0`
+ Current recovery amount			-	`hero.recoveries.recoveryValue:		11`

### Other Hero values
+ Renown					-	`hero.renown:				0`
+ Skills					-	`hero.skills: Set(10) {'climb', 'endurance', 'jump', 'navigate', 'empathize', …}`
+ Current amount of Surges			-	`hero.surges:				0`
+ Current Vicotry Points			-	`hero.victories:			3`
+ Accumulated XP				-	`hero.xp:				0`

### Movement speeds
+ Burrowing					-	`movement.burrow: 	null`
+ Climbing					-	`movement.climb:	null`
+ Flying					-	`movement.fly:		null`
+ Swimming					-	`movement.swim:		null`
+ Teleport					-	`movement.teleport:	null`
+ Waling					-	`movement.walk:		7`

The below bonuses come from a kit, but can be addressed this way in any case:
+ Bonus to Tier 1 Melee damage			-	`abilityBonuses.melee.damage.tier1:	2`
+ Bonus to Tier 2 Melee damage			-	`abilityBonuses.melee.damage.tier2:	2`
+ Bonus to Tier 3 Melee damage			-	`abilityBonuses.melee.damage.tier3:	2`
+ Bonus to Tier 1 Ranged damage			-	`abilityBonuses.ranged.damage.tier1:	0`
+ Bonus to Tier 2 Ranged damage			-	`abilityBonuses.ranged.damage.tier2:	0`
+ Bonus to Tier 3 Ranged damage			-	`abilityBonuses.ranged.damage.tier3:	0`
+ Bonus to melee distance			-	`abilityBonuses.melee.distance:	0`
+ Bonus to ranged distance			-	`abilityBonuses.ranged.distance:	0`

The below roll data refers to the actors size, and values such as stability and number of turns per combat
+ `combat.size.letter:			"M"`
+ `combat.size.value:			1`
+ `combat.stability:			1`
+ `combat.turns:			1`

### Immunities and Weaknesses
The below roll datas entries work add damage immunities and weaknesses, for example added in effects. The numerical value determines how much of a weakness of immunity the actor has
#### Immunities
+ Acid damage					-	`damage.immunities.acid:		0`
+ All damage (including untyped)		-	`damage.immunities.all:		0`
+ Cold damage					-	`damage.immunities.cold:		0`
+ Corruption damage				-	`damage.immunities.corruption:		0`
+ Fire damage					-	`damage.immunities.fire:		0`
+ Holy damage					-	`damage.immunities.holy:		0`
+ Lightning damage				-	`damage.immunities.lightning:		0`
+ Poison damage					-	`damage.immunities.poison:		0`
+ Psychic Damage				-	`damage.immunities.psychic:		0`
+ Sonic Damage					-	`damage.immunities.sonic:		0`
#### Weaknesses
+ Acid 						-	`damage.weaknesses.acid:		0`
+ All damage (including untyped)		-	`damage.weaknesses.all:			0`
+ Cold damage					-	`damage.weaknesses.cold:		0`
+ Corruption damage				-	`damage.weaknesses.corruption:		0`
+ Fire damage					-	`damage.weaknesses.fire:		0`
+ Holy damage					-	`damage.weaknesses.holy:		0`
+ Lightning damage				-	`damage.weaknesses.lightning:		0`
+ Poison damage					-	`damage.weaknesses.poison:		0`
+ Psychic Damage				-	`damage.weaknesses.psychic:		0`
+ Sonic Damage					-	`damage.weaknesses.sonic:		0`

### Statuses
Value indicates if actor currently has status (1/yes, 0/no)
+ Asleep					-	`statuses.sleep:	0`
+ Bleeding					-	`statuses.bleeding:	0`
+ Bruning					-	`statuses.burning:	0`
+ Dazed						-	`statuses.dazed:	0`
+ Dead						-	`statuses.dead:		0`
+ Deaf						-	`statuses.deaf: 	0`
+ Dying						-	`statuses.dying:	0`
+ Frozen					-	`statuses.frozen:	0`
+ Frightened					-	`statuses.frightened:	0`
+ Grabbed					-	`statuses.grabbed:	0`
+ Invisible					-	`statuses.invisible:	0`
+ Marked					-	`statuses.eye:		0`
+ Prone						-	`statuses.prone:	0`
+ Restrained					-	`statuses.restrained:	0`
+ Slowed					-	`statuses.slowed:	0`
+ Targeted					-	`statuses.target:	0`
+ Taunted					-	`statuses.taunted:	0`
+ Weakened					-	`statuses.weakened:	0`
+ Winded					-	`statuses.winded:	0`

## Echelon
+ Actor Echelon					-	`echelon:		1`
+ Item Echelon					-	`item.echelon:  	1`

## Item Roll Data
**First example: A healing potion, a craftable consumable**
#### Item Descriptors
+ Draw Steel ID:				-	`item._dsid: "health-potion"`
+ Item category					-	`item.category: "consumable"`
+ Item GM description				-	`item.description.gm: ""`
+ Item Echelon					-	`item.echelon: 1`
+ Item Keywords					-	`item.keywords: Set(1) {'magic'}`
+ Item Type					-	`item.kind: "other"`
+ Item Name					-	`item.name: "Healing Potion"`
#### Downtime Project roll data
+ Project Prerequisites				-	`item.prerequisites: "One ounce of costmary leaves"`
+ Project Goal					-	`item.project.goal: 45`
+ Project Roll Characteristric			-	`item.project.rollCharacteristic: Set(2) {'reason', 'intuition'}`
+ Project Source				-	`item.project.source: "Texts or lore in Caelian"`
+ Project Yield					-	`item.project.yield: "1"`
#### Source data
+ Source Book					-	`item.source.book`
+ Source Book Placeholder			-	`item.source.bookPlaceholder`
+ Source Label					-	`item.source.label`
+ Source License				-	`item.source.license`
+ Source Page					-	`item.source.page`
+ Source Revision				-	`item.source.revision`
+ Source Slug					-	`item.source.slug`+ 
+ Source Value					-	`item.source.value`

**Second example: An equipment kit: Cloak and Dagger**
+ Draw Steel ID	-	`item._dsid: "cloak-and-dagger"`
+ Item Bonus on Disengage distance		-	`item.bonuses.disengage`
+ Item Bonus on Melee Damage Tier 1		-	`item.bonuses.melee.damage.tier1`
+ Item Bonus on Melee Damage Tier 2		-	`item.bonuses.melee.damage.tier2`
+ Item Bonus on Melee Damage Tier 3		-	`item.bonuses.melee.damage.tier3`
+ Item Bonus on Melee Distance			-	`item.bonuses.melee.distance`
+ Item Bonus on Ranged Damage Tier 1		-	`item.bonuses.ranged.damage.tier1`
+ Item Bonus on Ranged Damage Tier 2		-	`item.bonuses.ranged.damage.tier2`
+ Item Bonus on Ranged Damage Tier 3		-	`item.bonuses.ranged.damage.tier3`
+ Item Bonus on Ranged Distance			-	`item.bonuses.ranged.distance`
+ Item Bonus on Speed				-	`item.bonuses.speed`
+ Item Bonus on Stability			-	`item.bonuses.stability`
+ Item Bonus on Stamina				-	`item.bonuses.stamina`
+ Item GM description				-	`item.description.gm`
+ Item description				-	`item.description.value`
+ Item Armor type				-	`item.equipment.armor: "light"`
+ Item is/has shield (true/false)		-	`item.equipment.shield: false`
+ Item Keywords					-	`item.equipment.weapon: Set(1) {'light'}`
+ Item Name					-	`item.name : "Cloak and Dagger"`

### Abilities
Example: troubadour heropic ability 'Dramatic Reversal', a 5 Drama ability

+ Draw Steel ID					-	`item._dsid: "troubadour-ability-9"`
+ Ability Category				-	`item.category: "heroic"`
+ Ability damage display (Melee/Ranged)		-	`item.damageDisplay: "melee"`
+ Ability Story Text				-	`item.description.flavor: "Give the audience a surprise."`
+ Ability GM description			-`item.description.gm: ""`
+ Ability description				-`item.description.value:  ""`
+ Ability primary distance (distance/AoE size eg Burst **5**)	-	`item.distance.primary: 3`
+ Ability secondary distance (AoE distance eg. Cube 3 within **10**)	-	`item.distance.secondary: 0`
+ Ability tertiary distance	(secondary AoE distance eg. 1x10 line within **1**-	`item.distance.tertiary: null`
+ Ability Distance type				-	`item.distance.type: "burst"`
+ Ability Effect				-	`item.effect: ""`
+ Ability Keywords				-	`item.keywords: Set(2) {'area', 'magic'}`
+ Ability Name					-	`item.name: "Dramatic Reversal"`
+ Ability Power Roll Characteristic		-	`item.powerRoll.characteristics: Set(1) {'presence'}`
+ Ability has Power Roll (true/false)		-	`item.powerRoll.enabled: true`
+ Ability Power Roll Characteristic formula	-	`item.powerRoll.formula: "@chr"`
+ `item.powerRoll.tier1: [{…}]`
+ `item.powerRoll.tier2: [{…}]`
+ `item.powerRoll.tier3: [{…}]`
+ Ability Heroic Resource/Malice Cost		-	`item.resource: 5`
+ Ability Additional Heroic Resource/Malice spent effect	-	`item.spend.text: ""`
+ Ability Additional Heroic Resource/Malice Cost`	-	item.spend.value: null`
+ Type of Target				-	`item.target.type: "creature"`
+ Number of targets				-	`item.target.value: null`
+ Trigger (if triggered action)			-	`item.trigger: ""`
+ Ability type:					-	`item.type: "action"`