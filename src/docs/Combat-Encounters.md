Combat Encounters in Draw Steel make some significant departures from the core foundry experience, due to the system's unique initiative system.

The Foundry [Knowledge Base](https://foundryvtt.com/article/combat/) has more info on the basics of combat encounters; this page is focused on system-specific information.

# Combatants

5 combatant categories exist, describing what the combatant's disposition is to the players. The disposition of NPCs towards the players can be set in the token settings.
+ Player Characters (highlighted in green)
+ Friendly NPCs (highlighted in teal)
+ Neutral NPCs (highlighted in yellow)
+ Hostile NPCs (highlighted in red)
+ Secret NPCs (highlighted in purple)

Additionally, in the respective NPC actor sheet a creature can have its organization
 noted, differentiating between stronger individual enemies (Solo, Leader, Troop, Platoon, Band) and Minions, which typically act in groups (See `Squad` combatant group below)

In the combat tracker itself, for the director any combatant has three setting icons:
+ a 'cross-out eye' icon which hides a combatant from the player view in the tracker. If the combatant is part of a combatant group, and all other group members are hidden too, the group is still visible to players despite seeming to be empty. If the actor is a minion and part of a squad combatant group, hiding all minions will also hide the individual minion stamina value, but not the stamina total.
+ a 'skull' which marks the combatant as defeated
+ a 'target' icon, which pings the combatant for everyone

For players there are two icons:
+ the 'target' icon, which pings the combatant for everyone
+ a 'centred eye' icon, which pans the players screen to that combatant,

### Right-click context menu

Right-clicking any individual combatant will open a context menu that allows to `Update Combatant` or `Remove Combatant`.

The `Update Combatant` menu opens a pop-up setting menu in which the following is displayed:
+ Represented Actor (non-editable)
+ Represented Token (non-editable)
+ Displayed Name (editable; sets displayed name in combat tracker)
+ Thumbnail Image (editable; sets token display image in combat tracker)
+ Initiative Value (editable; sets how many turns a token has per round. Standard is 1. 0=had their turn, 1=can act on 1 turn, 2=can act on 2 turns, etc...)
+ Combatant Group (editable; available if a combatant croup is set up for this encounter)
+ Disposition (editable; "Match token", Friendly, Neutral, Hostile, Secret)
+ Status (editable; `Hidden` and/or `Defeated`)

The `Initiative Value` currently resets to 1 at the beginning of each round and will have to be manually reset each round.

### Movement Histories

While in active combat, all movement will be tracked and displayed as movement history, if a combatant is hovered in the combat tracker or on the canvas. These will automatically be deleted when a combat encounter is ended.

## Initiative tab

In the Initiative tab, multiple different icons allow different functionalities. All of these are only accessible to the GM.

The `+` icon allows to create additional encounters that will appear as numerical values (`1`, `2`, `3`,...)  next to it. This allows to plan encounters ahead of time, and set up combatant groups in advance.

The `⋮` vertical ellipsis icon (three vertical dots), allows for the following options, each explained below:
+ Create Combatant Group
+ Roll Initiative
+ Reset Initiative (only available when actors are in encounter)
+ Clear Movement Histories (only available when actors are in encounter)
+ Delete Encounter

The cog icon will open the core foundry combat tracker settings, which allow to edit the turn marker, change the tracked resource (Recoveries, Stamina, Heroic Resource, Monster Level, etc...), edit whether to skip defeated actors in the initiative tracker, or not, and change the combat theme.

### Create Combatant Groups
When creating a combatant group, a dialogue prompt pops up, in which the combatant group can be named, and also gives the choice between a `base` or a `squad` group.

A `Base` combatant group can have any number of non-minion members, but no minion combatants.

A `Squad` combatant group can have any number of minions plus up to one non-minion captain. If a `Squad` group is set up, it will display the stamina pool of the minions as `X/Max (individual minion stamina)`, e.g. a Squad of 8 full stamina Gnoll Abyssal Hyenas is denoted as `56/56 (7)` as their combatant group. This number is not influenced by the presence of a captain, but the individual minion stamina value will only be visible if all minions within a squad have the same max stamina value.

Clicking on a combatant group reveals the list of all included combatants. Clicking on it again, collapses the list. In a `Squad` list, if a present captain is present, they are marked by a paladin helmet icon.

Both the `Base` and the `Squad` combatant groups rely on enemy NPC actors having their organization set in their actor sheet.

Actors may be added to a combatant group by click&dragging them into the group, or via the `Update Combatant` menu option of a combatants right-click context menu.

#### Right-click context menu

Right-clicking a combatant group will open a context menu that allows to `Update Combatant Group`, `Reset Squad HP To Max`, `Clear Movement Histories`, `Delete Combatant Group`, or `Configure Ownership`.
+ `Update Combatant Group` allows to change the name of a combatant group, its thumbnail image, its initiative value, and its current Stamina.
+ If the combatant group is a `Squad`, then the menu option `Reset Squad HP To Max` is available and it resets the Squad's Stamina to the maximum value determined by the sum of max Stamina of all the squad's minions.
+ `Delete Combatant Group` removes a combatant group from the tracker and displays the group's previous members as individual combatants again.
+ `Configure Ownership` gives the option to give players certain ownership rights over a combatant group, similar to an Actor or Item. If the ownership is set to `Owner` for a player, the Combatant Group becomes an ally of the Heroes.

### Roll Initiative

When clicking on the ellipsis menus option `Roll Initiative` the system will roll 1d10 and display the result in chat, including whether the heroes/players go first (6-10), or the Enemies (1-5). This has no direct impact on the initiative availability, and if heroes or monsters have abilities that allow them to ignore rolled initiative, this is still possible.

### Reset Initiative

The `Reset Initiative` option resets all combatants to `has acted`, including resetting multi-turn counts being reset to 0.

### Clear Movement Histories

While Combat Movement Histories will be automatically deleted if an encounter is ended, this menu option gives the possibility to do so instantly, if desired, clearing the canvas from visual clutter.

### Delete Encounter

If multiple encounters are open, individual encounters may be deleted with this menu option

## System Settings

If you'd prefer to use a more traditional initiative system like the ones in d20 fantasy games, the "Alternative" initiative system is available as a system setting.
