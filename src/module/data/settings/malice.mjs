import DrawSteelNPCSheet from "../../applications/sheets/npc.mjs";
import { systemID } from "../../constants.mjs";

/** @import { DrawSteelActor, DrawSteelCombat } from "../../documents/_module.mjs" */

const fields = foundry.data.fields;

/**
 * A data model to manage Malice in Draw Steel
 */
export class MaliceModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      value: new fields.NumberField({ nullable: false, initial: 0, integer: true }),
    };
  }

  /** Name for the setting */
  static label = "DRAW_STEEL.Setting.Malice.Label";

  /** Localized name for the setting */
  get label() {
    return game.i18n.localize(this.constructor.label);
  }

  /** Helper text for Malice */
  static hint = "DRAW_STEEL.Setting.Malice.Hint";

  /** Localized helper text for Malice */
  get hint() {
    return game.i18n.localize(this.constructor.hint);
  }

  /**
   * Re-render NPC sheets to synchronize the Malice display
   * @param {MaliceModel} value The MaliceModel instance
   * @param {object} options    Additional options which modify the creation or update request
   * @param {string} userId     The id of the User requesting the document update
   */
  static onChange(value, options, userId) {
    for (const [index, app] of foundry.applications.instances) {
      if (app instanceof DrawSteelNPCSheet) {
        app.render({ parts: ["header"] });
      }
    }
  }

  /**
   * Set malice for the start of combat
   * @param {DrawSteelActor[]} heroes Heroes to tally up victories
   * @returns {Promise<MaliceModel>}
   */
  async startCombat(heroes) {
    const totalVictories = heroes.reduce((victories, character) => {
      victories += foundry.utils.getProperty(character, "system.hero.victories") ?? 0;
      return victories;
    }, 0);
    const avgVictories = Math.floor(totalVictories / heroes.length) || 0;
    // Also work in the first round of combat bonus
    return game.settings.set(systemID, "malice", { value: avgVictories + 1 + heroes.length });
  }

  /**
   * Increase malice on round change
   * @param {DrawSteelCombat} combat The active combat
   * @param {DrawSteelActor[]} heroes The heroes who are currently alive
   * @returns {Promise<MaliceModel>}
   */
  async _onStartRound(combat, heroes) {
    return game.settings.set(systemID, "malice", { value: this.value + combat.round + heroes.length });
  }

  /**
   * Reset malice to 0
   * @returns {Promise<MaliceModel>}
   */
  async endCombat() {
    return game.settings.set(systemID, "malice", { value: 0 });
  }
}
