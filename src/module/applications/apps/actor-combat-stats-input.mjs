import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

export default class ActorCombatStatsInput extends DocumentInput {
  static PARTS = {
    body: {
      template: systemPath("templates/sheets/document-input/actor-combat-stats-input.hbs"),
    },
  };
}
