import {systemPath} from "../constants.mjs";
import {PowerRoll} from "../rolls/power.mjs";

/**
 * AppV2-based sheet Power Roll modifications
 */
const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;
export class PowerRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "power-roll-dialog"],
    actions: {
      roll: this.roll
    },
    tag: "form",
    form: {
      submitOnClose: false,
      handler: this._onSubmit
    }
  };

  static PARTS = {
    content: {
      template: systemPath("templates/rolls/dialog.hbs")
    }
  };

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

  /** Amend the global modifiers and target specific modifiers based on changed values
   * @override
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    this.options.context.modifiers = foundry.utils.mergeObject(this.options.context.modifiers, formData.modifiers, {overwrite: true, recursive: true});
    if (this.options.context.targets) this.options.context.targets = foundry.utils.mergeObject(this.options.context.targets, formData.targets, {overwrite: true, recursive: true});

    this.render(true);
  }

  /** Combine the always applicable modifers and target specific modifiers */
  combineModifiers(context) {
    context.targets.forEach(target => {
      target.combinedModifiers = {
        edges: Math.clamp(target.modifiers.edges + context.modifiers.edges, 0, PowerRoll.MAX_EDGE),
        banes: Math.clamp(target.modifiers.banes + context.modifiers.banes, 0, PowerRoll.MAX_BANE)
      };
    });
  }

  /** Set a final context for resolving the prompt, then close the dialog */
  static async roll() {
    const targets = this.options.context.targets;
    if (!targets || (targets.length === 0)) this.finalContext = [this.options.context.modifiers];
    else {
      this.finalContext = targets.reduce((accumlator, target) => {
        accumlator.push({...target.combinedModifiers, actor: target.actor});
        return accumlator;
      }, []);
    }

    this.close();
  }

  /* -------------------------------------------- */

  /**
   * Spawn a PowerRollDialog and wait for it to be rolled or closed.
   * @param {Partial<ApplicationConfiguration>} [options]
   * @returns {Promise<any>}                           Resolves to the final context to use for one or more power rolls
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
