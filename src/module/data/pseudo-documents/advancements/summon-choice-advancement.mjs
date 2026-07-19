import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";
import { requiredInteger } from "../../helpers.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
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
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "summon";
  }

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
      const actor = await fromUuid(pool.uuid);
      ctx.actorPool.push({
        ...pool,
        index: i,
        link: actor ? actor.toAnchor() : _loc("DRAW_STEEL.ADVANCEMENT.SHEET.unknownActor"),
      });
    }

    return ctx;
  }

  /* -------------------------------------------------- */

  /**
     * Process a dropped actor.
     * @param {DrawSteelActor} document
     * @returns {Promise<DrawSteelActor>}
     */
  handleDrop(document) {
    if (document.documentName !== "Actor") return;

    if (document.type !== "npc") return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.restrictedTypeSummon", {
      format: { type: _loc(CONFIG.Actor.typeLabels[document.type]) },
    });
    if (!document.pack) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.requirePackSummon", { localize: true });
    const exists = this.pool.some(k => k.uuid === document.uuid);
    if (exists) return;

    const pool = foundry.utils.deepClone(this._source.pool);
    pool.push({ uuid: document.uuid });
    return this.update({ pool });
  }
}
