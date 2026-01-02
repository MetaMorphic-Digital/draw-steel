import { systemID } from "../../constants.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseActorModel from "./base.mjs";
import SourceModel from "../models/source.mjs";

/**
 * @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 * @import AbilityModel from "../item/ability.mjs";
 * @import { MaliceModel } from "../settings/_module.mjs";
 * @import DamagePowerRollEffect from "../pseudo-documents/power-roll-effects/damage-effect.mjs";
 */

/**
 * NPCs are created and controlled by the director.
 */
export default class NPCModel extends BaseActorModel {
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

    schema.monster = new fields.SchemaField({
      freeStrike: requiredInteger({ initial: 0 }),
      keywords: new fields.SetField(setOptions()),
      level: requiredInteger({ initial: 1 }),
      ev: requiredInteger({ initial: 4 }),
      role: new fields.StringField({ required: true }),
      organization: new fields.StringField({ required: true }),
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

    if (!foundry.utils.isEmpty(updates)) this.updateSource(updates);
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

    const data = { value: this.monster.ev };
    this.monster.evLabel = this.isMinion
      ? game.i18n.format("DRAW_STEEL.Actor.npc.EVLabel.Minion", data)
      : game.i18n.format("DRAW_STEEL.Actor.npc.EVLabel.Other", data);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get coreResource() {
    return {
      name: game.i18n.localize("DRAW_STEEL.Setting.Malice.Label"),
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

  /**
   * Perform a free strike against one or more enemies.
   * @param {object} [options]
   * @param {DrawSteelActor[]} [options.targets]    Actors to apply the free strike damage to.
   *                                                Defaults to all current targets.
   * @param {boolean} [options.configure]           Configure which targets damage is applied to.
   * @returns {Promise<void>}
   */
  async performFreeStrike({ targets, configure = true } = {}) {
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
    const freeStrike = this.freeStrike;

    if (configure !== false) {
      const damageLabel = game.i18n.format("DRAW_STEEL.Actor.npc.FreeStrike.DialogHeader", {
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
}
