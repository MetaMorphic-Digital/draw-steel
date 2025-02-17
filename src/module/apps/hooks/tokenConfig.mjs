/** @import {DrawSteelActor} from "../../documents/actor.mjs" */

/**
 * A hook event that fires when the TokenConfig application is rendered
 * @param {TokenConfig} app             The Application instance being rendered
 * @param {JQuery<HTMLElement>} jquery  The inner HTML of the document that will be displayed and may be modified
 * @param {Record<string, any>} context The object of data used when rendering the application
 */
export function renderTokenConfig(app, [html], context) {
  /** @type {DrawSteelActor} */
  const actor = app.document.actor;
  // Replace option labels with schema-derived props
  if (actor) {
    const schema = actor.system.schema;
    /** @type {HTMLSelectElement[]} */
    const bars = html.querySelectorAll(".bar-attribute");
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
