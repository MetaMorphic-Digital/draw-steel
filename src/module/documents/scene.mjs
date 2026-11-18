import { systemID } from "../constants.mjs";

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Scene.documentClass.
 */
export default class DrawSteelScene extends foundry.documents.Scene {
  /** @inheritdoc */
  async _buildEmbedHTML(config, options = {}) {
    // Ignore normal cite and caption logic
    const embed = document.createElement("document-embed");
    embed.classList.add("scene-embed");

    const label = config.cite ? this.toAnchor({ name: config.label }) : foundry.utils.parseHTML(`<span>${config.label || this.name}</span>`);

    const viewButton = document.createElement("a");
    viewButton.append(foundry.applications.fields.createFontAwesomeIcon("fa-eye"));
    viewButton.dataset.tooltip = "SCENE.View";
    viewButton.dataset.embedAction = "view";

    const activateButton = document.createElement("a");
    activateButton.append(foundry.applications.fields.createFontAwesomeIcon("fa-bullseye"));
    activateButton.dataset.tooltip = "SCENE.Activate";
    activateButton.dataset.embedAction = "activate";

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
  _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    const user = game.users.get(userId);
    const isDesignated = (doc, action) => ((user?.active && doc.canUserModify(user, action)) ? user : game.users.activeGM)?.isSelf;

    // A deleted region ends the effects tracking it
    if ((collection === "regions") && !options.ds?.areaEffect) {
      for (const region of documents) {
        const source = fromUuidSync(region.getFlag(systemID, "abilitySource") ?? "");
        const trackers = source?.actor?.effects.filter(e => e.system.area?.regions.has(region.uuid)) ?? [];
        for (const effect of trackers) {
          if (!isDesignated(effect, "update")) continue;
          const remaining = effect.system.area.regions.difference(new Set([region.uuid]));
          if (remaining.size) effect.update({ "system.area.regions": Array.from(remaining) });
          else effect.delete();
        }
      }
    }

    // An unlinked token takes its effects with it without deleting them, so its tracked regions are deleted here
    if (collection === "tokens") {
      for (const token of documents) {
        if (token.actorLink) continue;
        for (const effect of token.actor?.effects ?? []) {
          for (const uuid of effect.system.area?.regions ?? []) {
            const region = fromUuidSync(uuid);
            if (region && isDesignated(region, "delete")) region.delete({ ds: { areaEffect: true } });
          }
        }
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  onEmbed(element) {
    element.querySelector("a[data-embed-action=\"view\"]")?.addEventListener("click", () => this.view());
    element.querySelector("a[data-embed-action=\"activate\"]")?.addEventListener("click", () => this.activate());
  }
}
