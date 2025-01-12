import DrawSteelActorSheet from "./base.mjs";
import {systemID, systemPath} from "../../constants.mjs";
/** @import {HeroTokenModel} from "../../data/settings/hero-tokens.mjs"; */

export default class DrawSteelCharacterSheet extends DrawSteelActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["character"],
    actions: {
      gainSurges: this._gainSurges
    }
  };

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

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Spend a hero token to gain a surge
   * @this DrawSteelNPCSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async _gainSurges(event, target) {
    /** @type {HeroTokenModel} */
    const heroTokens = game.settings.get(systemID, "heroTokens");

    const spend = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: "DRAW_STEEL.Setting.HeroTokens.GainSurges.label",
        icon: "fa-solid fa-bolt-lightning"
      },
      content: "<p>" + game.i18n.format("DRAW_STEEL.Setting.HeroTokens.GainSurges.dialogContent", {value: heroTokens.value}) + "</p>",
      rejectClose: false
    });

    if (spend) {
      const valid = await heroTokens.spendToken("gainSurges", {flavor: this.actor.name});
      if (valid !== false) {
        this.actor.update({"system.hero.surges": this.actor.system.hero.surges + 2});
      }
    }
  }
}
