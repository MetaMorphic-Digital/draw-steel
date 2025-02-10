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
      for (const opt of bar.options) {
        let field = schema.getField(opt.value);
        if (field?.label) {
          let label = field.label;
          while (field.parent.name !== "system") {
            field = field.parent;
            if (field.label) label = field.label + ": " + label;
          }
          opt.label = label;
        }
      }
    }
  }
}
