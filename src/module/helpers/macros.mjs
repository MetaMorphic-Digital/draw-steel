
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (!data.uuid.includes("Actor.")) {
    return ui.notifications.warn("DRAW_STEEL.Macro.Warnings.Create.NotOwnedItem", { localize: true });
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  let command;
  let name;
  switch (item.type) {
    case "ability":
    case "project":
      command = `ds.helpers.macros.rollItemMacro("${data.uuid}");`;
      name = item.name;
      break;
    default:
      command = `await foundry.applications.ui.Hotbar.toggleDocumentSheet("${item.uuid}");`;
      name = `${game.i18n.localize("Display")} ${item.name}`;
      break;
  }
  let macro = game.macros.find((m) => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name,
      type: "script",
      img: item.img,
      command,
      flags: { "draw-steel.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Call an item's roll method
 * @param {string} itemUuid
 */
export async function rollItemMacro(itemUuid) {
  const item = await fromUuid(itemUuid);
  if (!item) return ui.notifications.warn("DRAW_STEEL.Macro.Warnings.Roll.NoItem", { localize: true });
  if (!item.parent) return ui.notifications.warn("DRAW_STEEL.Macro.Warnings.Roll.NotOwnedItem", { format: { item: item.name } });
  if (!(item.system.roll instanceof Function)) return ui.notifications.warn("DRAW_STEEL.Macro.Warnings.Roll.NoRoll", { format: { item: item.name } });

  item.system.roll();
}
