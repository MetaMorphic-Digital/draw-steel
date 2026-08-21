import DSRoll from "./base.mjs";
import DrawSteelChatMessage from "../documents/chat-message.mjs";
import PowerRollDialog from "../applications/apps/power-roll-dialog.mjs";
import { systemPath } from "../constants.mjs";

/** @import { RollPromptOptions, ProjectRollPrompt } from "../_types.js" */

/**
 * A special test a hero makes while working on a downtime project during a respite.
 * A project roll doesn’t have any tier outcome.
 * Instead, its total is earned as project points toward completing the project.
 */
export default class ProjectRoll extends DSRoll {
  constructor(formula = "2d10", data = {}, options = {}) {
    super(formula, data, options);
    foundry.utils.mergeObject(this.options, this.constructor.DEFAULT_OPTIONS, {
      insertKeys: true,
      insertValues: true,
      overwrite: false,
    });
    this.options.edges = Math.clamp(this.options.edges, 0, this.constructor.MAX_EDGE);
    this.options.banes = Math.clamp(this.options.banes, 0, this.constructor.MAX_BANE);

    if (!options.appliedModifier) {
      // Add edges/banes to formula
      if (this.netBoon) {
        const operation = new foundry.dice.terms.OperatorTerm({ operator: (this.netBoon > 0 ? "+" : "-") });
        const number = new foundry.dice.terms.NumericTerm({
          number: Math.min(4, 2 * Math.abs(this.netBoon)),
          flavor: _loc(`DRAW_STEEL.ROLL.Power.Modifier.${this.netBoon > 0 ? "Edge" : "Bane"}`),
        });
        this.terms.push(operation, number);
      }

      // Add bonuses to formula
      if (this.options.bonuses !== 0) {
        const operation = new foundry.dice.terms.OperatorTerm({ operator: (this.options.bonuses > 0 ? "+" : "-") });
        const number = new foundry.dice.terms.NumericTerm({
          number: Math.abs(this.options.bonuses),
          flavor: _loc("DRAW_STEEL.ROLL.Power.Modifier.Bonuses"),
        });
        this.terms.push(operation, number);
      }

      this.resetFormula();
      this.options.appliedModifier = true;
    }
  }

  /* -------------------------------------------------- */

  static DEFAULT_OPTIONS = Object.freeze({
    criticalThreshold: 19,
    banes: 0,
    edges: 0,
    bonuses: 0,
  });

  /* -------------------------------------------------- */

  static CHAT_TEMPLATE = systemPath("templates/rolls/project.hbs");

  /* -------------------------------------------------- */

  /**
   * Maximum number of edges.
   */
  static MAX_EDGE = 2;

  /* -------------------------------------------------- */

  /**
   * Maximum number of banes.
   */
  static MAX_BANE = 2;

  /* -------------------------------------------------- */

  /**
   * Determines if this is a power roll with 2d10 base.
   * @returns {boolean}
   */
  get isValidProjectRoll() {
    const firstTerm = this.terms[0];
    return (firstTerm instanceof foundry.dice.terms.Die) && (firstTerm.faces === 10) && (firstTerm.number === 2);
  }

  /* -------------------------------------------------- */

  /**
   * Cancels out edges and banes to get the adjustment.
   * @returns {number} An integer from -2 to 2, inclusive.
   */
  get netBoon() {
    return this.options.edges - this.options.banes;
  }

  /* -------------------------------------------------- */

  /**
   * Total project points accrued from this roll.
   * @returns {number | undefined}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return Math.max(1, this.total);
  }

  /* -------------------------------------------------- */

  /**
   * Returns the natural result of the power roll.
   * @returns {number | undefined}
   */
  get naturalResult() {
    return this.dice[0].total;
  }

  /* -------------------------------------------------- */

  /**
   * Determines if the natural result was a natural 20.
   * @returns {boolean | null} Null if not yet evaluated.
   */
  get isNat20() {
    if ((this._total === undefined) || !this.isValidProjectRoll) return null;
    return (this.dice[0].total >= 20);
  }

  /* -------------------------------------------------- */

  /**
   * Determines if a project roll was a critical.
   * @returns {boolean | null} Null if not yet evaluated,
   * otherwise returns if the dice total is a 19 or higher.
   */
  get isCritical() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }

  /* -------------------------------------------------- */

  /**
   * Semantic alias for this.critical.
   */
  get isBreakthrough() {
    return this.isCritical;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareChatRenderContext({ flavor, isPrivate = false, ...options } = {}) {
    const context = await super._prepareChatRenderContext({ flavor, isPrivate, ...options });

    let modString = "";

    switch (this.netBoon) {
      case -2:
        modString = "DRAW_STEEL.ROLL.Power.Modifier.Banes";
        break;
      case -1:
        modString = "DRAW_STEEL.ROLL.Power.Modifier.Bane";
        break;
      case 1:
        modString = "DRAW_STEEL.ROLL.Power.Modifier.Edge";
        break;
      case 2:
        modString = "DRAW_STEEL.ROLL.Power.Modifier.Edges";
        break;
    }

    context.modifier = {
      number: Math.abs(this.netBoon),
      mod: _loc(modString),
    };

    context.critical = (this.isCritical || this.isNat20) ? "critical" : "";

    return context;
  }
}
