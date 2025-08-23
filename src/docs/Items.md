Within Draw Steel, an Item is any discrete piece of rules content; it not only includes equipment, but abilities, ancestries, and even projects.

The Foundry [Knowledge Base](https://foundryvtt.com/article/items/) has more info on the basics of combat encounters; this page is focused on system-specific information.

## General Info

All items have a source info button in the header of their sheet. This can be used to input source information for the item which will be displayed in the top right of the header. If the page value is a number, it will be prefixed with "pg.", otherwise it will be taken as-is and combined with the book name.

The description tab of the item sheet includes fields for both general and Director descriptions. The description field will use the item's roll data for any enrichers. Other core Foundry rich text features, such as secret blocks, are fully supported.

### Draw Steel ID

The Draw Steel ID (DSID) is a field that uniquely identifies a rules element separately from its specific instance in a compendium and is localization-independent. It should be preferred over the item name for deciding what counts as a an actor having a class, ability, or other item.

## Ability

Abilities that are both melee and ranged have an additional context option to switch their display between ranged and melee; this is relevant if a character has a kit or other bonuses that only apply to one or the other modes.

## Ancestry

_Supports Advancements: See that page for details_

An Actor can only have one ancestry; they are shown on the hero sheet in the header.

## Ancestry Trait

_Supports Advancements: See that page for details_

Ancestry traits have a field for the points it takes to purchase them. Leaving this empty means that an ancestry trait is a signature trait.

## Career

_Supports Advancements: See that page for details_

Careers are displayed in the header of the hero sheet. They have fields for the project points, renown, and wealth they can provide. When a career is added or removed from an actor, that actor's renown and wealth will be adjusted accordingly. The project points can be used by project items on the actor via its context menu.

## Class

_Supports Advancements: See that page for details_

Classes are listed in the header of the hero sheet. Draw Steel does not support multi-classing. Many hero properties are derived from their class, such as their maximum stamina as well as the names of their heroic and primary resources.

## Complication

_Supports Advancements: See that page for details_

Complications are displayed on the features tab of the hero sheet. A hero is not required to pick a complication.

## Culture

_Supports Advancements: See that page for details_

A culture's aspects are implemented entirely through the Advancement system. Creating an advancement on a culture gives a special prompt with pre-filled advancements for the various aspects in the books.

## Kit

_Supports Advancements: See that page for details_

The Draw Steel system automatically applies the bonuses from kits. Kits also support Item Grant Advancements for the purpose of providing their signature ability.

## Feature

_Supports Advancements: See that page for details_

Features can be used for both class, subclass, and monster features. They have no additional data besides their description and advancements.

## Perk

_Supports Advancements: See that page for details_

Perks include a type field in addition to their description and advancements.

## Subclass

_Supports Advancements: See that page for details_

Subclasses are displayed in the header of the hero sheet. An actor must have a class with the appropriate Draw Steel ID in order to add a subclass.

## Title

_Supports Advancements: See that page for details_

Titles can specify their echelon, story text, and prerequisites.

## Treasures

Treasures cover the variety individual items that heroes can acquire. They have a number of fields to help sort and organize them. Many treasures can be automated via ActiveEffects.

## Project

Projects are used to track progress made during respites for item crafting and other purposes.
