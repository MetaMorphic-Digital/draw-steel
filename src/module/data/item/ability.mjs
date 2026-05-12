import { DrawSteelActiveEffect, DrawSteelChatMessage } from "../../documents/_module.mjs";
import { requiredInteger, setOptions, validateDSID } from "../helpers.mjs";
import { systemID, systemPath } from "../../constants.mjs";
import AbilityConfigurationDialog from "../../applications/apps/ability-configuration-dialog.mjs";
import BaseItemModel from "./base-item.mjs";
import DamagePowerRollEffect from "../pseudo-documents/power-roll-effects/damage-effect.mjs";
import FormulaField from "../fields/formula-field.mjs";
import PowerRoll from "../../rolls/power.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import { DatabaseCreateOperation } from "@common/abstract/_types.mjs";
 * @import RegionDocument from "@client/documents/region.mjs";
 * @import { RegionPlacementOptions } from "@client/canvas/layers/_types.mjs"
 * @import { PowerRollModifiers } from "../../_types.js";
 * @import DrawSteelToken from "../../canvas/placeables/token.mjs";
 * @import DrawSteelTokenDocument from "../../documents/token.mjs";
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
        SpecialEffect: "system.effects",
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
        validationError: _loc("DRAW_STEEL.SOURCE.InvalidDSID"),
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
      primary: new FormulaField({ deterministic: true, initial: "1" }),
      secondary: new FormulaField({ deterministic: true, initial: "1" }),
      tertiary: new FormulaField({ deterministic: true, initial: "1" }),
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
        formula: new FormulaField({ blank: true, initial: "@chr", placeholder: "@chr" }),
        characteristics: new fields.SetField(setOptions()),
      }),
      effects: new ds.data.fields.CollectionField(ds.data.pseudoDocuments.powerRollEffects.BasePowerRollEffect),

      characteristic: new fields.SchemaField({
        key: new fields.StringField({ choices: Object.keys(ds.CONFIG.characteristics) }),
        value: requiredInteger({ initial: -5, min: null }),
      }, { persisted: false }),
    });

    schema.effects = new ds.data.fields.CollectionField(ds.data.pseudoDocuments.specialEffects.BaseSpecialEffect);

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

    // 1.1 effect migration, based on Document._addDataFieldMigration
    const { hasProperty, getProperty, setProperty, deleteProperty } = foundry.utils;
    const { Document } = foundry.abstract;
    if (!hasProperty(data, "effects")) {
      const spendID = "spend".padEnd(16, "0");
      if ((getProperty(data, "spend.value") || getProperty(data, "spend.text")) && !hasProperty(data, `effects.${spendID}`)) {
        const value = getProperty(data, "spend.value");
        setProperty(data, `effects.${spendID}`, {
          _id: spendID,
          type: "spend",
          sort: CONST.SORT_INTEGER_DENSITY, // guarantees after "after" effects if present
          resource: {
            value,
            multiple: value === null,
          },
          description: `<p>${getProperty(data, "spend.text") ?? ""}</p>`,
        });
        deleteProperty(data, "spend");
      }
      if (data.effect?.before) {
        const beforeID = "before".padEnd(16, "0");
        Document._addDataFieldMigration(data, "effect.before", `effects.${beforeID}`, (data) => {
          const description = getProperty(data, "effect.before");
          return {
            _id: beforeID,
            type: "base",
            description,
            before: true,
          };
        });
      }
      if (data.effect?.after) {
        const afterID = "after".padEnd(16, "0");
        Document._addDataFieldMigration(data, "effect.after", `effects.${afterID}`, (data) => {
          const description = getProperty(data, "effect.after");
          return {
            _id: afterID,
            type: "base",
            description,
          };
        });
      }
    }

    return super.migrateData(data);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.#resourceName = null;

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

    // Parse distance formulas
    const rollData = this.parent.getRollData();
    const contextName = this.parent.uuid;
    Object.assign(this.distance, {
      primary: ds.utils.evaluateFormula(this.distance.primary, rollData, { contextName }),
      secondary: ds.utils.evaluateFormula(this.distance.secondary, rollData, { contextName }),
      tertiary: ds.utils.evaluateFormula(this.distance.tertiary, rollData, { contextName }),
    });

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
    const replacementData = this.parent.getRollData();

    // Apply keyword modifiers first to ensure later effects operate on the modified set
    for (const bonus of (this.actor.system._abilityBonuses ?? [])) {
      if (bonus.key !== "keyword") continue;
      if (bonus.type !== "add") continue;
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
            this.distance.primary = distanceValueField.applyChange(this.distance.primary, this, bonus, { replacementData });
            break;
          case "meleeRanged":
            if (bonus.filters.keywords.has("melee")) this.distance.primary = distanceValueField.applyChange(this.distance.primary, this, bonus, { replacementData });
            if (bonus.filters.keywords.has("ranged")) this.distance.secondary = distanceValueField.applyChange(this.distance.secondary, this, bonus, { replacementData });
            break;
          case "wall":
          case "cube":
            this.distance.secondary = distanceValueField.applyChange(this.distance.secondary, this, bonus, { replacementData });
            break;
          case "line":
            this.distance.tertiary = distanceValueField.applyChange(this.distance.tertiary, this, bonus, { replacementData });
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
          const field = DamagePowerRollEffect.schema.getField(bonus.key);
          const firstDamageEffect = this.power.effects.documentsByType.damage.sort((a, b) => a.sort - b.sort)[0];
          // Damage bonuses only apply to the first entry
          if (!firstDamageEffect || !field) continue;
          const currentValue = foundry.utils.getProperty(firstDamageEffect, bonus.key);
          foundry.utils.setProperty(firstDamageEffect, bonus.key, field.applyChange(currentValue, this, bonus, { replacementData }));
        }
      }

      if (bonus.key.startsWith("forced")) {
        // Forced movement bonuses apply to all entries
        for (const effect of this.power.effects.documentsByType.forced) {
          const field = effect.schema.getField(bonus.key);
          if (!field) continue;
          const currentBonus = foundry.utils.getProperty(effect, bonus.key) ?? 0;
          foundry.utils.setProperty(effect, bonus.key, field.applyChange(currentBonus, this, bonus, { replacementData }));
        }
      }

      if (bonus.key === "potency") {
        // For potency effects, apply to all power roll effects and all tiers
        for (const effect of this.power.effects) {
          for (const tierNumber of [1, 2, 3]) {
            const key = `${effect.constructor.TYPE}.tier${tierNumber}.potency.value`;
            const formulaField = effect.schema.getField(key);
            const currentValue = foundry.utils.getProperty(effect, key);
            foundry.utils.setProperty(effect, key, formulaField.applyChange(currentValue, this, bonus, { replacementData }));
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

    labels.distance = _loc(ds.CONFIG.abilities.distances[this.distance.type]?.embedLabel, { ...this.distance });

    const targetConfig = ds.CONFIG.abilities.targets[this.target.type] ?? { embedLabel: "COMMON.Unknown" };
    if (this.target.custom) labels.target = this.target.custom;
    // == null covers null & undefined
    else if (this.target.value === null) labels.target = targetConfig.all;
    if (!labels.target) {
      // Non-plural dependent labels
      if (game.i18n.has(targetConfig.embedLabel)) labels.target = _loc(targetConfig.embedLabel);
      else {
        const labelSuffix = game.i18n.pluralRules.select(this.target.value);
        labels.target = _loc(`${targetConfig.embedLabel}.${labelSuffix}`, { value: this.target.value });
      }
    }

    return labels;
  }

  /* -------------------------------------------------- */

  /**
   * Cached reference to the resource name, reset during data prep.
   * @type {string}
   */
  #resourceName = null;

  /**
   * A cached reference to the heroic resource consumed by this ability.
   * @type {string}
   */
  get resourceName() {
    this.#resourceName ??= this.actor?.system.coreResource?.name;

    if (!this.#resourceName && (this.prerequisites.dsid.size === 1)) {
      const dsid = this.prerequisites.dsid.first();
      let classEntry = ds.registry.class.filter(e => e.dsid === dsid).at(-1);
      if (!classEntry) {
        const subclass = ds.registry.subclass.filter(e => e.dsid === dsid).at(-1);
        if (subclass) classEntry = ds.registry.class.filter(e => e.dsid === subclass.classLink).at(-1);
      }
      if (classEntry) this.#resourceName = classEntry.primary;
    }

    return this.#resourceName ??= _loc("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    const config = ds.CONFIG.abilities;
    const formattedLabels = this.formattedLabels;

    context.resourceName = this.resourceName;

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

    context.beforeEffects = [];
    context.afterEffects = [];
    for (const effect of this.effects.sortedContents) {
      const displayData = {
        label: effect.label,
        text: await enrichHTML(effect.description, { relativeTo: this.parent }),
      };
      context[effect.before ? "beforeEffects" : "afterEffects"].push(displayData);
    }
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
   * @param {Partial<AbilityUseOptions>} [config={}]        Usage Configuration.
   * @param {ApplicationConfiguration} [dialogOptions={}]   Options to be forwarded to the roll dialog.
   * @param {DatabaseCreateOperation} [messageOptions]      Options to be forwarded to the final created chat message.
   * @returns {Promise<DrawSteelChatMessage | null>}
   * TODO: Add hooks based on discussion with module authors.
   */
  async use(config = {}, dialogOptions = {}, messageOptions = {}) {
    if (!this.actor) throw new Error("Abilities can only be used while embedded");

    const coreResource = this.actor.system.coreResource ?? {};

    const dialogConfig = foundry.utils.mergeObject({
      ability: this.parent,
      context: {
        resource: {
          current: foundry.utils.getProperty(coreResource.target, coreResource.path),
          value: this.resource,
          name: coreResource.name,
        },
      },
      window: {
        title: this.parent.name,
      },
    }, dialogOptions);

    if (this.power.roll.enabled) {
      const formula = this.power.roll.formula ? `2d10 + ${this.power.roll.formula}` : "2d10";
      const rollData = this.parent.getRollData();

      dialogConfig.context.formula ??= PowerRoll.replaceFormulaData(formula, rollData, { missing: "0" });

      dialogConfig.context.modifiers ??= {};
      dialogConfig.context.modifiers.banes = (config.modifiers?.banes ?? 0) + (this.power.roll.banes ?? 0);
      dialogConfig.context.modifiers.edges = (config.modifiers?.edges ?? 0) + (this.power.roll.edges ?? 0);
      dialogConfig.context.modifiers.bonuses ??= 0;

      dialogConfig.context.targets ??= game.user.targets.reduce((accumulator, target) => {
        accumulator[target.id] = {
          tokenUuid: target.document.uuid,
          uuid: target.actor?.uuid ?? "",
          modifiers: this.getTargetModifiers(target),
        };
        return accumulator;
      }, {});

      this.getActorModifiers(dialogConfig.context);
    }

    const fd = await AbilityConfigurationDialog.create(dialogConfig);

    if (!fd) return null;

    const abilityPartId = "abilityUse".padEnd(16, "0");

    const messageData = foundry.utils.mergeObject({
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.actor }),
      type: "standard",
      rolls: [],
      title: this.parent.name,
      content: this.parent.name,
      system: {
        parts: {
          [abilityPartId]: {
            _id: abilityPartId,
            type: "abilityUse",
            abilityUuid: this.parent.uuid,
          },
        },
      },
      flags: { core: { canPopout: true } },
    }, messageOptions.data ?? {});

    delete messageOptions.data;

    DrawSteelChatMessage.applyMode(messageData, fd.messageMode);

    if (this.power.roll.enabled) {

      const baseRoll = new PowerRoll(dialogConfig.context.formula);
      await baseRoll.evaluate();
      messageData.rolls.push(baseRoll);

      const evaluatedRolls = [];

      for (const context of fd.rolls) {
        const roll = new PowerRoll(dialogConfig.context.formula, {}, { flavor: _loc(PowerRoll.TYPES.ability.label), ...context });
        roll.terms[0] = baseRoll.terms[0];
        await roll.evaluate({ allowInteractive: false });

        evaluatedRolls.push(roll);
      }

      // Power Rolls grouped by tier of success
      const groupedRolls = Object.groupBy(evaluatedRolls, roll => roll.product);

      // Each tier group gets a message part. Rolls within a group are in the same message part
      for (const tierNumber in groupedRolls) {
        const partId = `tier${tierNumber}Result`.padEnd(16, "0");

        const rollPart = {
          _id: partId,
          type: "abilityResult",
          rolls: groupedRolls[tierNumber],
          tier: tierNumber,
          abilityUuid: this.parent.uuid,
        };

        for (const damageEffect of this.power.effects.documentsByType.damage) {
          const damageRoll = damageEffect.toDamageRoll(tierNumber, { damageSelection: fd.damage });
          if (!damageRoll) continue;
          await damageRoll.evaluate();
          rollPart.rolls.push(damageRoll);
          // If there's a roll, add it to the base message data for DSN purposes
          if (!damageRoll.isDeterministic) messageData.rolls.push(damageRoll);
        }

        messageData.system.parts[partId] = rollPart;
      }
    }

    let resourceSpend = fd.resource ?? 0;

    for (const spend of Object.values(fd.spend ?? {})) resourceSpend += spend;

    if (resourceSpend) {
      messageData.flavor = _loc("DRAW_STEEL.Item.ability.ConfigureUse.SpentFlavor", {
        value: resourceSpend,
        name: this.actor.system.coreResource.name,
      });
    }

    if (resourceSpend) await this.actor?.system.updateResource(resourceSpend * -1);
    return DrawSteelChatMessage.create(messageData, messageOptions);
  }

  /* -------------------------------------------------- */

  /**
   * An alias of {@linkcode use}.
   */
  async roll(config = {}, dialogOptions = {}, messageOptions = {}) {
    return this.use(config, dialogOptions, messageOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Modify the options object based on conditions that apply to ability Power Rolls regardless of target.
   * @param {Partial<AbilityUseOptions>} options Options for the dialog.
   */
  getActorModifiers(options) {
    if (!this.actor) return;

    if (this.actor.statuses.has("weakened")) options.modifiers.banes += 1;
    if (this.actor.statuses.has("restrained")) options.modifiers.banes += 1;
    // TODO: Consider hook
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

  /* -------------------------------------------------- */

  /**
   * Does this ability have a valid, inferrable template to place?
   * @type {boolean}
   */
  get hasTemplate() {
    return typeof ds.CONFIG.abilities.distances[this.distance.type]?.area === "object";
  }

  /* -------------------------------------------------- */

  /**
   * Create a region template based on this ability's distance data.
   * @param {RegionPlacementOptions} [options={}] Options to forward to canvas.regions.placeRegion.
   * @returns {Promise<RegionDocument>} The Region document that was placed or null if
   *  - the placements of all shapes were skipped,
   *  - the dismiss key was pressed,
   *  - the game is paused and the user is not a GM, or
   *  - the Region creation was rejected by preCreate.
   */
  async placeTemplate(options = {}) {
    if (!this.hasTemplate) {
      const msg = _loc("DRAW_STEEL.Item.ability.NoArea", { ability: this.parent.name });
      ui.notifications.error(msg, { console: false });
      throw new Error(msg);
    }

    // Special case
    if (this.distance.type === "aura") options.attachToToken ??= true;

    /** @type {DrawSteelTokenDocument} */
    const tokenInfo = this.actor.token ?? this.actor.getActiveTokens(true, true)[0];

    const { type, count, ...shapeProperties } = ds.CONFIG.abilities.distances[this.distance.type].area;

    const shapeCount = typeof count === "string" ? this.distance[count] : 1;

    const shapes = Array.fromRange(shapeCount).map(() => {
      const shapeData = { type, gridBased: true, x: 0, y: 0 };
      for (const [key, path] of Object.entries(shapeProperties)) {
        shapeData[key] = this.distance[path] * canvas.dimensions.distancePixels;
      }
      // additional adjustments to conform to DS rules
      switch (type) {
        case "rectangle": // Special wall handling since it's a bunch of 1 x 1 spots.
          shapeData.width ??= canvas.dimensions.distancePixels;
          shapeData.height ??= canvas.dimensions.distancePixels;
          shapeData.anchorX = 0.5;
          shapeData.anchorY = 0.5;
          break;
        case "emanation":
          shapeData.base = {
            // TODO: Infer if the target type includes "self"
            hole: true,
            type: "token",
            x: 0,
            y: 0,
            width: tokenInfo.width,
            height: tokenInfo.width,
            shape: tokenInfo.shape,
          };
          break;
      }

      return shapeData;
    });

    const regionData = {
      shapes,
      name: this.parent.name,
      color: game.user.color,
      levels: [canvas.level.id],
      highlightMode: "coverage",
      displayMeasurements: true,
      visibility: CONST.REGION_VISIBILITY.OBSERVER,
      ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
      flags: {
        [systemID]: {
          abilitySource: this.parent.uuid,
        },
      },
    };

    return canvas.regions.placeRegion(regionData, options);
  }
}
