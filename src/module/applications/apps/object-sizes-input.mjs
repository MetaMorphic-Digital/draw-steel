import DocumentInput from "../api/document-input.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * @import { TEMPLATE_TYPES } from "../../data/models/template-shapes.mjs";
 */

/**
 * Simple live-updating input for object sizes.
 */
export default class ObjectSizesInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["object-sizes"],
    actions: {
      addShape: this.#addShape,
      deleteShape: this.#deleteShape,
      shapeRemoveAll: this.#shapeRemoveAll,
    },
    position: {
      width: 400,
    },
    window: {
      title: "DRAW_STEEL.Actor.object.ObjectSizes.DialogTitle",
      icon: "fa-solid fa-shapes",
      resizable: true,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/object-sizes-input.hbs"),
      templates: [
        systemPath("templates/apps/object-sizes/circle.hbs"),
        systemPath("templates/apps/object-sizes/emanation.hbs"),
        systemPath("templates/apps/object-sizes/line.hbs"),
        systemPath("templates/apps/object-sizes/rectangle.hbs"),
        systemPath("templates/apps/object-sizes/ring.hbs"),
        systemPath("templates/apps/object-sizes/token.hbs"),
      ],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sizeModel = this.document.system.combat.size;
    context.sizeSource = sizeModel._source;

    context.shapeContexts = sizeModel.shapes.map(shape => this._prepareShapeContext(shape));

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Create the dimension field.
   * @param {DataField} field
   * @param {FormInputConfig} inputConfig
   * @returns {HTMLElement[]}
   */
  static #dimensionInput(field, inputConfig) {
    const gridInput = foundry.applications.fields.createNumberInput({
      id: `${inputConfig.rootId}-${field.fieldPath}-grid`, min: 0, step: "any", dataset: { units: "grid" },
      value: inputConfig.value,
    });
    const gridLabel = document.createElement("label");
    gridLabel.setAttribute("for", gridInput.id);
    gridLabel.textContent = _loc("MEASUREMENT.GridUnits");
    return [gridInput, gridLabel];
  }

  /* -------------------------------------------------- */

  /**
   * Puts together rendering context for each shape.
   * @param {InstanceType<TEMPLATE_TYPES[keyof TEMPLATE_TYPES]>} shape
   * @returns {object}
   */
  _prepareShapeContext(shape) {
    const shapeContext = {
      shape,
      rootId: this.id,
      fields: { ...shape.schema.fields },
      source: shape._source,
      gridUnits: _loc("MEASUREMENT.GridUnits"),
      dimensionInput: ObjectSizesInput.#dimensionInput,
    };

    delete shapeContext.fields.hole;

    // Prepare base shape context for emanations
    if (shape.type === "emanation") {
      shapeContext.baseContext = {
        rootId: shapeContext.rootId,
        shape: shape.base,
        fields: shapeContext.fields.base.types[shape.base.type].fields,
        source: shape.base._source,
        gridUnits: shapeContext.gridUnits,
        dimensionInput: shapeContext.dimensionInput,
      };
    }

    return shapeContext;
  }

  /* -------------------------------------------------- */

  /**
   * Add a new shape.
   * @this ObjectSizesInput
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #addShape(event, target) {
    const content = this.element.ownerDocument.createElement("div");

    const { createFormGroup, createSelectInput } = foundry.applications.fields;

    // curated from foundry.data.BaseShapeData.TYPES
    const validShapes = [
      "rectangle",
      "circle",
      "emanation",
      "ring",
      "line",
    ];

    content.append(createFormGroup({
      label: "DRAW_STEEL.Actor.object.ObjectSizes.ShapeType",
      input: createSelectInput({
        options: validShapes.map(key => ({
          value: key,
          label: _loc(`SHAPE.TYPES.${key}.name`),
        })),
        name: "type",
        sort: true,
      }),
      localize: true,
    }));

    const fd = await ds.applications.api.DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.Actor.object.ObjectSizes.AddShape",
        icon: "fa-solid fa-shapes",
      },
    });

    if (!fd) return;

    const objectSize = this.document.system.combat.size;

    const shapeData = {
      type: fd.type,
      x: 0,
      y: 0,
      gridBased: true,
    };

    switch (fd.type) {
      case "rectangle":
        shapeData.width = shapeData.height = 1;
        break;
      case "circle":
        shapeData.radius = 1;
        break;
      case "ellipse":
        shapeData.radiusX = shapeData.radiusY = 1;
        break;
      case "emanation":
        shapeData.radius = 1;
        shapeData.base = {
          x: 0,
          y: 0,
          type: "token",
          shape: CONST.TOKEN_SHAPES.RECTANGLE_1,
          width: objectSize.value,
          height: objectSize.value,
        };
        break;
      case "ring":
        shapeData.radius = shapeData.innerWidth = shapeData.outerWidth = 1;
        break;
      case "line":
        shapeData.length = shapeData.width = 1;
        break;
    }

    await this.document.update({ "system.combat.size.shapes": objectSize._source.shapes.concat(shapeData) });
  }

  /* -------------------------------------------------- */

  /**
   * Delete a shape.
   * @this ObjectSizesInput
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #deleteShape(event, target) {
    const objectSize = this.document.system.combat.size;
    const idx = target.closest("[data-shape-index]").dataset.shapeIndex;
    await this.document.update({ "system.combat.size.shapes": objectSize._source.shapes.toSpliced(idx, 1) });
  }

  /* -------------------------------------------------- */

  /**
   * Delete all shapes.
   * @this ObjectSizesInput
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #shapeRemoveAll(event, target) {
    await this.document.update({ "system.combat.size.shapes": [] });
  }
}
