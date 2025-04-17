import { systemID, systemPath } from "../../constants.mjs";
import { EquipmentModel, KitModel, ProjectModel } from "../../data/item/_module.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";

/** @import { HeroTokenModel } from "../../data/settings/hero-tokens.mjs"; */
/** @import { ActorSheetItemContext, ActorSheetEquipmentContext } from "../_types.js" */

export default class DrawSteelCharacterSheet extends DrawSteelActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["character"],
    actions: {
      gainSurges: this._gainSurges,
      rollProject: this._rollProject,
      takeRespite: this._takeRespite,
      spendRecovery: this._spendRecovery,
      spendStaminaHeroToken: this._spendStaminaHeroToken,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/actor/character/header.hbs"),
      templates: ["templates/actor/character/header.hbs", "templates/parts/mode-toggle.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/actor/character/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/actor/shared/features.hbs"),
      scrollable: [""],
    },
    equipment: {
      template: systemPath("templates/actor/character/equipment.hbs"),
      scrollable: [""],
    },
    projects: {
      template: systemPath("templates/actor/character/projects.hbs"),
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
      template: systemPath("templates/actor/character/biography.hbs"),
      templates: ["languages.hbs", "biography.hbs", "gm-notes.hbs"].map(t => systemPath(`templates/actor/shared/partials/biography/${t}`)),
      scrollable: [""],
    },
  };

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "stats":
        context.skills = this._getSkillList();
        break;
      case "equipment":
        context.kits = await this._prepareKitsContext();
        context.kitFields = KitModel.schema.fields;
        context.equipment = await this._prepareEquipmentContext();
        context.equipmentFields = EquipmentModel.schema.fields;
        break;
      case "projects":
        context.projects = await this._prepareProjectsContext();
        context.projectFields = ProjectModel.schema.fields;
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

  /**
   * Prepare the context for features
   * @returns {Array<ActorSheetItemContext>}
   */
  async _prepareKitsContext() {
    const kits = this.actor.itemTypes.kit.toSorted((a, b) => a.sort - b.sort);
    const context = [];

    for (const kit of kits) {
      context.push(await this._prepareItemContext(kit));
    }

    return context;
  }

  /**
   * Prepare the context for equipment categories and individual equipment items
   * @returns {Record<keyof typeof ds["CONFIG"]["equipment"]["categories"] | "other", ActorSheetEquipmentContext>}
   */
  async _prepareEquipmentContext() {
    const context = {};
    const equipment = this.actor.itemTypes.equipment.toSorted((a, b) => a.sort - b.sort);

    // Prepare ability categories for each ability type
    for (const [category, config] of Object.entries(ds.CONFIG.equipment.categories)) {
      context[category] = {
        label: config.label,
        equipment: [],
      };
    }

    // Adding here instead of the initial context declaration so that the "other" category appears last on the character sheet
    context["other"] = {
      label: game.i18n.localize("DRAW_STEEL.Sheet.Other"),
      equipment: [],
    };

    // Prepare the context for each individual equipment item
    for (const item of equipment) {
      const category = context[item.system.category] ? item.system.category : "other";

      context[category].equipment.push(await this._prepareItemContext(item));
    }

    return context;
  }

  /**
   * Prepare the context for equipment categories and individual equipment items
   * @returns {Array<ActorSheetItemContext>}
   */
  async _prepareProjectsContext() {
    const projects = this.actor.itemTypes.project.toSorted((a, b) => a.sort - b.sort);
    const context = [];

    for (const project of projects) {
      context.push(await this._prepareItemContext(project));
    }

    return context;
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Spend a hero token to gain a surge
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async _gainSurges(event, target) {
    /** @type {HeroTokenModel} */
    const heroTokens = game.actors.heroTokens;

    const spend = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: "DRAW_STEEL.Setting.HeroTokens.GainSurges.label",
        icon: "fa-solid fa-bolt-lightning",
      },
      content: `<p>${game.i18n.format("DRAW_STEEL.Setting.HeroTokens.GainSurges.dialogContent", {
        value: heroTokens.value,
      })}</p>`,
      rejectClose: false,
    });

    if (spend) {
      const valid = await heroTokens.spendToken("gainSurges", { flavor: this.actor.name });
      if (valid !== false) {
        this.actor.update({ "system.hero.surges": this.actor.system.hero.surges + 2 });
      }
    }
  }

  /**
   * Make a project roll and track the project points
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async _rollProject(event, target) {
    const project = this._getEmbeddedDocument(target);
    await project.system.roll();
  }

  /**
   * Take a respite, converting victories to XP and resetting stamina and recoveries to max
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async _takeRespite(event, target) {
    await this.actor.system.takeRespite();
  }

  /**
   * Spend a recovery, adding to the character's stamina and reducing the number of recoveries
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async _spendRecovery(event, target) {
    await this.actor.system.spendRecovery();
  }

  /**
   * Spend a recovery, adding to the character's stamina and reducing the number of recoveries
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async _spendStaminaHeroToken() {
    await this.actor.system.spendStaminaHeroToken();
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    // If the item is an equipment and is dropped onto the project tab, create the item as a project instead
    const projectDropTarget = event.target.closest("[data-application-part='projects'");
    if (projectDropTarget && (item.type === "equipment") && (this.actor.uuid !== item.parent?.uuid)) {
      await item.system.createProject(this.actor);
    } else {
      await super._onDropItem(event, item);
    }
  }
}
