import DSDialog from "../../../applications/api/dialog.mjs";
import { systemPath } from "../../../constants.mjs";
import RollPart from "./roll.mjs";

/**
 * @import DamagePowerRollEffect from "../power-roll-effects/damage-effect.mjs";
 */

const { DocumentUUIDField } = foundry.data.fields;

/**
 * A part containing a Test roll and possible result text.
 */
export default class TestPart extends RollPart {
  /**@inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    heroReroll: this.#heroReroll,
    applyEffect: this.#applyEffect,
    gainResource: this.#gainResource,
    rollDamage: this.#rollDamage,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "test";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/test.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.resultSource = new DocumentUUIDField();

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Finds the most recent test roll (useful for managing rerolls).
   */
  get latestTest() {
    return this.rolls.filter(r => r instanceof ds.rolls.PowerRoll).at(-1);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    const lastTestPart = this.parent.parts.sortedContents.findLast(p => p.type === this.type) === this;

    if (this.message.isOwner && lastTestPart && (this.message.speakerActor?.type === "hero")) {
      context.ctx.buttons.unshift(ds.utils.constructHTMLButton({
        label: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.label"),
        icon: "fa-solid fa-dice-d10",
        dataset: {
          tooltip: "DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.tooltip",
          action: "heroReroll",
        },
      }));
    }

    const resultSource = await fromUuid(this.resultSource);

    if (resultSource) {
      const latestRoll = this.latestTest;

      if (typeof resultSource.system?.powerRollText === "function") {
        context.ctx.tierKey = `tier${latestRoll.product}`;
        context.ctx.tierSymbol = ["!", "@", "#"][latestRoll.product - 1];
        context.ctx.resultHTML = resultSource.system.powerRollText(latestRoll.product);
      }

      if ((resultSource.documentName === "Item") && (resultSource.type === "ability")) {
        for (const pre of resultSource.system.power.effects) {
          const newButtons = pre.constructButtons(latestRoll.product) ?? [];
          if (pre.type === "damage") {
            newButtons.push(ds.utils.constructHTMLButton({
              label: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.RollDamage.label"),
              icon: "fa-solid fa-dice-d6",
              dataset: {
                action: "rollDamage",
                uuid: pre.uuid,
              },
            }));
          }
          if (newButtons.length) context.ctx.buttons.push(...newButtons);
        }
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Reroll this test while expending a hero token.
   *
   * @this TestPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #heroReroll(event, target) {
    await this.reroll({ spendToken: true });
  }

  /* -------------------------------------------------- */

  /**
   * Reroll this test.
   * @param {object} [options={}]
   * @param {boolean} [options.spendToken] Should a hero token be spent as part of this reroll?
   * @returns {Promise<true | false>} Returns true if the reroll was performed or false if it wasn't.
   */
  async reroll(options = {}) {

    const newRoll = await this.rolls[0].reroll();

    if (options.spendToken) {
      const token = await game.actors.heroTokens.spendToken("rerollTest", { messageId: this.message.id });

      if (token === false) return false;

      newRoll.options = { ...newRoll.options, flavor: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.flavor") };
    }

    await this.update({ rolls: this.rolls.concat(newRoll) }, { notify: true, ds: {
      dsn: { [this.id]: [this.rolls.length] },
    } });

    return true;
  }

  /* -------------------------------------------------- */

  /**
     * Apply an effect to the selected actor.
     *
     * @this TestPart
     * @param {PointerEvent} event   The originating click event.
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
     */
  static async #applyEffect(event, target) {
    /** @type {AppliedPowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.NoPRE", { localize: true });

    const tierKey = `tier${this.latestTest.product}`;

    await pre.applyEffect(tierKey, target.dataset.effectId);
  }

  /* -------------------------------------------------- */

  /**
     * Apply an effect to the selected actor.
     *
     * @this TestPart
     * @param {PointerEvent} event   The originating click event.
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
     */
  static async #gainResource(event, target) {
    /** @type {GainResourcePowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.NoPRE", { localize: true });

    const tierKey = `tier${this.latestTest.product}`;

    await pre.applyGain(tierKey);
  }

  /* -------------------------------------------------- */

  /**
   * Apply an effect to the selected actor.
   *
   * @this TestPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollDamage(event, target) {
    const { uuid } = target.dataset;

    /** @type {DamagePowerRollEffect} */
    const pre = await fromUuid(uuid);

    const tier = this.latestTest.product;

    const damageInfo = pre.damage[`tier${tier}`];

    let damageSelection;

    if (damageInfo.types.size > 1) {
      const content = document.createElement("div");

      const { createFormGroup, createSelectInput } = foundry.applications.fields;

      content.append(createFormGroup({
        label: "DRAW_STEEL.ChatMessage.PARTS.test.RollDamage.DamageType",
        localize: true,
        input: createSelectInput({
          name: "damageSelection",
          options: Array.from(damageInfo.types).map(value => ({ label: ds.CONFIG.damageTypes[value]?.label ?? value, value })),
        }),
      }));

      const fd = await DSDialog.input({
        content,
        window: {
          title: pre.item.name,
          icon: "fa-solid fa-dice-d6",
        },
      });

      if (!fd) return;

      damageSelection = fd.damageSelection;
    }

    const damageRoll = pre.toDamageRoll(tier, { damageSelection });
    await damageRoll.evaluate();

    const options = { notify: true };

    if (!damageRoll.isDeterministic) options.ds = { dsn: { [this.id]: [this.rolls.length] } };

    await this.update({ rolls: this.rolls.concat(damageRoll) }, options);
  }
}
