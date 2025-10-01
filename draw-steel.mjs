import * as canvas from "./src/module/canvas/_module.mjs";
import * as documents from "./src/module/documents/_module.mjs";
import * as applications from "./src/module/applications/_module.mjs";
import * as helpers from "./src/module/helpers/_module.mjs";
import * as rolls from "./src/module/rolls/_module.mjs";
import * as data from "./src/module/data/_module.mjs";
import * as utils from "./src/module/utils/_module.mjs";
import * as DS_CONFIG from "./src/module/config.mjs";
import * as DS_CONST from "./src/module/constants.mjs";

globalThis.ds = {
  canvas,
  documents,
  applications,
  helpers,
  rolls,
  data,
  utils,
  CONST: DS_CONST,
  CONFIG: DS_CONFIG,
};

// Register custom elements.
for (const element of Object.values(applications.elements)) {
  window.customElements.define(element.tagName, element);
}

Hooks.once("init", function () {
  CONFIG.DRAW_STEEL = DS_CONFIG;
  game.system.socketHandler = new helpers.DrawSteelSocketHandler();
  helpers.DrawSteelSettingsHandler.registerSettings();
  applications.apps.DocumentSourceInput.addModuleSources();

  // Assign document classes
  for (const docCls of Object.values(documents)) {
    if (!foundry.utils.isSubclass(docCls, foundry.abstract.Document)) continue;
    CONFIG[docCls.documentName].documentClass = docCls;
  }

  helpers.registerHandlebars();
  const templates = ["templates/embeds/item/ability.hbs", "templates/embeds/item/kit.hbs", "templates/embeds/item/project.hbs"].map(t => DS_CONST.systemPath(t));

  // Assign data models & setup templates
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;
    for (const modelCls of Object.values(models)) {
      if (modelCls.metadata?.type) CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
      if (modelCls.metadata?.icon) CONFIG[doc].typeIcons[modelCls.metadata.type] = modelCls.metadata.icon;
      if (modelCls.metadata?.detailsPartial) templates.push(...modelCls.metadata.detailsPartial);
    }
  }

  // Custom collections
  CONFIG.Actor.collection = documents.collections.DrawSteelActors;

  // Assign canvas-related classes
  CONFIG.Token.objectClass = canvas.placeables.DrawSteelToken;
  CONFIG.Token.rulerClass = canvas.placeables.tokens.DrawSteelTokenRuler;
  CONFIG.Token.hudClass = applications.hud.DrawSteelTokenHUD;
  canvas.placeables.tokens.DrawSteelTokenRuler.applyDSMovementConfig();

  foundry.applications.handlebars.loadTemplates(templates);

  //Remove Status Effects Not Available in DrawSteel
  const toRemove = ["bleeding", "bless", "corrode", "curse", "degen", "disease", "upgrade", "fireShield", "fear", "holyShield", "hover", "coldShield", "magicShield", "paralysis", "poison", "prone", "regen", "restrain", "shock", "silence", "stun", "unconscious", "downgrade"];
  CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !toRemove.includes(effect.id));
  // Status Effect Transfer
  for (const [id, value] of Object.entries(DS_CONFIG.conditions)) {
    CONFIG.statusEffects.push({ id, _id: id.padEnd(16, "0"), ...value });
  }
  for (const [id, value] of Object.entries(DS_CONST.staminaEffects)) {
    CONFIG.statusEffects.push({ id, _id: id.padEnd(16, "0"), ...value });
  }

  // Destructuring some pieces for simplification
  const { Actors, Journal, Items } = foundry.documents.collections;
  const { DocumentSheetConfig } = foundry.applications.apps;

  // Register sheet application classes
  Actors.registerSheet(DS_CONST.systemID, applications.sheets.DrawSteelHeroSheet, {
    types: ["hero"],
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.Character",
  });
  Actors.registerSheet(DS_CONST.systemID, applications.sheets.DrawSteelNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.NPC",
  });
  Items.registerSheet(DS_CONST.systemID, applications.sheets.DrawSteelItemSheet, {
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.Item",
  });
  Journal.registerSheet(DS_CONST.systemID, applications.sheets.DrawSteelJournalEntrySheet, {
    label: "DRAW_STEEL.SHEET.Labels.JournalEntry",
  });

  DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", foundry.applications.sheets.ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, DS_CONST.systemID, applications.sheets.DrawSteelActiveEffectConfig, {
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.ActiveEffect",
  });
  DocumentSheetConfig.unregisterSheet(WallDocument, "core", foundry.applications.sheets.WallConfig);
  DocumentSheetConfig.registerSheet(WallDocument, DS_CONST.systemID, applications.sheets.DrawSteelWallConfig, {
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.WallDocument",
  });
  DocumentSheetConfig.registerSheet(CombatantGroup, DS_CONST.systemID, applications.sheets.DrawSteelCombatantGroupConfig, {
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.CombatantGroup",
  });

  // Register replacements for core UI elements
  Object.assign(CONFIG.ui, {
    combat: applications.sidebar.tabs.DrawSteelCombatTracker,
    players: applications.ui.DrawSteelPlayers,
  });

  // Register dice rolls
  CONFIG.Dice.rolls = [rolls.DSRoll, rolls.PowerRoll, rolls.ProjectRoll, rolls.DamageRoll, rolls.SavingThrowRoll];

  // Register enrichers
  CONFIG.TextEditor.enrichers = [applications.ux.enrichers.roll];
});

