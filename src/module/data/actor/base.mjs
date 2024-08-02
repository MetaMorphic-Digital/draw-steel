import {barAttribute, damageTypes, requiredInteger} from "../_helpers.mjs";

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

    schema.combat = new fields.SchemaField({
      size: requiredInteger(1),
      weight: requiredInteger(4),
      stability: requiredInteger(0),
      reach: requiredInteger(0)
    });

    schema.biography = new fields.SchemaField({
      value: new fields.HTMLField(),
      gm: new fields.HTMLField(),
      languages: new fields.SetField(new fields.StringField({blank: true, required: true}))
    });

    schema.movement = new fields.SchemaField({
      walk: new fields.NumberField(),
      burrow: new fields.NumberField(),
      climb: new fields.NumberField(),
      swim: new fields.NumberField(),
      fly: new fields.NumberField(),
      teleport: new fields.NumberField()
    });

    schema.damage = new fields.SchemaField({
      immunities: damageTypes(requiredInteger, {all: true, keywords: true}),
      weaknesses: damageTypes(requiredInteger, {all: true, keywords: true})
    });

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    this.stamina.winded = Math.floor(this.stamina.max / 2);
  }

  /**
   * Prompt the user for what types
   * @param {string} characteristic - The characteristic to roll
   * @param {object} [options] - Options to modify the characteristic roll
   * @param {Array<"test" | "resistance" | "ability">} [options.types] - Valid roll types for the characteristic
   * @param {number} [options.edges] - Base edges for the roll
   * @param {number} [options.banes] - Base banes for the roll
   */
  async rollCharacteristic(characteristic, options = {}) {
    const types = options.types ?? ["test", "resistance"];

    let type = types[0];

    if (types.length > 1) {
      const buttons = types.reduce((b, action) => {
        const {label, icon} = PowerRoll.TYPES[action];
        b.push({label, icon, action});
        return b;
      }, []);
      type = await foundry.applications.api.DialogV2.wait({
        window: {title: game.i18n.localize("DRAW_STEEL.Roll.Power.ChooseType.Title")},
        content: game.i18n.localize("DRAW_STEEL.Roll.Power.ChooseType.Content"),
        buttons
      });
    }
    const formula = `2d10 + @${characteristic}`;
    const data = this.parent.getRollData();
    return PowerRoll.prompt({type, formula, data, edges: options.edges, banes: options.banes});
  }
}
