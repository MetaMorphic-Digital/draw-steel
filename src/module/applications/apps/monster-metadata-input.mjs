import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for monster metadata
 */
export default class MonsterMetadataInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["monster-metadata"],
    window: {
      title: "DRAW_STEEL.Actor.NPC.MonsterMetadata.DialogTitle",
      icon: "fa-solid fa-spaghetti-monster-flying",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/sheets/document-input/monster-metadata-input.hbs"),
    },
  };

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const monsterConfig = ds.CONFIG.monsters;

    context.monsterKeywords = Object.entries(monsterConfig.keywords).map(([value, { label, group }]) => ({ value, label, group }));

    context.monsterOrganizations = Object.entries(monsterConfig.organizations).map(([value, { label }]) => ({ value, label }));

    context.monsterRoles = Object.entries(monsterConfig.roles).map(([value, { label }]) => ({ value, label }));

    context.monsterFields = this.document.system.schema.getField("monster").fields;

    return context;
  }
}
