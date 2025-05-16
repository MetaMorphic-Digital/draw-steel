# In-Game Automation

This page is dedicated to pointing out all current Automation in the Draw Steel System, and gives a preview of future automation.

# Current Automation (Version 0.7)

## Characteristic Rolls and Skills

When you click on any of your characteristics on your character sheet while in ‘play’ mode, it will automatically prompt to roll a power roll as a test for said characteristi. This prompted power roll opens a new input prompt, that allows to add skills, and situational bonuses, like edges and banes. The power roll follows the formula (situational bonuses and skills in parentheses):

***2d10 + characteristic (+ 2 (Skill bonus) ± Edges/Banes)***


## Stamina and negative Stamina

To set a heroes stamina to a negatyive value, either

- set the stamina value on the character sheet as [-value]. If Stamina is `5` and the entered value is `-10`, then the resulting stamina will be `-10`

- use the token HUD for a relative change of stamina. If stamina is `5` and the entered value is `-10` then the resulting stamina will be `-5`.

## Recoveries, Respites, and Hero Tokens

### Recoveries

On the character sheet is a button for using a `Recovery`, that automatically heals your character by their recovery value and decreases your recovery amount by 1.

### Respites

On the character sheet is a button for taking a `Respite`, that automatically converts your victories to XP and resets your recoveries.

### Recoveries through Hero Tokens

When clicking on the `Stamina` label on the character sheet, a prompt will appear to spend 2 Hero Tokens - if available - instead of a Recovery to regain stamina worth the actor’s recovery value.

### Hero Tokens and Malice display

Both Hero Token count  and Director’s Malice total are displayed in a little display as part of/below the player list in the bottom left corner of the screen. The Director has access to a global setting to hide their Malice count from the players, or have it be visible.

The three dot menu in line with hero tokens allows for awarding Hero Tokens to the party (increasing the count), and resetting them to the current player count. 

## Heroic Resource/Malice generation and consumption

If a player character has a defined class with a defined HR generation formula (typically `2` or `1d3`), then at the beginning of each of their turns in combat, they automatically generate that amount. Accordingly if they use abilities with a resource cost, that resource cost is automatically subtracted from their total.

### Victories and HR/Malice generation

If a player character has victories, then they will start combat with an equal amount of their HR.

#### Malice

The same is true for the Director's Malice generation. Malice is generated at the beginning of combat according to the formula:

***Malice = (Number of Heroes)+(Number of victories)+(Number of Rounds=1)***

During combat, after the first round Malice is generated at the beginning of a round according to the formula:

***Malice = (Number of Heroes)+(Number of Rounds>1)***

##### Malice Consumption

Malice is counted across **ALL** NPCs in game. Any ability that has a `Resource Cost` programmed into it, will consume Malice if activated from an NPC actor sheet.

Testing monster abilities that cost Malice does reduce the malice count in the display which is shared across all NPCs.

## Free Strikes

NPC Free Strikes are fully automated and require a target.

When a creature is targeted you can hit the free strike button of an NPC’s actor sheet, and the free strike damage automatically is applied to the target. This does not function without a creature being targeted.

## Movement and Attacks of Opportunity

With the implementation of the token ruler in Foundry V13 the system automatically displays allowed movement speed with the token ruler, including a display of how many free strikes a moving token would trigger from other creatures adjacent to that movement path.

Choosing one of the displayed movement types, such as climbing, crawling, or swimming automatically adjusts the available movement distance.

## Kits and Kit Bonuses

If a kit is set up with any bonuses applied to it (stamina, damage bonuses, stability, etc) these will automatically be applied to the displayed values that they correlate to.

### Multiple Kits

If a character has multiple kits that provide damage bonuses to the same type (melee/ranged), then the preferred kit needs to be marked from the right click context menu of the kit, so that the proper damage bonuses apply.

### Stamina Bonuses

For stamina, this means when a character sheet is in ‘edit’ mode, it will only show the base maximum stamina, and when it is in ‘play’ mode, it will show the maximum stamina including all bonuses.

**Example:** The base stamina of a hero is 12. The hero also wears a kit that gives a stamina bonus of +5. In ‘edit’ mode the hero's stamina would be only 12, but in ‘play’ mode the maximum stamina would be displayed as 17.

### Damage Bonuses

If a kit provides dedicated damage bonuses to certain tiers, or only to certain attacks (melee/ranged) then these bonuses are applied to the respectively key worded abilities accordingly.

- The `Shining Armor` kit for example only provides a +2 damage bonus to all tiers of abilities with the ‘melee’ key word.

