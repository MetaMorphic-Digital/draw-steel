import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import FormulaField from "../fields/formula-field.mjs";
import SavingThrowDialog from "../../applications/apps/saving-throw-dialog.mjs";
import SavingThrowRoll from "../../rolls/saving-throw.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * A data model used by default effects with properties to control the expiration behavior.
 */
export default class BaseEffectModel extends foundry.data.ActiveEffectTypeDataModel {
  /**
   * Key information about this ActiveEffect subtype.
   */
  static get metadata() {
    return {
      type: "base",
      icon: "fa-solid fa-person-rays",
      invalidActorTypes: ["party"],
      invalidItemTypes: [],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.ActiveEffect.base"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    const fields = foundry.data.fields;

    schema.end = new fields.SchemaField({
      roll: new FormulaField({ initial: "1d10 + @combat.save.bonus" }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Is this effect suppressed due to some system-specific behavior?
   * @type {boolean}
   */
  get isSuppressed() {
    const target = this.parent.target ?? {};
    const invalidTypes = this.constructor.metadata[`invalid${target.documentName}Types`] ?? [];
    return invalidTypes.includes(target.type);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const target = this.parent.parent ?? {};
    const invalidTypes = this.constructor.metadata[`invalid${target.documentName}Types`] ?? [];
    if (invalidTypes.includes(target.type)) return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {

    const enriched = await enrichHTML(this.parent.description, { ...options, relativeTo: this.parent });

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", this.parent.type);
    embed.innerHTML = enriched;

    return embed;
  }

  /* -------------------------------------------------- */

  /**
   * Rolls a saving throw for the actor and disables the effect if it passes.
   * @param {object} [rollOptions={}]     Options forwarded to new {@linkcode SavingThrowRoll}.
   * @param {object} [dialogOptions={}]   Options forwarded to {@linkcode SavingThrowDialog.create}.
   * @param {object} [messageData={}]     The data object to use when creating the message.
   * @param {object} [messageOptions={}]  Additional options which modify the created message.
   * @returns {Promise<DrawSteelChatMessage|object>} A promise which resolves to the created ChatMessage document if create is
   *                                                 true, or the Object of prepared chatData otherwise.
   * TODO: Move to DrawSteelActiveEffect.
   */
  async rollSave(rollOptions = {}, dialogOptions = {}, messageData = {}, messageOptions = {}) {
    const rollData = this.parent.getRollData();

    let formula = SavingThrowRoll.replaceFormulaData(this.end.roll, rollData);

    dialogOptions.context ??= {};
    dialogOptions.context.effect = this.parent;
    dialogOptions.context.effectFormula = formula;
    dialogOptions.context.successThreshold = rollOptions.successThreshold ??
      foundry.utils.getProperty(this.parent.target, "system.combat.save.threshold") ?? 6;

    const fd = await SavingThrowDialog.create(dialogOptions);

    if (!fd) return;

    const { rollConfig, rollMode } = fd;

    if (rollConfig.situationalBonus) formula += ` + ${rollConfig.situationalBonus}`;
    rollOptions.successThreshold = rollConfig.successThreshold;

    messageOptions.rollMode = rollMode;

    const roll = new SavingThrowRoll(formula, rollData, rollOptions);

    await roll.evaluate();

    if (roll.product) await this.parent.update({ "duration.expired": true });

    messageData.speaker ??= DrawSteelChatMessage.getSpeaker({ actor: this.parent.target });

    messageData.rolls = [roll];
    messageData.type = "standard";
    messageData.system ??= {};
    messageData.system.parts ??= [];

    messageData.system.parts.push({
      type: "savingThrow",
      effectUuid: this.parent.uuid,
      rolls: [roll],
    });

    return roll.toMessage(messageData, messageOptions);
  }
}
