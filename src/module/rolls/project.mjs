import {DSRoll} from "./base.mjs";
import {systemPath} from "../constants.mjs";

/**
 * Special test used during downtime
 */
export class ProjectRoll extends DSRoll {
  constructor(formula = "2d10", data = {}, options = {}) {
    super(formula, data, options);
    foundry.utils.mergeObject(this.options, this.constructor.DEFAULT_OPTIONS, {
      insertKeys: true,
      insertValues: true,
      overwrite: false
    });
    this.options.edges = Math.clamp(this.options.edges, 0, this.constructor.MAX_EDGE);
    this.options.banes = Math.clamp(this.options.banes, 0, this.constructor.MAX_BANE);

    if (!options.appliedModifier) {
      // Add edges/banes to formula
      if (this.netBoon) {
        const operation = new foundry.dice.terms.OperatorTerm({operator: (this.netBoon > 0 ? "+" : "-")});
        const number = new foundry.dice.terms.NumericTerm({
          number: Math.min(4, 2 * Math.abs(this.netBoon)),
          flavor: game.i18n.localize(`DRAW_STEEL.Roll.Power.Modifier.${this.netBoon > 0 ? "Edge" : "Bane"}`)
        });
        this.terms.push(operation, number);
      }

      // Add bonuses to formula
      if (this.options.bonuses !== 0) {
        const operation = new foundry.dice.terms.OperatorTerm({operator: (this.options.bonuses > 0 ? "+" : "-")});
        const number = new foundry.dice.terms.NumericTerm({
          number: Math.abs(this.options.bonuses),
          flavor: game.i18n.localize("DRAW_STEEL.Roll.Power.Modifier.Bonuses")
        });
        this.terms.push(operation, number);
      }

      this.resetFormula();
      this.options.appliedModifier = true;
    }
  }

  static DEFAULT_OPTIONS = Object.freeze({
    criticalThreshold: 19,
    banes: 0,
    edges: 0,
    bonuses: 0
  });

  static CHAT_TEMPLATE = systemPath("templates/rolls/project.hbs");

  /**
   * Maximum number of edges
   */
  static MAX_EDGE = 2;

  /**
   * Maximum number of banes
   */
  static MAX_BANE = 2;

  /**
   * Prompt the user with a roll configuration dialog
   * @param {object} [options] Options for the dialog
   * @param {"none"|"evaluate"|"message"} [options.evaluation="message"] How will the roll be evaluated and returned?
   * @param {number} [options.edges]                  Base edges for the roll
   * @param {number} [options.banes]                  Base banes for the roll
   * @param {string} [options.formula="2d10"]         Roll formula
   * @param {Record<string, unknown>} [options.data]  Roll data to be parsed by the formula
   * @param {string[]} [options.skills]               An array of skills that might be chosen
   */
  static async prompt(options = {}) {
    const evaluation = options.evaluation ?? "message";
    const formula = options.formula ?? "2d10";
    if (!["none", "evaluate", "message"].includes(evaluation)) {
      throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    }
    const flavor = options.flavor ?? game.i18n.localize("DRAW_STEEL.Roll.Project.Label");

    const dialogContext = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      bane: options.banes ?? 0,
      edges: options.edges ?? 0
    };

    if (options.skills) {
      dialogContext.skills = options.skills.reduce((obj, skill) => {
        const label = ds.CONFIG.skills.list[skill]?.label;
        if (!label) {
          console.warn("Could not find skill" + skill);
          return obj;
        }
        obj[skill] = label;
        return obj;
      }, {});
    }

    const content = await renderTemplate(systemPath("templates/rolls/prompt.hbs"), dialogContext);

    const rollContext = await foundry.applications.api.DialogV2.prompt({
      window: {title: "DRAW_STEEL.Roll.Project.Label"},
      content,
      ok: {
        callback: (event, button, dialog) => {
          const output = Array.from(button.form.elements).reduce((obj, input) => {
            if (input.name) obj[input.name] = input.value;
            return obj;
          }, {});

          return output;
        }
      },
      rejectClose: true
    });

    const roll = new this(formula, options.data, {flavor, ...rollContext});

    switch (evaluation) {
      case "none":
        return roll;
      case "evaluate":
        return roll.evaluate();
      case "message":
        return roll.toMessage();
    }
  }

  /**
   * Determines if this is a power roll with 2d10 base
   * @returns {boolean}
   */
  get isValidProjectRoll() {
    const firstTerm = this.terms[0];
    return (firstTerm instanceof foundry.dice.terms.Die) && (firstTerm.faces === 10) && (firstTerm.number === 2);
  }

  /**
   * Cancels out edges and banes to get the adjustment
   * @returns {number} An integer from -2 to 2, inclusive
   */
  get netBoon() {
    return this.options.edges - this.options.banes;
  }

  /**
   * Total project progress accrued from this roll
   * @returns {number | undefined}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return Math.max(1, this.total);
  }

  /**
   * Returns the natural result of the power roll
   * @returns {number | undefined}
   */
  get naturalResult() {
    return this.dice[0].total;
  }

  /**
   * Determines if the natural result was a natural 20
   * @returns {boolean | null} Null if not yet evaluated
   */
  get isNat20() {
    if ((this._total === undefined) || !this.isValidProjectRoll) return null;
    return (this.dice[0].total >= 20);
  }

  /**
   * Determines if a project roll was a critical
   * @returns {boolean | null} Null if not yet evaluated,
   * otherwise returns if the dice total is a 19 or higher
   */
  get isCritical() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }

  /**
   * Semantic alias for this.critical
   */
  get isBreakthrough() {
    return this.isCritical;
  }

  async _prepareContext({flavor, isPrivate}) {
    const context = await super._prepareContext({flavor, isPrivate});

    let modString = "";

    switch (this.netBoon) {
      case -2:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Banes";
        break;
      case -1:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Bane";
        break;
      case 1:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Edge";
        break;
      case 2:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Edges";
        break;
    }

    context.modifier = {
      number: Math.abs(this.netBoon),
      mod: game.i18n.localize(modString)
    };

    context.critical = (this.isCritical || this.isNat20) ? "critical" : "";

    return context;
  }
}
