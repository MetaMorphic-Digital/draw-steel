import { systemID, systemPath } from "../../constants.mjs";
import { EquipmentModel, KitModel, ProjectModel } from "../../data/item/_module.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";

/** @import { HeroTokenModel } from "../../data/settings/hero-tokens.mjs"; */
/** @import { ActorSheetItemContext, ActorSheetEquipmentContext } from "./_types.js" */

export default class DrawSteelCharacterSheet extends DrawSteelActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["character"],
    actions: {
      gainSurges: this.#gainSurges,
      rollProject: this.#rollProject,
      takeRespite: this.#takeRespite,
      spendRecovery: this.#spendRecovery,
      spendStaminaHeroToken: this.#spendStaminaHeroToken,
      modifyItemQuantity: this.#modifyItemQuantity,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/actor/character/header.hbs"),
      templates: ["templates/actor/character/header.hbs"].map(t => systemPath(t)),
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

  /* -------------------------------------------------- */

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
      case "biography":
        context.measurements = this._getMeasurements();
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */

  /**
   * Prepare the context for equipment categories and individual equipment items
   */
  async _prepareEquipmentContext() {
    /** @type {Record<string, ActorSheetEquipmentContext>} */
    const context = {};
    const equipment = this.actor.itemTypes.equipment.toSorted((a, b) => a.sort - b.sort);

    // Prepare ability categories for each ability type
    for (const [category, config] of Object.entries(ds.CONFIG.equipment.categories)) {
      context[category] = {
        label: config.label,
        equipment: [],
        showAdd: this.isEditMode,
        showHeader: this.isEditMode,
      };
    }

    // Adding here instead of the initial context declaration so that the "other" category appears last on the character sheet
    context["other"] = {
      label: game.i18n.localize("DRAW_STEEL.Sheet.Other"),
      equipment: [],
      showAdd: false,
      // Show "other" if and only if there is equipment of that category
      showHeader: false,
    };

    // Prepare the context for each individual equipment item
    for (const item of equipment) {
      const category = context[item.system.category] ? item.system.category : "other";
      context[category].showHeader = true;
      context[category].equipment.push(await this._prepareItemContext(item));
    }

    // Filter out unused headers for play mode
    if (this.isPlayMode) {
      for (const [key, value] of Object.entries(context)) {
        if (!value.equipment.length) delete context[key];
      }
    }

    return context;
  }

  /* -------------------------------------------------- */

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

  /**
   * Constructs an object with height and weight info.
   * @returns {{ heightUnit: string; heightOptions: FormSelectOption[]; weightUnit: string; weightOptions: FormSelectOption[] }}
   */
  _getMeasurements() {
    const heightOptions = Object.entries(ds.CONFIG.measurements.height).map(([value, config]) => ({
      value, label: config.label, group: ds.CONFIG.measurements.groups[config.group]?.label,
    }));
    const weightOptions = Object.entries(ds.CONFIG.measurements.weight).map(([value, config]) => ({
      value, label: config.label, group: ds.CONFIG.measurements.groups[config.group]?.label,
    }));

    return {
      heightUnit: ds.CONFIG.measurements.height[this.actor.system.biography.height.units]?.label ?? this.actor.system.biography.height.units,
      heightOptions,
      weightUnit: ds.CONFIG.measurements.weight[this.actor.system.biography.weight.units]?.label ?? this.actor.system.biography.weight.units,
      weightOptions,
    };
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
  static async #gainSurges(event, target) {
    /** @type {HeroTokenModel} */
    const heroTokens = game.actors.heroTokens;

    const spend = await ds.applications.api.DSDialog.confirm({
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

  /* -------------------------------------------------- */

  /**
   * Make a project roll and track the project points
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #rollProject(event, target) {
    const project = this._getEmbeddedDocument(target);
    await project.system.roll();
  }

  /* -------------------------------------------------- */

  /**
   * Take a respite, converting victories to XP and resetting stamina and recoveries to max
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #takeRespite(event, target) {
    await this.actor.system.takeRespite();
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the character's stamina and reducing the number of recoveries
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #spendRecovery(event, target) {
    await this.actor.system.spendRecovery();
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the character's stamina and reducing the number of recoveries
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #spendStaminaHeroToken() {
    await this.actor.system.spendStaminaHeroToken();
  }

  /* -------------------------------------------------- */

  /**
   * Modify the quantity of a piece of equipment.
   * @this DrawSteelCharacterSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #modifyItemQuantity(event, target) {
    const quantityModification = target.dataset.quantityModification;
    const item = this._getEmbeddedDocument(target);
    if (!item) return;

    const quantity = item.system.quantity ?? 0;
    const updatedQuantity = (quantityModification === "increase") ? quantity + 1 : quantity - 1;

    item.update({ "system.quantity": updatedQuantity });
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    // If the item is an equipment and is dropped onto the project tab, create the item as a project instead
    const projectDropTarget = event.target.closest("[data-application-part='projects']");
    if (projectDropTarget && (item.type === "equipment") && (this.actor.uuid !== item.parent?.uuid)) {
      await item.system.createProject(this.actor);
      return;
    }

    // Level up by dropping a class item.
    if (item.type === "class") {
      const cls = this.document.system.class;
      if (cls && (cls.identifier !== item.identifier)) {
        ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.cannotAddNewClass", { localize: true });
        return;
      }
      return this.document.system.advance({ levels: 1, item });
    }

    return super._onDropItem(event, item);
  }
}
