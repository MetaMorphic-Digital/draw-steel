import DocumentInput from "../api/document-input.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * Simple live-updating input for monster metadata.
 */
export default class CompanionMetadataInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["companion-metadata"],
    window: {
      title: "DRAW_STEEL.Actor.companion.CompanionMetadata.DialogTitle",
      icon: "fa-solid fa-spaghetti-monster-flying",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/companion-metadata-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const monsterConfig = ds.CONFIG.monsters;
    context.monsterKeywords = Object.entries(monsterConfig.keywords)
      .map(([value, { label, group }]) => ({ value, label, group }));
    context.monsterRoles = Object.entries(monsterConfig.roles).map(([value, { label }]) => ({ value, label }));
    context.companionFields = this.document.system.schema.getField("companion").fields;

    context.masterOptions = game.actors
      .filter(a => (a.type === "hero") && (a.isOwner || (a === this.document.system.companion.master)))
      .map(a => ({ value: a.id, label: a.name }));

    return context;
  }
}
