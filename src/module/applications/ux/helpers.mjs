/**
 * @typedef ParsedConfig
 * @property {string} _config
 * @property {string[]} values
 */

/**
 * Parse an enricher string into a configuration object.
 * @param {string} match  Matched configuration string.
 * @param {object} [options={}]
 * @param {boolean} [options.multiple=false]  Support splitting configuration by "&" into multiple sub-configurations.
 *                                            If set to `true` then an array of configs will be returned.
 * @returns {ParsedConfig[] | ParsedConfig} Array if Multiple is true, else object.
 */
export function parseConfig(match = "", { multiple = false } = {}) {
  if (multiple) return match.split("&").map(s => parseConfig(s));
  const config = { _config: match, values: [] };
  for (const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) {
    if (!part) continue;
    const [key, value] = part.split("=");
    const valueLower = value?.toLowerCase();
    if (value === undefined) config.values.push(key.replace(/(^"|"$)/g, ""));
    else if (["true", "false"].includes(valueLower)) config[key] = valueLower === "true";
    else if (Number.isNumeric(value)) config[key] = Number(value);
    else config[key] = value.replace(/(^"|"$)/g, "");
  }
  return config;
}

/* -------------------------------------------------- */

/**
 * Create a link.
 * @param {string} label                           Label to display.
 * @param {object} [dataset={}]                    Data that will be added to the link for the rolling method.
 * @param {object} [options={}]
 * @param {boolean} [options.classes="roll-link"]  Class to add to the link.
 * @param {string} [options.tag="a"]               Tag to use for the main link.
 * @param {string} [options.icon]                  An icon to stick at the start of the link.
 * @returns {HTMLElement}
 */
export function createLink(label, dataset = {}, { classes = "roll-link", tag = "a", icon } = {}) {
  const link = document.createElement(tag);
  link.className = classes;
  if (icon) {
    link.insertAdjacentElement("afterbegin", foundry.applications.fields.createFontAwesomeIcon(icon));
  }
  link.append(label.trim());
  addDataset(link, dataset);
  return link;
}

/* -------------------------------------------------- */

/**
 * Add a dataset object to the provided element.
 * @param {HTMLElement} element  Element to modify.
 * @param {object} dataset       Data properties to add.
 * @private
 */
export function addDataset(element, dataset) {
  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith("_") && (key !== "values") && value) element.dataset[key] = value;
  }
}
