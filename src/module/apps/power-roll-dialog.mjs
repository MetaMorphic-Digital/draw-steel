import {systemPath} from "../constants.mjs";
import {PowerRoll} from "../rolls/power.mjs";

/** @import {ApplicationConfiguration} from "../../../foundry/client-esm/applications/_types.mjs" */
/** @import {PowerRollDialogPrompt} from "./_types" */

/**
 * AppV2-based sheet Power Roll modifications
 */
const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;
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

  /** @override */
  async _prepareContext(options) {
    const context = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      ...this.options.context
    };

    if (context.targets) this.combineModifiers(context);

    return context;
  }

  /** 
   * Modify the context object by combining the always applicable modifers and target specific modifiers 
   * @param {object} context The context object provided in _prepareContext
   */
  combineModifiers(context) {
    context.targets.forEach(target => {
      target.combinedModifiers = {
        edges: Math.clamp(target.modifiers.edges + context.modifiers.edges, 0, PowerRoll.MAX_EDGE),
        banes: Math.clamp(target.modifiers.banes + context.modifiers.banes, 0, PowerRoll.MAX_BANE)
      };
    });
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
    if (!targets || (targets.length === 0)) this.finalContext = [this.options.context.modifiers];
    else {
      this.finalContext = targets.reduce((accumlator, target) => {
        accumlator.push({...target.combinedModifiers, actor: target.actor});
        return accumlator;
      }, []);
    }
    
    super._onSubmitForm(formConfig, event);
  }

  /* -------------------------------------------- */

  /**
   * Spawn a PowerRollDialog and wait for it to be rolled or closed.
   * @param {Partial<ApplicationConfiguration>} [options]
   * @returns {Promise<Array<PowerRollDialogPrompt> | null>}                           Resolves to the final context to use for one or more power rolls
   */
  static async prompt(options) {
    return new Promise((resolve, reject) => {
      const dialog = new this(options);
      dialog.addEventListener("close", event => {
        if (dialog.finalContext) resolve(dialog.finalContext);
        else resolve(null);
      }, {once: true});
      
      dialog.render({force: true});
    });
  }
}
