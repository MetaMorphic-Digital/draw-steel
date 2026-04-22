import DocumentInput from "../api/document-input.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * Simple live-updating input for object sizes.
 */
export default class ObjectSizesInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["object-sizes"],
    window: {
      title: "DRAW_STEEL.Actor.object.ObjectSizes.DialogTitle",
      icon: "fa-solid fa-shapes",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/object-sizes-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.sizeSource = this.document.system.combat.size._source;

    if ((context.sizeSource.shapes.length === 1) && !context.sizeSource.shapes[0].hole) {
      const shape = context.sizeSource.shapes[0];
      const fields = { ...shape.schema.fields };
      delete fields.hole;
      context.shapeContext = { rootId: this.id };
      foundry.applications.apps.ShapeConfig._prepareShapeContext(context.shapeContext, shape, fields);
    }
    return context;
  }
}
