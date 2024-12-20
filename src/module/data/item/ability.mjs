import {systemPath} from "../../constants.mjs";
import {PowerRoll} from "../../helpers/rolls.mjs";
import FormulaField from "../fields/formula-field.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Abilities are special actions, maneuvers, and more that affect creatures, objects, and the environment
 */
export default class AbilityModel extends BaseItemModel {
  static metadata = Object.freeze({
    ...super.metadata,
    type: "ability",
    detailsPartial: [systemPath("templates/item/partials/ability.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Ability"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG.abilities;

    schema.keywords = new fields.SetField(new fields.StringField({required: true, blank: false}));
    schema.type = new fields.StringField({required: true, blank: false, initial: "action"});
    schema.trigger = new fields.StringField();
    schema.distance = new fields.SchemaField({
      type: new fields.StringField({required: true, blank: false, initial: "self"}),
      primary: new fields.NumberField({integer: true}),
      secondary: new fields.NumberField({integer: true})
    });
    schema.damageDisplay = new fields.StringField({choices: {
      melee: "DRAW_STEEL.Item.Ability.Keywords.Melee",
      ranged: "DRAW_STEEL.Item.Ability.Keywords.Ranged"
    }, initial: "melee", required: true, blank: false});
    schema.target = new fields.SchemaField({
      type: new fields.StringField({required: true, blank: false, initial: "self"}),
      value: new fields.NumberField({integer: true})
    });

    const powerRollSchema = () => ({
      damage: new fields.SchemaField({
        value: new FormulaField(),
        type: new fields.StringField({required: true})
      }),
      ae: new fields.SetField(new fields.StringField({validate: foundry.data.validators.isValidId})),
      forced: new fields.SchemaField({
        type: new fields.StringField({choices: config.forcedMovement, blank: false}),
        value: new fields.NumberField(),
        vertical: new fields.BooleanField()
      }),
      description: new fields.StringField()
    });

    schema.powerRoll = new fields.SchemaField({
      enabled: new fields.BooleanField(),
      tier1: new fields.SchemaField(powerRollSchema()),
      tier2: new fields.SchemaField(powerRollSchema()),
      tier3: new fields.SchemaField(powerRollSchema())
    });
    schema.effect = new fields.StringField();
    schema.spend = new fields.NumberField({integer: true});

    return schema;
  }

  static itemDescription() {
    const description = super.itemDescription();
    description.flavor = new foundry.data.fields.StringField({required: true, blank: true});
    return description;
  }

  /* -------------------------------------------- */

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.actor?.type === "character") this._prepareCharacterData();
  }

  /**
   * Adds kit bonuses as native "active effect" like adjustments.
   * TODO: Consider adding an `overrides` like property if that makes sense for the item sheet handling
   * @protected
   */
  _prepareCharacterData() {
    /** @type {import("../actor/character.mjs").default["abilityBonuses"]} */
    const bonuses = foundry.utils.getProperty(this.actor ?? {}, "system.abilityBonuses");
    if (bonuses) { // Data prep order of operations issues
      switch (this.distance.type) {
        case "melee":
          if (this.keywords.has("weapon")) {
            this.distance.primary += bonuses.melee.distance;
          }
          break;
        case "ranged":
          if (this.keywords.has("weapon")) {
            this.distance.primary += bonuses.ranged.distance;
          }
          if (this.keywords.has("magic")) {
            this.distance.primary += bonuses.magic.distance;
          }
          break;
        case "meleeRanged":
          if (this.keywords.has("weapon")) {
            this.distance.primary += bonuses.melee.distance;
            this.distance.secondary += bonuses.ranged.distance;
          }
          break;
        case "aura":
          if (this.keywords.has("magic")) {
            this.distance.primary += bonuses.magic.area;
          }
          break;
        case "burst":
          if (this.keywords.has("magic")) {
            this.distance.primary += bonuses.magic.area;
          }
          break;
        case "cube":
          if (this.keywords.has("magic")) {
            this.distance.primary += bonuses.magic.area;
            this.distance.secondary += bonuses.magic.distance;
          }
          break;
        case "line":
          if (this.keywords.has("magic")) {
            this.distance.primary += bonuses.magic.area;
            this.distance.secondary += bonuses.magic.area;
          }
          break;
        case "wall":
          if (this.keywords.has("magic")) {
            this.distance.primary += bonuses.magic.area;
          }
          break;
        case "self":
        case "special":
          break;
      }
      // All three tier.damage.value fields should be identical, so their apply change should be identical
      const formulaField = this.schema.getField(["powerRoll", "tier1", "damage", "value"]);
      if (this.keywords.has("weapon")) {
        const isMelee = this.keywords.has("melee");
        const isRanged = this.keywords.has("ranged");
        const prefMelee = this.damageDisplay === "melee";
        if (isMelee && (prefMelee || !isRanged)) {
          for (const tier of PowerRoll.TIER_NAMES) {
            if (!bonuses.melee?.damage?.[tier]) continue;
            this.powerRoll[tier].damage.value = formulaField.applyChange(this.powerRoll[tier].damage.value, this, {
              value: bonuses.melee?.damage?.[tier],
              mode: CONST.ACTIVE_EFFECT_MODES.ADD
            });
          }
        }
        else if (isRanged) {
          for (const tier of PowerRoll.TIER_NAMES) {
            if (!bonuses.ranged?.damage?.[tier]) continue;
            this.powerRoll[tier].damage.value = formulaField.applyChange(this.powerRoll[tier].damage.value, this, {
              value: bonuses.ranged?.damage?.[tier],
              mode: CONST.ACTIVE_EFFECT_MODES.ADD
            });
          }
        }
      }
      if (this.keywords.has("magic")) {
        for (const tier of PowerRoll.TIER_NAMES) {
          if (!bonuses.magic?.damage?.[tier]) continue;
          this.powerRoll[tier].damage.value = formulaField.applyChange(this.powerRoll[tier].damage.value, this, {
            value: bonuses.magic?.damage?.[tier],
            mode: CONST.ACTIVE_EFFECT_MODES.ADD
          });
        }
      }
    }
  }

  getSheetContext(context) {
    const config = ds.CONFIG.abilities;
    context.keywords = Object.entries(config.keywords).map(([value, {label}]) => ({value, label}));
    context.actionTypes = Object.entries(config.types).map(([value, {label}]) => ({value, label}));

    context.distanceTypes = Object.entries(config.distances).map(([value, {label}]) => ({value, label}));
    context.primaryDistance = config.distances[this.distance.type].primary;
    context.secondaryDistance = config.distances[this.distance.type].secondary;

    context.targetTypes = Object.entries(config.targets).map(([value, {label}]) => ({value, label}));

    context.showDamageDisplay = this.keywords.has("melee") && this.keywords.has("ranged");

    context.damageType = Object.entries(ds.CONFIG.damageTypes).map(([value, {label}]) => ({value, label}));
    context.appliedEffects = this.parent.effects.filter(e => !e.transfer).map(e => ({label: e.name, value: e.id}));
  }
}
