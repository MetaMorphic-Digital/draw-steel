import { systemPath } from "../../constants.mjs";
import PowerRoll from "../../rolls/power.mjs";
import RollDialog from "../api/roll-dialog.mjs";

/** @import DrawSteelToken  from "../../canvas/placeables/token.mjs" */

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
   * The currently highlighted token.
   * @type {DrawSteelToken | null}
   */
  #highlightedToken = null;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === "content") {
      context.modChoices = Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {});

      if (context.type === "ability") await this._prepareAbilityContext(context);

      if (context.targets) await this._prepareTargets(context);

      if (context.skills?.size > 0) this._prepareSkillOptions(context);
    }

    return context;
  }

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    if (context.targets) {
      // Add event listeners to trigger target token hovering.
      this.element.addEventListener("pointermove", event => {
        if (!canvas.ready) return;

        const tokenUuid = event.target.closest(".target.group[data-token-uuid]")?.dataset.tokenUuid;
        const token = this.options.context.targets.find(target => target.tokenUuid === tokenUuid)?.token.object;
        if (token && token._canHover(game.user, event) && token.visible) {
          token._onHoverIn(event, { hoverOutOthers: true });
          this.#highlightedToken = token;
        } else {
          this.#highlightedToken?._onHoverOut(event);
          this.#highlightedToken = null;
        }
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the ability context by generating the ability Item and damageOptions.
   * @param {object} context
   */
  async _prepareAbilityContext(context) {
    context.ability = await fromUuid(context.ability);
    if (!context.ability) return;

    // Find the first instance of multiple damage types and create the options to provide a select
    context.damageOptions = null;
    for (const tier of PowerRoll.TIER_NAMES) {

      const effect = context.ability.system.power.effects.documentsByType.damage.find(e => e.damage[tier].types.size > 1);
      if (!effect) continue;

      context.damageOptions = Object.entries(ds.CONFIG.damageTypes)
        .filter(([type]) => effect.damage[tier].types.has(type))
        .map(([type, { label }]) => ({ value: type, label }));
      break;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare targets by adding the actor and combinging modifiers.
   * @param {object} context The context from _prepareContext.
   */
  async _prepareTargets(context) {
    for (const target of context.targets) {
      if (!target.actor) target.actor = await fromUuid(target.uuid);
      if (!target.token) target.token = await fromUuid(target.tokenUuid);

      target.combinedModifiers = {
        edges: Math.clamp(target.modifiers.edges + context.modifiers.edges, 0, PowerRoll.MAX_EDGE),
        banes: Math.clamp(target.modifiers.banes + context.modifiers.banes, 0, PowerRoll.MAX_BANE),
        bonuses: target.modifiers.bonuses + context.modifiers.bonuses,
      };
    }
  }

  /* -------------------------------------------------- */

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
    context.skillOptions = Array.from(context.skills).reduce((accumulator, value) => {
      const { group } = list[value];
      let { label } = list[value];
      if (value in skillModifiers) {
        const modifiers = [];

        const edges = skillModifiers[value].edges;
        const edgeCategory = pr.select(edges);
        const edgeName = game.i18n.format(`DRAW_STEEL.ROLL.Power.Modifier.Plurals.Edge.${edgeCategory}`);
        if (edges > 0) modifiers.push(game.i18n.format("DRAW_STEEL.ROLL.Power.Modifier.Label", { number: `+${edges}`, mod: edgeName }));

        const banes = skillModifiers[value].banes;
        const baneCategory = pr.select(banes);
        const baneName = game.i18n.format(`DRAW_STEEL.ROLL.Power.Modifier.Plurals.Bane.${baneCategory}`);
        if (banes > 0) modifiers.push(game.i18n.format("DRAW_STEEL.ROLL.Power.Modifier.Label", { number: `+${banes}`, mod: baneName }));

        const formatter = game.i18n.getListFormatter("narrow");
        label += ` (${formatter.format(modifiers)})`;
      }
      accumulator.push({ label: label, group: groups[group].label, value });
      return accumulator;
    }, []);
    return;
  }

  /* -------------------------------------------------- */

  /**
   * Amend the global modifiers and target specific modifiers based on changed values.
   * @inheritdoc
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    this.options.context.modifiers = foundry.utils.mergeObject(this.options.context.modifiers, formData.modifiers, {
      overwrite: true, recursive: true,
    });

    if (this.options.context.targets) {
      this.options.context.targets = foundry.utils.mergeObject(this.options.context.targets, formData.targets, {
        overwrite: true, recursive: true,
      });
    }

    if (formData["damage-selection"]) this.options.context.damage = formData["damage-selection"];

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

    this.render();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    const config = {
      rolls: [],
      damage: null,
      skill: null,
      rollMode: this.options.context.rollMode,
    };

    const targets = this.options.context.targets;
    if (!targets || (targets.length === 0)) config.rolls.push(this.options.context.modifiers);
    else {
      for (const target of targets) {
        config.rolls.push({ ...target.combinedModifiers, target: target.uuid });
      }
    }

    if (formData["damage-selection"]) config.damage = formData["damage-selection"];
    if (formData.skill) config.skill = formData.skill;

    return config;
  }
}
