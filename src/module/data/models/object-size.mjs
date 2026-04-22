import SizeModel from "./size.mjs";
import { systemID } from "../../constants.mjs";

const fields = foundry.data.fields;

/**
 * A data model to represent the size of an object in Draw Steel.
 */
export default class ObjectSizeModel extends SizeModel {
  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    Object.assign(schema, {
      text: new fields.StringField({ required: true }),
      direction: new fields.StringField({ required: true }),
      typical: new fields.StringField({ required: true }),
      shapes: new fields.ShapesField(),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Placeholder value for the text input.
   * @type {string}
   */
  get textPlaceholder() {
    return super.toString();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return this.text || super.toString();
  }

  /* -------------------------------------------------- */

  /**
   * Create a region based on this object's shapes data.
   * @param {RegionPlacementOptions} [options={}] Options to forward to canvas.regions.placeRegion.
   * @returns {Promise<RegionDocument>} The Region document that was placed or null if
   *  - the placements of all shapes were skipped,
   *  - the dismiss key was pressed,
   *  - the game is paused and the user is not a GM, or
   *  - the Region creation was rejected by preCreate.
   */
  placeArea(options = {}) {
    const object = this.parent.parent;

    const data = {
      shapes: this.shapes,
      name: object.name,
      color: game.user.color,
      levels: [canvas.level.id],
      highlightMode: "coverage",
      displayMeasurements: true,
      visibility: CONST.REGION_VISIBILITY.OBSERVER,
      ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
      flags: {
        [systemID]: {
          objectSource: object.uuid,
        },
      },
    };

    return canvas.regions.placeRegion(data, options);
  }
}
