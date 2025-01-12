import {systemPath} from "../../constants.mjs";
import {DrawSteelChatMessage} from "../../documents/_module.mjs";
import {PowerRoll, DamageRoll} from "../../rolls/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import {setOptions} from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

const fields = foundry.data.fields;

/**
 * Abilities are special actions, maneuvers, and more that affect creatures, objects, and the environment
 */
export default class AbilityModel extends BaseItemModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "ability",
    detailsPartial: [systemPath("templates/item/partials/ability.hbs")]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Ability"
  ];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();
    const config = ds.CONFIG.abilities;

    schema.keywords = new fields.SetField(setOptions());
    schema.type = new fields.StringField({required: true, blank: false, initial: "action"});
    schema.category = new fields.StringField({required: true, nullable: false}),
    schema.trigger = new fields.StringField();
    schema.distance = new fields.SchemaField({
      type: new fields.StringField({required: true, blank: false, initial: "self"}),
      primary: new fields.NumberField({integer: true, min: 0}),
      secondary: new fields.NumberField({integer: true, min: 0}),
      tertiary: new fields.NumberField({integer: true, min: 0})
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
        type: new fields.StringField({required: true, nullable: false})
      }),
      ae: new fields.SetField(setOptions({validate: foundry.data.validators.isValidId})),
      potency: new FormulaField({deterministic: true}),
      forced: new fields.SchemaField({
        type: new fields.StringField({choices: config.forcedMovement, blank: false}),
        value: new fields.NumberField(),
        vertical: new fields.BooleanField()
      }),
      description: new fields.StringField()
    });

    schema.powerRoll = new fields.SchemaField({
      enabled: new fields.BooleanField(),
      formula: new FormulaField(),
      characteristics: new fields.SetField(setOptions()),
      tier1: new fields.SchemaField(powerRollSchema()),
      tier2: new fields.SchemaField(powerRollSchema()),
      tier3: new fields.SchemaField(powerRollSchema())
    });
    schema.effect = new fields.StringField();
    schema.spend = new fields.NumberField({integer: true});

    return schema;
  }

  /** @override */
  static itemDescription() {
    const description = super.itemDescription();
    description.flavor = new fields.StringField({required: true, blank: true});
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
   * Also selects the highest characteristic from the options.
   * TODO: Consider adding an `overrides` like property if that makes sense for the item sheet handling
   * @protected
   */
  _prepareCharacterData() {
    this.powerRoll.characteristic = null;
    for (const characteristic of this.powerRoll.characteristics) {
      if (this.powerRoll.characteristic === null) this.powerRoll.characteristic = characteristic;

      const actorCharacteristics = this.actor.system.characteristics;
      if (actorCharacteristics[characteristic].value > actorCharacteristics[this.powerRoll.characteristic].value) this.powerRoll.characteristic = characteristic;
    }

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
          break;
        case "meleeRanged":
          if (this.keywords.has("weapon")) {
            this.distance.primary += bonuses.melee.distance;
            this.distance.secondary += bonuses.ranged.distance;
          }
          break;
        case "aura":
        case "burst":
        case "cube":
        case "line":
        case "wall":
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
    }
  }

  /**
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    // All abilities are rendered inline
    config.inline = true;
    const embed = document.createElement("div");
    embed.classList.add("ability");
    embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {system: this, systemFields: this.schema.fields, config: ds.CONFIG};
    this.getSheetContext(context);
    const abilityBody = await renderTemplate(systemPath("templates/item/embeds/ability.hbs"), context);
    embed.insertAdjacentHTML("beforeend", abilityBody);
    return embed;
  }

  /** @override */
  getSheetContext(context) {
    const config = ds.CONFIG.abilities;
    const keywordFormatter = game.i18n.getListFormatter({type: "unit"});
    const keywordList = Array.from(this.keywords).map(k => ds.CONFIG.abilities.keywords[k]?.label ?? k);
    context.keywordList = keywordFormatter.format(keywordList);
    context.actionTypes = Object.entries(config.types).map(([value, {label}]) => ({value, label}));
    context.abilityCategories = Object.entries(config.categories).map(([value, {label}]) => ({value, label}));

    context.triggeredAction = !!config.types[this.type]?.triggered;

    context.distanceLabel = game.i18n.format(config.distances[this.distance.type]?.embedLabel, {...this.distance});
    context.distanceTypes = Object.entries(config.distances).map(([value, {label}]) => ({value, label}));
    context.primaryDistance = config.distances[this.distance.type].primary;
    context.secondaryDistance = config.distances[this.distance.type].secondary;
    context.tertiaryDistance = config.distances[this.distance.type].tertiary;

    const targetConfig = config.targets[this.target.type] ?? {embedLabel: "Unknown"};
    context.targetLabel = this.target.value === null ?
      targetConfig.all ?? game.i18n.localize(targetConfig.embedLabel) :
      game.i18n.format(targetConfig.embedLabel, {value: this.target.value});
    context.targetTypes = Object.entries(config.targets).map(([value, {label}]) => ({value, label}));

    context.showDamageDisplay = this.keywords.has("melee") && this.keywords.has("ranged");

    context.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([value, {label}]) => ({value, label}));
    context.appliedEffects = this.parent.effects.filter(e => !e.transfer).map(e => ({label: e.name, value: e.id}));

    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, {label}]) => ({value, label}));
  }

  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    if (this.actor) {
      rollData.chr = this.actor.system.characteristics[this.powerRoll.characteristic]?.value;
    }
  }

  /**
   * Use an ability, generating a chat message and potentially making a power roll
   * @param {object} [options={}] Configuration
   * @param {UIEvent} [options.event] The event prompting the use
   * @param {number} [options.banes]  Banes to apply to a power roll
   * @param {number} [options.edges]  Edges to apply to a power roll
   * @returns {Promise<DrawSteelChatMessage>}
   */
  async use(options = {}) {
    const messageData = {
      speaker: DrawSteelChatMessage.getSpeaker({actor: this.actor}),
      type: "abilityUse",
      rolls: [],
      content: this.parent.name,
      system: {
        uuid: this.parent.uuid
      }
    };
    // TODO: Put the spend in flavor text (e.g. "Spends 5 Essence" or whatever)

    DrawSteelChatMessage.applyRollMode(messageData, "roll");

    if (this.powerRoll.enabled) {
      const formula = this.powerRoll.formula ? `2d10 + ${this.powerRoll.formula}` : "2d10";
      const rollData = this.parent.getRollData();
      const powerRoll = await PowerRoll.prompt({
        type: "ability",
        formula,
        data: rollData,
        evaluation: "evaluate",
        banes: options.banes,
        edges: options.banes
      });
      messageData.rolls.push(powerRoll);
      const tier = this.powerRoll[`tier${powerRoll.product}`];
      const damageFormula = tier.damage.value;
      if (damageFormula) {
        const damageType = ds.CONFIG.damageTypes[tier.damage.type]?.label ?? tier.damage.type;
        const flavor = game.i18n.format("DRAW_STEEL.Item.Ability.DamageFlavor", {type: damageType});
        const damageRoll = new DamageRoll(damageFormula, rollData, {flavor, type: damageType});
        await damageRoll.evaluate();
        messageData.rolls.push(damageRoll);
      }
    }

    return DrawSteelChatMessage.create(messageData);
  }
}
