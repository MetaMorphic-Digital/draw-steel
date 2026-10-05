The Draw Steel system adds the following hooks to the ones available in the [core software](https://foundryvtt.com/api/modules/hookEvents.html).

## Drop Data

The base Foundry software provides a [`dropActorSheetData`](https://foundryvtt.com/api/functions/hookEvents.dropActorSheetData.html) hook. The Draw Steel system also provides a similar `dropItemSheetData` hook.

## canRenderDSApplication

All DS Applications provides a `ds.canRender${Class}$` hook, e.g. `ds.canRenderAbilityConfigurationDialog`, that if returned an explicit `false` will prevent it from rendering.

## Damage Origin

When damage is applied from a chat message, the Stamina update carries where it came from in `options.ds.origin`: `{ messageId, partId, abilityUuid, actorUuid, tokenUuid }`, with `actorUuid` and `tokenUuid` taken from the message speaker. Read it in the core `preUpdateActor` and `updateActor` hooks, or `preUpdateCombatantGroup` and `updateCombatantGroup` for minion squads. Damage applied through `takeDamage` without an origin leaves it undefined.
