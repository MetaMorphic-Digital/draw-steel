import DocumentInput from "../api/document-input.mjs";
import { systemPath } from "../../constants.mjs";

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
      width: 500,
    },
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
      templates: [
        systemPath("templates/apps/object-sizes/circle.hbs"),
        systemPath("templates/apps/object-sizes/emanation.hbs"),
        systemPath("templates/apps/object-sizes/line.hbs"),
        systemPath("templates/apps/object-sizes/rectangle.hbs"),
        systemPath("templates/apps/object-sizes/ring.hbs"),
      ],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sizeModel = this.document.system.combat.size;
    context.sizeSource = sizeModel._source;

    context.shapeContexts = sizeModel.shapes.map(shape => {
      const fields = { ...shape.schema.fields };
      delete fields.hole;
      const shapeContext = { rootId: this.id };
      foundry.applications.apps.ShapeConfig._prepareShapeContext(shapeContext, shape, fields);
      return shapeContext;
    });

    return context;
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
          type: "token",
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
