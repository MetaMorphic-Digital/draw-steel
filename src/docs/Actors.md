Within Draw Steel, the Heroes and Non-Player Characters are collectively referred to as "Actors".

The Foundry [Knowledge Base](https://foundryvtt.com/article/actors/) has more info on the basics of actors; this page is focused on system-specific information.

## General info

The actor sheets in Draw Steel feature both a "Play" and "Edit" mode, which can be toggled using the buttons in the top right of the sheet.

In play mode:
- You can click the characteristic labels to prompt for a roll, including the opportunity to select a relevant skill or modify edges & boons

In edit mode:
- You can adjust the base values
- The adjustments from active effects and advancements are *not* displayed.

### Tokens

Actors are represented on the canvas via tokens. Draw Steel includes a number of enhancements to the core token functionality.

**Attribute Bars:** The Token attribute bars will assume a "delta" change if you enter a number prefixed with a + or -, so -5 means "reduce attribute by 5" rather than "set attribute to -5". If you want to *set* an attribute to a negative value, prefix with `=-`, e.g. `=-5` to set to -5.

**Flanking:** The system automates the edge on melee strikes from Flanking; it requires line of effect and the ability to take triggered actions.

**Token Ruler:** Dragging a token in Draw Steel will both display distance information based on the token's movement value & selected movement type as well as the *quantity* of free strikes triggered.

## Heroes

The player characters in Draw Steel are heroes.

### Recoveries and Respites

Players can use the "Recovery" button on the character sheet to spend a recovery and regain stamina equal to their recovery value. They can also use the "Respite" button to restore their stamina, recoveries, and convert their victories to xp.

### Heroic Resources

If a player character has a defined class with a defined HR generation formula (typically `2` or `1d3`), then at the beginning of each of their turns in combat, they automatically generate that amount. Accordingly if they use abilities with a resource cost, that resource cost is automatically subtracted from their total. If a player character has victories, then they will start combat with an equal amount of their HR.

### Hero Tokens

All heroes share a "Hero Token" pool from which they can dig deeper. Players can spend hero tokens in a number of ways. The current number of hero tokens is displayed in the bottom left below the player list.
- Clicking the "Stamina" button on the character sheet will spend two hero tokens to regain stamina equal to the hero's recovery value.
- Clicking the "Surges" button will spend a hero token to gain two surges.
- Saving throws include a button to spend a hero token to turn a failure into a success.
- You can always use the vertical ellipsis menu below the Players list to spend hero tokens without any automated effect.

Directors have additional options in the vertical ellipsis menu, including giving hero tokens and resetting the total to the number of heroes in the game.

## Non-Player Characters

Non-player character ("NPC") actors cover both the monsters that the heroes fight as well as any other type of character a director might include in their game.

### Malice

The system automatically generates Malice at the start of each round of combat based on the number of heroes, their victories, and the number of rounds. To be counted as a hero, a combatant must:
- be associated with an actor of type "hero"
- that hero is owned by at least one player

#### Malice Consumption

All NPC actors share a malice pool. Any ability that has a `Resource Cost` listed will consume Malice if activated from an NPC actor sheet.

## Free Strikes

The Free Strike button on an NPC automatically applies the damage to *targeted* actors.