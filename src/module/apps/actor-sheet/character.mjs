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
      template: systemPath("templates/actor/character/biography.hbs"),
      scrollable: [""]
    }
  };

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "stats":
        context.skills = this._getSkillList();
        break;
    }
    return context;
  }

  /**
   * Constructs a string listing the actor's skills
   * @returns {string}
   */
  _getSkillList() {
    const list = this.actor.system.hero.skills.reduce((skills, skill) => {
      skill = ds.CONFIG.skills.list[skill]?.label;
      if (skill) skills.push(skill);
      return skills;
    }, []);
    const formatter = game.i18n.getListFormatter();
    return formatter.format(list);
  }
}
