import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for object metadata.
 */
export default class ObjectMetadataInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["object-metadata"],
    window: {
      title: "DRAW_STEEL.Actor.object.ObjectMetadata.DialogTitle",
      icon: "fa-solid fa-wagon-covered",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/object-metadata-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const objectConfig = ds.CONFIG.objects;
    context.objectCategories = Object.entries(objectConfig.categories).map(([value, { label }]) =>
      ({ value, label }),
    );
    context.objectRoles = Object.entries(objectConfig.roles).map(([value, { label }]) => ({ value, label }));
    context.objectFields = this.document.system.schema.getField("object").fields;
    return context;
  }
}
