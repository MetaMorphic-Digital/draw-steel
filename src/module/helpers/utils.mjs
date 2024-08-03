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

/* -------------------------------------------- */
/*  Config Pre-Localization                     */
/* -------------------------------------------- */

// Adapted from dnd5e

/**
 * Storage for pre-localization configuration.
 * @type {object}
 * @private
 */
const _preLocalizationRegistrations = {};

/**
 * Mark the provided config key to be pre-localized during the init stage.
 * @param {string} configKeyPath          Key path within `CONFIG.DRAW_STEEL` to localize.
 * @param {object} [options={}]
 * @param {string} [options.key]          If each entry in the config enum is an object,
 *                                        localize and sort using this property.
 * @param {string[]} [options.keys=[]]    Array of localization keys. First key listed will be used for sorting
 *                                        if multiple are provided.
 * @param {boolean} [options.sort=false]  Sort this config enum, using the key if set.
 */
export function preLocalize(configKeyPath, {key, keys = [], sort = false} = {}) {
  if (key) keys.unshift(key);
  _preLocalizationRegistrations[configKeyPath] = {keys, sort};
}

/* -------------------------------------------- */

/**
 * Execute previously defined pre-localization tasks on the provided config object.
 * @param {object} config  The `CONFIG.DRAW_STEEL` object to localize and sort. *Will be mutated.*
 */
export function performPreLocalization(config) {
  for (const [keyPath, settings] of Object.entries(_preLocalizationRegistrations)) {
    const target = foundry.utils.getProperty(config, keyPath);
    if (!target) continue;
    _localizeObject(target, settings.keys);
    if (settings.sort) foundry.utils.setProperty(config, keyPath, sortObjectEntries(target, settings.keys[0]));
  }

  // Localize & sort status effects
  CONFIG.statusEffects.forEach(s => s.name = game.i18n.localize(s.name));
  CONFIG.statusEffects.sort((lhs, rhs) =>
    lhs.id === "dead" ? -1 : rhs.id === "dead" ? 1 : lhs.name.localeCompare(rhs.name, game.i18n.lang)
  );
}

/* -------------------------------------------- */

/**
 * Localize the values of a configuration object by translating them in-place.
 * @param {object} obj       The configuration object to localize.
 * @param {string[]} [keys]  List of inner keys that should be localized if this is an object.
 * @private
 */
function _localizeObject(obj, keys) {
  for (const [k, v] of Object.entries(obj)) {
    const type = typeof v;
    if (type === "string") {
      obj[k] = game.i18n.localize(v);
      continue;
    }

    if (type !== "object") {
      console.error(new Error(
        `Pre-localized configuration values must be a string or object, ${type} found for "${k}" instead.`
      ));
      continue;
    }
    if (!keys?.length) {
      console.error(new Error(
        "Localization keys must be provided for pre-localizing when target is an object."
      ));
      continue;
    }

    for (const key of keys) {
      const value = foundry.utils.getProperty(v, key);
      if (!value) continue;
      foundry.utils.setProperty(v, key, game.i18n.localize(value));
    }
  }
}
