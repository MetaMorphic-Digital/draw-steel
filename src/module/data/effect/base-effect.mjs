import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import FormulaField from "../fields/formula-field.mjs";
import SavingThrowDialog from "../../applications/apps/saving-throw-dialog.mjs";
import SavingThrowRoll from "../../rolls/saving-throw.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { setOptions } from "../helpers.mjs";
import { systemID } from "../../constants.mjs";

/**
 * @import RegionDocument from "@client/documents/region.mjs";
 */

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
      sourceDying: new fields.BooleanField(),
    });

    schema.area = new fields.SchemaField({
      track: new fields.BooleanField(),
      regions: new fields.SetField(new fields.DocumentUUIDField({ type: "Region" })),
    });

    schema.project = new fields.SchemaField({
      prerequisites: new fields.StringField({ required: true }),
      source: new fields.StringField({ required: true }),
      rollCharacteristic: new fields.SetField(setOptions()),
      goal: new fields.NumberField(),
      yield: new fields.SchemaField({
        kind: new fields.StringField({ required: true, initial: "weapon" }),
        amount: new FormulaField({ initial: "1" }),
        display: new fields.StringField({ required: true }),
      }),
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
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    const toggled = ("disabled" in changed) || foundry.utils.hasProperty(changed, "duration.expired");
    if (!toggled) return;
    const operations = this.#linkedRegions("update").flatMap(region => BaseEffectModel.#toggleOperations(region, this.parent.active));
    if (operations.length) foundry.documents.modifyBatch(operations);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    const operations = Object.values(Object.groupBy(this.#linkedRegions("delete"), region => region.parent.id))
      .map(regions => ({ action: "delete", documentName: "Region", parent: regions[0].parent, ids: regions.map(r => r.id), ds: { areaEffect: true } }));
    if (operations.length) foundry.documents.modifyBatch(operations);
  }

  /* -------------------------------------------------- */

  /**
   * The regions tracked by this effect that this client is designated to modify.
   * @param {string} action     The region operation to perform.
   * @returns {RegionDocument[]}
   */
  #linkedRegions(action) {
    return Array.from(this.area.regions, uuid => fromUuidSync(uuid)).filter(region => {
      return region && game.users.getDesignatedUser(user => user.active && region.canUserModify(user, action))?.isSelf;
    });
  }

  /* -------------------------------------------------- */

  /**
   * The operations that switch a tracked region on or off. A region that is off has its behaviors disabled and shows only on the Regions layer.
   * Hidden isn't used because regions attached to a token always share the token's hidden state.
   * @param {RegionDocument} region
   * @param {boolean} on
   * @returns {object[]}
   */
  static #toggleOperations(region, on) {
    const disabledIds = region.getFlag(systemID, "disabledBehaviors");
    if (on === !disabledIds) return [];
    const behaviorIds = on ? disabledIds.filter(id => region.behaviors.has(id)) : region.behaviors.filter(b => !b.disabled).map(b => b.id);
    const operations = [{
      action: "update", documentName: "Region", parent: region.parent, updates: [{
        _id: region.id,
        visibility: on ? CONST.REGION_VISIBILITY.ALWAYS : CONST.REGION_VISIBILITY.LAYER,
        [`flags.${systemID}.disabledBehaviors`]: on ? _del : behaviorIds,
      }],
    }];
    if (behaviorIds.length) {
      operations.push({ action: "update", documentName: "RegionBehavior", parent: region, updates: behaviorIds.map(_id => ({ _id, disabled: !on })) });
    }
    return operations;
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

    const { rollConfig, messageMode } = fd;

    if (rollConfig.situationalBonus) formula += ` + ${rollConfig.situationalBonus}`;
    rollOptions.successThreshold = rollConfig.successThreshold;

    const roll = new SavingThrowRoll(formula, rollData, rollOptions);

    await roll.evaluate();

    if (roll.product) await this.parent.update({ "duration.expired": true });

    messageData.speaker ??= DrawSteelChatMessage.getSpeaker({ actor: this.parent.target });

    const savingThrowId = "savingThrow".padEnd(16, "0");

    DrawSteelChatMessage.applyMode(messageData, messageMode);

    const finalMessageData = foundry.utils.mergeObject({
      rolls: [roll],
      type: "standard",
      system: {
        parts: {
          [savingThrowId]: {
            _id: savingThrowId,
            type: "savingThrow",
            effectUuid: this.parent.uuid,
            flavor: this.parent.name,
            rolls: [roll],
          },
        },
      },
      author: game.user.id,
      sound: CONFIG.sounds.dice,
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.parent.actor }),
      title: this.parent.name,
      flags: { core: { canPopout: true } },
    }, messageData);

    return DrawSteelChatMessage.create(finalMessageData, messageOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Creates a project for this equipment on the provided actor.
   * @param {DrawSteelActor} actor
   * @returns {DrawSteelItem}
   */
  async createProject(actor) {
    if (!actor) return;

    const name = _loc("DRAW_STEEL.Item.project.Craft.ItemName", { name: this.parent.name });
    return getDocumentClass("Item").create({ name, type: "project", "system.yield.document": this.parent.uuid }, { parent: actor });
  }
}
