/**
 * @import DrawSteelChatMessage from "../../../documents/chat-message.mjs";
 * @import DSRoll from "../../../rolls/base.mjs";
 */

const { ArrayField, JSONField, StringField } = foundry.data.fields;

/**
 * A nested datamodel for rendering partial chat messages.
 */
export default class MessagePart extends foundry.abstract.DataModel {
  /**
   * Standard click event listeners.
   * @type {Record<string, Function>}
   */
  static ACTIONS = {};

  /* -------------------------------------------------- */

  /**
   * The template used for rendering this part in a chat message.
   * @type {string}
   */
  static TEMPLATE = "";

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      type: new StringField({
        required: true,
        blank: false,
        initial: this.TYPE,
        validate: value => value === this.TYPE,
        validationError: `must be equal to ${this.TYPE}`,
      }),
      rolls: new ArrayField(new JSONField()),
      flavor: new StringField({ required: true }),
    };
  }

  /* -------------------------------------------------- */

  /**
   * The available part subtypes.
   * @type {Record<string, typeof MessagePart>}
   */
  static get TYPES() {
    return this.#TYPES ??= Object.freeze({
      content: ds.data.ChatMessage.parts.ContentPart,
      roll: ds.data.ChatMessage.parts.RollPart,
      test: ds.data.ChatMessage.parts.TestPart,
    });
  }

  /* -------------------------------------------------- */

  /**
   * The available part subtypes.
   * @type {Record<string, typeof MessagePart>|void}
   */
  static #TYPES;

  /* -------------------------------------------------- */

  /**
   * The subtype of this part.
   * @type {string}
   */
  static TYPE = "";

  /* -------------------------------------------------- */

  /**
   * The chat message this is part of.
   * @type {DrawSteelChatMessage}
   */
  get message() {
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Does this part contain dice rolls?
   * @type {boolean}
   */
  get isRoll() {
    return !!this.rolls.length;
  }

  /* -------------------------------------------------- */

  /**
   * Is this part visible to the current user?
   * @type {boolean}
   */
  get visible() {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Modify the context used to render this part.
   * Called by StandardModel#_renderHTML.
   * @param {object} context    The context object (**will be mutated**).
   * @returns {Promise<void>}
   */
  async _prepareContext(context) {
    context.ctx = {};
    context.ctx.rolls = await Promise.all(this.rolls.map(roll => roll.render()));
  }

  /* -------------------------------------------------- */

  /**
   * Apply event listeners to the rendered element.
   * Called by StandardModel#_renderHTML.
   * @param {HTMLElement} element   The rendered part.
   * @param {object} context        The rendering context.
   */
  _addListeners(element, context) {
    const actions = this.constructor.ACTIONS;
    for (const el of element.querySelectorAll("[data-action]")) {
      const action = actions[el.dataset.action];
      if (!action) continue;
      el.addEventListener("click", event => action.call(this, event, el));
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare data of an individual part.
   */
  prepareData() {
    /** @type {DSRoll[]} */
    this.rolls = this.rolls.reduce((rolls, rollData) => {
      try {
        rolls.push(foundry.dice.Roll.fromData(rollData));
      } catch (err) {
        Hooks.onError("MessagePart#rolls", err, { rollData, log: "error" });
      }
      return rolls;
    }, []);
  }
}
