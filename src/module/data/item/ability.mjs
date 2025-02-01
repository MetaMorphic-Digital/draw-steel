import {systemPath} from "../../constants.mjs";
import {DrawSteelActiveEffect, DrawSteelActor, DrawSteelChatMessage} from "../../documents/_module.mjs";
import {DamageRoll, DSRoll, PowerRoll} from "../../rolls/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import {setOptions} from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/** @import {FormInputConfig, FormGroupConfig} from "../../../../foundry/client-esm/applications/forms/fields.mjs" */
/** @import {PowerRollModifiers, PowerRollPromptOptions} from "../../_types.js" */
/** @import {MaliceModel} from "../settings/_module.mjs" */

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
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Ability"
  ];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();
    const config = ds.CONFIG.abilities;

    schema.keywords = new fields.SetField(setOptions());
    schema.type = new fields.StringField({required: true, blank: false, initial: "action"});
    schema.category = new fields.StringField({required: true});
    schema.resource = new fields.NumberField({initial: null, min: 1, integer: true});
    schema.trigger = new fields.StringField({required: true});
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

    const potencySchema = (initialPotency) => {
      const schema = {
        enabled: new fields.BooleanField({label: "DRAW_STEEL.Item.Ability.FIELDS.powerRoll.tier.potency.enabled.label"}),
        characteristic: new fields.StringField({label: "DRAW_STEEL.Item.Ability.FIELDS.powerRoll.tier.potency.characteristic.label"}),
        value: new FormulaField({deterministic: true, initial: initialPotency, label: "DRAW_STEEL.Item.Ability.FIELDS.powerRoll.tier.potency.value.label"})
      };

      Object.entries(schema).forEach(([field, fieldSchema]) => fieldSchema.label = game.i18n.localize(`DRAW_STEEL.Item.Ability.FIELDS.powerRoll.tier.potency.${field}.label`));

      return schema;
    };

    const powerRollSchema = ({initialPotency}) => {
      const schema = new fields.TypedSchemaField({
        damage: new fields.SchemaField({
          type: new fields.StringField({required: true, initial: "damage", blank: false}),
          value: new FormulaField(),
          types: new fields.SetField(new fields.StringField({required: true})),
          potency: new fields.SchemaField(potencySchema(initialPotency)),
          display: new fields.StringField({required: true})
        }),
        ae: new fields.SchemaField({
          type: new fields.StringField({required: true, initial: "ae", blank: false}),
          always: new fields.SetField(setOptions({validate: foundry.data.validators.isValidId})),
          success: new fields.SetField(setOptions({validate: foundry.data.validators.isValidId})),
          failure: new fields.SetField(setOptions({validate: foundry.data.validators.isValidId})),
          potency: new fields.SchemaField(potencySchema(initialPotency)),
          display: new fields.StringField({required: true})
        }),
        forced: new fields.SchemaField({
          type: new fields.StringField({required: true, initial: "forced", blank: false}),
          types: new fields.SetField(new fields.StringField({choices: config.forcedMovement, blank: false})),
          value: new fields.NumberField(),
          vertical: new fields.BooleanField(),
          potency: new fields.SchemaField(potencySchema(initialPotency)),
          display: new fields.StringField({required: true})
        }),
        other: new fields.SchemaField({
          type: new fields.StringField({required: true, initial: "other", blank: false}),
          potency: new fields.SchemaField(potencySchema(initialPotency)),
          display: new fields.StringField({required: true})
        })
      });

      const baseLabel = "DRAW_STEEL.Item.Ability.FIELDS.powerRoll.tier";
      Object.entries(schema.types).forEach(([type, typeSchema]) => {
        schema.types[type].label = game.i18n.localize(`${baseLabel}.${type}.label`);
        Object.entries(typeSchema.fields).forEach(([field, fieldSchema]) => {

          switch (field) {
            case "potency":
            case "type":
            case "display":
              fieldSchema.label = game.i18n.localize(`${baseLabel}.${field}.label`);
              break;
            default:
              fieldSchema.label = game.i18n.localize(`${baseLabel}.${type}.${field}.label`);
              break;
          }
        });
      });

      return schema;
    };

    schema.powerRoll = new fields.SchemaField({
      enabled: new fields.BooleanField(),
      formula: new FormulaField({blank: false, initial: "@chr"}),
      characteristics: new fields.SetField(setOptions()),
      potencyCharacteristic: new fields.StringField(),
      tier1: new fields.ArrayField(powerRollSchema({initialPotency: "@potency.weak"})),
      tier2: new fields.ArrayField(powerRollSchema({initialPotency: "@potency.average"})),
      tier3: new fields.ArrayField(powerRollSchema({initialPotency: "@potency.strong"}))
    });
    schema.effect = new fields.StringField({required: true});
    schema.spend = new fields.SchemaField({
      value: new fields.NumberField({integer: true}),
      text: new fields.StringField({required: true})
    });

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

      if (this.keywords.has("weapon")) {
        const isMelee = this.keywords.has("melee");
        const isRanged = this.keywords.has("ranged");
        const prefMelee = this.damageDisplay === "melee";
        const distance = (isMelee && (prefMelee || !isRanged)) ? "melee" : ((isRanged) ? "ranged" : null);

        if (distance) {
          // All three tier.damage.value fields should be identical, so their apply change should be identical
          const formulaField = this.schema.getField(["powerRoll", "tier1", "damage", "value"]);
          for (const tier of PowerRoll.TIER_NAMES) {
            const firstDamageEffect = this.powerRoll[tier].find(effect => effect.type === "damage");
            if (!firstDamageEffect || !bonuses[distance]?.damage?.[tier]) continue;

            firstDamageEffect.value = formulaField.applyChange(firstDamageEffect.value, this, {
              value: bonuses[distance].damage[tier],
              mode: CONST.ACTIVE_EFFECT_MODES.ADD
            });
          }
        }
      }
    }
  }

  /**
   * Generate the potency data for a given tier.
   *
   * @param {string} tierName The name of the tier to pull from the power roll
   * @returns {Partial<PotencyData>}
   */
  getPotencyData(tierName) {
    const potency = this.powerRoll[tierName].potency;
    const potencyData = {
      enabled: potency.enabled && !!this.powerRoll.potencyCharacteristic
    };

    // If potency is not enabled or there is no potency value return early
    if (!potencyData.enabled && !potency.value) return potencyData;

    const potencyValue = new DSRoll(potency.value, this.parent.getRollData()).evaluateSync().total;
    potencyData.characteristic = this.powerRoll.potencyCharacteristic;
    potencyData.value = potencyValue;
    potencyData.embed = game.i18n.format("DRAW_STEEL.Item.Ability.Potency.Embed", {
      characteristic: game.i18n.localize(`DRAW_STEEL.Actor.characteristics.${potencyData.characteristic}.abbreviation`),
      value: potencyValue
    });

    return potencyData;
  }

  /**
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    // All abilities are rendered inline
    config.inline = true;

    // If unspecified assume all three tiers are desired for display
    if (!(("tier1" in config) || ("tier2" in config) || ("tier3" in config))) {
      config.tier1 = this.powerRoll.enabled;
      config.tier2 = this.powerRoll.enabled;
      config.tier3 = this.powerRoll.enabled;
    }

    const embed = document.createElement("div");
    embed.classList.add("ability");
    embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG,
      resourceName: this.actor?.system.coreResource.name ?? game.i18n.localize("DRAW_STEEL.Actor.Character.FIELDS.hero.primary.label")
    };
    if (config.tier1) context.tier1 = true;
    if (config.tier2) context.tier2 = true;
    if (config.tier3) context.tier3 = true;
    this.getSheetContext(context);
    const abilityBody = await renderTemplate(systemPath("templates/item/embeds/ability.hbs"), context);
    embed.insertAdjacentHTML("beforeend", abilityBody);
    return embed;
  }

  /** @override */
  getSheetContext(context) {
    const config = ds.CONFIG.abilities;

    context.resourceName = this.actor?.system.coreResource?.name ?? "";

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

    context.powerRollEffectOptions = Object.entries(this.schema.fields.powerRoll.fields.tier1.element.types).map(([value, {label}]) => ({value, label}));

    if (context.tab.id === "details") {
      context.subtabs = Object.entries(PowerRoll.RESULT_TIERS).map(([tier, {label}]) => ({
        cssClass: ((!context.tabGroups.powerRoll && (tier === "tier1")) || (context.tabGroups.powerRoll === tier)) ? "active" : "",
        group: "powerRoll",
        id: tier,
        label
      }));
      context.subtab = context.subtabs.find(subtab => subtab.cssClass === "active");
    }
  }

  /** @override */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    if (this.actor) {
      rollData.chr = this.actor.system.characteristics[this.powerRoll.characteristic]?.value;
    }
  }

  /**
   * Use an ability, generating a chat message and potentially making a power roll
   * @param {Partial<AbilityUseOptions>} [options={}] Configuration
   * @returns {Promise<Array<DrawSteelChatMessage> | null>}
   * TODO: Add hooks based on discussion with module authors
   */
  async use(options = {}) {
    /**
     * Configuration information
     * @type {object | null}
     */
    let configuration = null;
    let resourceSpend = this.resource ?? 0;
    const coreResource = this.actor?.system.coreResource;

    // Determine if the configuration form should even run.
    // Can be factored out if/when complexity increases
    if (this.spend.value || this.spend.text) {
      let content = "";

      /**
       * Range picker config is ignored by the checkbox element
       * @type {FormInputConfig} */
      const spendInputConfig = {
        name: "spend",
        min: 0,
        max: foundry.utils.getProperty(coreResource.target, coreResource.target),
        step: 1
      };

      // Nullish value with text means X spend
      const spendInput = this.spend.value ?
        foundry.applications.fields.createCheckboxInput(spendInputConfig) :
        foundry.applications.elements.HTMLRangePickerElement.create(spendInputConfig);

      content += foundry.applications.fields.createFormGroup({
        label: game.i18n.format("DRAW_STEEL.Item.Ability.ConfigureUse.SpendLabel", {
          value: this.spend.value || "",
          name: coreResource.name
        }),
        input: spendInput
      }).outerHTML;

      configuration = await foundry.applications.api.DialogV2.prompt({
        content,
        window: {
          title: "DRAW_STEEL.Item.Ability.ConfigureUse.Title",
          icon: "fa-solid fa-gear"
        },
        ok: {
          callback: (event, button, dialog) => {
            return new FormDataExtended(button.form).object;
          }
        },
        rejectClose: false
      });

      if (!configuration) return null;
    }

    const messageData = {
      speaker: DrawSteelChatMessage.getSpeaker({actor: this.actor}),
      type: "abilityUse",
      rolls: [],
      content: this.parent.name,
      system: {
        uuid: this.parent.uuid
      }
    };

    if (configuration) {
      if (configuration.spend) {
        resourceSpend += typeof configuration.spend === "boolean" ? this.spend.value : configuration.spend;
        messageData.flavor = game.i18n.format("DRAW_STEEL.Item.Ability.ConfigureUse.SpentFlavor", {
          value: resourceSpend,
          name: coreResource.name
        });
      }
    }

    // TODO: Figure out how to better handle invocations when this.actor is null
    await this.actor?.system.updateResource(resourceSpend * -1);

    DrawSteelChatMessage.applyRollMode(messageData, "roll");

    if (this.powerRoll.enabled) {
      const formula = this.powerRoll.formula ? `2d10 + ${this.powerRoll.formula}` : "2d10";
      const rollData = this.parent.getRollData();
      options.modifiers ??= {};
      options.modifiers.banes ??= 0;
      options.modifiers.edges ??= 0;

      this.getActorModifiers(options);

      // Get the power rolls made per target, or if no targets, then just one power roll
      const powerRolls = await PowerRoll.prompt({
        type: "ability",
        formula,
        data: rollData,
        evaluation: "evaluate",
        actor: this.actor,
        ability: this.parent.uuid,
        modifiers: options.modifiers,
        targets: [...game.user.targets].reduce((accumulator, target) => {
          accumulator.push({
            uuid: target.actor.uuid,
            modifiers: this.getTargetModifiers(target.actor)
          });
          return accumulator;
        }, [])
      });

      if (!powerRolls) return null;
      const baseRoll = powerRolls.findSplice(powerRoll => powerRoll.options.baseRoll);

      // Power Rolls grouped by tier of success
      const groupedRolls = powerRolls.reduce((accumulator, powerRoll) => {
        accumulator[powerRoll.product] ??= [baseRoll];
        accumulator[powerRoll.product].push(powerRoll);

        return accumulator;
      }, {});

      // Each tier group gets a message. Rolls within a group are in the same message
      const messages = [];
      for (const tierNumber in groupedRolls) {
        const messageDataCopy = foundry.utils.duplicate(messageData);
        for (const powerRoll of groupedRolls[tierNumber]) {
          messageDataCopy.rolls.push(powerRoll);
        }
        const tier = this.powerRoll[`tier${tierNumber}`];
        const damageFormula = tier.damage.value;
        if (damageFormula) {
          const damageType = ds.CONFIG.damageTypes[tier.damage.type]?.label ?? tier.damage.type;
          const flavor = game.i18n.format("DRAW_STEEL.Item.Ability.DamageFlavor", {type: damageType});
          const damageRoll = new DamageRoll(damageFormula, rollData, {flavor, type: damageType});
          await damageRoll.evaluate();
          messageDataCopy.rolls.push(damageRoll);
        }
        if (messages.length > 0) messageDataCopy.system.embedText = false;

        messages.push(DrawSteelChatMessage.create(messageDataCopy));
      }

      return Promise.allSettled(messages);
    }
    else return Promise.allSettled([DrawSteelChatMessage.create(messageData)]);
  }

  /**
   * Modify the options object based on conditions that apply to ability Power Rolls regardless of target
   * @param {Partial<AbilityUseOptions>} options Options for the dialog
   */
  getActorModifiers(options) {
    if (!this.actor) return;
    //TODO: CONDITION CHECKS

    // Restrained conditions check
    if (this.actor.statuses.has("restrained")) options.modifiers.banes += 1;
  }

  /**
   * Get the modifiers based on conditions that apply to ability Power Rolls specific to a target
   * @param {DrawSteelActor} target A target of the Ability Roll
   * @returns {PowerRollModifiers}
   */
  getTargetModifiers(target) {
    const modifiers = {
      banes: 0,
      edges: 0
    };

    //TODO: ALL CONDITION CHECKS

    // Frightened condition checks
    if (DrawSteelActiveEffect.isStatusSource(this.actor, target, "frightened")) modifiers.banes += 1; // Attacking the target frightening the actor
    if (DrawSteelActiveEffect.isStatusSource(target, this.actor, "frightened")) modifiers.edges += 1; // Attacking the target the actor has frightened

    // Grabbed condition check - targeting a non-source adds a bane
    if (DrawSteelActiveEffect.isStatusSource(this.actor, target, "grabbed") === false) modifiers.banes += 1; 

    // Restrained condition check - targeting restrained gets an edge
    if (target.statuses.has("restrained")) modifiers.edges += 1;

    return modifiers;
  }

  /**
   * Determine if an Active Effect or a status is restricting this ability.
   * @returns {boolean}
   */
  get restricted() {
    if (!this.actor) return false;

    // Checking if active effects have restricted this ability based on type or _dsid
    const restrictions = this.actor.system.restrictions;
    if (restrictions.type.has(this.type)) return true;
    if (restrictions.dsid.has(this._dsid)) return true;

    // Checking if statuses have restricted this ability based on type or _dsid
    for (const effect of CONFIG.statusEffects) {
      if (!this.actor.statuses.has(effect.id) || !effect.restrictions) continue;

      if (effect.restrictions.type?.has(this.type)) return true;
      if (effect.restrictions.dsid?.has(this._dsid)) return true;
    }

    return false;
  }
}
