import { systemPath } from "../../constants.mjs";
import { DrawSteelActiveEffect, DrawSteelActor, DrawSteelChatMessage } from "../../documents/_module.mjs";
import { DamageRoll, PowerRoll } from "../../rolls/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { setOptions } from "../helpers.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import DamagePowerRollEffect from "../pseudo-documents/power-roll-effects/damage-effect.mjs";
import BaseItemModel from "./base.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 * @import { FormInputConfig } from "@common/data/_types.mjs";
 * @import { PowerRollModifiers } from "../../_types.js";
 */

const fields = foundry.data.fields;

/**
 * Abilities are special actions, maneuvers, and more that affect creatures, objects, and the environment.
 */
export default class AbilityModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "ability",
      detailsPartial: [systemPath("templates/sheets/item/partials/ability.hbs")],
      embedded: {
        PowerRollEffect: "system.power.effects",
      },
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.ability");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // Items don't have descriptions
    delete schema.description;

    schema.story = new fields.StringField({ required: true });
    schema.keywords = new fields.SetField(setOptions());
    schema.type = new fields.StringField({ required: true, blank: false, initial: "action" });
    schema.category = new fields.StringField({ required: true });
    schema.resource = new fields.NumberField({ initial: null, min: 1, integer: true });
    schema.trigger = new fields.StringField({ required: true });
    schema.distance = new fields.SchemaField({
      type: new fields.StringField({ required: true, blank: false, initial: "self" }),
      primary: new fields.NumberField({ integer: true, min: 0 }),
      secondary: new fields.NumberField({ integer: true, min: 0 }),
      tertiary: new fields.NumberField({ integer: true, min: 0 }),
    });
    schema.damageDisplay = new fields.StringField({ choices: {
      melee: "DRAW_STEEL.Item.ability.Keywords.Melee",
      ranged: "DRAW_STEEL.Item.ability.Keywords.Ranged",
    }, initial: "melee", required: true, blank: false });
    schema.target = new fields.SchemaField({
      type: new fields.StringField({ required: true, blank: false, initial: "self" }),
      custom: new fields.StringField({ required: true }),
      value: new fields.NumberField({ required: true, integer: true }),
    });

    schema.power = new fields.SchemaField({
      roll: new fields.SchemaField({
        formula: new FormulaField({ blank: true, initial: "@chr" }),
        characteristics: new fields.SetField(setOptions()),
      }),
      effects: new ds.data.fields.CollectionField(ds.data.pseudoDocuments.powerRollEffects.BasePowerRollEffect),
    });

    schema.effect = new fields.SchemaField({
      before: new fields.HTMLField(),
      after: new fields.HTMLField(),
    });
    schema.spend = new fields.SchemaField({
      value: new fields.NumberField({ integer: true }),
      text: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(data) {
    // Game release updates
    if (data.type === "action") data.type = "main";

    return super.migrateData(data);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();
    for (const effect of this.power.effects) effect.prepareBaseData();

    this.power.characteristic = {
      key: "",
      value: -5,
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.power.roll.enabled = this.power.effects.size > 0;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  preparePostActorPrepData() {
    super.preparePostActorPrepData();
    this._applyAbilityBonuses();

    for (const chr of this.power.roll.characteristics) {
      const c = this.actor.system.characteristics[chr];
      if (!c) continue;
      if (c.value >= this.power.characteristic.value) {
        this.power.characteristic.key = chr;
        this.power.characteristic.value = c.value;
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Adds kit bonuses as native "active effect" like adjustments.
   * @protected
   */
  _applyAbilityBonuses() {
    for (const bonus of (this.actor.system._abilityBonuses ?? [])) {
      if (!bonus.filters.keywords.isSubsetOf(this.keywords)) continue;

      if (bonus.key === "distance") {
        // All distance value fields are structured identically so the field can be used regardless of which it actually modifies
        const distanceValueField = this.schema.getField("distance.primary");
        switch (this.distance.type) {
          case "melee":
          case "ranged":
            this.distance.primary = distanceValueField.applyChange(this.distance.primary, this, bonus);
            break;
          case "meleeRanged":
            if (bonus.filters.keywords.has("melee")) this.distance.primary = distanceValueField.applyChange(this.distance.primary, this, bonus);
            if (bonus.filters.keywords.has("ranged")) this.distance.secondary = distanceValueField.applyChange(this.distance.secondary, this, bonus);
            break;
          case "wall":
          case "cube":
            this.distance.secondary = distanceValueField.applyChange(this.distance.secondary, this, bonus);
            break;
          case "line":
            this.distance.tertiary = distanceValueField.applyChange(this.distance.tertiary, this, bonus);
            break;
          case "aura":
          case "burst":
          case "self":
          case "special":
            break;
        }
      }

      if (bonus.key.startsWith("damage")) {
        let applyBonus = true;
        if (this.keywords.has("melee") && this.keywords.has("ranged")) {
          // melee & ranged abilities only display one set of bonuses at a time
          const filterMeleeRanged = bonus.filters.keywords.has("melee") || bonus.filters.keywords.has("ranged");
          applyBonus = !filterMeleeRanged || bonus.filters.keywords.has(this.damageDisplay);
        }

        if (applyBonus) {
          const formulaField = DamagePowerRollEffect.schema.getField(bonus.key);
          const firstDamageEffect = this.power.effects.find(effect => effect.type === "damage");
          if (!firstDamageEffect) return;
          const currentValue = foundry.utils.getProperty(firstDamageEffect, bonus.key);
          foundry.utils.setProperty(firstDamageEffect, bonus.key, formulaField.applyChange(currentValue, this, bonus));
        }
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    // All abilities are rendered inline
    config.inline = true;

    // If unspecified assume all three tiers are desired for display
    if (!(("tier1" in config) || ("tier2" in config) || ("tier3" in config))) {
      config.tier1 = config.tier2 = config.tier3 = this.power.effects.size > 0;
    }

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", "ability");
    if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG,
    };
    if (config.tier1) context.tier1 = true;
    if (config.tier2) context.tier2 = true;
    if (config.tier3) context.tier3 = true;
    await this.getSheetContext(context);
    const abilityBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/ability.hbs"), context);
    embed.insertAdjacentHTML("beforeend", abilityBody);
    return embed;
  }

  /* -------------------------------------------------- */

  /**
   * The formatted text strings for keywords, distance, and target for use in the ability embed and actor sheet.
   * @returns {Record<"keywords" | "distance" | "target", string>}
   */
  get formattedLabels() {
    const labels = {};
    const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });
    const keywordList = Array.from(this.keywords).map(k => ds.CONFIG.abilities.keywords[k]?.label ?? k);
    labels.keywords = keywordFormatter.format(keywordList) || "—";

    labels.distance = game.i18n.format(ds.CONFIG.abilities.distances[this.distance.type]?.embedLabel, { ...this.distance });

    const targetConfig = ds.CONFIG.abilities.targets[this.target.type] ?? { embedLabel: "Unknown" };
    labels.target = this.target.custom || (this.target.value == null ?
      targetConfig.all ?? game.i18n.localize(targetConfig.embedLabel) :
      game.i18n.format(targetConfig.embedLabel, { value: this.target.value }));

    return labels;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    const config = ds.CONFIG.abilities;
    const formattedLabels = this.formattedLabels;

    const resourceName = this.actor?.system.coreResource?.name ?? game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label");

    context.resourceName = resourceName;

    context.keywordList = formattedLabels.keywords;

    context.actionTypeLabel = config.types[this.type]?.label ?? "";
    context.actionTypes = Object.entries(config.types).map(([value, { label }]) => ({ value, label }));
    context.abilityCategories = Object.entries(config.categories).map(([value, { label }]) => ({ value, label }));

    context.triggeredAction = !!config.types[this.type]?.triggered;

    context.distanceLabel = formattedLabels.distance;
    context.distanceTypes = Object.entries(config.distances).map(([value, { label }]) => ({ value, label }));
    context.primaryDistance = config.distances[this.distance.type]?.primary ?? "";
    context.secondaryDistance = config.distances[this.distance.type]?.secondary ?? "";
    context.tertiaryDistance = config.distances[this.distance.type]?.tertiary ?? "";

    context.targetLabel = formattedLabels.target;
    context.targetTypes = Object.entries(config.targets).map(([value, { label }]) => ({ value, label }));

    context.showDamageDisplay = this.keywords.has("melee") && this.keywords.has("ranged");

    context.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([value, { label }]) => ({ value, label }));
    context.appliedEffects = this.parent.effects.filter(e => !e.transfer).map(e => ({ label: e.name, value: e.id }));

    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));

    context.powerRollEffects = Object.fromEntries([1, 2, 3].map(tier => [
      `tier${tier}`,
      { text: this.power.effects.contents.map(effect => effect.toText(tier)).filter(_ => _).join("; ") },
    ]));
    context.powerRolls = this.power.effects.size > 0;

    context.powerRollBonus = this.power.roll.formula;

    if (this.power.roll.formula.includes("@chr")) {
      const characteristicsFormatter = game.i18n.getListFormatter({ type: "disjunction" });
      const characteristicList = this.power.roll.characteristics.map(characteristic => {
        const localizedCharacteristic = ds.CONFIG.characteristics[characteristic]?.label ?? characteristic;
        return (characteristic === this.power.characteristic.key) ? `<em>${localizedCharacteristic}</em>` : localizedCharacteristic;
      });

      context.powerRollBonus = this.power.roll.formula.replace("@chr", characteristicsFormatter.format(Array.from(characteristicList)));
    }

    context.enrichedBeforeEffect = await enrichHTML(this.effect.before, { relativeTo: this.parent });
    context.enrichedAfterEffect = await enrichHTML(this.effect.after, { relativeTo: this.parent });

    context.spendLabel = game.i18n.format("DRAW_STEEL.Item.ability.ConfigureUse.SpendLabel", {
      value: this.spend.value ?? "",
      name: resourceName,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    if (this.actor) {
      rollData.chr = this.actor.system.characteristics[this.power.characteristic.key]?.value;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Use an ability, generating a chat message and potentially making a power roll.
   * @param {Partial<AbilityUseOptions>} [options={}] Configuration.
   * @returns {Promise<DrawSteelChatMessage[] | null>}
   * TODO: Add hooks based on discussion with module authors.
   */
  async use(options = {}) {
    /**
     * Configuration information.
     * @type {object | null}
     */
    let configuration = null;
    let resourceSpend = this.resource ?? 0;
    const coreResource = this.actor?.system.coreResource;

    // Determine if the configuration form should even run.
    // Can be factored out if/when complexity increases
    if (this.spend.value || this.spend.text) {
      let content = "";

      const current = foundry.utils.getProperty(coreResource.target, coreResource.path);

      /**
       * Range picker config is ignored by the checkbox element.
       * @type {FormInputConfig}
       */
      const spendInputConfig = {
        name: "spend",
        min: 0,
        max: current - coreResource.minimum,
        step: 1,
      };

      // Nullish value with text means X spend
      const spendInput = this.spend.value ?
        foundry.applications.fields.createCheckboxInput(spendInputConfig) :
        foundry.applications.elements.HTMLRangePickerElement.create(spendInputConfig);

      let hint = null;
      if (this.spend.value) {
        hint = game.i18n.format(this.spend.value <= spendInputConfig.max ? "DRAW_STEEL.Item.ability.ConfigureUse.SpendHint" : "DRAW_STEEL.Item.ability.ConfigureUse.SpendWarning", {
          value: current,
          name: coreResource.name,
        });
      }

      const spendGroup = foundry.applications.fields.createFormGroup({
        label: game.i18n.format("DRAW_STEEL.Item.ability.ConfigureUse.SpendLabel", {
          value: this.spend.value || "",
          name: coreResource.name,
        }),
        input: spendInput,
        hint,
      });

      // Style fix
      if (this.spend.value) {
        const label = spendGroup.querySelector("label");
        label.classList.add("checkbox");
        label.style = "font-size: inherit;";
      }

      content += spendGroup.outerHTML;

      configuration = await ds.applications.api.DSDialog.input({
        content,
        window: {
          title: "DRAW_STEEL.Item.ability.ConfigureUse.Title",
          icon: "fa-solid fa-gear",
        },
      });

      if (!configuration) return null;
    }

    const messageData = {
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.actor }),
      type: "abilityUse",
      rolls: [],
      title: this.parent.name,
      content: this.parent.name,
      system: {
        uuid: this.parent.uuid,
      },
      flags: { core: { canPopout: true } },
    };

    if (configuration) {
      if (configuration.spend) {
        resourceSpend += typeof configuration.spend === "boolean" ? this.spend.value : configuration.spend;
        messageData.flavor = game.i18n.format("DRAW_STEEL.Item.ability.ConfigureUse.SpentFlavor", {
          value: resourceSpend,
          name: coreResource.name,
        });
      }
    }

    // TODO: Figure out how to better handle invocations when this.actor is null
    if (resourceSpend) await this.actor?.system.updateResource(resourceSpend * -1);

    if (this.power.roll.enabled) {
      const formula = this.power.roll.formula ? `2d10 + ${this.power.roll.formula}` : "2d10";
      const rollData = this.parent.getRollData();
      options.modifiers ??= {};
      options.modifiers.banes ??= 0;
      options.modifiers.edges ??= 0;
      options.modifiers.bonuses ??= 0;

      this.getActorModifiers(options);

      // Get the power rolls made per target, or if no targets, then just one power roll
      const promptValue = await PowerRoll.prompt({
        type: "ability",
        formula,
        data: rollData,
        evaluation: "evaluate",
        actor: this.actor,
        ability: this.parent.uuid,
        modifiers: options.modifiers,
        targets: [...game.user.targets].reduce((accumulator, target) => {
          accumulator.push({
            tokenUuid: target.document.uuid,
            uuid: target.actor?.uuid ?? "",
            modifiers: this.getTargetModifiers(target),
          });
          return accumulator;
        }, []),
      });

      if (!promptValue) return null;
      const { rollMode, powerRolls } = promptValue;

      DrawSteelChatMessage.applyRollMode(messageData, rollMode);
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

        // Filter to the non-zero damage tiers and map them to the tier damage in one loop.
        const damageEffects = this.power.effects.documentsByType.damage.reduce((effects, currentEffect) => {
          const damage = currentEffect.damage[`tier${tierNumber}`];
          if (Number(damage.value) !== 0) effects.push(damage);
          return effects;
        }, []);

        for (const damageEffect of damageEffects) {
          // If the damage types size is only 1, get the only value. If there are multiple, set the type to the returned value from the dialog.
          let damageType = "";
          if (damageEffect.types.size === 1) damageType = damageEffect.types.first();
          else if (damageEffect.types.size > 1) damageType = baseRoll.options.damageSelection;

          const damageLabel = ds.CONFIG.damageTypes[damageType]?.label ?? damageType ?? "";
          const flavor = game.i18n.format("DRAW_STEEL.Item.ability.DamageFlavor", { type: damageLabel });
          const damageRoll = new DamageRoll(String(damageEffect.value), rollData, { flavor, type: damageType });
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

  /* -------------------------------------------------- */

  /**
   * An alias of {@linkcode use}.
   */
  async roll(options = {}) {
    this.use(options);
  }

  /* -------------------------------------------------- */

  /**
   * Modify the options object based on conditions that apply to ability Power Rolls regardless of target.
   * @param {Partial<AbilityUseOptions>} options Options for the dialog.
   */
  getActorModifiers(options) {
    if (!this.actor) return;
    //TODO: CONDITION CHECKS

    // Restrained conditions check
    if (this.actor.statuses.has("restrained")) options.modifiers.banes += 1;
  }

  /* -------------------------------------------------- */

  /**
   * Get the modifiers based on conditions that apply to ability Power Rolls specific to a target.
   * @param {DrawSteelToken} target A target of the Ability Roll.
   * @returns {PowerRollModifiers}
   */
  getTargetModifiers(target) {
    const modifiers = {
      banes: 0,
      edges: 0,
      bonuses: 0,
    };
    const targetActor = target.actor;
    const token = canvas.tokens.controlled[0]?.actor === this.actor ? canvas.tokens.controlled[0] : null;

    //TODO: ALL CONDITION CHECKS

    // Modifiers requiring just the targeted token to have an actor
    if (targetActor) {
      // Frightened condition checks
      if (DrawSteelActiveEffect.isStatusSource(this.actor, targetActor, "frightened")) modifiers.banes += 1; // Attacking the target frightening the actor
      if (DrawSteelActiveEffect.isStatusSource(targetActor, this.actor, "frightened")) modifiers.edges += 1; // Attacking the target the actor has frightened

      // Grabbed condition check - targeting a non-source adds a bane
      if (DrawSteelActiveEffect.isStatusSource(this.actor, targetActor, "grabbed") === false) modifiers.banes += 1;
      // Restrained condition check - targeting restrained gets an edge
      if (targetActor.statuses.has("restrained")) modifiers.edges += 1;
    }

    // Modifiers requiring just a controlled token
    if (token) {
      // Flanking checks
      if (this.keywords.has("melee") && this.keywords.has("strike") && token.isFlanking(target)) modifiers.edges += 1;
    }

    // Modifiers requiring both a controlled token and the targeted token to have an actor
    if (token && targetActor) {
      //Taunted checks - attacking a token other than the taunted source while having LOE to the taunted source gets a double bane
      if (DrawSteelActiveEffect.isStatusSource(this.actor, targetActor, "taunted") === false) {
        const tauntedSource = fromUuidSync(this.actor.system.statuses.taunted.sources.first());
        const activeTokens = tauntedSource?.getActiveTokens?.() ?? [];

        for (const tauntedSourceToken of activeTokens) {
          if (!token.hasLineOfEffect(tauntedSourceToken)) continue;
          modifiers.banes += 2;
          break;
        }
      }
    }

    return modifiers;
  }

  /* -------------------------------------------------- */

  /**
   * Determine if an Active Effect or a status is restricting this ability.
   * @returns {boolean}
   */
  get restricted() {
    if (!this.actor) return false;

    // Checking if active effects have restricted this ability based on type or _dsid
    const restrictions = this.actor.system.restrictions;
    if (restrictions.type.has(this.type)) return true;
    if (restrictions.dsid.has(this.parent.dsid)) return true;

    return false;
  }
}
