import { systemPath } from "../../constants.mjs";
import { AdvancementModel, TreasureModel, KitModel, ProjectModel } from "../../data/item/_module.mjs";
import FillTraitDialog from "../apps/advancement/fill-trait-dialog.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";

/**
 * @import DrawSteelItem from "../../documents/item.mjs";
 * @import { HeroTokenModel } from "../../data/settings/hero-tokens.mjs";
 * @import { ActorSheetItemContext, ActorSheetTreasureContext, ActorSheetComplicationsContext } from "./_types.js";
 */

export default class DrawSteelHeroSheet extends DrawSteelActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["hero"],
    actions: {
      addOrigin: this.#addOrigin,
      levelUp: this.#levelUp,
      gainSurges: this.#gainSurges,
      rollProject: this.#rollProject,
      takeRespite: this.#takeRespite,
      spendRecovery: this.#spendRecovery,
      spendStaminaHeroToken: this.#spendStaminaHeroToken,
      modifyItemQuantity: this.#modifyItemQuantity,
      fillTrait: this.#fillTrait,
    },
    position: {
      // Skills section is visible by default
      height: 680,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/hero-sheet/header.hbs"),
      templates: ["templates/sheets/actor/hero-sheet/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/sheets/actor/hero-sheet/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/sheets/actor/hero-sheet/features.hbs"),
      templates: ["templates/sheets/actor/shared/partials/features/features.hbs"].map(t => systemPath(t)),
      scrollable: [""],
    },
    equipment: {
      template: systemPath("templates/sheets/actor/hero-sheet/equipment.hbs"),
      scrollable: [""],
    },
    projects: {
      template: systemPath("templates/sheets/actor/hero-sheet/projects.hbs"),
      scrollable: [""],
    },
    abilities: {
      template: systemPath("templates/sheets/actor/shared/abilities.hbs"),
      scrollable: [""],
    },
    effects: {
      template: systemPath("templates/sheets/actor/shared/effects.hbs"),
      scrollable: [""],
    },
    biography: {
      template: systemPath("templates/sheets/actor/hero-sheet/biography.hbs"),
      templates: ["languages.hbs", "biography.hbs", "director-notes.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/biography/${t}`)),
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "stats":
        context.unfilledSkill = !!this.actor.system._unfilledTraits.skill?.size;
        context.skills = this._getSkills();
        break;
      case "features":
        context.complications = await this._prepareComplicationsContext();
        break;
      case "equipment":
        context.kits = await this._prepareKitsContext();
        context.kitFields = KitModel.schema.fields;
        context.treasure = await this._prepareTreasureContext();
        context.treasureFields = TreasureModel.schema.fields;
        break;
      case "projects":
        context.projects = await this._prepareProjectsContext();
        context.projectFields = ProjectModel.schema.fields;
        break;
      case "biography":
        context.measurements = this._getMeasurements();
        context.unfilledLanguage = !!this.actor.system._unfilledTraits.language?.size;
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Constructs a string listing the actor's skills.
   * @returns {string}
   */
  _getSkills() {
    const list = this.actor.system.hero.skills.reduce((skills, skill) => {
      skill = ds.CONFIG.skills.list[skill]?.label;
      if (skill) skills.push(skill);
      return skills;
    }, []).sort((a, b) => a.localeCompare(b, game.i18n.lang));
    const formatter = game.i18n.getListFormatter();

    const skillOptions = ds.CONFIG.skills.optgroups;

    for (const skill of this.actor.system.hero.skills) {
      if (!(skill in ds.CONFIG.skills.list)) skillOptions.push({ value: skill });
    }

    return {
      list: formatter.format(list),
      options: skillOptions,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the context for features.
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
   * Prepare the context for treasure categories and individual treasure items.
   */
  async _prepareTreasureContext() {
    /** @type {Record<string, ActorSheetTreasureContext>} */
    const context = {};
    const treasures = this.actor.itemTypes.treasure.toSorted((a, b) => a.sort - b.sort);

    // Prepare ability categories for each ability type
    for (const [category, config] of Object.entries(ds.CONFIG.equipment.categories)) {
      context[category] = {
        label: config.label,
        treasure: [],
        showAdd: this.isEditMode,
        showHeader: this.isEditMode,
      };
    }

    // Adding here instead of the initial context declaration so that the "other" category appears last on the hero sheet
    context["other"] = {
      label: game.i18n.localize("DRAW_STEEL.SHEET.Other"),
      treasure: [],
      showAdd: false,
      // Show "other" if and only if there is treasure of that category
      showHeader: false,
    };

    // Prepare the context for each individual treasure item
    for (const item of treasures) {
      const category = context[item.system.category] ? item.system.category : "other";
      context[category].showHeader = true;
      context[category].treasure.push(await this._prepareItemContext(item));
    }

    // Filter out unused headers for play mode
    if (this.isPlayMode) {
      for (const [key, value] of Object.entries(context)) {
        if (!value.treasure.length) delete context[key];
      }
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the context for complication items.
   */
  async _prepareComplicationsContext() {
    const complications = this.actor.itemTypes.complication.toSorted((a, b) => a.sort - b.sort);

    /** @type {ActorSheetComplicationsContext} */
    const context = {
      label: game.i18n.localize("TYPES.Item.complication"),
      complications: [],
      showAdd: this.isEditMode,
      showHeader: complications.length || this.isEditMode,
    };

    // Prepare the context for each individual complication item
    for (const item of complications) {
      context.complications.push(await this._prepareItemContext(item));
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the context for project items.
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
   * Open a window to add an appropriate hero origin.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #addOrigin(event, target) {
    // TODO: Replace this with opening a compendium browser as part of #130
    switch (target.dataset.type) {
      case "ancestry":
        game.packs.get("draw-steel.origins").render({ force: true });
        break;
      case "culture":
        game.packs.get("draw-steel.origins").render({ force: true });
        break;
      case "career":
        game.packs.get("draw-steel.origins").render({ force: true });
        break;
      case "class":
        game.packs.get("draw-steel.classes").render({ force: true });
        break;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Advance this hero one level.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #levelUp(event, target) {
    await this.actor.system.advance();
  }

  /* -------------------------------------------------- */

  /**
   * Spend a hero token to gain a surge.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
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
   * Make a project roll and track the project points.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollProject(event, target) {
    const project = this._getEmbeddedDocument(target);
    await project.system.roll();
  }

  /* -------------------------------------------------- */

  /**
   * Take a respite, converting victories to XP and resetting stamina and recoveries to max.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #takeRespite(event, target) {
    await this.actor.system.takeRespite();
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the hero's stamina and reducing the number of recoveries.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #spendRecovery(event, target) {
    await this.actor.system.spendRecovery();
  }

  /* -------------------------------------------------- */

  /**
   * Spend a hero token, adding to the hero's stamina and reducing the number of hero tokens.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #spendStaminaHeroToken() {
    await this.actor.system.spendStaminaHeroToken();
  }

  /* -------------------------------------------------- */

  /**
   * Modify the quantity of a piece of treasure.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
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

  /**
   * Prompt the user to fill one or more unchosen languages.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #fillTrait(event, target) {
    const { type } = target.dataset;

    const appOptions = {
      advancements: this.actor.system._unfilledTraits[type].map(uuid => fromUuidSync(uuid, { relative: this.actor })),
    };

    // special name for the language title
    if (type === "language") foundry.utils.setProperty(appOptions, "window.title", "DRAW_STEEL.ADVANCEMENT.FillTrait.languageTitle");

    FillTraitDialog.create(appOptions);
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    // Sort & Permission check first
    if (!this.isEditable) return null;
    if (this.actor.uuid === item.parent?.uuid) {
      const result = await this._onSortItem(event, item);
      return result?.length ? item : null;
    }

    // If the item is a treasure and is dropped onto the project tab, create the item as a project instead
    const projectDropTarget = event.target.closest("[data-application-part='projects']");
    if (projectDropTarget && (item.type === "treasure") && (this.actor.uuid !== item.parent?.uuid)) {
      await item.system.createProject(this.actor);
      return;
    }

    // Level up by dropping a class item.
    if (item.type === "class") {
      const cls = this.actor.system.class;
      if (cls && (cls.dsid !== item.dsid)) {
        const message = game.i18n.format("DRAW_STEEL.ADVANCEMENT.WARNING.cannotAddNewType", {
          type: game.i18n.localize(CONFIG.Item.typeLabels[item.type]),
        });
        ui.notifications.error(message, { console: false });
        throw new Error(message);
      }
      return this.actor.system.advance({ levels: 1, item });
    } else if (item.system instanceof AdvancementModel) {
      if (item.type === "subclass") {
        const cls = this.actor.system.class;
        if (!cls) {
          const message = game.i18n.localize("DRAW_STEEL.Item.subclass.ERRORS.NeedClass");
          ui.notifications.error(message, { console: false });
          throw new Error(message);
        }
        else if (cls.dsid !== item.system.classLink) {
          const message = game.i18n.format("DRAW_STEEL.Item.subclass.ERRORS.WrongDSID", {
            expected: item.system.classLink,
            actual: cls.dsid,
          });
          ui.notifications.error(message, { console: false });
          throw new Error(message);
        }
      }
      // Other advancements
      if (["ancestry", "career", "culture"].includes(item.type)) {
        /** @type {DrawSteelItem} */
        const existing = this.actor.system[item.type];
        if (existing) {
          const confirmation = await existing.advancementDeletionPrompt({ replacement: true });
          if (!confirmation) return;
        }
      }
      return item.system.applyAdvancements({ actor: this.actor, levels: { end: this.actor.system.level } });
    }

    // Fixed default implementation, see https://github.com/foundryvtt/foundryvtt/issues/13166

    const keepId = !this.actor.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { keepId, clearFolder: true });
    const result = await Item.implementation.create(itemData, { parent: this.actor, keepId });
    return result ?? null;
  }

  /** @inheritdoc */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return null;
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== "Item") return null;
    const projectDropTarget = event.target.closest("[data-application-part='projects'");
    const droppedItemData = await Promise.all(
      folder.contents.map(async (/** @type {DrawSteelItem} */ item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);

        // If it's a treasure dropped on the project tab, create the item as a project
        if (projectDropTarget && (item.type === "treasure")) {
          const name = game.i18n.format("DRAW_STEEL.Item.project.Craft.ItemName", { name: item.name });
          return { name, type: "project", "system.yield.item": item.uuid };
        }
        else if (item.supportsAdvancements && (item.getEmbeddedCollection("Advancement").size > 0)) {
          ui.notifications.error("DRAW_STEEL.SHEET.NoCreateAdvancement", { format: { name: item.name } });
          return null;
        }

        const keepId = !this.actor.items.has(item.id);

        return game.items.fromCompendium(item, { keepId, clearFolder: true });
      }),
    );
    await this.actor.createEmbeddedDocuments("Item", droppedItemData.filter(_ => _), { keepId: true });
    return folder;
  }
}
