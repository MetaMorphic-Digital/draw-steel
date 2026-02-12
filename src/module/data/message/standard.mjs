import { systemPath } from "../../constants.mjs";
import DrawSteelSystemModel from "../system-model.mjs";

/**
 * @import { SubtypeMetadata } from "../_types"
 */

/**
 * A standard model for chat messages that holds nested models that each individually
 * render a part of the chat message html. This class is responsible for delegating responsibility.
 */
export default class StandardModel extends DrawSteelSystemModel {
  /**
   * Key information about this ChatMessage subtype.
   * @type {SubtypeMetadata}
   */
  static get metadata() {
    return {
      type: "standard",
      embedded: {
        MessagePart: "system.parts",
      },
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      parts: new ds.data.fields.CollectionField(ds.data.pseudoDocuments.messageParts.BaseMessagePart),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(data) {
    // Passing an array of parts is always valid, this migration will automatically translate that to the proper object format
    if (Array.isArray(data.parts)) {
      data.parts = data.parts.reduce((record, part) => {
        const _id = foundry.utils.randomID();
        record[_id] = { _id, ...part };
        return record;
      }, {});
    }

    return super.migrateData(data);
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

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    /**
     * An array of new roll indices per part.
     * @type {Record<string, number[]>}
     */
    const newRolls = options.ds?.dsn;

    // Dice so Nice integration
    if (game.dice3d && newRolls && (userId === game.userId)) {
      for (const [partId, rollIndices] of Object.entries(newRolls)) {
        const part = this.parts.get(partId);

        for (const i of rollIndices) {
          const roll = part.rolls[i];
          if (!roll.isDeterministic) ds.compatibility.dsn.playRoll(roll, this.parent);
        }
      }
    }
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
    for (const part of this.parts.sortedContents) {
      if (!part.visible) continue;
      Object.assign(context, { part });
      await part._prepareContext(context);
      const htmlString = await foundry.applications.handlebars.renderTemplate(part.constructor.TEMPLATE, context);
      const html = foundry.utils.parseHTML(`<section data-message-part="${part.id}">${htmlString}</section>`);
      part._addListeners(html, context);
      part._onRender(html, context);
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
    for (const cssClass of cssClasses) if (cssClass) frame.classList.add(cssClass);
    if (options.borderColor) frame.style.setProperty("border-color", options.borderColor);
    return frame;
  }
}
