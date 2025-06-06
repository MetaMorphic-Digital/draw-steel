/**
 * A helper method for constructing an HTML button based on given parameters.
 * @param {object} config Options forwarded to the button
 * @param {string} config.label
 * @param {Record<string, string>} [config.dataset={}]
 * @param {string[]} [config.classes=[]]
 * @param {string} [config.icon=""]
 * @param {"button" | "submit"} [config.type="button"]
 * @param {boolean} [config.disabled=false]
 * @returns {HTMLButtonElement}
 */
export default function constructHTMLButton({ label, dataset = {}, classes = [], icon = "", type = "button", disabled = false }) {
  const button = document.createElement("button");
  button.type = type;

  for (const [key, value] of Object.entries(dataset)) {
    button.dataset[key] = value;
  }
  button.classList.add(...classes);
  if (icon) icon = `<i class="${icon}"></i> `;
  if (disabled) button.disabled = true;
  button.innerHTML = `${icon}${label}`;

  return button;
}
