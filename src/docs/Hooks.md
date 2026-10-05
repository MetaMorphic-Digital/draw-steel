The Draw Steel system adds the following hooks to the ones available in the [core software](https://foundryvtt.com/api/modules/hookEvents.html).

## Drop Data

The base Foundry software provides a [`dropActorSheetData`](https://foundryvtt.com/api/functions/hookEvents.dropActorSheetData.html) hook. The Draw Steel system also provides a similar `dropItemSheetData` hook.

## canRenderDSApplication

All DS Applications provides a `ds.canRender${Class}$` hook, e.g. `ds.canRenderAbilityConfigurationDialog`, that if returned an explicit `false` will prevent it from rendering.

## Damage Origin

When damage is applied from a chat message, the Stamina update carries where it came from in `options.ds.origin`: `{ messageId, partId, abilityUuid, actorUuid, tokenUuid }`, with `actorUuid` and `tokenUuid` taken from the message speaker. Read it in the core `preUpdateActor` and `updateActor` hooks, or `preUpdateCombatantGroup` and `updateCombatantGroup` for minion squads. Damage applied through `takeDamage` without an origin leaves it undefined.

## Applying Target Results

When a per-target ability result is applied, the system calls `ds.preApplyTargetResult(part, action, context)` first and `ds.applyTargetResult(part, action, context)` after. `part` is the `TargetResultPart`, and `action` is `"applyDamage"`, `"applyEffect"` or `"gainResource"`.

`context.targets` holds the actors it applies to. For damage it also holds the `roll` and `halfDamage`; for effects and resources, the power roll `effect` (and `effectId` for applied effects). Returning an explicit `false` from `ds.preApplyTargetResult` cancels the application, and changes to `context` are used for it. After damage, `context.applied` lists Stamina and temporary Stamina before and after for each actor, or the Stamina pool for each minion squad.
