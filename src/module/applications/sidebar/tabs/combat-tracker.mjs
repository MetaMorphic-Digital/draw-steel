import { systemID, systemPath } from "../../../constants.mjs";
import { DrawSteelCombatant, DrawSteelCombatantGroup } from "../../../documents/_module.mjs";

/**
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 */

const { ux, sidebar } = foundry.applications;

/**
 * A custom combat tracker that supports Draw Steel's initiative system.
 */
export default class DrawSteelCombatTracker extends sidebar.tabs.CombatTracker {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      rollFirst: this.#rollFirst,
      toggleGroupExpand: this.#toggleGroupExpand,
      activateCombatant: this.#onActivateCombatant,
      activateGroup: this.#onActivateGroup,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    // Inherited
    header: {
      template: "templates/sidebar/tabs/combat/header.hbs",
    },
    // Inherited, only used for "alternative" combat
    tracker: {
      template: "templates/sidebar/tabs/combat/tracker.hbs",
    },
    // Inherited, only used for "alternative" combats
    footer: {
      template: "templates/sidebar/tabs/combat/footer.hbs",
    },
    dsTracker: {
      template: systemPath("templates/sidebar/tabs/combat/tracker.hbs"),
      templates: [systemPath("templates/sidebar/tabs/combat/turn.hbs")],
      scrollable: [""],
    },
    dsFooter: {
      template: systemPath("templates/sidebar/tabs/combat/footer.hbs"),
    },
  };

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    // deep clone of static PARTS
    const parts = super._configureRenderParts(options);

    if (game.combats.isDefaultInitiativeMode) {
      delete parts.tracker;
      delete parts.footer;
    } else {
      delete parts.dsTracker;
      delete parts.dsFooter;
    }

    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "dsFooter":
        await this._prepareCombatContext(context, options);
        break;
      case "dsTracker":
        await this._prepareTrackerContext(context, options);
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareCombatContext(context, options) {
    await super._prepareCombatContext(context, options);

    const combat = this.viewed;

    const numberTurn = Number.isNumeric(combat?.turn);

    const isPlayerTurn = combat?.combatant?.players?.includes(game.user);
    const canControl = numberTurn && combat.canUserModify(game.user, "update", { turn: null });

    context.nullTurn = combat?.combatant && !numberTurn;
    context.canEndTurn = isPlayerTurn && canControl;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);

    if (!game.combats.isDefaultInitiativeMode) return;

    const combat = this.viewed;

    /** @type {Array<Array>} */
    const [noGroup, grouped] = (context.turns ?? []).partition(c => !!c?.group);

    /** @type {Record<string, Array>} */
    const groups = Object.groupBy(grouped, c => c.group.id);

    /** @type {DrawSteelCombatant | undefined} */
    const currentTurn = combat?.turns[combat.turn];

    const invertedDisposition = foundry.utils.invertObject(CONST.TOKEN_DISPOSITIONS);

    context.groupTurns = combat?.groups.reduce((acc, cg) => {
      if (!cg.visible) return acc;

      const { _expanded, id, name, isOwner, defeated: isDefeated, hidden, disposition, initiative, img } = cg;
      const turns = groups[id] ?? [];
      const active = turns.some(t => t.id === currentTurn?.id);

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
        for (const t of turns) {
          /** @type {DrawSteelActor} */
          const actor = this.viewed.combatants.get(t.id)?.actor;
          if (!actor?.isMinion) continue;
          const threshold = foundry.utils.getProperty(actor, "system.stamina.max");
          if (!("threshold" in turn.stamina)) turn.stamina.threshold = threshold;
          else if (turn.stamina.threshold !== threshold) {
            turn.stamina.threshold = null;
            break;
          }
        }
      }

      turn.activateTooltip = cg.initiative ? "Act" : "Restore";

      turn.initiativeCount = cg.initiative > 1 ? cg.initiative : "";

      turn.initiativeSymbol = cg.initiative ? "fa-arrow-right" : "fa-clock-rotate-left";

      const dispositionColor = cg.hasPlayerOwner ? "PARTY" : invertedDisposition[disposition] ?? "OTHER";

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

    context.groupTurns?.sort(combat._sortCombatants);
  }

  /* -------------------------------------------------- */

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

    if (combatant.system.isCaptain) turn.captain = true;

    return turn;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    if (!game.combats.isDefaultInitiativeMode) return;

    // These buttons/methods are inappropriate for default initiative handling
    this.element.querySelector(".encounter-controls.combat .control-buttons.left [data-action=\"rollAll\"]")?.remove();
    this.element.querySelector(".encounter-controls.combat .control-buttons.left [data-action=\"rollNPC\"]")?.remove();
    if (game.user.isGM) {
      const rightControls = this.element.querySelector(".encounter-controls.combat .control-buttons.right");
      if (rightControls) {
        const endCombat = rightControls.querySelector("[data-action=\"endCombat\"]");
        if (!endCombat) {
          rightControls.insertAdjacentElement("beforeend", ds.utils.constructHTMLButton({
            classes: ["inline-control", "combat-control", "icon", "fa-solid", "fa-trash"],
            dataset: {
              action: "endCombat",
              tooltip: "COMBAT.End",
            },
          }));
        }
      }
    }

    new ux.DragDrop.implementation({
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

  /* -------------------------------------------------- */

  /**
   * An event that occurs when a drag workflow begins for a draggable combatant on the combat tracker.
   * @param {DragEvent} event       The initiating drag start event.
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

  /* -------------------------------------------------- */

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   * @protected
   */
  _onDragOver(event) {
    // TODO: Highlight the drop target?
    // console.debug(this, event);
  }

  /* -------------------------------------------------- */

  /**
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDrop(event) {
    // Combat Tracker contains combatant groups, which means this would fire twice
    event.stopPropagation();
    const data = ux.TextEditor.implementation.getDragEventData(event);
    /** @type {DrawSteelCombatant} */
    const combatant = await DrawSteelCombatant.fromDropData(data);
    /** @type {HTMLLIElement | null} */
    const groupLI = event.target.closest(".combatant-group");
    if (groupLI) {
      /** @type {DrawSteelCombatantGroup} */
      const group = this.viewed.groups.get(groupLI.dataset.groupId);
      if ((combatant.actor?.isMinion && (group.type !== "squad"))) {
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._getGroupContextOptions, ".combatant-group", {
      hookName: "getCombatantGroupContextOptions",
      fixed: true,
      parentClassHooks: false,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getEntryContextOptions() {
    const entryOptions = super._getEntryContextOptions();

    if (game.combats.isDefaultInitiativeMode) {
      entryOptions.findSplice(e => e.name === "COMBAT.CombatantClear");
      entryOptions.findSplice(e => e.name === "COMBAT.CombatantReroll");
    }

    // Add captain context menu option.
    const getCombatant = li => this.viewed.combatants.get(li.dataset.combatantId);
    entryOptions.push({
      name: "DRAW_STEEL.Combatant.ToggleCaptain",
      icon: "<i class=\"fa-solid fa-helmet-battle\"></i>",
      condition: li => {
        const combatant = getCombatant(li);
        return game.user.isGM && !combatant.actor?.isMinion && (combatant.group?.type === "squad");
      },
      callback: li => {
        const combatant = getCombatant(li);
        const newCaptain = (!combatant.system.isCaptain) ? combatant.id : null;

        combatant.group.update({ "system.captainId": newCaptain });
      },
    });

    return entryOptions;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getCombatContextOptions() {
    const entryOptions = super._getCombatContextOptions();

    if (game.combats.isDefaultInitiativeMode) {
      entryOptions.findSplice(o => o.name === "COMBAT.RollAll");
      entryOptions.findSplice(o => o.name === "COMBAT.RollNPC");

      entryOptions.unshift({
        name: game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-users-rectangle\"></i>",
        callback: () => DrawSteelCombatantGroup.createDialog({}, { parent: this.viewed }),
      }, {
        name: "COMBAT.InitiativeRoll",
        icon: "<i class=\"fa-solid fa-dice-d10\"></i>",
        callback: () => this.viewed.rollFirst(),
      });

    }

    return entryOptions;
  }

  /* -------------------------------------------------- */

  /**
   * Get the context menu entries for Combatant Groups in the tracker.
   * Only available to game masters.
   * @returns {ContextMenuEntry[]}
   */
  _getGroupContextOptions() {
    /** @type {(li: HTMLElement) => DrawSteelCombatantGroup} */
    const getCombatantGroup = li => this.viewed.groups.get(li.dataset.groupId);
    return [
      {
        name: game.i18n.format("DOCUMENT.Update", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-edit\"></i>",
        condition: li => getCombatantGroup(li).isOwner,
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
        condition: li => {
          const group = getCombatantGroup(li);
          return ((group.type === "squad") && group.isOwner);
        },
        callback: li => {
          const group = getCombatantGroup(li);
          group.update({ "system.staminaValue": group.system.staminaMax });
        },
      },
      {
        name: "COMBAT.ClearMovementHistories",
        icon: "<i class=\"fa-solid fa-shoe-prints\"></i>",
        condition: li => game.user.isGM,
        callback: li => getCombatantGroup(li).clearMovementHistories(),
      },
      {
        name: "DRAW_STEEL.CombatantGroup.ColorTokens.Label",
        icon: "<i class=\"fa-solid fa-palette\"></i>",
        condition: li => getCombatantGroup(li).members.every(c => c.isOwner),
        callback: async li => {

          const content = document.createElement("div");

          const colorInput = foundry.applications.fields.createFormGroup({
            label: "DRAW_STEEL.CombatantGroup.ColorTokens.Input",
            input: foundry.applications.elements.HTMLColorPickerElement.create({
              name: "color",
            }),
            localize: true,
          });

          content.append(colorInput);

          const fd = await ds.applications.api.DSDialog.wait({
            content,
            window: {
              title: "DRAW_STEEL.CombatantGroup.ColorTokens.Title",
              icon: "fa-solid fa-palette",
            },
            buttons: [
              {
                label: "TOKEN.FIELDS.texture.tint.label",
                action: "texture.tint",
                callback: (ev, button, dialog) => {
                  return {
                    fieldPath: button.dataset.action,
                    color: button.form.color.value,
                  };
                },
              },
              {
                label: "TOKEN.FIELDS.ring.colors.ring.label",
                action: "ring.colors.ring",
                callback: (ev, button, dialog) => {
                  return {
                    fieldPath: button.dataset.action,
                    color: button.form.color.value,
                  };
                },
              },
            ],
          });

          if (!fd) return;

          await getCombatantGroup(li).updateTokens(fd.fieldPath, fd.color);
        },
      },
      {
        name: game.i18n.format("DOCUMENT.Delete", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-trash\"></i>",
        condition: li => game.user.isGM,
        callback: li => getCombatantGroup(li).delete(),
      },
      {
        name: "OWNERSHIP.Configure",
        icon: "<i class=\"fa-solid fa-lock\"></i>",
        condition: game.user.isGM,
        callback: li => new foundry.applications.apps.DocumentOwnershipConfig({
          document: getCombatantGroup(li),
          position: {
            top: Math.min(li.offsetTop, window.innerHeight - 350),
            left: window.innerWidth - 720,
          },
        }).render({ force: true }),
      },
      {
        name: "DRAW_STEEL.CombatantGroup.ToggleVisibility",
        icon: "<i class=\"fa-solid fa-eye-slash\"></i>",
        condition: li => game.user.isGM && getCombatantGroup(li).members.size,
        callback: li => {
          const combatantGroup = getCombatantGroup(li);
          const updates = Array.from(combatantGroup.members).map(member => ({ _id: member.id, hidden: !combatantGroup.hidden }));
          combatantGroup.parent.updateEmbeddedDocuments("Combatant", updates);
        },
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

  /* -------------------------------------------------- */

  /**
   * Toggle a Combatant Group.
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #toggleGroupExpand(event, target) {
    // Don't proceed if the click event was actually on one of the combatants
    const entry = event.target.closest("[data-combatant-id]");
    if (entry) return;

    const combat = this.viewed;
    const group = combat.groups.get(target.dataset.groupId);

    group._expanded = !group._expanded;

    // Main sidebar renders are automatically propagated to popouts
    await ui.combat.render({ parts: ["dsTracker"] });
  }

  /* -------------------------------------------------- */

  /**
   * Cycle through the combatant's activation status.
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

  /* -------------------------------------------------- */

  /**
   * Cycle through the combatant group's activation status.
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
