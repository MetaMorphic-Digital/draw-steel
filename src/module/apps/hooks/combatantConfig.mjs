/** @import {DrawSteelCombatant} from "../../documents/combatant.mjs" */

/**
 * A hook event that fires when the CombatantConfig application is rendered
 * @param {CombatantConfig} app
 * @param {JQuery<HTMLElement>} jquery
 * @param {Record<string, any>} context
 */
export function renderCombatantConfig(app, [html], context) {
  /**
   * @type {DrawSteelCombatant}
   */
  const combatant = app.document;

  if (combatant.type !== "base") return;

  const dispositions = Object.entries(CONST.TOKEN_DISPOSITIONS).map(([key, value]) => ({value, label: game.i18n.localize(`TOKEN.DISPOSITION.${key}`)}));

  const dispositionInput = combatant.system.schema.getField("disposition").toFormGroup(
    {},
    {options: dispositions, value: combatant.system.disposition, blank: game.i18n.localize("DRAW_STEEL.Combatant.base.FIELDS.disposition.blank"), dataset: {dtype: "Number"}}
  );

  const formGroups = html.querySelectorAll("form .form-group");

  const status = formGroups[formGroups.length - 1];

  status.insertAdjacentElement("beforebegin", dispositionInput);

  app.setPosition({height: app.position.height + 30});
}
