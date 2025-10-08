import { systemID, systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for characteristics.
 */
export default class CharacteristicInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["actor-characteristics"],
    window: {
      title: "DRAW_STEEL.Actor.base.CharacteristicInput.Title",
      icon: "fa-solid fa-dumbbell",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/characteristic-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === "body") {
      context.characteristics = Object.keys(ds.CONFIG.characteristics).reduce((obj, chc) => {
        obj[chc] = {
          field: this.document.system.schema.getField(["characteristics", chc, "value"]),
          value: this.document.system._source.characteristics[chc].value,
          advancements: 0,
        };
        return obj;
      }, {});

      for (const item of this.document.items) {
        if (!item.supportsAdvancements) continue;
        for (const advancement of item.getEmbeddedCollection("Advancement").documentsByType.characteristic) {
          const selected = item.getFlag(systemID, `advancement.${advancement.id}.selected`) ?? [];
          for (const chr of selected) context.characteristics[chr].advancements += 1;
        }
      }
    }

    return context;
  }
}
