/**
 * @import DrawSteelCombatant from "../../documents/combatant.mjs";
 * @import { ApplicationRenderOptions } from "@client/applications/_types.mjs";
 * @import CombatantConfig from "@client/applications/sheets/combatant-config.mjs";
 */

/**
 * A hook event that fires when the CombatantConfig application is rendered.
 * @param {CombatantConfig} app         The Application instance being rendered.
 * @param {HTMLElement} html  The inner HTML of the document that will be displayed and may be modified.
 * @param {Record<string, any>} context The object of data used when rendering the application.
 * @param {ApplicationRenderOptions} options
 */
export function renderCombatantConfig(app, html, context, options) {
  /**
   * @type {DrawSteelCombatant}
   */
  const combatant = app.document;

  if (combatant.type !== "base") return;

  const dispositions = Object.entries(CONST.TOKEN_DISPOSITIONS).map(([key, value]) => ({ value, label: game.i18n.localize(`TOKEN.DISPOSITION.${key}`) }));

  const dispositionInput = combatant.system.schema.getField("disposition")?.toFormGroup(
    {},
    { options: dispositions, value: combatant.system.disposition, blank: game.i18n.localize("DRAW_STEEL.Combatant.base.FIELDS.disposition.blank"), dataset: { dtype: "Number" } },
  );

  const groups = combatant.parent.groups.map(g => ({ value: g.id, label: g.name }));

  const groupInput = combatant.schema.getField("group").toFormGroup(
    { label: "DOCUMENT.CombatantGroup", localize: true },
    { options: groups, value: combatant.group?.id, blank: "" },
  );

  const formGroups = html.querySelectorAll("form .form-group");

  const status = formGroups[formGroups.length - 1];

  if (groupInput) status.insertAdjacentElement("beforebegin", groupInput);

  if (dispositionInput) status.insertAdjacentElement("beforebegin", dispositionInput);
}
