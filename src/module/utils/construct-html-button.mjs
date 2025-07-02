/**
 * A helper method for constructing an HTML button based on given parameters.
 * @param {object} config Options forwarded to the button
 * @param {string} [config.label]                             A label for the button
 * @param {Record<string, string>} [config.dataset={}]        Dataset info
 * @param {string[]} [config.classes=[]]                      Classes to apply to the button
 * @param {string} [config.icon=""]                           A FontAwesome icon for the button
 * @param {string} [config.img=""]                            A URL image path. Takes priority over a FA icon.
 * @param {HTMLButtonElement["type"]} [config.type="button"]  Button type
 * @param {boolean} [config.disabled=false]                   Whether to disable the button
 * @returns {HTMLButtonElement}
 */
export default function constructHTMLButton({ label = "", dataset = {}, classes = [], icon = "", img = "", type = "button", disabled = false }) {
  const button = document.createElement("button");
  button.type = type;

  for (const [key, value] of Object.entries(dataset)) {
    button.dataset[key] = value;
  }
  button.classList.add(...classes);
  let image = "";
  if (img) image = `<img src="${img}" alt="${label}">`;
  else if (icon) image = `<i class="${icon}"></i> `;
  if (disabled) button.disabled = true;
  button.innerHTML = `${image}${label}`;

  return button;
}
