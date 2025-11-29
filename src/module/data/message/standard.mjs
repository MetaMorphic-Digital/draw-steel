import { systemPath } from "../../constants.mjs";
import MessagePart from "./parts/base.mjs";

const { ArrayField, TypedSchemaField } = foundry.data.fields;

/**
 * A standard model for chat messages that holds nested models that each individually
 * render a part of the chat message html. This class is responsible for delegating responsibility.
 */
export default class StandardModel extends foundry.abstract.TypeDataModel {
  /**
   * Chat message subtype metadata.
   */
  static metadata = Object.freeze({
    type: "standard",
  });

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      parts: new ArrayField(new TypedSchemaField(MessagePart.TYPES)),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Does this message contain dice rolls?
   * @type {boolean}
   */
  get isRoll() {
    return this.parts.some(part => part.isRoll);
  }

  /* -------------------------------------------------- */

  /**
   * Is this chat message visible?
   * @type {boolean}
   */
  get visible() {
    return this.parts.some(part => part.visible);
  }

  /* -------------------------------------------------- */

  /**
   * Render the HTML for the ChatMessage which should be added to the log.
   * @param {object} [options]              Additional options passed to the Handlebars template.
   * @param {boolean} [options.canDelete]   Render a delete button. By default, this is true for GM users.
   * @param {boolean} [options.canClose]    Render a close button for dismissing chat card notifications.
   * @returns {Promise<HTMLElement>}
   */
  async renderHTML(options = {}) {
    const context = {
      ...options,
      document: this.parent,
      actor: this.parent.speakerActor,
      user: game.user,
      rollData: this.parent.getRollData?.(),
      isWhisper: this.parent.whisper.length,
      whisperTo: this.parent.whisper.map(u => game.users.get(u)?.name).filterJoin(", "),
    };

    const element = this.#renderFrame(options);

    // Always-rendered header element.
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      systemPath("templates/sidebar/chat/parts/header.hbs"), context,
    );
    element.insertAdjacentHTML("beforeend", htmlString);

    // Render subparts.
    for (const [i, part] of this.parts.entries()) {
      if (!part.visible) continue;
      Object.assign(context, { part, index: i });
      await part._prepareContext(context);
      const htmlString = await foundry.applications.handlebars.renderTemplate(part.constructor.TEMPLATE, context);
      const html = foundry.utils.parseHTML(`<section data-message-part="${i}">${htmlString}</section>`);
      part._addListeners(html, context);
      element.insertAdjacentElement("beforeend", html);
    }

    return element;
  }

  /* -------------------------------------------------- */

  /**
   * Render the frame (the LI element) of the chat message.
   * @param {object} options
   * @returns {HTMLLIElement}
   */
  #renderFrame(options) {
    const frame = document.createElement("LI");
    const { blind, id, style, whisper } = this.parent;
    frame.dataset.messageId = id;

    const cssClasses = [
      game.system.id,
      "chat-message",
      "message",
      "flexcol",
      style === CONST.CHAT_MESSAGE_STYLES.IC ? "ic" : null,
      style === CONST.CHAT_MESSAGE_STYLES.EMOTE ? "emote" : null,
      whisper.length ? "whisper" : null,
      blind ? "blind" : null,
    ];
    for (const cssClass of cssClasses) frame.classList.add(cssClass);
    if (options.borderColor) frame.style.setProperty("border-color", options.borderColor);
    return frame;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    for (const part of this.parts) part.prepareData();
  }
}
