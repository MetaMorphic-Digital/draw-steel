import {barAttribute, requiredInteger} from "./_helpers.mjs";

export default class BaseActorModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const characteristic = {min: -5, max: 5, initial: 0, integer: true};
    const schema = {};

    schema.stamina = barAttribute(20);

    schema.characteristics = new fields.SchemaField(
      CONFIG.DRAW_STEEL.characteristics.reduce((obj, chc) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField(characteristic)
        });
        return obj;
      }, {})
    );

    schema.stats = new fields.SchemaField({
      size: requiredInteger(1),
      weight: requiredInteger(4),
      languages: new fields.SetField(new fields.StringField({blank: true, required: true}))
    });

    schema.biography = new fields.SchemaField({
      value: new fields.HTMLField(),
      gm: new fields.HTMLField()
    });

    schema.movement = new fields.SchemaField({
      walk: new fields.NumberField(),
      burrow: new fields.NumberField(),
      climb: new fields.NumberField(),
      swim: new fields.NumberField(),
      fly: new fields.NumberField(),
      teleport: new fields.NumberField()
    });

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    this.stamina.winded = Math.floor(this.stamina.max / 2);
  }
}
