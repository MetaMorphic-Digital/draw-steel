The Draw Steel system adds the following hooks to the ones available in the [core software](https://foundryvtt.com/api/modules/hookEvents.html).

## Prepare Data

The ActiveEffect, Actor, ChatMessage, Combat, Combatant, Item, and User documents all have a hook of the format `ds.prepare${DocumentName}Data`. This hook is called after all other data preparation has completed. For example, you could use this to give all heroes an additional 10 max stamina without needing to apply an active effect.

```js
Hooks.on("ds.prepareActorData", (actor) => {
  if (actor.type !== "hero") return;
  actor.system.stamina.max += 10;
});
```

## Drop Data

The base Foundry software provides a [`dropActorSheetData`](https://foundryvtt.com/api/functions/hookEvents.dropActorSheetData.html) hook. The Draw Steel system also provides a similar `dropItemSheetData` hook.

## Ability Configuration Dialog

The Ability Configuration Dialog provides a `ds.preRenderAbilityConfigurationDialog` hook that if returned an explicit `false` will prevent it from rendering. Keep in mind that hooks only run synchronously; a Promise that resolves to false is not an explicit false.
