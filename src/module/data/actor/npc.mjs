import { requiredInteger, setOptions } from "../helpers.mjs";
import { systemID, systemPath } from "../../constants.mjs";
import CreatureModel from "./creature.mjs";
import DamageRoll from "../../rolls/damage.mjs";
import { DrawSteelActiveEffect } from "../../documents/_module.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import SourceModel from "../models/source.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 * @import AbilityModel from "../item/ability.mjs";
 * @import { MaliceModel } from "../settings/_module.mjs";
 * @import { EmbedDisplayFlags } from "../item/_types";
 * @import DamagePowerRollEffect from "../pseudo-documents/power-roll-effects/damage-effect.mjs";
 */

/**
 * A nonplayer character, usually created and run by the Director.
 */
export default class NPCModel extends CreatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "npc",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat([
    "DRAW_STEEL.SOURCE",
    "DRAW_STEEL.Actor.npc",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.negotiation = new fields.SchemaField({
      interest: requiredInteger({ initial: 5 }),
      patience: requiredInteger({ initial: 5 }),
      motivations: new fields.SetField(setOptions()),
      pitfalls: new fields.SetField(setOptions()),
      impression: requiredInteger({ initial: 1 }),
    });

    schema.ev = requiredInteger({ initial: 4 });

    schema.monster = new fields.SchemaField({
      freeStrike: requiredInteger({ initial: 0 }),
      keywords: new fields.SetField(setOptions()),
      level: requiredInteger({ initial: 1 }),
      role: new fields.StringField({ required: true }),
      organization: new fields.StringField({ required: true }),
      withCaptainEffect: new LocalDocumentField(DrawSteelActiveEffect || foundry.documents.ActiveEffect, { required: false }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(data) {
    switch (data.monster?.organization) {
      // release updates
      case "band":
        data.monster.organization = "horde";
        break;
      case "troop":
        data.monster.organization = "elite";
        break;
    }

    // 0.10 Object release
    foundry.abstract.Document._addDataFieldMigration(data, "monster.ev", "ev");

    return super.migrateData(data);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get level() {
    return this.monster.level;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isMinion() {
    return this.monster.organization === "minion";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const updates = {};

    const compendium = game.packs.get(this.parent.pack);
    if (compendium) {
      if (compendium.metadata.packageType === "system") foundry.utils.setProperty(updates, "source.license", "Draw Steel Creator License");
      else if (compendium.metadata.packageType === "module") {
        const m = game.modules.get(compendium.metadata.packageName);
        const defaultBook = foundry.utils.getProperty(m, "flags.draw-steel.defaultBook");
        if (defaultBook) foundry.utils.setProperty(updates, "source.book", defaultBook);
        const defaultLicense = foundry.utils.getProperty(m, "flags.draw-steel.defaultLicense");
        if (defaultLicense) foundry.utils.setProperty(updates, "source.license", defaultLicense);
      }
    }

    this.updateSource(updates);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.source.prepareData();

    const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });

    const monsterKeywords = ds.CONFIG.monsters.keywords;
    const keywordList = Array.from(this.monster.keywords).map(k => monsterKeywords[k]?.label).filter(_ => _);
    this.monster.keywords.list = keywordList;
    this.monster.keywords.labels = keywordFormatter.format(keywordList);

    const organizations = ds.CONFIG.monsters.organizations;
    this.monster.organizationLabel = organizations[this.monster.organization]?.label ?? "";

    const roles = ds.CONFIG.monsters.roles;
    this.monster.roleLabel = roles[this.monster.role]?.label ?? "";

    const evData = { value: this.ev };
    this.evLabel = this.isMinion
      ? _loc("DRAW_STEEL.Actor.base.EVLabel.Minion", evData)
      : _loc("DRAW_STEEL.Actor.base.EVLabel.Other", evData);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get coreResource() {
    return {
      name: _loc("DRAW_STEEL.Setting.Malice.Label"),
      /** @type {MaliceModel} */
      target: game.actors.malice,
      path: "value",
      minimum: 0,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Fetch the traits of this creature's free strike.
   * The value is stored in `this.monster.freeStrike`.
   * @returns {import("./_types").FreeStrike}
   */
  get freeStrike() {
    /** @type {DrawSteelItem & {system: AbilityModel}} */
    const signature = this.parent.items.find(i => (i.type === "ability") && (i.system.category === "signature"));
    /** @type {Set<string>} */
    const keywords = signature ? new Set(["magic", "psionic", "weapon"]).intersection(signature.system.keywords) : new Set();

    /** @type {DamagePowerRollEffect} */
    const firstDamage = signature?.system.power.effects.find(e => e.type === "damage");

    const freeStrike = {
      value: this.monster.freeStrike,
      keywords: keywords.add("strike"),
      type: firstDamage?.damage.tier1.types.first() ?? "",
      range: {
        melee: 1,
        ranged: 5,
      },
    };
    switch (signature?.system.distance.type) {
      case "melee":
        freeStrike.range.melee = Math.max(1, signature.system.distance.primary ?? 0);
        break;
      case "ranged":
        freeStrike.range.ranged = Math.max(5, signature.system.distance.primary ?? 0);
        break;
      case "meleeRanged":
        freeStrike.range.melee = Math.max(1, signature.system.distance.primary ?? 0);
        freeStrike.range.ranged = Math.max(5, signature.system.distance.secondary ?? 0);
        break;
    }

    return freeStrike;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options) {
    // All NPCs are rendered inline
    config.inline = true;

    const context = {
      actor: this.parent,
      characteristics: this._getCharacteristics(false),
      damageIW: this._getImmunitiesWeaknesses(),
      itemEmbeds: await this._getItemEmbeds(config),
      monsterKeywords: this._getMonsterKeywords().join(", "),
      movement: this._getMovement(true).list,
      system: this,
      systemFields: this.schema.fields,
      withCaptain: await this._getWithCaptainDescription(options),
    };

    const embed = document.createElement("div");

    embed.classList.add("draw-steel", "actor", "npc", this.monster.role || "no-role");

    embed.innerHTML = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/actor/npc.hbs"), context);

    return embed;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare embeds of Items for the NPC embed.
   * @param {DocumentHTMLEmbedConfig} config  Configuration for embedding behavior.
   * @returns {Promise<HTMLElement[]>}
   */
  async _getItemEmbeds(config) {
    let abilities = this._getOrderedAbilities(config);
    const { startFeatures, endFeatures } = this._getOrderedFeatures();
    const orderedItems = [...startFeatures, ...abilities, ...endFeatures];

    return Promise.all(orderedItems.map(async (item) => {
      const embed = await item.system.toEmbed({ includeName: true });
      embed.icon = item.system.getStatBlockIcon?.();
      return embed;
    }));
  }

  /* -------------------------------------------------- */

  /**
   * Orders Ability Items in the same order
   * as the keys in ds.CONFIG.abilities.types.
   * @param {DocumentHTMLEmbedConfig} config  Configuration for embedding behavior.
   * @returns {DrawSteelItem[]}
   */
  _getOrderedAbilities(config) {
    const abilityTypes = Object.keys(ds.CONFIG.abilities.types);
    return this.parent.items.documentsByType.ability
      // Ancestry malice do not show by default
      .filter(i => config.showAllItems || (i.system.category !== "ancestryMalice"))
      .sort((a, b) => abilityTypes.indexOf(a.system.type) - abilityTypes.indexOf(b.system.type) || a.sort - b.sort);
  }

  /* -------------------------------------------------- */

  /**
   * Orders Feature Items via the `embedDisplay.displayAtEnd` flag.
   * @returns {{ startFeatures: DrawSteelItem[], endFeatures: DrawSteelItem[] }}
   */
  _getOrderedFeatures() {
    const features = this.parent.items.documentsByType.feature.toSorted((a, b) => a.sort - b.sort);

    const [ startFeatures, endFeatures ] = features.partition(f => {
      return !!f.getFlag(systemID, "embedDisplay.displayAtEnd");
    });
    return { startFeatures, endFeatures };
  }

  /* ------------------------------------------------- */

  /** @inheritdoc */
  onEmbed(element) {
    element.querySelector("a[data-action='openSheet']")?.addEventListener("click", () => this.parent.sheet.render({ force: true }));
  }

  /* -------------------------------------------------- */

  /**
   * Perform a free strike against one or more enemies.
   * If the user is not a director, this creates a chat message with a damage roll.
   * @param {object} [options]
   * @param {DrawSteelActor[]} [options.targets]    Actors to apply the free strike damage to.
   *                                                Defaults to all current targets.
   * @param {boolean} [options.configure]           Configure which targets damage is applied to.
   * @returns {Promise<void>}
   */
  async performFreeStrike({ targets, configure = true } = {}) {
    const freeStrike = this.freeStrike;
    if (!game.user.isGM) {

      const title = _loc("DRAW_STEEL.Actor.npc.FreeStrike.DialogTitle");

      const roll = new DamageRoll(String(freeStrike.value), {
        type: freeStrike.type,
        flavor: ds.CONFIG.damageTypes[freeStrike.type]?.label,
      });

      await roll.evaluate();

      await DrawSteelChatMessage.create({
        title,
        speaker: DrawSteelChatMessage.getSpeaker({ actor: this.parent }),
        type: "standard",
        "system.parts": [{
          rolls: [roll],
          flavor: title,
          type: "roll",
        }],
        flags: { core: { canPopout: true } },
      });
    }
    if (!targets) {
      try {
        targets = game.user.targets.map(t => t.actor).filter(a => a?.system?.takeDamage).toObject();
      } catch (e) {
        ui.notifications.error("DRAW_STEEL.Actor.npc.FreeStrike.MultiLinked", { localize: true });
        throw (e);
      }
    }
    if (!targets.length) {
      ui.notifications.error("DRAW_STEEL.Actor.npc.FreeStrike.NoTargets", { localize: true });
      return;
    }

    if (configure !== false) {
      const damageLabel = _loc("DRAW_STEEL.Actor.npc.FreeStrike.DialogHeader", {
        value: freeStrike.value,
        type: ds.CONFIG.damageTypes[freeStrike.type]?.label ?? "",
      });
      const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });
      const keywordList = freeStrike.keywords.toObject().map(k => ds.CONFIG.abilities.keywords[k]?.label);

      let content = `<span>${keywordFormatter.format([damageLabel, ...keywordList])}</span>`;

      content += targets.map(a => {
        const checkboxInput = foundry.applications.fields.createCheckboxInput({ name: a.uuid, value: true });
        const formGroup = foundry.applications.fields.createFormGroup({
          label: a.name,
          input: checkboxInput,
          classes: ["inline"],
        });
        // style fix
        const label = formGroup.querySelector("label");
        label.classList.add("checkbox");
        label.style = "font-size: inherit;";
        return formGroup.outerHTML;
      }).join("");

      /** @type {object} */
      const fd = await ds.applications.api.DSDialog.input({
        window: { title: "DRAW_STEEL.Actor.npc.FreeStrike.DialogTitle", icon: "fa-solid fa-burst" },
        content,
        ok: {
          label: "DRAW_STEEL.Actor.npc.FreeStrike.DialogButton",
        },
      });
      if (!fd) return;
      targets = Object.entries(fd).filter(f => f[1]).map(f => fromUuidSync(f[0]));
    }

    for (const actor of targets) {
      actor.system.takeDamage(freeStrike.value, { type: freeStrike.type });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async updateResource(delta) {
    if (!game.user.isGM) {
      ui.notifications.error("DRAW_STEEL.Setting.Malice.PlayerError", { localize: true, console: false });
      throw new Error("Malice can only be updated by a GM");
    }
    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    await game.settings.set(systemID, "malice", { value: malice.value + delta });
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the printable string for the monster's keywords.
   * @returns {string[]}
   */
  _getMonsterKeywords() {
    const monsterKeywords = ds.CONFIG.monsters.keywords;
    return Array.from(this.monster.keywords).map(k => monsterKeywords[k]?.label).filter(_ => _);
  }

  /* ------------------------------------------------- */

  /**
   * Fetches the description for the "With Captain" effect.
   * @param {object} [options] Options to forward to the TextEditor.enrichHTML method.
   * @returns {Promise<string|null>} The inner HTML of the first element of the description.
   *                                 Null if no such effect exists.
   */
  async _getWithCaptainDescription(options = {}) {
    const { withCaptainEffect } = this.monster;
    if (!withCaptainEffect) return null;
    return enrichHTML(withCaptainEffect.description, { ...options, relativeTo: withCaptainEffect });
  }
}
