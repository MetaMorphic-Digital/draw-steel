
export default class BaseEffectModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({
    type: "base"
  });

  static defineSchema() {
    const fields = foundry.data.fields;
    const config = CONFIG.DRAW_STEEL;
    return {
      end: new fields.StringField({choices: config.effectEnds, blank: false}),
      characteristic: new fields.StringField({choices: config.characteristics, blank: false})
    };
  }
}
