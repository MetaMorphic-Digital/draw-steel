## Is Draw Steel available in other languages?

The system fully implements Foundry's i18n framework, so non-English languages can be provided as modules. The [Babele](https://foundryvtt.com/packages/babele) module is a popular option for translating compendium content.

## Modules

### Are there any recommended modules?

There are no "recommended" modules for use with Draw Steel. The system is designed to be fully supported and playable by itself. However, we do recommend setting a *personal content module* so you can reuse content you create for your game across worlds. Some item types (like classes and ancestries) can only be created inside a compendium.

1. In Setup, go to the Add-on Modules tab, and hit the ⚙️ `Create Module` button.
2. Give it a `Title`, such as "Shared Packs". You may ignore the rest of the fields in the Basic Details tab.
3. Go to the Compendium Packs tab, click `+ Add Compendium Pack`, and give the pack a `Label` (like "Perks") and a `Document Type` (which would be `Item` if this was for spells). Set the `Required System` to "Draw Steel" if this is an Actor or Item pack.
4. Keep adding more packs with the `+ Add Compendium Pack` button until you've got what you need. You can always edit this later and add more, though.
5. Hit the `Create Module` button.
6. In a world, go to the `Game Settings` sidebar > `Manage Modules`, then enable this new module.
7. Go to the `Compendium Packs` sidebar > right-click one of your new packs > `Toggle Edit Lock` to allow changes to it.
8. Open the pack, drag stuff into it. When you enable this module in another world on this same host, all of that stuff will be there, and available to use.

If you'd prefer a video guide for this, there's one here: <https://www.youtube.com/watch?v=RaRtUkNdoig>

### How can I integrate a module with Draw Steel?

Reach out via Discord where you can be provided with guidance on integrating modules for personal configuration, adding compatibility directly to modules, or creating compatibility modules. Pull requests to Draw Steel directly for the purpose of module compatibility will only be accepted on a limited basis; the system currently only provides native integration for **Dice so Nice**.
