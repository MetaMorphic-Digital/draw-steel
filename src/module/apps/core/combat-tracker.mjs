import {systemID, systemPath} from "../../constants.mjs";

export default class DrawSteelCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  static DEFAULT_OPTIONS = {
    actions: {
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
    dsTracker: {
      template: systemPath("templates/combat/tracker.hbs")
    },
    dsFooter: {
      template: systemPath("templates/combat/footer.hbs")
    }
  };

  /** @override */
  _configureRenderParts(options) {
    // deep clone of static PARTS
    const parts = super._configureRenderParts(options);

    if (game.settings.get(systemID, "initiativeMode") === "default") {
      delete parts.tracker;
      delete parts.footer;
    } else {
      delete parts.dsTracker;
      delete parts.dsFooter;
    }

    return parts;
  }

  /** @override */
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

  /** @override */
  async _prepareTurnContext(combat, combatant, index) {
    const turn = await super._prepareTurnContext(combat, combatant, index);

    let dispositionColor = " PARTY";
    if (!combatant.hasPlayerOwner) {
      switch (combatant.disposition) {
        case -2:
          dispositionColor = " SECRET";
          break;
        case -1:
          dispositionColor = " HOSTILE";
          break;
        case 0:
          dispositionColor = " NEUTRAL";
          break;
        case 1:
          dispositionColor = " FRIENDLY";
          break;
        default:
          dispositionColor = " OTHER";
      }
    }
    turn.css += dispositionColor;

    return turn;
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
    console.log(this, event, target, combatant);
    const combat = this.viewed;
    const oldValue = combatant.initiative;
    const newValue = oldValue ? oldValue - 1 : (combatant.actor?.system.combat?.turns ?? 1);
    console.log(oldValue, newValue);
    await combatant.update({initiative: newValue});
    if (oldValue) {
      const newTurn = combat.turns.findIndex((c) => c === combatant);
      combat.update({turn: newTurn}, {direction: 1});
    }
  }
}
