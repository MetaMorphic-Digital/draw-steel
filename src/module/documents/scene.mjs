/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Scene.documentClass.
 */
export default class DrawSteelScene extends foundry.documents.Scene {
  /** @inheritdoc */
  async _buildEmbedHTML(config, options = {}) {
    // Ignore normal cite and caption logic
    const embed = document.createElement("document-embed");

    const label = config.cite ? this.toAnchor({ name: config.label }) : foundry.utils.parseHTML(`<span>${config.label || this.name}</span>`);

    const viewButton = document.createElement("a");
    viewButton.append(foundry.applications.fields.createFontAwesomeIcon("fa-eye"));
    viewButton.dataset.tooltip = "SCENE.View";
    viewButton.dataset.embedAction = "view";

    const activateButton = document.createElement("a");
    activateButton.append(foundry.applications.fields.createFontAwesomeIcon("fa-bullseye"));
    activateButton.dataset.tooltip = "SCENE.Activate";
    viewButton.dataset.embedAction = "activate";

    if (config.inline || !this.thumb) {
      embed.append(label);
      if (game.user.isGM) embed.append(viewButton, activateButton);
    } else {
      const figure = document.createElement("figure");

      const figCaption = document.createElement("figcaption");
      figCaption.append(label);
      if (game.user.isGM) figCaption.append(viewButton, activateButton);

      const img = document.createElement("img");
      img.src = this.thumb;

      figure.append(figCaption, img);

      embed.append(figure);
    }

    return embed;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  onEmbed(element) {
    element.querySelector("a[data-embed-action=\"view\"]")?.addEventListener("click", () => this.view());
    element.querySelector("a[data-embed-action=\"activate\"]")?.addEventListener("click", () => this.activate());
  }
}
