import { systemID } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

export default class AdvancementModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "",
      embedded: {
        Advancement: "system.advancements",
      },
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      advancements: new ds.data.fields.CollectionField(ds.data.pseudoDocuments.advancements.BaseAdvancement),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.advancement");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    if ((this.actor?.type !== "character")) return;

    const record = this.actor.system._traits;
    const flags = this.parent.flags[systemID]?.advancement ?? {};
    const addTrait = (type, trait) => {
      record[type] ??= new Set();
      for (const k of trait) record[type].add(k);
    };
    for (const advancement of this.advancements) {
      if (!["skill", "language"].includes(advancement.type)) continue;
      const selected = advancement.isChoice
        ? flags[advancement.id]?.selected ?? []
        : Object.keys(advancement.traitChoices);
      addTrait(advancement.type, selected);
    }
  }
}
