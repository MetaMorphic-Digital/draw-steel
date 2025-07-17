/** @import DrawSteelActor from "../../documents/actor.mjs" */

/** @typedef {foundry.applications.sheets.PrototypeTokenConfig} PrototypeTokenConfig */
/** @typedef {foundry.applications.sheets.TokenConfig} TokenConfig */

/**
 * A hook event that fires when the TokenConfig application is rendered
 * @param {PrototypeTokenConfig | TokenConfig} app             The Application instance being rendered
 * @param {HTMLElement} html  The inner HTML of the document that will be displayed and may be modified
 * @param {Record<string, any>} context The object of data used when rendering the application
 * @param {ApplicationRenderOptions} options
 */
export function renderTokenApplication(app, html, context, options) {
  /** @type {DrawSteelActor} */
  const actor = app.actor;
  // Replace option labels with schema-derived props
  if (actor) {
    const schema = actor.system.schema;
    /** @type {HTMLSelectElement[]} */
    const bars = html.querySelectorAll("select[name^='bar']");
    for (const bar of bars) {
      const groups = {};
      const options = [...bar.options];
      for (const opt of options) {
        const field = schema.getField(opt.value);
        if (field?.label) opt.label = field.label;
        if (!field || (opt.parentElement.label === game.i18n.localize("TOKEN.BarAttributes"))) continue;
        // Build groups by going to the highest level ancestor with a label
        let ancestor = field;
        let p = field.parent;
        while (p.name !== "system") {
          if (p.label) ancestor = p;
          p = p.parent;
        }
        if (field !== ancestor) {
          if (ancestor.name in groups) {
            groups[ancestor.name].appendChild(opt);
          }
          else {
            const g = document.createElement("optgroup");
            g.label = ancestor.label;
            bar.appendChild(g);
            groups[ancestor.name] = g;
            g.appendChild(opt);
          }
        }
      }
    }
  }
}
