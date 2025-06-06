import { systemID, systemPath } from "../../constants.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";

/** @import { FormSelectOption } from "@client/applications/forms/fields.mjs" */
/** @import DrawSteelActor from "../../documents/actor.mjs"; */

export default class DrawSteelNPCSheet extends DrawSteelActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["npc"],
    actions: {
      updateSource: this.#updateSource,
      editMonsterMetadata: this.#editMonsterMetadata,
      freeStrike: this.#freeStrike,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/actor/npc/header.hbs"),
      templates: ["templates/actor/npc/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/actor/npc/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/actor/shared/features.hbs"),
      scrollable: [""],
    },
    abilities: {
      template: systemPath("templates/actor/shared/abilities.hbs"),
      scrollable: [""],
    },
    effects: {
      template: systemPath("templates/actor/shared/effects.hbs"),
      scrollable: [""],
    },
    biography: {
      template: systemPath("templates/actor/npc/biography.hbs"),
      templates: ["languages.hbs", "biography.hbs", "gm-notes.hbs"].map(t => systemPath(`templates/actor/shared/partials/biography/${t}`)),
      scrollable: [""],
    },
  };

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header":
        context.monsterKeywords = this._getMonsterKeywords();
        context.organizationLabel = this._getOrganizationLabel();
        context.roleLabel = this._getRoleLabel();
        context.evLabel = this._getEVLabel();
        context.showMalice = game.user.isGM && (this.actor.system.monster.organization !== "minion");
        context.malice = game.actors.malice;
        break;
      case "stats":
        context.isSingleSquadMinion = this.actor.isMinion && (this.actor.system.combatGroups.size === 1);
        if (context.isSingleSquadMinion) context.combatGroup = this.actor.system.combatGroup;
        break;
      case "biography":
        context.motivations = this._getMotivations();
        break;
    }
    return context;
  }

  /**
   * Fetches the printable string for the monster's keywords
   * @returns {string}
   */
  _getMonsterKeywords() {
    const monsterKeywords = ds.CONFIG.monsters.keywords;
    const formatter = game.i18n.getListFormatter({ type: "unit" });
    const keywords = Array.from(this.actor.system.monster.keywords).map(k => monsterKeywords[k]?.label).filter(k => k);
    return formatter.format(keywords);
  }

  /**
   * Fetches the label for the monster's organization
   * @returns {{list: FormSelectOption[], current: string}}
   */
  _getOrganizationLabel() {
    const organizations = ds.CONFIG.monsters.organizations;
    return organizations[this.actor.system.monster.organization]?.label ?? "";
  }

  /**
   * Fetches the label for the monster's role
   * @returns {{list: FormSelectOption[], current: string}}
   */
  _getRoleLabel() {
    const roles = ds.CONFIG.monsters.roles;
    return roles[this.actor.system.monster.role]?.label ?? "";
  }

  /**
   * Fetches the label for the monster's Encounter Value
   */
  _getEVLabel() {
    const data = { value: this.actor.system.monster.ev };
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
      list: Object.entries(motivations).map(([value, { label }]) => ({ value, label })),
      currentMotivations: formatter.format(currentMotivations),
      currentPitfalls: formatter.format(currentPitfalls),
    };
  }

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    /** @type {HTMLInputElement} */
    const maliceInput = this.element.querySelector("[data-setting=\"malice\"]");
    if (maliceInput) {
      maliceInput.addEventListener("change", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        game.settings.set(systemID, "malice", { value: ev.target.value });
      });
    }

    /** @type {HTMLInputElement} */
    const squadStaminaInput = this.element.querySelector("[name=\"squadStaminaValue\"]");
    if (squadStaminaInput) {
      squadStaminaInput.addEventListener("change", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.actor.system.combatGroup.update({ "system.staminaValue": ev.target.value });
      });
    }
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Open the update source dialog
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #updateSource(event, target) {
    this.actor.system.source.updateDialog();
  }

  /**
   * Open a dialog to edit the monster metadata
   * @this DrawSteelNPCSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #editMonsterMetadata(event, target) {
    const htmlContainer = document.createElement("div");
    const schema = this.actor.system.schema;
    const monsterData = this.actor.system.monster;
    const monsterConfig = ds.CONFIG.monsters;

    const keywordInput = schema.getField("monster.keywords").toFormGroup({}, {
      value: monsterData.keywords,
      options: Object.entries(monsterConfig.keywords).map(([value, { label, group }]) => ({ value, label, group })),
    });
    const levelInput = schema.getField("monster.level").toFormGroup({}, { value: monsterData.level });
    const organizationInput = schema.getField("monster.organization").toFormGroup({}, {
      value: monsterData.organization,
      options: Object.entries(monsterConfig.organizations).map(([value, { label }]) => ({ value, label })),
    });
    const roleInput = schema.getField("monster.role").toFormGroup({}, {
      value: monsterData.role,
      options: Object.entries(monsterConfig.roles).map(([value, { label }]) => ({ value, label })),
    });
    const evInput = schema.getField("monster.ev").toFormGroup({}, { value: monsterData.ev });

    htmlContainer.append(keywordInput, levelInput, organizationInput, roleInput, evInput);

    /** @type {object | null} */
    const fd = await ds.applications.api.DSDialog.input({
      content: htmlContainer.outerHTML,
      classes: ["draw-steel", "monster-metadata"],
      window: {
        title: "DRAW_STEEL.Actor.NPC.MonsterMetadata.DialogTitle",
        icon: "fa-solid fa-spaghetti-monster-flying",
      },
      ok: {
        label: "Save",
        icon: "fa-solid fa-floppy-disk",
      },
      rejectClose: false,
    });
    if (fd) {
      await this.actor.update(fd);
    }
  }

  /**
   * Open a dialog to edit the monster metadata
   * @this DrawSteelNPCSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #freeStrike(event, target) {
    /** @type {Array<DrawSteelActor>} */
    const targets = game.user.targets.map(t => t.actor).filter(a => a?.system?.takeDamage).toObject();
    if (!targets.length) {
      ui.notifications.error("DRAW_STEEL.Actor.NPC.FreeStrike.NoTargets", { localize: true });
      return;
    }
    const freeStrike = this.actor.system.freeStrike;

    const damageLabel = game.i18n.format("DRAW_STEEL.Actor.NPC.FreeStrike.DialogHeader", {
      value: freeStrike.value,
      type: ds.CONFIG.damageTypes[freeStrike.type]?.label ?? "",
    });
    const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });
    const keywordList = freeStrike.keywords.toObject().map(k => ds.CONFIG.abilities.keywords[k]?.label);

    let content = `<span>${keywordFormatter.format([damageLabel, ...keywordList])}</span>`;

    content += targets.map(a => {
      const checkboxInput = foundry.applications.fields.createCheckboxInput({ name: a.uuid, value: true });
      const formGroup = foundry.applications.fields.createFormGroup({
        label: a.name,
        input: checkboxInput,
      });
      // style fix
      const label = formGroup.querySelector("label");
      label.classList.add("checkbox");
      label.style = "font-size: inherit;";
      return formGroup.outerHTML;
    }).join("");

    /** @type {object} */
    const fd = await ds.applications.api.DSDialog.input({
      window: { title: "DRAW_STEEL.Actor.NPC.FreeStrike.DialogTitle", icon: "fa-solid fa-burst" },
      content,
      ok: {
        label: "DRAW_STEEL.Actor.NPC.FreeStrike.DialogButton",
      },
    });

    if (fd) {
      for (const [uuid, bool] of Object.entries(fd)) {
        if (bool) {
          /** @type {DrawSteelActor} */
          const actor = fromUuidSync(uuid);
          actor.system.takeDamage(freeStrike.value, { type: freeStrike.type });
        }
      }
    }
  }
}
