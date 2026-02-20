import TypedPseudoDocument from "../typed-pseudo-document.mjs";

/**
 * @import DrawSteelChatMessage from "../../../documents/chat-message.mjs";
 * @import DSRoll from "../../../rolls/base.mjs";
 */

const { ArrayField, JSONField, StringField } = foundry.data.fields;

/**
 * A nested datamodel for rendering partial chat messages.
 */
export default class BaseMessagePart extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "MessagePart",
      icon: "fa-solid fa-message",
    };
  }

  /* -------------------------------------------------- */

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
    return Object.assign(super.defineSchema(), {
      rolls: new ArrayField(new JSONField({ validate: BaseMessagePart.#validateRoll })),
      flavor: new StringField({ required: true }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Validate that Rolls belonging to the message part are valid.
   * @param {string} rollJSON     The serialized Roll data.
   */
  static #validateRoll(rollJSON) {
    const roll = JSON.parse(rollJSON);
    if (!roll.evaluated) throw new Error("Roll objects added to message parts must be evaluated");
  }

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

  /** @inheritdoc */
  prepareBaseData() {
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
