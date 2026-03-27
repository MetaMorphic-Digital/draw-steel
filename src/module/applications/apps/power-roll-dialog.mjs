import PowerRoll from "../../rolls/power.mjs";
import RollDialog from "../api/roll-dialog.mjs";
import { systemPath } from "../../constants.mjs";

const { FormDataExtended } = foundry.applications.ux;

/**
 * A roll dialog for Power Rolls.
 * @see {@link PowerRoll}
 */
export default class PowerRollDialog extends RollDialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["power-roll-dialog"],
    position: {
      width: 400,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/apps/power-roll-dialog.hbs"),
    },
    footer: super.PARTS.footer,
  };

  /* -------------------------------------------------- */

  /**
   * Formatter to select the correct plural form for "Edge".
   * Must be initialized before first use to ensure language is available.
   * @type {Intl.PluralRules | null}
   */
  static EdgePluralFormatter = null;

  /* -------------------------------------------------- */

  /**
   * Cached object for edge and bane options.
   * @type {Record<number, number>}
   */
  static #modChoices = Array.fromRange(3).reduce((obj, number) => {
    obj[number] = number;
    return obj;
  }, {});

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === "content") {
      context.modChoices = PowerRollDialog.#modChoices;
      if (context.skills?.size > 0) this._prepareSkillOptions(context);
    }

    return context;
  }

  /**
   * Prepare the skill select options.
   * @param {object} context The context from _prepareContext.
   */
  _prepareSkillOptions(context) {
    const { list, groups } = ds.CONFIG.skills;
    const skillModifiers = context.skillModifiers;

    if (!this.constructor.EdgePluralFormatter) {
      this.constructor.EdgePluralFormatter = new Intl.PluralRules(game.i18n.lang, { type: "cardinal" });
    }
    const pr = this.constructor.EdgePluralFormatter;

    // If there are skill modifiers, alter the label to include (+1 Edge) or (+2 Edges), etc.
    context.skillOptions = Array.from(context.skills).map(value => {
      const { group } = list[value];
      let { label } = list[value];
      if (value in skillModifiers) {
        const modifiers = [];

        const edges = skillModifiers[value].edges;
        const edgeCategory = pr.select(edges);
        const edgeName = _loc(`DRAW_STEEL.ROLL.Power.Modifier.Plurals.Edge.${edgeCategory}`);
        if (edges > 0) modifiers.push(_loc("DRAW_STEEL.ROLL.Power.Modifier.Label", { number: `+${edges}`, mod: edgeName }));

        const banes = skillModifiers[value].banes;
        const baneCategory = pr.select(banes);
        const baneName = _loc(`DRAW_STEEL.ROLL.Power.Modifier.Plurals.Bane.${baneCategory}`);
        if (banes > 0) modifiers.push(_loc("DRAW_STEEL.ROLL.Power.Modifier.Label", { number: `+${banes}`, mod: baneName }));

        const formatter = game.i18n.getListFormatter("narrow");
        label += ` (${formatter.format(modifiers)})`;
      }
      return { label: label, group: groups[group].label, value };
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    this._refreshInputs(formData);

    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Refresh all inputs based on changed values.
   * @param {Record<string, unknown>} formData
   */
  _refreshInputs(formData) {
    if (this.options.context.modifiers) {
      this.options.context.modifiers = foundry.utils.mergeObject(this.options.context.modifiers, formData.modifiers, {
        overwrite: true, recursive: true,
      });
    }

    if ("skill" in formData) {
      const previousSkill = this.options.context.skill ?? "";
      const newSkill = formData.skill;
      if ((previousSkill === "") && (newSkill !== "")) this.options.context.modifiers.bonuses += 2;
      else if ((previousSkill !== "") && (newSkill === "")) this.options.context.modifiers.bonuses -= 2;

      const skillModifiers = this.options.context.skillModifiers;
      if (previousSkill in skillModifiers) {
        this.options.context.modifiers.edges -= skillModifiers[previousSkill].edges ?? 0;
        this.options.context.modifiers.banes -= skillModifiers[previousSkill].banes ?? 0;
      }

      if (newSkill in skillModifiers) {
        this.options.context.modifiers.edges += skillModifiers[newSkill].edges ?? 0;
        this.options.context.modifiers.banes += skillModifiers[newSkill].banes ?? 0;
      }

      this.options.context.skill = newSkill;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    const config = {
      rolls: [this.options.context.modifiers],
      skill: null,
      messageMode: this.options.context.messageMode,
    };

    if (formData.skill) config.skill = formData.skill;

    return config;
  }
}
