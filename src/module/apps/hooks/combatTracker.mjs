import {systemID} from "../../constants.mjs";
/** @import {DrawSteelCombatant} from "../../documents/combatant.mjs" */

/**
 * A hook event that fires when the CombatTracker application is rendered
 * @param {CombatTracker} app
 * @param {JQuery<HTMLElement>} jquery
 * @param {Record<string, any>} context
 * // TODO: Refactor to properly subclassing the CombatTracker app in v13
 */
export function renderCombatTracker(app, [html], context) {
  if (game.settings.get(systemID, "initiativeMode") !== "default") return;
  const combat = app.viewed;
  /** @type {HTMLLIElement[]} */
  const combatants = html.querySelectorAll("li.combatant") ?? [];
  // Combatant entry updates
  for (const entry of combatants) {
    /** @type {DrawSteelCombatant} */
    const combatant = combat.combatants.get(entry.dataset.combatantId);
    /** @type {HTMLDivElement} */
    const initControl = entry.querySelector(".token-initiative");
    let dispositionColor = "PARTY";
    if (!combatant.hasPlayerOwner) {
      switch (combatant.disposition) {
        case -2:
          dispositionColor = "SECRET";
          break;
        case -1:
          dispositionColor = "HOSTILE";
          break;
        case 0:
          dispositionColor = "NEUTRAL";
          break;
        case 1:
          dispositionColor = "FRIENDLY";
          break;
        default:
          dispositionColor = "OTHER";
      }
    }
    initControl.classList.add(dispositionColor);
    if (combatant.isOwner) {
      initControl.innerHTML = `<a class="activate-combatant" data-tooltip="DRAW_STEEL.Combat.Initiative.Actions.${combatant.initiative ? "Act" : "Restore"}">
        <i class="fa-solid ${combatant.initiative ? "fa-arrow-right" : "fa-clock-rotate-left"}"></i>
        </a>`;

      /** @type {HTMLAnchorElement} */
      const button = initControl.children[0];

      button.addEventListener("click", async (element, event) => {
        const oldValue = combatant.initiative;
        const newValue = oldValue ? oldValue - 1 : 1;
        await combatant.update({initiative: newValue});
        if (oldValue) {
          const newTurn = app.viewed.turns.findIndex((c) => c === combatant);
          combat.update({turn: newTurn}, {direction: 1});
        }
      });
    } else initControl.innerHTML = "";
  }

  // Footer updates
  html.querySelector("a.combat-control[data-control=\"previousTurn\"]")?.remove();
  html.querySelector("a.combat-control[data-control=\"nextTurn\"]")?.remove();
}
