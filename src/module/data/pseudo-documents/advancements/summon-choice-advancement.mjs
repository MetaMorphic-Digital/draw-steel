import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";
import { requiredInteger } from "../../helpers.mjs";

/**
 * @import { DrawSteelActiveEffect, DrawSteelActor } from "../../../documents/_module.mjs";
 * @import { SummonInfo } from "./_types";
 * @import { SummonPortfolio } from "../../actor/_types";
 */

const { ArrayField, DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;
const { createFormGroup, createSelectInput, createNumberInput } = foundry.applications.fields;

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
  prepareBaseData() {
    super.prepareBaseData();
    // Signature minions don't have quantities
    if (!this.cost) for (const actor of this.pool) actor.count = null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const hero = this.document.actor;
    if (!hero) return;

    const flags = this.document.getFlag(ds.CONST.systemID, "advancement") ?? {};

    const options = this.pool
      .filter(o => flags[this.id]?.selected.includes(o.uuid))
      .map(o => ({ ...o, cost: this.cost, advancementUuid: this.uuid }));
    const portfolio = hero.system._summonPortfolios[this.dsid] ??= [];
    portfolio.push(...options);
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

  /* -------------------------------------------------- */

  /**
   * Parse summoning info for a given actor portfolio and present a dialog to make a choice.
   * @param {DrawSteelActor} hero   The actor doing the summoning.
   * @param {string} portfolioKey   The DSID of the ability that is doing the summoning.
   * @param {Object} [options={}]
   * @param {boolean} [options.signatureOnly=false] Only show signature minions and hide the cost input?
   * @returns {Promise<SummonInfo | void>} Returns void if dialog canceled or no valid summoning options.
   */
  static async getSummonInfo(hero, portfolioKey, { signatureOnly = false } = {}) {
    /** @type {SummonPortfolio[]} */
    const portfolio = hero.system._summonPortfolios[portfolioKey] ?? [];

    const summonOptions = portfolio.reduce((options, o) => {
      if (signatureOnly && (o.cost !== null)) return options;
      const idx = fromUuidSync(o.uuid);
      if (idx) options.push({
        label: _loc("DRAW_STEEL.Actor.Summoning.ActorSelectDialog.optionLabel", {
          name: idx.name,
          cost: o.cost ?? _loc("DRAW_STEEL.Actor.Summoning.ActorSelectDialog.signature"),
        }),
        value: idx.uuid,
        cost: o.cost,
      });
      return options;
      // Reverse sort by cost + alpha sort
    }, []).sort((a, b) => b.cost - a.cost || a.label.localeCompare(b.label));

    if (!summonOptions.length) return void ui.notifications.error("DRAW_STEEL.Actor.Summoning.Errors.NO_OPTIONS", { localize: true });
    // Token permissions handled by placeActor

    const content = document.createElement("div");

    const uuidSelect = createFormGroup({
      label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.label",
      hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.hint",
      input: createSelectInput({
        name: "uuid",
        options: summonOptions,
      }),
      localize: true,
    });

    const signatureCount = createFormGroup({
      label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.count.label",
      hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.count.hint",
      input: createNumberInput({
        name: "count",
        min: 1,
        value: 1,
      }),
      localize: true,
    });

    content.append(uuidSelect, signatureCount);

    if (!signatureOnly) {
      const resourceCost = createFormGroup({
        label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.cost.label",
        hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.cost.hint",
        input: createNumberInput({
          name: "cost",
          min: 1,
          max: hero.system.hero.primary.value,
          value: portfolio[0].cost ?? 1,
        }),
        localize: true,
      });

      content.append(resourceCost);
    }

    const fd = await DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.title",
        icon: "fa-solid fa-transporter-2",
      },
      render: (ev, dialog) => {
        /** @type {HTMLInputElement} */
        const costInput = dialog.element.querySelector("[name=\"cost\"]");
        if (!costInput) return;
        /** @type {HTMLInputElement} */
        const signatureInput = dialog.element.querySelector("[name=\"count\"]");
        signatureInput.addEventListener("change", (e) => {
          costInput.value = e.target.value;
        });
        /** @type {HTMLDivElement} */
        const signatureGroup = signatureInput.closest(".form-group");
        signatureGroup.hidden = summonOptions[0].cost !== null;
        dialog.element.querySelector("[name=\"uuid\"]").addEventListener("change", (e) => {
          const { cost } = portfolio.find(o => o.uuid === e.target.value);
          signatureGroup.hidden = cost !== null;
          costInput.value = cost ?? signatureInput.value;
        });
      },
    });

    if (!fd) return;

    const summonInfo = portfolio.find(o => o.uuid === fd.uuid);

    /** @type {SummonChoiceAdvancement} */
    const advancement = fromUuidSync(summonInfo.advancementUuid);

    /** @type {DrawSteelActiveEffect[]} */
    const effects = [];
    for (const effectInfo of advancement.effects) {
      if (hero.system.level < effectInfo.level) return;
      const effect = await fromUuid(effectInfo.uuid);
      if (effect) effects.push(effect);
    }

    const returnInfo = {
      effects,
      uuid: fd.uuid,
      count: summonInfo.count ?? fd.count,
    };

    if ("cost" in fd) returnInfo.cost = fd.cost;

    return returnInfo;
  }
}
