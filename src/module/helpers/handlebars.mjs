/**
 * Register all handlebars in Draw Steel
 */
export function registerHandlebars() {
  Handlebars.registerHelper({
    wordBreaker
  });
}

/**
 * Transforms a string by adding appropriate handlebars
 * @param {string} value The original name
 * @returns {string} HTML that must be parsed
 */
function wordBreaker(value) {
  if (value instanceof Handlebars.SafeString) value = value.toString();
  // TODO: Insert foundry's HTML cleaning since this return has to be parsed
  value = value.replaceAll("/", "/&#8203;"); // append a zero-width space to any forward slashes
  return value;
}
