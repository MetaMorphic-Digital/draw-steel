import DSRoll from "./base.mjs";
import { systemPath } from "../constants.mjs";

/**
 * Usually a flat d10 roll to shake free of a persistent condition.
 */
export default class SavingThrowRoll extends DSRoll {
  /**
   * @param {string} [formula="1d10"]        Default saving throw is a flat 1d10.
   * @param {Record<string, any>} [data]     Roll data.
   * @param {{ flavor?: string, successThreshold?: number }} [options]  Options to modify roll display.
   */
  constructor(formula = "1d10", data = {}, options = {}) {
    super(formula, data, options);
  }

  /* -------------------------------------------------- */

  static CHAT_TEMPLATE = systemPath("templates/rolls/save.hbs");

  /* -------------------------------------------------- */

  /**
   * The total to succeed or higher.
   * @returns {number}
   * @defaultValue `6`
   */
  get successThreshold() {
    return this.options.successThreshold ?? 6;
  }

  /* -------------------------------------------------- */

  /**
   * Did the saving throw succeed.
   * @returns {boolean}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return this.total >= this.successThreshold;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareChatRenderContext({ flavor, isPrivate = false, ...options } = {}) {
    const context = await super._prepareChatRenderContext({ flavor, isPrivate, ...options });

    if (!isPrivate) {
      context.flavor ??= game.i18n.localize("DRAW_STEEL.ROLL.Save.Label");
      context.result = this.product ? "critical" : "failure";
    }

    return context;
  }
}
