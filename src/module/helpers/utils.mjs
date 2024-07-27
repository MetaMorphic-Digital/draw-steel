/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: "temporary",
      label: game.i18n.localize("DRAW_STEEL.Effect.Temporary"),
      effects: []
    },
    passive: {
      type: "passive",
      label: game.i18n.localize("DRAW_STEEL.Effect.Passive"),
      effects: []
    },
    inactive: {
      type: "inactive",
      label: game.i18n.localize("DRAW_STEEL.Effect.Inactive"),
      effects: []
    }
  };

  // Iterate over active effects, classifying them into categories
  for (const e of effects) {
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }

  // Sort each category
  for (const c of Object.values(categories)) {
    c.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }
  return categories;
}
