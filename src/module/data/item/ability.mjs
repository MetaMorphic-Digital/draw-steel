import {DSRoll} from "../../helpers/rolls.mjs";
import BaseItemModel from "./base.mjs";

export default class AbilityModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "ability"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Ability"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = CONFIG.DRAW_STEEL.abilities;

    const requiredChoice = (choices, initial) => ({
      required: true,
      blank: false,
      choices,
      initial
    });

    schema.keywords = new fields.SetField(new fields.StringField({required: true, blank: false, choices: config.keywords}));
    schema.type = new fields.StringField(requiredChoice(config.types, "action"));
    schema.distance = new fields.SchemaField({
      type: new fields.StringField(requiredChoice(config.distances, "self")),
      primary: new fields.NumberField(),
      secondary: new fields.NumberField()
    });
    schema.trigger = new fields.StringField();
    schema.target = new fields.SchemaField({
      type: new fields.StringField(requiredChoice(config.targets, "self")),
      value: new fields.NumberField(),
      all: new fields.BooleanField()
    });

    const powerRollSchema = () => ({
      damage: new fields.SchemaField({
        value: new fields.StringField({validate: DSRoll.validate, validationError: "Must be a valid roll formula"}),
        type: new fields.StringField()
      }),
      ae: new fields.StringField({validate: foundry.data.validators.isValidId}),
      forced: new fields.SchemaField({
        type: new fields.StringField({choices: config.forcedMovement, blank: false}),
        value: new fields.NumberField(),
        vertical: new fields.BooleanField()
      }),
      description: new fields.StringField()
    });

    schema.powerRoll = new fields.SchemaField({
      tier1: new fields.SchemaField(powerRollSchema()),
      tier2: new fields.SchemaField(powerRollSchema()),
      tier3: new fields.SchemaField(powerRollSchema())
    });
    schema.effect = new fields.StringField();
    schema.spend = new fields.NumberField();

    return schema;
  }

  static itemDescription() {
    const description = super.itemDescription();
    description.flavor = new foundry.data.fields.StringField({required: true, blank: true});
    return description;
  }
}
