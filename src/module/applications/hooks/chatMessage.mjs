import DrawSteelChatMessage from "../../documents/chat-message.mjs";

/**
 * A hook event that fires for each ChatMessage which is rendered for addition to the ChatLog.
 * This hook allows for final customization of the message HTML before it is added to the log.
 * // TODO: In v13, adjust the hook call and the second parameter
 * @param {DrawSteelChatMessage} message The ChatMessage document being rendered
 * @param {JQuery<HTMLLIElement>} jquery The pending HTML as a jQuery object
 * @param {Record<string, any>} context
 */
export async function renderChatMessage(message, [html], context) {
  if (message.system.alterMessageHTML instanceof Function) {
    await message.system.alterMessageHTML(html);
  }
  if (message.system.addListeners instanceof Function) {
    await message.system.addListeners(html);
  }
}
