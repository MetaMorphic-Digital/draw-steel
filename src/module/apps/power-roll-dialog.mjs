import {systemPath} from "../constants.mjs";
import {PowerRoll} from "../rolls/power.mjs";

/** @import {ApplicationConfiguration} from "../../../foundry/client-esm/applications/_types.mjs" */
/** @import {PowerRollDialogPrompt} from "./_types" */

const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;

/**
 * AppV2-based sheet Power Roll modifications
 */
export class PowerRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "power-roll-dialog"],
    position: {
      width: 400
    },
    actions: {
      setRollMode: this.setRollMode
    },
    tag: "form",
    form: {
      closeOnSubmit: true
    }
  };

  /** @override */
  static PARTS = {
    content: {
      template: systemPath("templates/rolls/power-roll-dialog.hbs")
    }
  };

  /**
   * The final prompt value to return to the requester
   * @type {Array<object>}
   */
  promptValue;

  /** @override */
  _initializeApplicationOptions(options) {
    options.context.rollMode = game.settings.get("core", "rollMode");

    return super._initializeApplicationOptions(options);
  }

  /** @override */
  async _prepareContext(options) {
    const context = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      rollModes: CONFIG.Dice.rollModes,
      ...this.options.context
    };

    if (context.type === "ability") await this._prepareAbilityContext(context);

    if (context.targets) await this._prepareTargets(context);

    if (context.skills?.size > 0) this._prepareSkillOptions(context);

    return context;
  }

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
      const effect = context.ability.system.powerRoll[tier].find(effect => (effect.type === "damage") && (effect.types.size > 1));
      if (!effect || context.damageOptions) continue;

      context.damageOptions = Object.entries(ds.CONFIG.damageTypes).filter(([type, data]) => effect.types.has(type)).map(([value, {label}]) => ({value, label}));
      break;
    }
  }

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
        bonuses: target.modifiers.bonuses + context.modifiers.bonuses
      };
    }
  }

  /**
   * Prepare the skill select options
   * @param {object} context The context from _prepareContext
   */
  _prepareSkillOptions(context) {
    const {list, groups} = ds.CONFIG.skills;
    context.skillOptions = Array.from(context.skills).reduce((accumulator, value) => {
      const {label, group} = list[value];
      accumulator.push({label, group: groups[group].label, value});
      return accumulator;
    }, []);
  }

  /**
   * Amend the global modifiers and target specific modifiers based on changed values
   * @override
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    this.options.context.modifiers = foundry.utils.mergeObject(this.options.context.modifiers, formData.modifiers, {overwrite: true, recursive: true});
    if (this.options.context.targets) this.options.context.targets = foundry.utils.mergeObject(this.options.context.targets, formData.targets, {overwrite: true, recursive: true});
    if (formData["damage-selection"]) this.options.context.damage = formData["damage-selection"];

    if ("skill" in formData) {
      const previousSkill = this.options.context.skill ?? "";
      const newSkill = formData.skill;
      if ((previousSkill === "") && (newSkill !== "")) this.options.context.modifiers.bonuses += 2;
      else if ((previousSkill !== "") && (newSkill === "")) this.options.context.modifiers.bonuses -= 2;

      this.options.context.skill = newSkill;
    }

    this.render(true);
  }

  /**
   * Set a final context for resolving the prompt, then close the dialog
   * @override
   */
  async _onSubmitForm(formConfig, event) {
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    const targets = this.options.context.targets;
    if (!targets || (targets.length === 0)) this.promptValue = {rolls: [this.options.context.modifiers]};
    else {
      const rolls = targets.reduce((accumulator, target) => {
        accumulator.push({...target.combinedModifiers, target: target.uuid});
        return accumulator;
      }, []);

      this.promptValue = {rolls};
    }

    if (formData["damage-selection"]) this.promptValue.damage = formData["damage-selection"];
    if (formData.skill) this.promptValue.skill = formData.skill;

    this.promptValue.rollMode = this.options.context.rollMode;

    super._onSubmitForm(formConfig, event);
  }

  /**
  * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static setRollMode(event, target) {
    this.options.context.rollMode = target.dataset.rollMode;
    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Spawn a PowerRollDialog and wait for it to be rolled or closed.
   * @param {Partial<ApplicationConfiguration>} [options]
   * @returns {Promise<PowerRollDialogPrompt | null>}      Resolves to the final context to use for one or more power rolls.
   *                                                       If the dialog was closed without rolling, it resolves to null.
   */
  static async prompt(options) {
    return new Promise((resolve, reject) => {
      const dialog = new this(options);
      dialog.addEventListener("close", event => {
        if (dialog.promptValue) resolve(dialog.promptValue);
        else resolve(null);
      }, {once: true});

      dialog.render({force: true});
    });
  }
}
