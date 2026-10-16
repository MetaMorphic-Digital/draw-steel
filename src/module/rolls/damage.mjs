import DSRoll from "./base.mjs";
import { systemPath } from "../constants.mjs";

/**
 * @import { DamageApplication, DamageOrigin } from "../_types";
 * @import { DrawSteelChatMessage } from "../documents/_module.mjs";
 * @import BaseMessagePart from "../data/pseudo-documents/message-parts/base-message-part.mjs";
 */

/**
 * A roll subclass with damage-specific info like damage type.
 */
export default class DamageRoll extends DSRoll {
  /**
   * Button callback to apply damage to selected actors.
   * @param {PointerEvent} event
   */
  static async applyDamageCallback(event) {
    if (!canvas.tokens.controlled.length) return void ui.notifications.error("DRAW_STEEL.ROLL.Damage.NoTokenSelected", { localize: true });

    /** @type {HTMLButtonElement} */
    const target = event.currentTarget;

    const part = target.closest("[data-message-part]");
    const li = target.closest("[data-message-id]");
    const message = game.messages.get(li.dataset.messageId);
    const idx = target.dataset.index;
    const messagePart = part ? message.system.parts.get(part.dataset.messagePart) : null;
    /** @type {DamageRoll} */
    const roll = messagePart ? messagePart.rolls[idx] : message.rolls[idx];

    await roll.applyDamage(null, { halfDamage: event.shiftKey, origin: DamageRoll.getOrigin(message, messagePart) });
  }

  /* -------------------------------------------------- */

  /**
   * Describe where damage applied from a chat message came from.
   * @param {DrawSteelChatMessage} message    The message holding the damage roll.
   * @param {BaseMessagePart} [part]          The message part holding the damage roll, if any.
   * @returns {DamageOrigin}
   */
  static getOrigin(message, part) {
    const { scene, token } = message.speaker;
    return {
      messageId: message.id,
      partId: part?.id ?? null,
      abilityUuid: part?.abilityUuid ?? null,
      actorUuid: getDocumentClass("ChatMessage").getSpeakerActor(message.speaker)?.uuid ?? null,
      tokenUuid: (scene && token) ? (game.scenes.get(scene)?.tokens.get(token)?.uuid ?? null) : null,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static CHAT_TEMPLATE = systemPath("templates/rolls/damage.hbs");

  /* -------------------------------------------------- */

  /**
   * The damage type.
   * @type {string}
   */
  get type() {
    return this.options.type ?? (this.isHeal ? "value" : "");
  }

  /* -------------------------------------------------- */

  /**
   * The localized label for this damage roll's type.
   * @type {string}
   */
  get typeLabel() {
    if (this.isHeal) return ds.CONFIG.healingTypes[this.type]?.label;
    return ds.CONFIG.damageTypes[this.type]?.label ?? "";
  }

  /* -------------------------------------------------- */

  /**
   * Damage immunities to ignore.
   * @type {string[]}
   */
  get ignoredImmunities() {
    return this.options.ignoredImmunities ?? [];
  }

  /* -------------------------------------------------- */

  /**
   * Does this represent healing?
   * @type {boolean}
   */
  get isHeal() {
    return this.options.isHeal || false;
  }

  /* -------------------------------------------------- */

  /**
   * Is this damage from an AOE ability?
   * @type {boolean}
   */
  get aoe() {
    return this.options.aoe || false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareChatRenderContext(options = {}) {
    const context = await super._prepareChatRenderContext(options);

    context.isGM = game.user.isGM;
    if ("rollIndex" in options) {
      Object.assign(context, {
        rollIndex: options.rollIndex,
        buttonIcon: this.isHeal ? "fa-solid fa-heart-pulse" : "fa-solid fa-burst",
        tooltipPath: this.isHeal ?
          "DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.Tooltip" :
          "DRAW_STEEL.ChatMessage.base.Buttons.ApplyDamage.Tooltip",
      });
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Produces a button with relevant data to applying this damage.
   * @param {number} index The index of this roll in the `rolls` array of the message.
   * @returns {HTMLButtonElement} A button that.
   */
  toRollButton(index) {
    const labelPath = this.isHeal ? "DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.Label" : "DRAW_STEEL.ChatMessage.base.Buttons.ApplyDamage.Label";

    const tooltipPath = this.isHeal ? "DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.Tooltip" : "DRAW_STEEL.ChatMessage.base.Buttons.ApplyDamage.Tooltip";

    return ds.utils.constructHTMLButton({
      label: _loc(labelPath, {
        type: this.typeLabel ? " " + this.typeLabel : "",
        amount: this.total,
      }),
      dataset: {
        action: "applyDamage",
        index,
        tooltip: _loc(tooltipPath),
        tooltipDirection: "UP",
      },
      classes: ["apply-damage"],
      icon: this.isHeal ? "fa-solid fa-heart-pulse" : "fa-solid fa-burst",
    });
  }

  /* -------------------------------------------------- */

  /**
   * Apply this roll's damage to a selection of actors.
   * @param {DrawSteelActor[]} [targets]    Actors to apply damage to. Defaults to selected targets.
   * @param {object} [options={}]           Options that modify the damage application.
   * @param {boolean} [options.halfDamage]  Only apply half the total damage.
   * @param {DamageOrigin} [options.origin] Where the damage came from, passed through to the Stamina update.
   * @returns {Promise<DamageApplication[]>}  Stamina before and after, per actor or minion squad.
   */
  async applyDamage(targets, options = {}) {
    targets ??= ds.utils.tokensToActors();

    // Group actors by combatant group if they are a minion with only one combat group, otherwise group the rest in a single array.
    const { actors = [], ...groups } = Object.groupBy(targets, (target => {
      if (!target.isMinion || !target.system.combatGroup || (target.system.combatGroups.size > 1)) return "actors";
      else return target.system.combatGroup.uuid;
    }));

    let amount = this.total;
    if (options.halfDamage) amount = Math.floor(amount / 2);

    /** @type {DamageApplication[]} */
    const applied = [];
    const stamina = actor => ({ value: actor.system.stamina.value, temporary: actor.system.stamina.temporary });

    // Actors that aren't minions or in a combat group.
    for (const actor of actors) {
      const before = stamina(actor);
      if (this.isHeal) {
        const isTemp = this.type !== "value";
        if (isTemp && (amount < actor.system.stamina.temporary)) ui.notifications.warn("DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.TempCapped", {
          format: { name: actor.name },
        });
        else await actor.modifyTokenAttribute(isTemp ? "stamina.temporary" : "stamina", amount, !isTemp, !isTemp);
      }
      else await actor.system.takeDamage(amount, { type: this.type, ignoredImmunities: this.ignoredImmunities, origin: options.origin });
      applied.push({ actor, before, after: stamina(actor) });
    }

    // Minion sqauds
    for (const [uuid, actors] of Object.entries(groups)) {
      const group = fromUuidSync(uuid);
      const before = { value: group.system.staminaValue };
      // Minions cannot regain stamina or gain temp stamina (Monsters p. 7)
      if (this.isHeal) {
        const msg = `DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.${this.type === "value" ? "MinionHeal" : "MinionTemp"}`;
        ui.notifications.warn(msg, { localize: true });
      }
      // Damage
      else await group.system.takeDamage(actors, amount, { type: this.type, ignoredImmunities: this.ignoredImmunities, aoe: this.aoe, origin: options.origin });
      applied.push({ group, actors, before, after: { value: group.system.staminaValue } });
    }

    return applied;
  }
}
