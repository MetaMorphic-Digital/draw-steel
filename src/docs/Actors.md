Within Draw Steel, the Heroes and Non-Player Characters are collectively referred to as "Actors".

The Foundry [Knowledge Base](https://foundryvtt.com/article/actors/) has more info on the basics of actors; this page is focused on system-specific information.

## General info

The actor sheets in Draw Steel feature both a "Play" and "Edit" mode, which can be toggled using the buttons in the top right of the sheet.

In play mode:
- You can click the Characteristic labels to prompt for a roll, including the opportunity to select a relevant skill or apply edges and boons.

In edit mode:
- You can adjust the base values.
- The adjustments from ActiveEffects and advancements are *not* displayed.

### Tokens

Actors are represented on the canvas via tokens. Draw Steel includes a number of enhancements to the core token functionality.

**Attribute Bars:** The Token attribute bars will assume a "delta" change if you enter a number prefixed with a `+` or `-`, so `-5` means "reduce attribute by 5" rather than "set attribute to `-5`". If you want to *set* an attribute to a negative value, prefix with `=-`, e.g. `=-5` to set to `-5`.

**Flanking:** The system automates the edge on melee strikes from Flanking; it requires line of effect and the ability to take triggered actions. It is possible to mark an actor as unflankable. See the `Flankable` condition in [[Active Effects]] for more information.

**Token Ruler:** Dragging a token in Draw Steel will both display distance information based on the token's movement value and selected movement type as well as the *quantity* of free strikes triggered.

## Heroes

The player characters in Draw Steel are known as heroes.

### Recoveries and Respites

Players can use the "Recovery" button on the character sheet to spend a recovery and regain stamina equal to their recovery value. They can also use the "Respite" button to restore their stamina, recoveries, and convert their victories to xp.

### Heroic Resources

If a player character has a defined class with a defined Heroic Resource generation formula (typically `2` or `1d3`), then, at the beginning of each of their turns in combat, they automatically generate that amount. Accordingly, if they use abilities with a resource cost, that resource cost is automatically subtracted from their total. If a player character has victories, then they will start combat with an equal amount of their Heroic Resource.

### Hero Tokens

All heroes share a "Hero Token" pool from which they can dig deeper. Players can spend hero tokens in a number of ways. The current number of hero tokens is displayed in the bottom left below the player list.
- Clicking the "Stamina" button on the character sheet will spend two hero tokens to regain stamina equal to the hero's recovery value.
- Clicking the "Surges" button will spend a hero token to gain two surges.
- Saving throws include a button to spend a hero token to turn a failure into a success.
- Tests include a button to spend a hero token to reroll the test.
- You can always use the vertical ellipsis menu below the Players list to spend hero tokens without any automated effect.

Directors have additional options in the vertical ellipsis menu, including giving hero tokens and resetting the total to the number of heroes in the game.

## Non-Player Characters

Non-player character ("NPC") actors cover both the monsters that the heroes fight as well as any other type of character a director might include in their game.

### Malice

The system automatically generates Malice at the start of each round of combat based on the number of heroes, their victories, and the number of rounds. To be counted as a hero for the purpose of this system feature, a combatant must be associated with an actor of type "hero" and that actor must be owned by at least one player.

#### Malice Consumption

All NPC actors share a malice pool. Any ability that has a Resource Cost listed will consume Malice if activated from an NPC actor sheet.

## Free Strikes

The Free Strike button on an NPC automatically applies the damage to *targeted* actors.

## Actor Images

The system supports two flags, `"avatarProperties.objectFit"` and `"avatarProperties.objectPosition"`, which correspond to the [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit) and [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-position) css properties for the actor image in the character sheet.

### In-world adjustment

You can set flags for an existing actor with commands like `actor.setFlag("draw-steel", "avatarProperties.objectFit", "contain")` or `actor.setFlag("draw-steel", "avatarProperties.objectPosition", "50% 50%")`. These can be useful when working with existing actors in a world like player characters. The default values for these properties are `"cover"` and `"50% 0"` respectively.

Alternatively, `new ds.applications.apps.ActorAvatarInput({ document: actor }).render({ force: true })` will create a window that allows for easy configuration of the properties.

### Art Mapping Integration

For module developers seeking to use the Art Mapping feature, we have special processing for the `avatarProperties` key. The objectFit and objectPosition properties are both optional if only one is needed.

```json
"actor": "modules/my-module/asset/gobbo.webp",
"avatarProperties": {
  "objectFit": "contain",
  "objectPosition": "50% 50%"
}
```
