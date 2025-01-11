import {DSRoll} from "./base.mjs";
import {systemPath} from "../constants.mjs";

/**
 * Usually a flat d10 roll to shake free of a persistent condition
 */
export class SavingThrowRoll extends DSRoll {
  /**
   * @param {string} [formula="1d10"]        Default saving throw is a flat 1d10
   * @param {Record<string, any>} [data]     Roll data
   * @param {{ flavor?: string, successThreshold?: number }} [options]  Options to modify roll display
   */
  constructor(formula = "1d10", data = {}, options = {}) {
    super(formula, data, options);
  }

  static CHAT_TEMPLATE = systemPath("templates/rolls/save.hbs");

  /**
   * The total to succeed or higher
   * @returns {number}
   * @defaultValue `6`
   */
  get successThreshold() {
    return this.options.successThreshold ?? 6;
  }

  /**
   * Did the saving throw succeed
   * @returns {boolean}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return this.total >= this.successThreshold;
  }

  /**
   * Helper function to generate render context in use with `static CHAT_TEMPLATE`
   * @param {object} options
   * @param {string} [options.flavor]     Flavor text to include
   * @param {boolean} [options.isPrivate] Is the Roll displayed privately?
   * @returns An object to be used in `renderTemplate`
   */
  async _prepareContext({flavor, isPrivate}) {
    return {
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : flavor ?? this.options.flavor ?? game.i18n.localize("DRAW_STEEL.Roll.Save.Label"),
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
      result: this.product ? "critical" : "failure"
    };
  }
}
