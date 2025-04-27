/**
 * A helper method for constructing an HTML button based on given parameters.
 * @param {object} config
 * @param {string} config.label
 * @param {Record<string, string>} [config.dataset={}]
 * @param {string[]} [config.classes=[]]
 * @param {string} [config.icon=""]
 * @returns {HTMLButtonElement}
 */
export default function constructHTMLButton({ label, dataset = {}, classes = [], icon = "" }) {
  const button = document.createElement("button");

  for (const [key, value] of Object.entries(dataset)) {
    button.dataset[key] = value;
  }
  button.classList.add(...classes);
  if (icon) icon = `<i class="${icon}"></i> `;
  button.innerHTML = `${icon}${label}`;

  return button;
}
