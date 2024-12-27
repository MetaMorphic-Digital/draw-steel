import {barAttribute, damageTypes, requiredInteger, SizeModel} from "../helpers.mjs";
const fields = foundry.data.fields;

/**
 * A base actor model that provides common properties for both characters and npcs
 */
export default class BaseActorModel extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    const characteristic = {min: -5, max: 5, initial: 0, integer: true};
    const schema = {};

    schema.stamina = barAttribute(20);

    schema.characteristics = new fields.SchemaField(
      Object.entries(ds.CONFIG.characteristics).reduce((obj, [chc, {label, hint}]) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField({...characteristic, label, hint})
        });
        return obj;
      }, {})
    );

    schema.combat = new fields.SchemaField({
      size: new fields.EmbeddedDataField(SizeModel),
      stability: requiredInteger({initial: 0})
    });

    schema.biography = new fields.SchemaField(this.actorBiography());

    schema.movement = new fields.SchemaField({
      walk: new fields.NumberField({integer: true, min: 0, initial: 5}),
      burrow: new fields.NumberField({integer: true, min: 0}),
      climb: new fields.NumberField({integer: true, min: 0}),
      swim: new fields.NumberField({integer: true, min: 0}),
      fly: new fields.NumberField({integer: true, min: 0}),
      teleport: new fields.NumberField({integer: true, min: 0})
    });

    schema.damage = new fields.SchemaField({
      immunities: damageTypes(requiredInteger, {all: true, keywords: true}),
      weaknesses: damageTypes(requiredInteger, {all: true, keywords: true})
    });

    return schema;
  }

  /**
   * Helper function to fill in the `biography` property
   * @protected
   * @returns {Record<string, fields["DataField"]}
   */
  static actorBiography() {
    return {
      value: new fields.HTMLField(),
      gm: new fields.HTMLField(),
      languages: new fields.SetField(new fields.StringField({blank: true, required: true}))
    };
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    this.potency = {
      bonuses: 0
    };
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.stamina.winded = Math.floor(this.stamina.max / 2);
  }

  /**
   * The actor's melee range
   */
  get reach() {
    return 1;
  }

  /**
   * @override
   * @param {Record<string, unknown>} changes
   * @param {import("../../../../foundry/common/abstract/_types.mjs").DatabaseUpdateOperation} operation
   * @param {User} user
   */
  _preUpdate(changes, operation, user) {
    const newSize = foundry.utils.getProperty(changes, "system.combat.size.value");
    if ((newSize !== undefined) && (this.combat.size.value !== newSize)) {
      foundry.utils.mergeObject(changes, {
        prototypeToken: {
          width: newSize,
          height: newSize
        }
      });
    }
  }

  /**
   * Prompt the user for what types
   * @param {string} characteristic - The characteristic to roll
   * @param {object} [options] - Options to modify the characteristic roll
   * @param {Array<"test" | "ability">} [options.types] - Valid roll types for the characteristic
   * @param {number} [options.edges] - Base edges for the roll
   * @param {number} [options.banes] - Base banes for the roll
   */
  async rollCharacteristic(characteristic, options = {}) {
    const types = options.types ?? ["test"];

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
    const flavor = `${game.i18n.localize(`DRAW_STEEL.Actor.base.FIELDS.characteristics.${characteristic}.value.hint`)} ${game.i18n.localize(PowerRoll.TYPES[type].label)}`;
    return PowerRoll.prompt({type, formula, data, flavor, edges: options.edges, banes: options.banes});
  }
}
