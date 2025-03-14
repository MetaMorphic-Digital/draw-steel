
/**
 * Base roll class for Draw Steel
 */
export class DSRoll extends foundry.dice.Roll {
  /** @inheritdoc */
  async render({flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false} = {}) {
    if (!this._evaluated) await this.evaluate({allowInteractive: !isPrivate});
    const chatData = await this._prepareContext({flavor, isPrivate});
    return renderTemplate(template, chatData);
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
      flavor: isPrivate ? null : flavor ?? this.options.flavor,
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100
    };
  }
}
