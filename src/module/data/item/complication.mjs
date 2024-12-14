import {systemPath} from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * A complication is an optional feature that provides both a positive benefit and a negative drawback
 */
export default class ComplicationModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "complication",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/complication.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Complication"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
