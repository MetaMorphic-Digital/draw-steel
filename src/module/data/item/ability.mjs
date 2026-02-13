import { systemPath } from "../../constants.mjs";
import { DrawSteelActiveEffect, DrawSteelChatMessage } from "../../documents/_module.mjs";
import { PowerRoll } from "../../rolls/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { setOptions, validateDSID } from "../helpers.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import DamagePowerRollEffect from "../pseudo-documents/power-roll-effects/damage-effect.mjs";
import BaseItemModel from "./base-item.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 * @import { FormInputConfig } from "@common/data/_types.mjs";
 * @import { PowerRollModifiers } from "../../_types.js";
 * @import DrawSteelToken from "../../canvas/placeables/token.mjs"
 */

const fields = foundry.data.fields;

/**
 * Special main actions, maneuvers, and more that a creature can use to affect other creatures and objects, and the environment.
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

    // Can be expanded over time for automation
    schema.prerequisites = new fields.SchemaField({
      value: new fields.StringField({ required: true }),
      dsid: new fields.SetField(setOptions({
        validate: validateDSID,
        validationError: game.i18n.localize("DRAW_STEEL.SOURCE.InvalidDSID"),
      })),
      level: new fields.NumberField({ required: true, integer: true, positive: true }),
    });

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
        reactive: new fields.BooleanField(),
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

    this.power.roll.enabled = !this.power.roll.reactive && (this.power.effects.size > 0);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  preparePostActorPrepData() {
    super.preparePostActorPrepData();
    this._applyAbilityBonuses();

    if (!this.power.roll.reactive && this.actor.system.characteristics) {
      for (const chr of this.power.roll.characteristics) {
        const c = this.actor.system.characteristics[chr];
        if (!c) continue;
        if (c.value >= this.power.characteristic.value) {
          this.power.characteristic.key = chr;
          this.power.characteristic.value = c.value;
        }
      }
    }

    // Prepare PRE data that relies on ability data prep being complete (e.g. treasure damage bonuses).
    for (const effect of this.power.effects) {
      effect.preparePostAbilityPrepData();
    }
  }

  /* -------------------------------------------------- */

  /**
   * Adds kit bonuses as native "active effect" like adjustments.
   * @protected
   */
  _applyAbilityBonuses() {
    // Apply keyword modifiers first to ensure later effects operate on the modified set
    for (const bonus of (this.actor.system._abilityBonuses ?? [])) {
      if (bonus.key !== "keyword") continue;
      if (bonus.mode !== CONST.ACTIVE_EFFECT_MODES.ADD) continue;
      if (!bonus.filters.keywords.isSubsetOf(this.keywords)) continue;

      this.keywords.add(bonus.value);
    }

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
          // TODO: Remove in v14 with non-persisted schema fields.
          const field = (bonus.key.startsWith("damage.bonuses")) ? new fields.NumberField({ integer: true }) : DamagePowerRollEffect.schema.getField(bonus.key);
          const firstDamageEffect = this.power.effects.find(effect => effect.type === "damage");
          if (!firstDamageEffect) return;
          const currentValue = foundry.utils.getProperty(firstDamageEffect, bonus.key);
          foundry.utils.setProperty(firstDamageEffect, bonus.key, field.applyChange(currentValue, this, bonus));
        }
      }

      const forcedPrefix = "forced.";
      if (bonus.key.startsWith(forcedPrefix)) {
        const key = bonus.key.substring(forcedPrefix.length);
        // Apply forced movement bonuses to all forced movement effects
        const forcedEffects = this.power.effects.filter(effect => effect.type === "forced");
        for (const effect of forcedEffects) {
          const currentBonuses = foundry.utils.getProperty(effect, "bonuses") ?? {};
          // Bonus change objects are stored as strings, convert to Number
          foundry.utils.setProperty(effect, "bonuses", { ...currentBonuses, [key]: Number(bonus.value) });
        }
      }

      if (bonus.key === "potency") {
        // For potency effects, apply to all power roll effects and all tiers
        for (const effect of this.power.effects) {
          for (const tierNumber of [1, 2, 3]) {
            const key = `${effect.constructor.TYPE}.tier${tierNumber}.potency.value`;
            const formulaField = effect.schema.getField(key);
            const currentValue = foundry.utils.getProperty(effect, key);
            foundry.utils.setProperty(effect, key, formulaField.applyChange(currentValue, this, bonus));
          }
        }
      }

      if (bonus.key.startsWith("power.")) {
        switch (bonus.key) {
          case "power.roll.banes":
            this.power.roll.banes = this.power.roll.banes ?? 0 + (Number(bonus.value) || 0);
            break;
          case "power.roll.edges":
            this.power.roll.edges = this.power.roll.edges ?? 0 + (Number(bonus.value) || 0);
            break;
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
    // If unspecified assume all three tiers are desired for display
    if (!(("tier1" in config) || ("tier2" in config) || ("tier3" in config))) {
      config.tier1 = config.tier2 = config.tier3 = this.power.effects.size > 0;
    }

    // Ability embeds do not have citations
    const embed = document.createElement("document-embed");
    embed.classList.add("draw-steel", "ability");
    if (config.includeName !== false) embed.innerHTML = `<h5>${config.cite ? this.parent.toAnchor().outerHTML : this.parent.name}</h5>`;
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

    context.powerRollEffects = {};
    for (const tier of [1, 2, 3]) {
      context.powerRollEffects[`tier${tier}`] = await this.powerRollText(tier);
    }
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

  /**
   * Produces the power roll text for a given tier.
   * @param {1 | 2 | 3} tier
   * @returns {Promise<string>} An HTML string.
   */
  async powerRollText(tier) {
    return this.power.effects.sortedContents.map(effect => effect.toText(tier)).filter(_ => _).join("; ");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    if (this.actor && this.actor.system.characteristics) {
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
      type: "standard",
      rolls: [],
      title: this.parent.name,
      content: this.parent.name,
      system: {
        parts: [{
          type: "abilityUse",
          abilityUuid: this.parent.uuid,
        }],
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
      options.modifiers.banes = (options.modifiers.banes ?? 0) + (this.power.roll.banes ?? 0);
      options.modifiers.edges = (options.modifiers.edges ?? 0) + (this.power.roll.edges ?? 0);
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
      const { rollMode, rolls, baseRoll } = promptValue;

      // Base roll for DSN purposes
      messageData.rolls.push(baseRoll);

      DrawSteelChatMessage.applyRollMode(messageData, rollMode);

      // Power Rolls grouped by tier of success
      const groupedRolls = Object.groupBy(rolls, roll => roll.product);

      // Each tier group gets a message part. Rolls within a group are in the same message part
      for (const tierNumber in groupedRolls) {
        const rollPart = {
          type: "abilityResult",
          rolls: groupedRolls[tierNumber],
          tier: tierNumber,
          abilityUuid: this.parent.uuid,
        };

        for (const damageEffect of this.power.effects.documentsByType.damage) {
          const damageRoll = damageEffect.toDamageRoll(tierNumber, { damageSelection: baseRoll.options.damageSelection });
          if (!damageRoll) continue;
          await damageRoll.evaluate();
          rollPart.rolls.push(damageRoll);
          // If there's a roll, add it to the base message data for DSN purposes
          if (!damageRoll.isDeterministic) messageData.rolls.push(damageRoll);
        }

        messageData.system.parts.push(rollPart);
      }
    }
    return DrawSteelChatMessage.create(messageData);
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
      modifiers.edges += foundry.utils.getProperty(targetActor, "system.combat.targetModifiers.edges") ?? 0;
      modifiers.banes += foundry.utils.getProperty(targetActor, "system.combat.targetModifiers.banes") ?? 0;

      // Frightened condition checks
      if (DrawSteelActiveEffect.isStatusSource(this.actor, targetActor, "frightened")) modifiers.banes += 1; // Attacking the target frightening the actor
      if (DrawSteelActiveEffect.isStatusSource(targetActor, this.actor, "frightened")) modifiers.edges += 1; // Attacking the target the actor has frightened

      // Grabbed condition check - targeting a non-source adds a bane
      if (DrawSteelActiveEffect.isStatusSource(this.actor, targetActor, "grabbed") === false) modifiers.banes += 1;
      // Restrained condition check - targeting restrained gets an edge
      if (targetActor.statuses.has("restrained")) modifiers.edges += 1;
      // Surprised condition check - targeting surprised gets an edge
      if (targetActor.statuses.has("surprised")) modifiers.edges += 1;
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
        const tauntedSourceUuid = this.actor.system.statuses.taunted.sources.first();
        const isTauntedSourceTargeted = !!game.user.targets.find(target => target.actor?.uuid === tauntedSourceUuid);
        if (!isTauntedSourceTargeted) {
          const tauntedSource = fromUuidSync(tauntedSourceUuid);
          const activeTokens = tauntedSource?.getActiveTokens?.() ?? [];

          for (const tauntedSourceToken of activeTokens) {
            if (!token.hasLineOfEffect(tauntedSourceToken)) continue;
            modifiers.banes += 2;
            break;
          }
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
