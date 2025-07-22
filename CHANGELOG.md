# CHANGELOG

<!--
## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

### Known Issues
-->

## 0.8.0

### Added

- Advancements (#51)
- Added a button to ability use messages to apply effects from the ability. (#214)
- Added a Wealth field to Careers. (#535)
- Adding or removing a career will adjust the amount of renown and wealth your character has.
- Added a Renown and Wealth field to characters. (#279)
- Added age, height, and weight info to the Biography tab for characters.
- Expanded end of encounter prompt to reset heroic resources & temporary stamina. (#612)
- Added name and image inputs to pseudodocument creation, e.g. Power Roll Effects. (#718)
- Added a "Next Respite" option for ending Active Effects. (#694)
- Added an option in the character sheet equipment context menu to start a crafting project for that equipment.
- Add a setting for which project events type to use, "None", "Roll for Event", or "Event Milestones". (#710)
  - If set to "Roll for Event", a roll button will appear in the chat message.
  - If set to "Event Milestones", if an event milestone is reached, text will indicate the number of milestones reached.
- When a project roll is a breakthrough, a button will appear to roll the project again.

### Changed

- [BREAKING] Redid the implementation of how "Applied Effect" Power Roll Effects work. Now, instead of several sets, you can add an entire effect and it will have multiple properties to configure per tier, such as the Potency Condition, if/how it overrides the end, and any additional properties like "stackable".
- [BREAKING] Moved recoveries from `system.hero.recoveries` to `system.recoveries`.
- [BREAKING] Character max recoveries and stamina are now derived from their class item (#627).
- The end of encounter prompt now only triggers if an encounter progressed to at least the first round. (#643)
- Certain item types (Class, Subclass, Ancestry, Career, Kit) can no longer be created directly in world. Instead, they must be created inside a compendium. (#716)
  - This enforces good practices for data creation.
  - The buttons on the character sheet header now open the Ancestry, Background, and Class compendiums.
- Items with advancements can no longer be mass-created as part of dropping a folder onto an actor sheet. (#736)
- Adjusted the display of Power Roll Effects, including adding an image property.

### Fixed

- Fixed display of popped out ability messages
- Fixed display of multi-result abilities
- Fixed unrequited prompting for end of turn events (#673)

## 0.7.3

### Added

- Added support for heroic resources that can go negative. (#508)
- Add Adjust Malice and Reset Malice context menu options to the player UI. (#515)
- Equipment now has a "quantity" property. Completing a project will now add to an equipment's quantity if it already exists on the actor, based on matching `dsid` values. (#558)
- Added Healing enricher, which lets you recover stamina or temporary stamina with `[[/heal]]`. See the wiki for more details. (#559)
- Added Damage enricher, which lets you add damage rolls to text with `[[/damage]]`. See the wiki for more details. (#568)
- Added a button in the Combat Tracker footer to end the current combatant's turn without beginning a new one. (#638)

### Changed

- Overhauled the Effects tab of the Item & Actor sheets. (#146)
  - Actor sheets now feature a "Status Conditions" section which lists the conditions specific to Draw Steel.
    - Clicking the buttons will toggle the status
    - If you have a status, it will be highlighted in orange
    - If the status is granted by a non-canonical condition, the button will be disabled
  - Hitting "New Effect" in the "Temporary Effects" section will now set the duration to End of Turn, instead of 1 round.
  - An effect's enriched description is now available by toggling the carat, like already existed for items.
- Replaced the default token status menu with a new one that allows applying a status with one of Draw Steel's unique durations. (#261)
- Adjusted display of the actor sheets in play mode. (#609)
  - Unused ability and equipment sections are no longer displayed in play mode.
  - Add Item buttons only display in edit mode.
- New actors and items now start in edit mode. Items no longer default to edit mode if opened while editable.
- Show malice value in the player UI on combat creation instead of only on beginning combat. (#498)
- Moved ability bonus calculations to after active effect application. (#613)

### Fixed

- Fixed various color issues on sheets that had their theme set individually. (#599)
- Fixed malice generation applying the first round bonus twice.
- The "Award Victories" prompt will no longer appear if you cancel out of ending a combat.

## 0.7.2

### Added
- Added support for the automatic end of effects. (#551)
  - End of Turn will automatically self-disable when an affected actor ends their turn.
  - Saving Throws will create prompts for owners. If multiple players own an actor, the active GM will receive a dialog to help delegate rolls.
    - The roll message has a button to spend a hero token to automatically succeed.
  - End of Encounter effects will automatically self-disable alongside the encounter.
- Added Disengage to Stats tab in the movement section and integrated the Kit Bonus. (#519)
- Added UI for configuring an actor's turns per round, save bonus, and save threshold. (#532)
  - These are also readable in a hover tooltip on the "Combat" legend in the Stats tab.
- Added spend line to the displayed power content. (#398)
  - Note: Expect future breaking changes with how Spend is configured to account for variations that the current data does not represent.
- Added Ability compendium with basic actions and maneuvers.
  - Creating a new character will give them those basic actions and maneuvers. (#56)
- Stamina changes now display as floating damage number. The color depends on the type of damage dealt. (#417)

### Changed
- Aligned the system's active effect suppression checks with core v13 behavior, allowing the system model to also apply. (#541)
- The Monster Metadata and Source forms now perform live updates instead of using a save button.
- Added a `dsid` getter on the Item class, made the initialized version of _dsid read only (you can still perform updates but not apply active effects). (#389)

### Fixed
- Fixed an issue that allowed characteristics to become null, instead of defaulting back to 0.
- Fixed free strikes not applying. (#544)
- Minions which have unlinked tokens in a squad but are not themselves in a squad will not display as if they are in a squad. (#561)

## 0.7.1

### Added
- Automated flanking bonuses when requirements are met. (#451)
- Added a flag to the wall documents to configure if a wall should block of line of effect.
- Add level to actor roll data. (#514)
- Automated the double bane applied when attacking a target other than the source of the taunted status effect while in line of effect to the taunted source. (#167)

### Changed
- Removed the "Roll All" and "Roll NPC" buttons from the combat tracker while using the default Draw Steel initiative. (#491)

### Fixed
- Fixed swapping kits on characters with the maximum.
- Fixed the ability sheet failing to render if it has a forced movement power roll effect with a bad roll formula. (#500)
- Using the Enter key to submit a character or item sheet will no longer also toggle the sheet mode. (#501)
- Fixed setting the power roll characteristic if all applicable characteristics are negative.
- Fixed missing story text from ability embeds. (#506)
- Fixed kit speed bonuses not applying. (#511)
- Added missing skills. (#518)
- Fixed Active Effect embeds not working.
- Fixed doubled roll display for characteristic rolls from Dice So Nice. (#522)

## 0.7.0 Foundry v13 Alpha

### Added
- Implemented Combatant Groups. (#131)
  - You can create Combatant Groups from the ellipsis (three-dot) menu in the top right of the Combat display.
    - A Base combatant group can have any number of non-minion members.
    - A Squad can have any number of minions plus up to one non-minion captain.
  - You can drag and drop or use the "Update Combatant" form to adjust combatant group membership.
  - Only GMs can create or delete combatant groups, but they can grant individual edit permissions to players (#354).
  - Damage to minions will automatically be transferred to squads, if possible. (#357)
- Implemented Draw Steel Token Ruler. (#273)
  - Moving a token will show the number of opportunity attacks provoked by movement.
  - Available movement types and the cost modifications are determined by appropriate properties, such as preventing a prone creature from flying.
- Added new item subtype: Project. (#257)
- Numerous improvements to the Power Roll Dialog.
  - Added roll mode configuration. (#143)
  - Added general roll modifier input. (#276)
  - Added skill selection. (#277)
- Added immunities and weaknesses section to the actor sheets. (#184)
- Various ability sheet improvements
  - Added "Special" target type. (#275)
  - Added Power Roll section to the item sheet. (#366)
- Dragging an owned ability or project item to the hotbar will create a macro to use/roll it. (#313)
- Negative stamina now has unique colors in bar. (#315)
- Added display for hero tokens and malice below the Players list. (#156)
- Added a prompt at the end of combat to award victories to each character in the combat. (#388)
- Added ways to spend hero tokens from the character sheet (#54)
- Added a number of generic icons for different monster roles under `systems/draw-steel/assets/roles`.
- Added basic embed functionality for active effects.

### Changed
- [BREAKING] Major overhaul of abilities.
  - Abilities no longer have a description tab
  - Power roll, spend, and effects have been moved to the new Impact tab
  - Power roll effects are now organized by type first (e.g. Damage)
    - Each type has data for each tier
  - The Effect line has been split into two rich text editors for before & after the power roll. (#478)
- Changed system minimum to v13.340, verified system for v13 generally.
- Updated application overrides and hooks to v13 UI overhaul compatibility. (#226, #229, #230, #231, #232, #233, #255, #298)
- [BREAKING] Actor `system.movement` has been refactored from values for each type to `system.movement.value` and `system.movement.types`
  - `value` is the general speed
  - `types` is a set of the speed tags
  - `teleport` has been preserved as a calculated value from the base speed, prior to active effects and conditions
- Switched various fontAwesome icons to pro-exclusives. (#274)
- Various repository refactors. (#253, #290, #301, #325, #338)
- Made various sheet actions hard private (#397)
- Moved the play/edit mode toggle and the item/npc update source buttons to the sheet header (#413)

### Fixed
- Fixed an error preventing combat start if no player-owned characters are in the combat. (#266)
- Fixed typos in CONFIG.DRAW_STEEL. (#269)
- Fixed token resource bar not allowing negative stamina values. (#236)

## 0.6.2

### Added
- Added an option to the kit's right-click context menu to set the preferred kit.
- Added an option to the ability's right click context menu to swap between melee/ranged usage on weapons with a distance of melee or ranged.
- Added an embed for kits used for viewing on the actor sheet, viewing in play mode on the kit sheet, and posting to chat. (#239)
- Added place to set class level (#172).
- Added an equipment tab and moved the kits to this tab instead of the features tab. (#250)

### Changed
- Updated the view of the features tab to match the style of the abilities tab (#153).
  - The kit section will only be visible if the actor's class allows kits or there's kits on the actor.
  - Made the kit swap dialog more clear on why you need to swap kits.

### Fixed
- Added zero-width spaces after "/" in names to ensure they linebreak properly (#241).
- Fixed kit stability not increasing character stability.

## 0.6.1

### Fixed
- Fixed bug preventing new character sheets from opening because they had 0 abilities.

## 0.6 Initial Release
