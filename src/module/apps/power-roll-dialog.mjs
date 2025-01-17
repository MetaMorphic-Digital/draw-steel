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
  async _prepareContext(options) {
    const context = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      ...this.options.context
    };

    if (context.targets) await this._prepareTargets(context);

    return context;
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
        banes: Math.clamp(target.modifiers.banes + context.modifiers.banes, 0, PowerRoll.MAX_BANE)
      };
    }
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

    this.render(true);
  }

  /** 
   * Set a final context for resolving the prompt, then close the dialog 
   * @override
   */
  async _onSubmitForm(formConfig, event) {
    const targets = this.options.context.targets;
    if (!targets || (targets.length === 0)) this.promptValue = [this.options.context.modifiers];
    else {
      this.promptValue = targets.reduce((accumulator, target) => {
        accumulator.push({...target.combinedModifiers, target: target.uuid});
        return accumulator;
      }, []);
    }
    
    super._onSubmitForm(formConfig, event);
  }

  /* -------------------------------------------- */

  /**
   * Spawn a PowerRollDialog and wait for it to be rolled or closed.
   * @param {Partial<ApplicationConfiguration>} [options]
   * @returns {Promise<Array<PowerRollDialogPrompt> | null>}      Resolves to the final context to use for one or more power rolls. 
   *                                                              If the dialog was closed without rolling, it resolves to null.
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
