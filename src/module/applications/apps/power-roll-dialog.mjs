import { systemPath } from "../../constants.mjs";
import { PowerRoll } from "../../rolls/power.mjs";
import DSApplication from "../api/application.mjs";

const { FormDataExtended } = foundry.applications.ux;

/**
 * AppV2-based sheet Power Roll modifications
 */
export default class PowerRollDialog extends DSApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["power-roll-dialog"],
    position: {
      width: 400,
    },
    actions: {
      setRollMode: this.#setRollMode,
    },
    context: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/rolls/power-roll-dialog.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options.context ??= {};
    options.context.rollMode = game.settings.get("core", "rollMode");
    return super._initializeApplicationOptions(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      rollModes: CONFIG.Dice.rollModes,
      ...this.options.context,
    };

    if (context.type === "ability") await this._prepareAbilityContext(context);

    if (context.targets) await this._prepareTargets(context);

    if (context.skills?.size > 0) this._prepareSkillOptions(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the ability context by generating the ability Item and damageOptions
   * @param {object} context
   */
  async _prepareAbilityContext(context) {
    context.ability = await fromUuid(context.ability);
    if (!context.ability) return;

    // Find the first instance of multiple damage types and create the options to provide a select
    context.damageOptions = null;
    for (const tier of PowerRoll.TIER_NAMES) {

      const effect = context.ability.system.power.effects.getByType("damage").find(e => e.damage[tier].types.size > 1);
      if (!effect) continue;

      context.damageOptions = Object.entries(ds.CONFIG.damageTypes)
        .filter(([type]) => effect.damage[tier].types.has(type))
        .map(([type, { label }]) => ({ value: type, label }));
      break;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare targets by adding the actor and combinging modifiers
   * @param {object} context The context from _prepareContext
   */
  async _prepareTargets(context) {
    for (const target of context.targets) {
      if (!target.actor) target.actor = await fromUuid(target.uuid);

      target.combinedModifiers = {
        edges: Math.clamp(target.modifiers.edges + context.modifiers.edges, 0, PowerRoll.MAX_EDGE),
        banes: Math.clamp(target.modifiers.banes + context.modifiers.banes, 0, PowerRoll.MAX_BANE),
        bonuses: target.modifiers.bonuses + context.modifiers.bonuses,
      };
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the skill select options
   * @param {object} context The context from _prepareContext
   */
  _prepareSkillOptions(context) {
    const { list, groups } = ds.CONFIG.skills;
    context.skillOptions = Array.from(context.skills).reduce((accumulator, value) => {
      const { label, group } = list[value];
      accumulator.push({ label, group: groups[group].label, value });
      return accumulator;
    }, []);
  }

  /* -------------------------------------------------- */

  /**
   * Amend the global modifiers and target specific modifiers based on changed values
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

  /* -------------------------------------------------- */

  /**
   * Change and store the picked roll mode.
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event    The originating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static #setRollMode(event, target) {
    this.options.context.rollMode = target.dataset.rollMode;
    this.render();
  }
}
