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

### 0.7.2

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
