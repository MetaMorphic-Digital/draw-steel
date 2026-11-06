Advancements are a way for many different item types to specify complex actor adjustments. Heroes, Companions, and Retainers can benefit from advancements.

## General Info

All advancements support picking a unique name and image to help distinguish them on the sheet. In addition, they have a description field which fully supports rich text editing and a requirements field which supports specifying the level required to gain the advancement.

Advancement choices can be adjusted by opening the Advancements tab of the item's sheet while it is on an actor.

## Characteristic

Characteristic Advancements provide bonuses to characteristics; they are appropriate for the level 4, 7, and 10 class bonuses as well as Echelon 4 titles, but do not handle starting characteristics. For a class with a two primary characteristics like the Tactician, only "Guaranteed" and "Never" are necessary. For classes with a single primary characteristic like the Shadow, at 4 and 10 the "Choice" provides a single choice between all characteristics marked eligible.

## Effect and Item Grants

Effect Grant Advancements and Item Grant Advancements allow one item to add other items or active effects to the character sheet automatically. The "Choose N" field determines how many items from the configured pool of choices can be picked; if this value is less than or equal to the number of items available to pick from, all available choices are granted.

Options can be added to the pool by dragging and dropping; these specifications are stored by UUID, which means that if an item is moved, deleted, or otherwise unavailable, it cannot be granted. However, if an item or active effect is simply updated (e.g. for errata), the link will not be disrupted. This will *not* automatically update items or effects already granted to an actor, only ensure that items or effects granted in the future are the latest version.

Whenever an Item Grant Advancement provides choices, if the choice would provide further advancements, those will be added to the configuration window.

## Traits

Trait Advancements cover several other types of advancements that share common features. They are applied during data preparation after ActiveEffects, which means their adjustments will not be visible in edit mode on the character sheet. They do not check the actor for what choices have already been made in other advancements; it is up to players to ensure that their trait choices from their ancestry, culture, career, and class do not overlap.

### Skills

Skill Advancements provide skills either from a group or individually. If a feature specifies that it grants "X skill from Y group," do not include the group in the advancement; simply include the specific skill. If not all skill choices have been made, a button will be available on the character sheet to configure the remaining choices at any point.

### Languages

Language Advancements allow specifying a language to be granted. If not all language choices have been made during the level-up process, a button will be available on the character sheet to configure the remaining choices at any point.

## Actor Choice

The Summoning and Companion advancement types are a form of Actor Choice advancement and are used in the [[Summoning]] system.