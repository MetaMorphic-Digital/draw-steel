import {systemID, systemPath} from "../../constants.mjs";
import DrawSteelCombatantGroup from "../../documents/combatant-group.mjs";
/** @import { DrawSteelCombatant } from "../../documents/_module.mjs"; */

/**
 * A custom combat tracker that supports Draw Steel's initiative system
 */
export default class DrawSteelCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      rollFirst: this.#rollFirst,
      createGroup: this.#createGroup,
      toggleGroupExpand: this.#toggleGroupExpand,
      activateCombatant: this.#onActivateCombatant
    }
  };

  /** @override */
  static PARTS = {
    /** Inherited */
    header: {
      template: "templates/sidebar/tabs/combat/header.hbs"
    },
    /** Inherited, only used for "alternative" combat */
    tracker: {
      template: "templates/sidebar/tabs/combat/tracker.hbs"
    },
    /** Inherited, only used for "alternative" combats */
    footer: {
      template: "templates/sidebar/tabs/combat/footer.hbs"
    },
    dsHeader: {
      template: systemPath("templates/combat/header.hbs")
    },
    dsTracker: {
      template: systemPath("templates/combat/tracker.hbs"),
      templates: [systemPath("templates/combat/turn.hbs")]
    },
    dsFooter: {
      template: systemPath("templates/combat/footer.hbs")
    }
  };

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /** @override */
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

  /** @override */
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

  /** @override */
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
      const {_expanded, id, name, isOwner, defeated: isDefeated, hidden, disposition, initiative, img} = cg;
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
        active
      };

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
        isDefeated ? "defeated" : null
      ].filterJoin(" ");

      acc.push(turn);

      return acc;
    }, noGroup);

    context.groupTurns.sort(combat._sortCombatants);

    console.log(context.groupTurns);
  }

  /** @override */
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

    return turn;
  }

  /** @override */
  _getEntryContextOptions() {
    const entryOptions = super._getEntryContextOptions();

    if (game.settings.get(systemID, "initiativeMode") === "default") {
      entryOptions.findSplice(e => e.name === "COMBAT.CombatantClear");
      entryOptions.findSplice(e => e.name === "COMBAT.CombatantReroll");
    }

    return entryOptions;
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
    DrawSteelCombatantGroup.createDialog({}, {parent: this.viewed});
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

    this.render({parts: ["dsTracker"]});
  }

  /**
   * Cycle through the combatant's activation status
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #onActivateCombatant(event, target) {
    const {combatantId} = target.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant) return;

    const combat = this.viewed;
    const oldValue = combatant.initiative;
    const newValue = oldValue ? oldValue - 1 : (combatant.actor?.system.combat?.turns ?? 1);

    await combatant.update({initiative: newValue});

    if (oldValue) {
      const newTurn = combat.turns.findIndex((c) => c === combatant);
      combat.update({turn: newTurn}, {direction: 1});
    }
  }
}