/**
 * Perform one-time pre-localization and sorting of some configuration objects.
 */
Hooks.once("i18nInit", () => {
  helpers.localization.performPreLocalization(CONFIG.DRAW_STEEL);

  // These fields are not auto-localized due to having a different location in en.json
  for (const model of Object.values(CONFIG.Actor.dataModels)) {
    /** @type {foundry.data.fields.SchemaField} */
    const characteristicSchema = model.schema.getField("characteristics");
    if (characteristicSchema) {
      for (const [characteristic, { label, hint }] of Object.entries(ds.CONFIG.characteristics)) {
        const field = characteristicSchema.getField(`${characteristic}.value`);
        if (!field) continue;
        field.label = label;
        field.hint = hint;
      }
    }
    // Allows CONFIG.damageTypes to only have to define the name of the damage type once
    /** @type {foundry.data.fields.SchemaField} */
    const damageSchema = model.schema.getField("damage");
    if (damageSchema) {
      for (const field of Object.values(damageSchema.fields.immunities.fields)) {
        if (field.label) {
          field.label = game.i18n.format("DRAW_STEEL.Actor.base.FIELDS.damage.immunities.format", { type: game.i18n.localize(field.label) });
        }
      }
      for (const field of Object.values(damageSchema.fields.weaknesses.fields)) {
        if (field.label) {
          field.label = game.i18n.format("DRAW_STEEL.Actor.base.FIELDS.damage.weaknesses.format", { type: game.i18n.localize(field.label) });
        }
      }
    }
  }

  // Localize pseudo-documents. Base first, then loop through the types in use
  foundry.helpers.Localization.localizeDataModel(data.pseudoDocuments.powerRollEffects.BasePowerRollEffect);
  foundry.helpers.Localization.localizeDataModel(data.pseudoDocuments.advancements.BaseAdvancement);

  const localizePseudos = record => {
    for (const cls of Object.values(record)) {
      foundry.helpers.Localization.localizeDataModel(cls);
    }
  };

  localizePseudos(data.pseudoDocuments.powerRollEffects.BasePowerRollEffect.TYPES);
  localizePseudos(data.pseudoDocuments.advancements.BaseAdvancement.TYPES);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  await data.migrations.migrateWorld();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item") {
      helpers.macros.createDocMacro(data, slot);
      return false;
    }
  });
  Hooks.callAll("ds.ready");
  console.log(DS_CONST.ASCII);
});

/**
 * Render hooks.
 */
Hooks.on("renderChatMessageHTML", applications.hooks.renderChatMessageHTML);
Hooks.on("renderCombatantConfig", applications.hooks.renderCombatantConfig);
Hooks.on("renderTokenApplication", applications.hooks.renderTokenApplication);

/**
 * Other hooks.
 */
Hooks.on("diceSoNiceRollStart", helpers.diceSoNiceRollStart);
Hooks.on("hotReload", helpers.hotReload);
