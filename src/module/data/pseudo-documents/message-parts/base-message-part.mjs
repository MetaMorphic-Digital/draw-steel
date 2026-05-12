import TypedPseudoDocument from "../typed-pseudo-document.mjs";

/**
 * @import { DrawSteelActor, DrawSteelChatMessage } from "../../../documents/_module.mjs";
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
  static ACTIONS = {
    selectToken: this.#selectToken,
  };

  /* -------------------------------------------------- */

  /**
   * The template used for rendering this part in a chat message.
   * @type {string}
   */
  static TEMPLATE = "";

  /* -------------------------------------------------- */

  /** @inheritdoc */
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
   * Are inner pieces of this part visible to players?
   * @type {boolean}
   */
  get isContentVisible() {
    const { whisper, isAuthor, blind } = this.message;
    if (whisper?.length) return whisper.includes(game.user.id) || (isAuthor && !blind);
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
    const isPrivate = context.ctx.isPrivate = !this.isContentVisible;
    const name = this.message.author?.name ?? _loc("CHAT.UnknownUser");
    context.ctx.flavor = isPrivate ? _loc("CHAT.PrivateRollContent", { user: foundry.utils.escapeHTML(name) }) : this.flavor;
    context.ctx.rolls = await Promise.all(this.rolls.map(roll => roll.render({ isPrivate })));
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

  /* -------------------------------------------------- */

  /**
   * Select a targeted actor. Only available to Directors.
   *
   * @this BaseMessagePart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static #selectToken(event, target) {
    const { uuid } = target.dataset;

    /** @type {DrawSteelActor} */
    const actor = fromUuidSync(uuid);

    const tokens = actor.getDependentTokens({ scenes: canvas.scene });

    const releaseOthers = !event.shiftKey;

    const newSet = new Set(tokens.map(t => t.object));

    const oldSet = new Set(canvas.tokens.controlled);

    let toRelease;
    if (releaseOthers) toRelease = oldSet.difference(newSet);
    else if (newSet.isSubsetOf(oldSet)) toRelease = newSet;
    if (toRelease?.size) toRelease.forEach(placeable => {
      placeable.release({ renderSidebar: false });
    });

    // Control tokens that were not controlled before
    const toControl = newSet.difference(oldSet);
    toControl.forEach(placeable => placeable.control({ releaseOthers: false, renderSidebar: false }));

    if ((releaseOthers && (toRelease?.size > 0)) || (toControl.size > 0)) {
      ui.placeables.render();
      if (game.activeTool === "select") ui.placeablesPalette?.render();
    }
  }
}
