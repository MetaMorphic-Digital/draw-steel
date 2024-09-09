import {PowerRoll} from "../../helpers/rolls.mjs";
import {FormulaField} from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Abilities are special actions, maneuvers, and more that affect creatures, objects, and the environment
 */
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
    const config = ds.CONFIG.abilities;

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
      primary: new fields.NumberField({integer: true}),
      secondary: new fields.NumberField({integer: true})
    });
    schema.damageDisplay = new fields.StringField({choices: ["melee", "ranged"]});
    schema.trigger = new fields.StringField();
    schema.target = new fields.SchemaField({
      type: new fields.StringField(requiredChoice(config.targets, "self")),
      value: new fields.NumberField(),
      all: new fields.BooleanField()
    });

    const powerRollSchema = () => ({
      damage: new fields.SchemaField({
        value: new FormulaField(),
        type: new fields.StringField({required: true})
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

  /* -------------------------------------------- */

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.actor?.type !== "character") {
      /** @type {import("../actor/character.mjs").default["abilityBonuses"]} */
      const bonuses = this.actor.system.abilityBonuses;
      if (bonuses) { // Data prep order of operations issues
        switch (this.distance.type) {
          case "melee":
            if (this.keywords.has("weapon")) {
              this.distance.primary += bonuses.melee.reach;
            }
            break;
          case "ranged":
            if (this.keywords.has("weapon")) {
              this.distance.primary += bonuses.ranged.reach;
            }
            if (this.keywords.has("magic")) {
              this.distance.primary += bonuses.magic.distance;
            }
            break;
          case "meleeRanged":
            if (this.keywords.has("weapon")) {
              this.distance.primary += bonuses.melee.reach;
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
  }
}
