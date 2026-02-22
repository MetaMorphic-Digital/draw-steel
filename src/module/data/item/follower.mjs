import BaseItemModel from "./base-item.mjs";
import { systemPath } from "../../constants.mjs";

const fields = foundry.data.fields;

/**
 * An NPC dedicated to helping a Hero. Many of the actions of a follower are controlled by a player.
 * Sages and Artisans are implemented as items because they are primarily associated with a hero and do not need to be represented on the canvas.
 */
export default class FollowerModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "follower",
      packOnly: false,
      invalidActorTypes: ["object", "npc"],
      detailsPartial: [systemPath("templates/sheets/item/partials/follower.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.follower");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    const characteristic = { initial: 0, integer: true, nullable: false };

    schema.characteristics = new fields.SchemaField(
      Object.entries(ds.CONFIG.characteristics).reduce((obj, [chc, { label, hint }]) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField({ ...characteristic, label, hint }),
        });
        return obj;
      }, {}),
    );

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    Object.values(this.characteristics).forEach((chr) => {
      Object.assign(chr, {
        edges: 0,
        banes: 0,
        dice: {
          mode: "kh",
          number: 2,
          faces: 10,
        },
      });
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    await super.getSheetContext(context);

    const data = context.isPlay ? this : this._source;
    context.characteristics = Object.keys(ds.CONFIG.characteristics).reduce((obj, chc) => {
      const value = foundry.utils.getProperty(data, `characteristics.${chc}.value`);
      obj[chc] = {
        field: this.schema.getField(["characteristics", chc, "value"]),
        value: context.isPlay ? (value ?? 0) : (value || null),
      };
      return obj;
    }, {});
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    rollData.item.chr = -5;
    for (const [key, obj] of Object.entries(this.characteristics)) {
      const rollKey = ds.CONFIG.characteristics[key].rollKey;
      rollData.item[rollKey] = obj.value;

      if (obj.value > rollData.item.chr) rollData.item.chr = obj.value;
    }
  }
}
