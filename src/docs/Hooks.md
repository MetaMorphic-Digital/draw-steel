The Draw Steel system adds the following hooks to the ones available in the [core software](https://foundryvtt.com/api/modules/hookEvents.html).

## Drop Data

The base Foundry software provides a [`dropActorSheetData`](https://foundryvtt.com/api/functions/hookEvents.dropActorSheetData.html) hook. The Draw Steel system also provides a similar `dropItemSheetData` hook.

## canRenderDSApplication

All DS Applications provides a `ds.canRender${Class}$` hook, e.g. `ds.canRenderAbilityConfigurationDialog`, that if returned an explicit `false` will prevent it from rendering.