- The `Cloak and Dagger` kit provides a +1 damage bonus to all tiers of abilities with either the ‘melee’ or/and the ‘ranged’ key word.

- The `Panther` kit provides a +4 bonus to tier 3 results of abilities with the ‘melee’ key word

Additionally, if an equipped kit provides damage bonuses that are not the same across both types (melee/ranged) (eg `Shining Armor`, the right-click context menu of an ability that can be used both as a Melee or Ranged attack, allows to choose between `Melee` and `Ranged` mode, which applies the respective damage bonuses appropriately.

### Other Bonuses

If a kit provides a bonus other than stamina or damage, these bonuses also get automatically applied and displayed on the character sheet. This includes bonuses to speed, stability, or ability distance.

## Applying Damage from Chat Messages

If an ability is programmed with damage, untyped or typed, then when the ability is used, a button will appear in the chat window that is showing the power roll result, which will automatically apply the damage to a selected token. This also immediately takes damage weaknesses and immunities into account *(see below)*

## Damage Immunities and Weaknesses

Damage Immunities and Weaknesses can be added via the respective section the the actor sheet.. If an ability deals damage that the receiving actor has an active effect that provides immunity or weakness to that damage type, then the value is automatically subtracted when the “Apply Damage” button in the ability’s chat message is pressed. The respective data strings to address the correct immunity or weakness can be found on the ***Roll Data*** page

## Automated Status Effects

Certain status effects and their function are automated, with some requiring a targeted actor to act as a source.

Additionally, each effect is documented in the system compendiums.

### Dazed

If the `Dazed` effect is applied to an actor, then a warning symbol will appear next to that actor’s triggered actions, free triggered actions, and free maneuvers, to indicate that these abilities can’t be used while affected by the `Dazed` effect.

### Dying

If an Actor's stamina falls below zero they automatically get the `dying` status effect applied to them. This status does not have any effects by itself and is removed automatically if an actor's stamina gets healed above zero stamina.

### Frightened

If the `Frightened` status effect is applied to an actor, while another actor is targeted, the targeted actor becomes the source of the affected actor's fear and the ability power rolls of the frightened actor that are targeted at the source actor automatically have a bane.

### Grabbed

If the `Grabbed` status effect is applied to an actor, while another actor is targeted, the targeted actor becomes the source of the Grab and the ability power rolls of the grabbed actor that are targeted at actors other than the source actor automatically have a bane. Additionally the displayed movement speed on the grabbed actor’s character sheet is set to zero.

### Prone

If the `Prone` status effect is applied to an actor, the available movement types of that actor become only `Crawl`, `Burrow`, and `Teleport`. If the movement mode `Crawl` is chosen the movement costs 1 square extra. (see ***Movement***) ~~(Not yet implemented) Abilities target the prone actor and that have the melee key word automatically have an edge. The prone actor’s abilities that have the ‘Strike’ keyword take a bane.~~

### Restrained

If the `Restrained` status effect is applied to an actor the ability power rolls of the restrained actor automatically have a bane and abilities with the restrained actor being targeted have an edge. Additionally the displayed movement speed on the grabbed actor’s character sheet is set to zero.

### Slowed

If the `Slowed` status effect is applied to an actor, the displayed maximum speed on the character sheet of that actor is changed to 2 and the in-game token ruler of that actor displays allowed speed accordingly. (see ***Movement***) Traits such as Humans` `Perseverance` can be activated via Active Effects, which allows to set the “slowed” speed to 3 instead of 2.

### Weakend

If the `Weakened` status is applied to an actor, all power rolls of that actor automatically have a bane applied to them.

### Winded

If an actor falls below 50 % of their maximum stamina, they automatically get the `winded` status effect applied to them. This status does not have any effects by itself.
If the actor's stamina gets healed above the 50 % threshold, the `winded` status automatically if removed. 

# Future Automations

The following automations planned for the near or distant future.

## Negotiations

An application is planned to support directors when running Negotiations

## Compendium Browser

Once there is multiple sources of content, a compendium browser migth become helpful.

## Actor Type - Retainers

Currently there are only 2 Actor types, Characters and NPCs. An additional actor type is planned for retainers to support their implementation as a mix of character and monster features.

## Automated Status Effects

### Bleeding
When an actor has the `Bleeding` status effect, it automatically loses `1d6` stamina henever they make a test using Might or Agility, make a strike, or use an action, maneuver, or a triggered action.


### Taunted

If the `Taunted` status effect is applied to an actor, while another actor is targeted, the targeted actor becomes the source of the Taunt and abilities that are targeted at the actors other than the source actor automatically have a bane.

### Winded

If the stamina falls below zero, it is automatically replaced with the `dying` status.



