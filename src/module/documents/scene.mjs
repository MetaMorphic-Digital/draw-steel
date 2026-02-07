/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Scene.documentClass.
 */
export default class DrawSteelScene extends foundry.documents.Scene {
  /** @inheritdoc */
  async _buildEmbedHTML(config, options = {}) {
    if (!config.hideThumb && this.thumb) {
      const img = document.createElement("img");
      img.src = this.thumb;

      return img;
    }
  }
}
