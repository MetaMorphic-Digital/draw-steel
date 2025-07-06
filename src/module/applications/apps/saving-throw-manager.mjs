import { systemPath } from "../../constants.mjs";
import RollManager from "../api/roll-manager.mjs";

/** @import { DrawSteelActiveEffect, DrawSteelChatMessage, DrawSteelUser } from "../../documents/_module.mjs" */

/**
 * A class for managing a saving throw roll
 * @extends RollManager<boolean>
 */
export default class SavingThrowManager extends RollManager {
  /**
   * Determine the appropriate user to roll a saving throw.
   * @param {DrawSteelActiveEffect} effect The effect to save against
   * @returns {boolean} Did the saving throw succeed
   */
  static async delegateSavingThrow(effect) {
    if (!game.user.isGM) throw new Error("SavingThrowManager#delegateSavingThrow is only for GM users");
    /** @type {DrawSteelUser[]} */
    const activePlayerOwners = game.users.filter(u => !u.isGM && effect.testUserPermission(u, "OWNER") && u.active);
    if (!activePlayerOwners.length) {
      const message = await effect.system.rollSave();
      return !!message?.rolls[0].product;
    }
    else if (activePlayerOwners.length === 1) {
      const messageData = await game.system.socketHandler.rollSave(effect, activePlayerOwners[0]);
      const message = game.messages.get(messageData._id);
      return message.rolls[0].product;
    }
    else {
      const activeOwners = game.users.filter(u => effect.testUserPermission(u, "OWNER") && u.active);
      const queryResult = await this.create({ users: activeOwners, effect });
      return Object.values(queryResult).filter(r => typeof r === "boolean")[0];
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["saving-throw-manager"],
    effect: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/saving-throw-manager.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.Roll.Save.Manager.Title", { name: this.effect.name });
  }

  /* -------------------------------------------------- */

  /**
   * Convenient reference to the stored effect
   * @type {DrawSteelActiveEffect}
   */
  get effect() {
    return this.options.effect;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _handleRoll(user, target) {
    game.system.socketHandler.rollSave(this.effect, user).then(messageData => {
      if (!messageData) {
        delete this.queryResult[user.id];
        return this.render();
      }

      /** @type {DrawSteelChatMessage} */
      const message = game.messages.get(messageData._id);

      this.queryResult[user.id] = message.rolls[0].product;

      this.close();
    }, reason => {
      console.error(reason);
      delete this.queryResult[user.id];
      return this.render();
    });

    // Need non-boolean but truthy result
    this.queryResult[user.id] = "processing";

    this.render();
  }
}
