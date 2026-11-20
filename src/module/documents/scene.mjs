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
    const isDesignated = (doc, action) => game.users.getDesignatedUser(user => user.active && doc.canUserModify(user, action))?.isSelf;
    const operations = [];

    if ((collection === "regions") && !options.ds?.areaEffect) {
      const deleted = new Set(documents.map(region => region.uuid));
      const trackers = new Set(documents.flatMap(region => {
        const source = fromUuidSync(region.getFlag(systemID, "abilitySource") ?? "");
        return source?.actor?.effects.filter(e => e.system.area?.regions.has(region.uuid)) ?? [];
      }));
      for (const effect of trackers) {
        if (!isDesignated(effect, "update")) continue;
        const remaining = effect.system.area.regions.difference(deleted);
        operations.push(remaining.size
          ? { action: "update", documentName: "ActiveEffect", parent: effect.parent, updates: [{ _id: effect.id, "system.area.regions": Array.from(remaining) }] }
          : { action: "delete", documentName: "ActiveEffect", parent: effect.parent, ids: [effect.id] });
      }
    }

    // An unlinked token takes its effects with it without deleting them, so its tracked regions are deleted here
    if (collection === "tokens") {
      const regions = documents.filter(token => !token.actorLink)
        .flatMap(token => token.actor?.effects.contents.flatMap(effect => Array.from(effect.system.area?.regions ?? [])) ?? [])
        .map(uuid => fromUuidSync(uuid))
        .filter(region => region && isDesignated(region, "delete"));
      for (const group of Object.values(Object.groupBy(regions, region => region.parent.id))) {
        operations.push({ action: "delete", documentName: "Region", parent: group[0].parent, ids: group.map(r => r.id), ds: { areaEffect: true } });
      }
    }

    if (operations.length) foundry.documents.modifyBatch(operations);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  onEmbed(element) {
    element.querySelector("a[data-embed-action=\"view\"]")?.addEventListener("click", () => this.view());
    element.querySelector("a[data-embed-action=\"activate\"]")?.addEventListener("click", () => this.activate());
  }
}
