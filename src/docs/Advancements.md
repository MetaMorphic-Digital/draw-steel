Advancements are a way for many different item types to specify complex actor adjustments. Only heroes can benefit from advancements.

## General Info

All advancements support picking a unique name and image to help distinguish them on the sheet. In addition, they have a description field which fully supports rich text editing and a requirements field which supports specifying the level required to gain the advancement.

Advancement choices can be adjusted by opening the Advancements tab of the item's sheet while it is on an actor.

## Item Grants

Item grants allow one item to add other items to the character sheet automatically. The "Choose N" field will give all available choices if there are fewer choices than specified or if the field is entirely blank.

Items can be added to the pool by dragging and dropping; these specifications are stored by UUID, which means that if an item is moved, deleted, or otherwise unavailable it cannot be granted. However, if an item is simply updated (e.g. for errata), the link will not be disrupted. This will *not* automatically update items already granted to an actor, only ensure that future granted items are the latest version.

Whenever an item grant advancement provides choices, if the choice would provide further advancements, those will be added to the configuration dialog.

## Traits

Trait grants cover several other types of advancements that share common features. They are applied during data preparation after Active Effects, which means their adjustments will not be visible in edit mode on the character sheet. They do not check the actor for what choices have already been made in other advancements; it is up to players to ensure that their trait choices from their ancestry, culture, career, and class do not overlap.

### Skills

Skill advancements provide skills either from a group or individually. If a feature specifies that it grants "X skill from Y group", do not include the group in the advancement; just include the specific skill. If not all skill choices have been made, a reminder button will be available on the character sheet.

### Languages

Language advancements allow specifying either a general skill choice or specific language grants. If not all language choices have been made, a reminder button will be available on the character sheet.
