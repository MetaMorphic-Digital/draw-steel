import DSRoll from "./base.mjs";
import { systemPath } from "../constants.mjs";
import PowerRollDialog from "../applications/apps/power-roll-dialog.mjs";
import DrawSteelChatMessage from "../documents/chat-message.mjs";

/** @import { RollPromptOptions, ProjectRollPrompt } from "../_types.js" */

/**
 * Special test used during downtime
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
          flavor: game.i18n.localize(`DRAW_STEEL.ROLL.Power.Modifier.${this.netBoon > 0 ? "Edge" : "Bane"}`),
        });
        this.terms.push(operation, number);
      }

      // Add bonuses to formula
      if (this.options.bonuses !== 0) {
        const operation = new foundry.dice.terms.OperatorTerm({ operator: (this.options.bonuses > 0 ? "+" : "-") });
        const number = new foundry.dice.terms.NumericTerm({
          number: Math.abs(this.options.bonuses),
          flavor: game.i18n.localize("DRAW_STEEL.ROLL.Power.Modifier.Bonuses"),
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
   * Maximum number of edges
   */
  static MAX_EDGE = 2;

  /* -------------------------------------------------- */

  /**
   * Maximum number of banes
   */
  static MAX_BANE = 2;

  /* -------------------------------------------------- */

  /**
   * Prompt the user with a roll configuration dialog
   * @param {Partial<RollPromptOptions>} [options]
   * @returns {Promise<ProjectRollPrompt | null>}
   */
  static async prompt(options = {}) {
    const evaluation = options.evaluation ?? "message";
    const formula = options.formula ?? "2d10";
    if (!["none", "evaluate", "message"].includes(evaluation)) {
      throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    }
    const flavor = options.flavor ?? game.i18n.localize("DRAW_STEEL.ROLL.Project.Label");
    options.modifiers ??= {};
    options.modifiers.edges ??= 0;
    options.modifiers.banes ??= 0;
    options.modifiers.bonuses ??= 0;
    options.skills ??= options.actor?.system.hero?.skills ?? null;

    const context = {
      modifiers: options.modifiers,
      skills: options.skills,
    };

    const promptValue = await PowerRollDialog.create({
      context,
      window: {
        title: "DRAW_STEEL.ROLL.Project.Label",
      },
    });

    if (!promptValue) return null;

    const roll = new this(formula, options.data, { flavor, ...promptValue.rolls[0] });
    const speaker = DrawSteelChatMessage.getSpeaker({ actor: options.actor });

    let projectRoll;
    switch (evaluation) {
      case "none":
        projectRoll = roll;
        break;
      case "evaluate":
        projectRoll = await roll.evaluate();
        break;
      case "message":
        projectRoll = await roll.toMessage({ speaker }, { rollMode: promptValue.rollMode });
        break;
    }

    return { rollMode: promptValue.rollMode, projectRoll };
  }

  /* -------------------------------------------------- */

  /**
   * Determines if this is a power roll with 2d10 base
   * @returns {boolean}
   */
  get isValidProjectRoll() {
    const firstTerm = this.terms[0];
    return (firstTerm instanceof foundry.dice.terms.Die) && (firstTerm.faces === 10) && (firstTerm.number === 2);
  }

  /* -------------------------------------------------- */

  /**
   * Cancels out edges and banes to get the adjustment
   * @returns {number} An integer from -2 to 2, inclusive
   */
  get netBoon() {
    return this.options.edges - this.options.banes;
  }

  /* -------------------------------------------------- */

  /**
   * Total project points accrued from this roll
   * @returns {number | undefined}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return Math.max(1, this.total);
  }

  /* -------------------------------------------------- */

  /**
   * Returns the natural result of the power roll
   * @returns {number | undefined}
   */
  get naturalResult() {
    return this.dice[0].total;
  }

  /* -------------------------------------------------- */

  /**
   * Determines if the natural result was a natural 20
   * @returns {boolean | null} Null if not yet evaluated
   */
  get isNat20() {
    if ((this._total === undefined) || !this.isValidProjectRoll) return null;
    return (this.dice[0].total >= 20);
  }

  /* -------------------------------------------------- */

  /**
   * Determines if a project roll was a critical
   * @returns {boolean | null} Null if not yet evaluated,
   * otherwise returns if the dice total is a 19 or higher
   */
  get isCritical() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }

  /* -------------------------------------------------- */

  /**
   * Semantic alias for this.critical
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
      mod: game.i18n.localize(modString),
    };

    context.critical = (this.isCritical || this.isNat20) ? "critical" : "";

    return context;
  }
}
