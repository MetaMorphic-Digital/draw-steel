import {systemPath} from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * A complication is an optional feature that provides both a positive benefit and a negative drawback
 */
export default class ComplicationModel extends AdvancementModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "complication",
    invalidActorTypes: ["npc"]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Complication"
  ];
}
