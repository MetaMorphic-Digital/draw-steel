import { TEMPLATE_TYPES } from "../models/template-shapes.mjs";

/**
 * @import {ArrayFieldOptions, DataFieldContext} from "@common/data/_types.mjs";
 */

/**
 * A subclass of {@link foundry.data.fields.ArrayField} for template shapes.
 */
export default class TemplateShapesField extends foundry.data.fields.ArrayField {
  /**
   * @param {ArrayFieldOptions} [options]  Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]   Additional context which describes the field.
   */
  constructor(options, context) {
    super(new foundry.data.fields.TypedSchemaField(TEMPLATE_TYPES), options, context);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    if (!value) return value;
    return value.map((v, i) => {
      const shape = this.element.initialize(v, model, options);
      shape._index = i;
      return shape;
    });
  }
}
