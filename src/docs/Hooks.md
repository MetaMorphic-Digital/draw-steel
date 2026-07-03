The Draw Steel system adds the following hooks to the ones available in the [core software](https://foundryvtt.com/api/modules/hookEvents.html).

## Prepare Data

The ActiveEffect, Actor, ChatMessage, Combat, Combatant, Item, and User documents all have a hook of the format `ds.prepare${DocumentName}Data`. This hook is called after all other data preparation has completed.

```js
Hooks.on("ds.prepareActorData", (actor) => {
  if (actor.type !== "hero") return;
  actor.system.stamina.max += 10;
});
```

## Drop Data

The base Foundry software provides a [`dropActorSheetData`](https://foundryvtt.com/api/functions/hookEvents.dropActorSheetData.html) hook. The Draw Steel system also provides a similar `dropItemSheetData` hook.

## canRenderDSApplication

All DS Applications provides a `ds.canRender${Class}$` hook, e.g. `ds.canRenderAbilityConfigurationDialog`, that if returned an explicit `false` will prevent it from rendering.
