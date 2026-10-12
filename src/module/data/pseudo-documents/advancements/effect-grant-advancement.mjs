import AdvancementChain from "../../../utils/advancement/chain.mjs";
import AdvancementLeaf from "../../../utils/advancement/leaf.mjs";
import BaseAdvancement from "./base-advancement.mjs";
import EffectGrantConfigurationDialog from "../../../applications/apps/advancement/effect-grant-configuration-dialog.mjs";
import { systemID } from "../../../constants.mjs";

/**
 * @import { DrawSteelActiveEffect, DrawSteelActor, DrawSteelItem } from "../../../documents/_module.mjs";
 */

const { ArrayField, DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;

/**
 * An advancement representing a fixed or chosen active effect from a known set of effects.
 */
export default class EffectGrantAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      pool: new ArrayField(new SchemaField({
        uuid: new DocumentUUIDField({ embedded: false, type: "ActiveEffect" }),
      })),
      chooseN: new NumberField({ required: true, integer: true, min: 1 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "effectGrant";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT.EFFECT_GRANT");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    if (this.chooseN === null) return false;
    if (this.chooseN >= Object.values(this.pool).length) return false;
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get canReconfigure() {
    const actor = this.document.parent;
    // Removed check for isChoice, as an item grant advancement can always be reconfigured
    // to delete old versions of items and make new ones
    return !!actor && (this.requirements.level <= actor.system.level);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();
    // Item grants that are only granting a single item should have a matching icon
    const hasDefaultImage = (this.img === ds.CONFIG.Advancement.effectGrant.defaultImage);
    const hasOneGrant = (this.pool.length === 1);
    if (hasDefaultImage & hasOneGrant) {
      const indexEntry = fromUuidSync(this.pool[0].uuid);
      if (indexEntry) this.img = indexEntry.img;
    }
  }

  /* -------------------------------------------------- */

  /**
   * A list of effects granted by this advancement.
   * @returns {DrawSteelActiveEffect[] | null} An array of granted effects, or null if this doesn't have an associated actor.
   */
  grantedEffects() {
    /** @type {DrawSteelActor} */
    const actor = this.document.parent;
    if (!actor) return null;

    return this.document.effects.filter(effect => {
      const advancementFlags = effect.getFlag(systemID, "advancement");
      return advancementFlags?.advancementId === this.id;
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async createLeaves(node) {
    const promises = [];
    for (const { uuid } of this.pool) {
      // TODO: Optimize DB calls
      /** @type {DrawSteelActiveEffect} */
      const effect = await fromUuid(uuid);
      if (!effect) continue;
      node.choices[effect.uuid] = new AdvancementLeaf(node, effect.uuid, effect.toAnchor().outerHTML, { effect });
    }
    return Promise.allSettled(promises);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node) {
    const selection = await EffectGrantConfigurationDialog.create({ node });

    if (!selection) return null;

    const promises = [];

    if (node) {
      node.selected = selection.choices.reduce((selected, uuid) => {
        selected[uuid] = true;
        return selected;
      }, {});
    }

    await Promise.allSettled(promises);

    return { [`flags.draw-steel.advancement.${this.id}.selected`]: selection.choices };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async reconfigure() {
    await super.reconfigure();

    /** @type {DrawSteelActor} */
    const actor = this.document.parent;

    const ids = this.grantedEffects();

    if (ids.length) {
      const allowed = await ds.applications.api.DSDialog.confirm({
        window: {
          icon: "fa-solid fa-arrow-rotate-right",
          title: "DRAW_STEEL.ADVANCEMENT.Reconfigure.ConfirmEffectGrant.Title",
        },
        content: `<p>${_loc("DRAW_STEEL.ADVANCEMENT.Reconfigure.ConfirmEffectGrant.Content")}</p>`,
      });
      if (!allowed) return;
    }

    const chain = new AdvancementChain(actor, { start: null, end: actor.system.level });

    await chain.initializeRoots({ advancement: this });

    const configuration = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chain,
      window: { title: "DRAW_STEEL.ADVANCEMENT.ChainConfiguration.reconfigureTitle" },
    });
    if (!configuration) return;

    if (ids?.length) this.document.deleteEmbeddedDocuments("ActiveEffect", ids.map(i => i.id));

    const toUpdate = {
      [this.document.id]: { _id: this.document.id },
    };

    await chain.finalize({ toUpdate });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(options) {
    const ctx = {};

    ctx.effectPool = [];
    for (const [i, pool] of this.pool.entries()) {
      const effect = await fromUuid(pool.uuid);
      ctx.effectPool.push({
        ...pool,
        index: i,
        link: effect ? effect.toAnchor() : _loc("DRAW_STEEL.ADVANCEMENT.SHEET.unknownEffect"),
      });
    }

    return ctx;
  }

  /* -------------------------------------------------- */

  /**
     * Process a dropped effect.
     * @param {DrawSteelActiveEffect} document
     * @returns {Promise<DrawSteelItem>}
     */
  handleDrop(document) {
    if (document.documentName !== "ActiveEffect") return;

    if (!document.pack) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.requirePack", { localize: true });
    if (document.parent) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.forbidParent", { localize: true });

    const exists = this.pool.some(k => k.uuid === document.uuid);
    if (exists) return;

    const pool = foundry.utils.deepClone(this._source.pool);
    pool.push({ uuid: document.uuid });
    return this.update({ pool });
  }
}
