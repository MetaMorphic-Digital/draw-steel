import DrawSteelNPCSheet from "../../applications/sheets/npc-sheet.mjs";
import { systemID } from "../../constants.mjs";

/** @import { DrawSteelActor, DrawSteelCombat } from "../../documents/_module.mjs" */

const fields = foundry.data.fields;

/**
 * A data model to manage Malice in Draw Steel.
 */
export class MaliceModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      value: new fields.NumberField({ nullable: false, initial: 0, integer: true }),
    };
  }

  /* -------------------------------------------------- */

  /** Name for the setting. */
  static label = "DRAW_STEEL.Setting.Malice.Label";

  /* -------------------------------------------------- */

  /** Localized name for the setting. */
  get label() {
    return game.i18n.localize(this.constructor.label);
  }

  /* -------------------------------------------------- */

  /** Helper text for Malice. */
  static hint = "DRAW_STEEL.Setting.Malice.Hint";

  /* -------------------------------------------------- */

  /** Localized helper text for Malice. */
  get hint() {
    return game.i18n.localize(this.constructor.hint);
  }

  /* -------------------------------------------------- */

  /**
   * Re-render NPC sheets to synchronize the Malice display.
   * @param {MaliceModel} value The MaliceModel instance.
   * @param {object} options    Additional options which modify the creation or update request.
   * @param {string} userId     The id of the User requesting the document update.
   */
  static onChange(value, options, userId) {
    ui.players.render();
    for (const [index, app] of foundry.applications.instances) {
      if (app instanceof DrawSteelNPCSheet) {
        app.render({ parts: ["header"] });
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Set malice for the start of combat.
   * @param {DrawSteelActor[]} heroes Heroes to tally up victories.
   * @returns {Promise<MaliceModel>}
   */
  async startCombat(heroes) {
    const totalVictories = heroes.reduce((victories, hero) => {
      victories += foundry.utils.getProperty(hero, "system.hero.victories") ?? 0;
      return victories;
    }, 0);
    const avgVictories = Math.floor(totalVictories / heroes.length) || 0;
    return game.settings.set(systemID, "malice", { value: avgVictories });
  }

  /* -------------------------------------------------- */

  /**
   * Increase malice on round change.
   * @param {DrawSteelCombat} combat The active combat.
   * @param {DrawSteelActor[]} heroes The heroes who are currently alive.
   * @returns {Promise<MaliceModel>}
   */
  async _onStartRound(combat, heroes) {
    return game.settings.set(systemID, "malice", { value: this.value + combat.round + heroes.length });
  }

  /* -------------------------------------------------- */

  /**
   * Reset malice to 0.
   * @returns {Promise<MaliceModel>}
   */
  async resetMalice() {
    return game.settings.set(systemID, "malice", { value: 0 });
  }

  /* -------------------------------------------------- */

  /**
   * Prompt an input dialog to adjust the current malice value.
   * @returns {Promise<MaliceModel>}
   */
  async adjustMalice() {
    const input = foundry.applications.fields.createNumberInput({ name: "maliceAdjustment", value: 0 });
    const adjustmentGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Setting.Malice.AdjustMalice.label",
      hint: "DRAW_STEEL.Setting.Malice.AdjustMalice.hint",
      input,
      localize: true,
    });

    const fd = await ds.applications.api.DSDialog.input({
      window: { title: "DRAW_STEEL.Setting.Malice.AdjustMalice.label", icon: "fa-solid fa-plus-minus" },
      content: adjustmentGroup.outerHTML,
      ok: {
        label: "DRAW_STEEL.Setting.Malice.AdjustMalice.label",
        icon: "fa-solid fa-plus-minus",
      },
    });

    if (!fd.maliceAdjustment) return this;

    const newMaliceValue = Math.max(0, this.value + fd.maliceAdjustment);

    return game.settings.set(systemID, "malice", { value: newMaliceValue });
  }
}
