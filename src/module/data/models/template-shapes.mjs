import { requiredInteger } from "../helpers.mjs";

const { NumberField, TypedSchemaField } = foundry.data.fields;

/**
 * Data for a Rectangle that will be placed on the canvas.
 */
export class RectangleTemplateData extends foundry.data.RectangleShapeData {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.object.ObjectSizes");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.count = requiredInteger({ initial: 1, min: 1 });

    // Don't need origin data
    delete schema.x;
    delete schema.y;
    // Always grid-based
    delete schema.gridBased;

    return schema;
  }
}

/* -------------------------------------------------- */

/**
 * Data for a Circle that will be placed on the canvas.
 */
export class CircleTemplateData extends foundry.data.CircleShapeData {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.object.ObjectSizes");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.count = requiredInteger({ initial: 1, min: 1 });

    // Don't need origin data
    delete schema.x;
    delete schema.y;
    // Always grid-based
    delete schema.gridBased;

    return schema;
  }
}

/* -------------------------------------------------- */

/**
 * Data for an Emanation that will be placed on the canvas. This is always based on a Token.
 */
export class EmanationTemplateData extends foundry.data.BaseShapeData {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["SHAPE.TYPES.emanation", "SHAPE.TYPES.base"];

  /* -------------------------------------------------- */

  static {
    Object.defineProperty(this, "TYPE", { value: "emanation" });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.radius = new NumberField({ required: true, nullable: false, min: 0, initial: undefined });

    schema.base = new TypedSchemaField({
      token: TokenTemplateData,
    });

    return schema;
  }
}

/* -------------------------------------------------- */

/**
 * Data for a Cone that will be placed on the canvas.
 */
export class ConeTemplateData extends foundry.data.ConeShapeData {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.object.ObjectSizes");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.count = requiredInteger({ initial: 1, min: 1 });

    // Don't need origin data
    delete schema.x;
    delete schema.y;
    // Always grid-based
    delete schema.gridBased;

    return schema;
  }
}

/* -------------------------------------------------- */

/**
 * Data for a Ring that will be placed on the canvas.
 */
export class RingTemplateData extends foundry.data.RingShapeData {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.object.ObjectSizes");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.count = requiredInteger({ initial: 1, min: 1 });

    // Don't need origin data
    delete schema.x;
    delete schema.y;
    // Always grid-based
    delete schema.gridBased;

    return schema;
  }
}

/* -------------------------------------------------- */

/**
 * Data for a Line that will be placed on the canvas.
 */
export class LineTemplateData extends foundry.data.LineShapeData {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.object.ObjectSizes");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.count = requiredInteger({ initial: 1, min: 1 });

    // Don't need origin data
    delete schema.x;
    delete schema.y;
    // Always grid-based
    delete schema.gridBased;

    return schema;
  }
}

/* -------------------------------------------------- */

/**
 * Valid Draw Steel base shape template types.
 */
export const TEMPLATE_TYPES = {
  rectangle: RectangleTemplateData,
  circle: CircleTemplateData,
  emanation: EmanationTemplateData,
  cone: ConeTemplateData,
  ring: RingTemplateData,
  line: LineTemplateData,
};

/* -------------------------------------------------- */

/**
 * Data for a Token that will be placed on the canvas.
 */
export class TokenTemplateData extends foundry.data.TokenShapeData {
  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // Don't need origin data
    delete schema.x;
    delete schema.y;
    // Grid shape is assumed to be square/match current grid.
    delete schema.shape;

    return schema;
  }
}
