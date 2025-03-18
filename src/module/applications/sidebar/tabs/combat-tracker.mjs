import { systemID, systemPath } from "../../../constants.mjs";
import { DrawSteelCombatant, DrawSteelCombatantGroup } from "../../../documents/_module.mjs";

/** @import { ContextMenuEntry } from "../../../../foundry/client-esm/applications/ui/context.mjs" */

/**
 * A custom combat tracker that supports Draw Steel's initiative system
 */
export default class DrawSteelCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      rollFirst: this.#rollFirst,
      createGroup: this.#createGroup,
      toggleGroupExpand: this.#toggleGroupExpand,
      activateCombatant: this.#onActivateCombatant,
      activateGroup: this.#onActivateGroup,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    /** Inherited */
    header: {
      template: "templates/sidebar/tabs/combat/header.hbs",
    },
    /** Inherited, only used for "alternative" combat */
    tracker: {
      template: "templates/sidebar/tabs/combat/tracker.hbs",
    },
    /** Inherited, only used for "alternative" combats */
    footer: {
      template: "templates/sidebar/tabs/combat/footer.hbs",
    },
    dsHeader: {
      template: systemPath("templates/combat/header.hbs"),
    },
    dsTracker: {
      template: systemPath("templates/combat/tracker.hbs"),
      templates: [systemPath("templates/combat/turn.hbs")],
    },
    dsFooter: {
      template: systemPath("templates/combat/footer.hbs"),
    },
  };

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    // deep clone of static PARTS
    const parts = super._configureRenderParts(options);

    if (game.settings.get(systemID, "initiativeMode") === "default") {
      delete parts.header;
      delete parts.tracker;
      delete parts.footer;
    } else {
      delete parts.dsHeader;
      delete parts.dsTracker;
      delete parts.dsFooter;
    }

    return parts;
  }

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "dsHeader":
      case "dsFooter":
        await this._prepareCombatContext(context, options);
        break;
      case "dsTracker":
        await this._prepareTrackerContext(context, options);
        break;
    }
    return context;
  }

  /** @inheritdoc */
  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);

    if (game.settings.get(systemID, "initiativeMode") !== "default") return;

    const combat = this.viewed;

    /** @type {Array<Array>} */
    const [noGroup, grouped] = context.turns.partition(c => !!c.group);

    /** @type {Record<string, Array>} */
    const groups = Object.groupBy(grouped, c => c.group.id);

    /** @type {DrawSteelCombatant} */
    const currentTurn = combat.turns[combat.turn];

    context.groupTurns = combat.groups.reduce((acc, cg) => {
      const { _expanded, id, name, isOwner, defeated: isDefeated, hidden, disposition, initiative, img } = cg;
      const turns = groups[id] ?? [];
      const active = turns.some(t => t.id === currentTurn.id);

      const turn = {
        isGroup: true,
        id,
        name,
        isOwner,
        isDefeated,
        hidden,
        disposition,
        initiative,
        turns,
        img,
        active,
      };

      if (cg.type === "squad") {
        turn.stamina = { value: cg.system.staminaValue, max: cg.system.staminaMax };
      }

      turn.activateTooltip = cg.initiative ? "Act" : "Restore";

      turn.initiativeCount = cg.initiative > 1 ? cg.initiative : "";

      turn.initiativeSymbol = cg.initiative ? "fa-arrow-right" : "fa-clock-rotate-left";

      let dispositionColor = "PARTY";

      if (!cg.hasPlayerOwner) {
        const invertedDisposition = foundry.utils.invertObject(CONST.TOKEN_DISPOSITIONS);
        dispositionColor = invertedDisposition[disposition] ?? "OTHER";
      }

      turn.css = [
        dispositionColor,
        _expanded ? "expanded" : null,
        active ? "active" : null,
        hidden ? "hide" : null,
        isDefeated ? "defeated" : null,
      ].filterJoin(" ");

      acc.push(turn);

      return acc;
    }, noGroup);

    context.groupTurns.sort(combat._sortCombatants);
  }

  /** @inheritdoc */
  async _prepareTurnContext(combat, combatant, index) {
    const turn = await super._prepareTurnContext(combat, combatant, index);

    turn.disposition = combatant.disposition;

    let dispositionColor = "PARTY";

    if (!combatant.hasPlayerOwner) {
      const invertedDisposition = foundry.utils.invertObject(CONST.TOKEN_DISPOSITIONS);
      dispositionColor = invertedDisposition[combatant.disposition] ?? "OTHER";
    }
    turn.css += " " + dispositionColor;

    turn.activateTooltip = combatant.initiative ? "Act" : "Restore";

    turn.initiativeCount = combatant.initiative > 1 ? combatant.initiative : "";

    turn.initiativeSymbol = combatant.initiative ? "fa-arrow-right" : "fa-clock-rotate-left";

    turn.group = combatant.group;

    if ((turn.group?.type === "squad") && !combatant.actor?.isMinion) turn.captain = true;

    return turn;
  }

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    if (game.settings.get(systemID, "initiativeMode") !== "default") return;
    new DragDrop({
      dragSelector: ".combatant",
      dropSelector: ".combatant-group, .combat-tracker",
      permissions: {
        dragstart: () => game.user.isGM,
        drop: () => game.user.isGM,
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      },
    }).bind(this.element);
  }

  /**
   * An event that occurs when a drag workflow begins for a draggable combatant on the combat tracker.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDragStart(event) {
    const li = event.currentTarget;
    const combatant = this.viewed.combatants.get(li.dataset.combatantId);
    if (!combatant) return;
    const dragData = combatant.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   * @protected
   */
  _onDragOver(event) {
    // TODO: Highlight the drop target?
    // console.log(this, event);
  }

  /**
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDrop(event) {
    // Combat Tracker contains combatant groups, which means this would fire twice
    event.stopPropagation();
    const data = TextEditor.getDragEventData(event);
    /** @type {DrawSteelCombatant} */
    const combatant = await DrawSteelCombatant.fromDropData(data);
    /** @type {HTMLLIElement | null} */
    const groupLI = event.target.closest(".combatant-group");
    if (groupLI) {
      /** @type {DrawSteelCombatantGroup} */
      const group = this.viewed.groups.get(groupLI.dataset.groupId);
      if (group.system.captain && !combatant.actor?.isMinion) {
        ui.notifications.error("DRAW_STEEL.CombatantGroup.Error.SquadOneCaptain", { localize: true });
      }
      else if ((combatant.actor?.isMinion && (group.type !== "squad"))) {
        ui.notifications.error("DRAW_STEEL.CombatantGroup.Error.MinionMustSquad", { localize: true });
      }
      else {
        combatant.update({ group });
      }
    }
    else {
      combatant.update({ group: null });
    }
  }

  /** @inheritdoc */
  _attachFrameListeners() {
    super._attachFrameListeners();

    // TODO: Revise in 13.338
    if (game.user.isGM) foundry.applications.ui.ContextMenu.create(this, this.element, ".combatant-group", { jQuery: false, hookName: "GroupContext", fixed: true });
  }

  /** @inheritdoc */
  _getEntryContextOptions() {
    const entryOptions = super._getEntryContextOptions();

    if (game.settings.get(systemID, "initiativeMode") === "default") {
      entryOptions.findSplice(e => e.name === "COMBAT.CombatantClear");
      entryOptions.findSplice(e => e.name === "COMBAT.CombatantReroll");
    }

    return entryOptions;
  }

  /**
   * Get the context menu entries for Combatant Groups in the tracker.
   * @returns {ContextMenuEntry[]}
   */
  _getGroupContextOptions() {
    const getCombatantGroup = li => this.viewed.groups.get(li.dataset.groupId);
    return [
      {
        name: game.i18n.format("DOCUMENT.Update", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-edit\"></i>",
        callback: li => getCombatantGroup(li)?.sheet.render({
          force: true,
          position: {
            top: Math.min(li.offsetTop, window.innerHeight - 350),
            left: window.innerWidth - 720,
          },
        }),
      },
      {
        name: "DRAW_STEEL.CombatantGroup.ResetSquadHP",
        icon: "<i class=\"fa-solid fa-rotate\"></i>",
        condition: li => getCombatantGroup(li).type === "squad",
        callback: li => {
          /** @type {DrawSteelCombatantGroup} */
          const group = getCombatantGroup(li);
          group.update({ "system.staminaValue": group.system.staminaMax });
        },
      },
      {
        name: game.i18n.format("DOCUMENT.Delete", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-trash\"></i>",
        callback: li => getCombatantGroup(li).delete(),
      },
    ];
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Roll to determine who will go first.
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #rollFirst(event, target) {
    this.viewed.rollFirst();
  }

  /**
   * Create a Combatant Group
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #createGroup(event, target) {
    DrawSteelCombatantGroup.createDialog({}, { parent: this.viewed });
  }

  /**
   * Toggle a Combatant Group
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #toggleGroupExpand(event, target) {
    const combat = this.viewed;
    const group = combat.groups.get(target.dataset.groupId);

    group._expanded = !group._expanded;

    this.render({ parts: ["dsTracker"] });
  }

  /**
   * Cycle through the combatant's activation status
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #onActivateCombatant(event, target) {
    const { combatantId } = target.closest("[data-combatant-id]")?.dataset ?? {};
    const combat = this.viewed;

    if (!combat) return;

    /** @type {DrawSteelCombatant} */
    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;

    const oldValue = combatant.initiative;
    const newValue = oldValue ? oldValue - 1 : (combatant.actor?.system.combat?.turns ?? 1);

    await combatant.update({ initiative: newValue });

    if (oldValue) {
      const newTurn = combat.turns.findIndex((c) => c === combatant);
      combat.update({ turn: newTurn }, { direction: 1 });
    }
  }

  /**
   * Cycle through the combatant group's activation status
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #onActivateGroup(event, target) {
    const { groupId } = target.closest("[data-group-id]")?.dataset ?? {};

    /** @type {DrawSteelCombatantGroup} */
    const group = this.viewed?.groups.get(groupId);
    if (!group) return;

    const oldValue = group.initiative;
    const newValue = oldValue ? oldValue - 1 : 1;

    if (oldValue) group._expanded = true;

    await group.update({ initiative: newValue });

  }
}
