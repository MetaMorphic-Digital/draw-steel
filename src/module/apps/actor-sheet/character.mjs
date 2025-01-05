import DrawSteelActorSheet from "./base.mjs";
import {systemPath} from "../../constants.mjs";

export default class DrawSteelCharacterSheet extends DrawSteelActorSheet {
  /** @override */
  static PARTS = {
    header: {
      template: systemPath("templates/actor/character/header.hbs")
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs"
    },
    stats: {
      template: systemPath("templates/actor/character/stats.hbs"),
      scrollable: [""]
    },
    features: {
      template: systemPath("templates/actor/character/features.hbs"),
      scrollable: [""]
    },
    abilities: {
      template: systemPath("templates/actor/shared/abilities.hbs"),
      scrollable: [""]
    },
    effects: {
      template: systemPath("templates/actor/shared/effects.hbs"),
      scrollable: [""]
    },
    biography: {
      template: systemPath("templates/actor/shared/biography.hbs"),
      scrollable: [""]
    }
  };
}
