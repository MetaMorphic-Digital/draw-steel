import DrawSteelActorSheet from "./base.mjs";
import {systemPath} from "../../constants.mjs";
/** @import {FormSelectOption} from "../../../../foundry/client-esm/applications/forms/fields.mjs" */

export default class DrawSteelNPCSheet extends DrawSteelActorSheet {
  /** @override */
  static PARTS = {
    header: {
      template: systemPath("templates/actor/npc/header.hbs")
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs"
    },
    stats: {
      template: systemPath("templates/actor/npc/stats.hbs"),
      scrollable: [""]
    },
    features: {
      template: systemPath("templates/actor/npc/features.hbs"),
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
      template: systemPath("templates/actor/npc/biography.hbs"),
      scrollable: [""]
    }
  };

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header":
        context.monsterKeywords = this._getMonsterKeywords();
        context.organizations = this._getOrganizations();
        context.roles = this._getRoles();
        context.evLabel = this._getEVLabel();
        break;
      case "biography":
        context.motivations = this._getMotivations();
        break;
    }
    return context;
  }

  /**
   * Fetches the options for Monster Organizations
   * @returns {{list: FormSelectOption[], current: string}}
   */
  _getMonsterKeywords() {
    const formatter = game.i18n.getListFormatter({type: "unit"});
    return {
      list: [],
      current: formatter.format(this.actor.system.monster.keywords)
    };
  }

  /**
   * Fetches the options for Monster Organizations
   * @returns {{list: FormSelectOption[], current: string}}
   */
  _getOrganizations() {
    const organizations = ds.CONFIG.monsters.organizations;
    return {
      list: Object.entries(organizations).map(([value, {label}]) => ({value, label})),
      current: organizations[this.actor.system.monster.organization]?.label ?? ""
    };
  }

  /**
   * Fetches the options for Monster Roles
   * @returns {{list: FormSelectOption[], current: string}}
   */
  _getRoles() {
    const roles = ds.CONFIG.monsters.roles;
    return {
      list: Object.entries(roles).map(([value, {label}]) => ({value, label})),
      current: roles[this.actor.system.monster.role]?.label ?? ""
    };
  }

  /**
   * Constructs a label
   */
  _getEVLabel() {
    const data = {value: this.actor.system.monster.ev};
    if (this.actor.system.monster.organization === "minion") return game.i18n.format("DRAW_STEEL.Actor.NPC.EVLabel.Minion", data);
    else return game.i18n.format("DRAW_STEEL.Actor.NPC.EVLabel.Other", data);
  }

  /**
   * Fetches the options for Motivations
   * @returns {{list: FormSelectOption[]}}
   */
  _getMotivations() {
    const motivations = ds.CONFIG.negotiation.motivations;
    const formatter = game.i18n.getListFormatter();

    const currentMotivations = this.actor.system.negotiation.motivations.reduce((arr, motivation) => {
      motivation = motivations[motivation]?.label;
      if (motivation) arr.push(motivation);
      return arr;
    }, []);
    const currentPitfalls = this.actor.system.negotiation.pitfalls.reduce((arr, pitfall) => {
      pitfall = motivations[pitfall]?.label;
      if (pitfall) arr.push(pitfall);
      return arr;
    }, []);
    return {
      list: Object.entries(motivations).map(([value, {label}]) => ({value, label})),
      currentMotivations: formatter.format(currentMotivations),
      currentPitfalls: formatter.format(currentPitfalls)
    };
  }
}
