# Content Style Guide

The Draw Steel system repository has a large amount of compendium content licensed under the Draw Steel Creator License. This document provides information about the expectations for new content added to the compendiums. If you have questions about anything here, ask in the `draw-steel-dev` channel in the League discord. This document functions as an extension of the primary [CONTRIBUTING](./CONTRIBUTING.md) file.

## All Document Types
- All documents should have a thematically appropriate icon selected from the core foundry icons.
- HTML fields should be clean without extra styles added from pasting.
- Not every feature is supported by automation; it's better to have the rules text and leave it up to individual groups to handle than use an ugly hack
  - If something seems like it should be supported by automation, check if there's already a ticket, and if there's not, feel free to file one requesting support.

## Actors
- The system provides icons for each of the monster roles.
- Prototype token settings should be set to the following:
  - Name: Matches actor.
  - Display name: Owner hover (20).
  - Display bars: Owner hover (20).
  - Size: Appropriate for monster size.
  - Lock Rotation: True.
  - Actor link: False.
  - Sight: Not enabled.
- Items should have the appropriate source info.

## Items
- Use [Enrichers](https://github.com/MetaMorphic-Digital/draw-steel/wiki/Enrichers) to fill in functionality and reduce text repetition.
- Familiarize yourself with the capabilities of Advancements for any items that support them.

### Abilities
- For abilities with no power roll, the "before" effect is preferred to the "after".

### Ancestry
- The description on the ancestry itself should be the info text.
- Even features that only grant abilities should be created as both, for the purpose of easy inclusion in trait purchasing.

### Ancestry Trait
- If a trait grants an ability, both the trait and the ability must be included
- Ancestry Traits should not include the point cost in their name or _dsid.
- A point cost of null means it is a signature trait

### Career
- Inciting incidents tables should be linked by `@UUID` reference.

### Culture
- The core book's cultures are not expected to have descriptions, and the advancement titles should consist solely of the aspect (e.g. "Communal").

<!-- Complication -->

### Class and Subclass
- If a class or subclass feature only exists to grant an ability, e.g. the Tactician's Mark, just grant the ability directly and put the extra description in the Advancement.

### Equipment
- Each tier of benefits for a leveled treasure should be implemented as a separate active effect with the idea that *only* that effect will be active.

### Feature
- Not having a subtype is perfectly reasonable, many features are neither perks nor titles.

### Kit
- Keep in mind that the book's abilities already include the kit bonus, so the ones in the compendium should *not* include the kit bonus to avoid double-counting.

<!-- Perk -->

<!-- Project -->

### Title
- Titles with choices should have item grants for each of those choices, e.g. for Ratcatcher, an ability named "Come Out to Play", a feature for "Deadly and Big", and another feature for "Everybody Move!".
- Use the `@Embed` enricher to avoid duplicating text unnecessarily.

## Roll Tables
- Linked documents (e.g. a career and its incidents table) should have matching icons.
- Table results are the exception; only the table itself needs a unique icon.
