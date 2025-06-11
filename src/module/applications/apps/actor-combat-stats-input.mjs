import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for specialized combat data
 */
export default class ActorCombatStatsInput extends DocumentInput {
  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/sheets/document-input/actor-combat-stats-input.hbs"),
    },
  };
}
