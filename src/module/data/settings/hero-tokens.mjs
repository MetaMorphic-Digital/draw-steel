import {systemID} from "../../constants.mjs";

const fields = foundry.data.fields;

/**
 * A data model to manage Hero Tokens in Draw Steel
 */
export class HeroTokenModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      value: new fields.NumberField({required: true, nullable: false, initial: 0, integer: true, min: 0})
    };
  }

  /** Name for the setting */
  static label = "DRAW_STEEL.Setting.HeroTokens.Label";

  /** Helper text for Hero Tokens */
  static hint = "DRAW_STEEL.Setting.HeroTokens.Hint";

  /**
   * Send a socket message to the Director to spend a hero token
   * Necessary because only game masters can modify world settings
   */
  spendToken() {
    const currentTokens = game.settings.get(systemID, "heroTokens").value;
    if (currentTokens < 1) {
      ui.notifications.error("DRAW_STEEL.Setting.HeroTokens.NoHeroTokens");
      return;
    }
    game.system.socketHandler.emit("spendHeroToken", {userId: game.userId});
  }
}
