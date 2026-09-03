import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";
import { requiredInteger } from "../../helpers.mjs";

/**
 * @import { DrawSteelActiveEffect, DrawSteelActor } from "../../../documents/actor.mjs";
 */

const { ArrayField, DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;

/**
 * An advancement that selects other actors from a pool for the Summoner.
 */
export default class SummonChoiceAdvancement extends ActorChoiceAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      cost: new NumberField({ initial: null, min: 1, integer: true }),
      chooseN: new NumberField({ required: true, integer: true, min: 1, initial: 2 }),
      pool: new ArrayField(new SchemaField({
        uuid: new DocumentUUIDField({ embedded: false, type: "Actor" }),
        count: requiredInteger({ initial: 2, min: 1 }),
      })),
      effects: new ArrayField(new SchemaField({
        uuid: new DocumentUUIDField({ embedded: false, type: "ActiveEffect" }),
        level: new NumberField({ min: 1, integer: true, max: 10, required: true }),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "summon";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT.SUMMON");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get actorOptions() {
    return Object.values(this.pool).reduce((options, entry) => {
      const idx = fromUuidSync(entry.uuid);
      if (idx) options.push({ uuid: idx.uuid });
      return options;
    }, []);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(options) {
    const ctx = {};

    ctx.actorPool = [];
    for (const [i, pool] of this.pool.entries()) {
      ctx.actorPool.push({
        ...pool,
        index: i,
        link: ds.utils.createDocumentLink(pool.uuid)?.outerHTML ?? _loc("DRAW_STEEL.ADVANCEMENT.SHEET.unknownActor"),
      });
    }

    ctx.summonEffects = [];
    for (const [i, effect] of this.effects.entries()) {
      ctx.summonEffects.push({
        ...effect,
        index: i,
        link: ds.utils.createDocumentLink(effect.uuid)?.outerHTML ?? _loc("DRAW_STEEL.ADVANCEMENT.SHEET.unknownEffect"),
      });
    }

    return ctx;
  }

  /* -------------------------------------------------- */

  /**
   * Process a dropped actor or active effect.
   * @param {DrawSteelActor | DrawSteelActiveEffect} document
   * @returns {Promise<DrawSteelActor>}
   */
  handleDrop(document) {
    switch (document.documentName) {
      case "ActiveEffect": return this.#handleActiveEffectDrop(document);
      case "Actor": return this.#handleActorDrop(document);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Process a dropped effect.
   * @param {DrawSteelActiveEffect} effect
   */
  #handleActiveEffectDrop(effect) {
    if (!effect.pack || effect.parent) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.requireStandaloneSummonEffect", { localize: true });
    const exists = this.effects.some(k => k.uuid === effect.uuid);
    if (exists) return;

    const effects = foundry.utils.deepClone(this._source.effects);
    effects.push({ uuid: effect.uuid });
    return this.update({ effects });
  }

  /* -------------------------------------------------- */

  /**
   * Process a dropped actor.
   * @param {DrawSteelActor} document
   * @returns {Promise<DrawSteelActor>}
   */
  #handleActorDrop(actor) {
    if (actor.type !== "npc") return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.restrictedTypeSummon", {
      format: { type: _loc(CONFIG.Actor.typeLabels[actor.type]) },
    });
    if (!actor.pack) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.requirePackSummon", { localize: true });
    const exists = this.pool.some(k => k.uuid === actor.uuid);
    if (exists) return;

    const pool = foundry.utils.deepClone(this._source.pool);
    pool.push({ uuid: actor.uuid });
    return this.update({ pool });
  }

}
