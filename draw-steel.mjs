import * as canvas from "./src/module/canvas/_module.mjs";
import * as compatibility from "./src/module/compatibility/_module.mjs";
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
  compatibility,
  documents,
  applications,
  helpers,
  rolls,
  data,
  utils,
  CONST: DS_CONST,
  CONFIG: DS_CONFIG,
  registry: new helpers.DrawSteelRegistry(),
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

  const templates = [
    "templates/embeds/item/ability.hbs",
    "templates/embeds/item/kit.hbs",
    "templates/embeds/item/project.hbs",
    "templates/embeds/item/treasure.hbs",
  ].map(t => DS_CONST.systemPath(t));

  // Assign data models & setup templates
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;
    for (const modelCls of Object.values(models)) {
      if (modelCls.metadata?.type) CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
      if (modelCls.metadata?.icon) CONFIG[doc].typeIcons[modelCls.metadata.type] = modelCls.metadata.icon;
      if (modelCls.metadata?.detailsPartial) templates.push(...modelCls.metadata.detailsPartial);
    }
  }

  // Indexing DSID, class primary name, subclass associated classes, and perk types
  CONFIG.Item.compendiumIndexFields.push("system._dsid", "system.primary", "system.classLink", "system.perkType");
  // Need to be able to find "configuration" type pages
  CONFIG.JournalEntry.compendiumIndexFields.push("pages.type");

  // Custom collections
  CONFIG.Actor.collection = documents.collections.DrawSteelActors;
  CONFIG.Combat.collection = documents.collections.DrawSteelCombatEncounters;

  // Assign canvas-related classes
  CONFIG.Token.objectClass = canvas.placeables.DrawSteelToken;
  CONFIG.Token.rulerClass = canvas.placeables.tokens.DrawSteelTokenRuler;
  CONFIG.Token.hudClass = applications.hud.DrawSteelTokenHUD;
  CONFIG.Canvas.layers.tokens.layerClass = canvas.layers.DrawSteelTokenLayer;
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
  const { Actors, Items, Journal } = foundry.documents.collections;
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

  // Journal Pages
  Journal.registerSheet(DS_CONST.systemID, applications.sheets.DrawSteelJournalEntrySheet, {
    makeDefault: true,
    label: "DRAW_STEEL.SHEET.Labels.JournalEntry",
  });
  DocumentSheetConfig.registerSheet(
    JournalEntryPage, DS_CONST.systemID,
    applications.sheets.journal.ConfigPage,
    { makeDefault: true, types: ["configuration"] },
  );
  DocumentSheetConfig.registerSheet(
    JournalEntryPage, DS_CONST.systemID,
    applications.sheets.journal.DrawSteelImageSheet,
    { makeDefault: true, types: ["image"] },
  );
  DocumentSheetConfig.registerSheet(
    JournalEntryPage, DS_CONST.systemID,
    applications.sheets.journal.ReferencePage,
    { makeDefault: true, types: ["reference"] },
  );
  DocumentSheetConfig.registerSheet(
    JournalEntryPage, DS_CONST.systemID,
    applications.sheets.journal.TierOutcomePage,
    { makeDefault: true, types: ["tierOutcome"] },
  );

  // Register replacements for core UI elements
  Object.assign(CONFIG.ui, {
    combat: applications.sidebar.tabs.DrawSteelCombatTracker,
    players: applications.ui.DrawSteelPlayers,
  });

  // Register replacements for core ux elements.
  Object.assign(CONFIG.ux, {
    TooltipManager: helpers.interaction.DrawSteelTooltipManager,
  });

  // Register dice rolls
  CONFIG.Dice.rolls = [rolls.DSRoll, rolls.PowerRoll, rolls.ProjectRoll, rolls.DamageRoll, rolls.SavingThrowRoll];

  // Register enrichers
  CONFIG.TextEditor.enrichers = [
    applications.ux.enrichers.applyEffect,
    applications.ux.enrichers.lookup,
    applications.ux.enrichers.reference,
    applications.ux.enrichers.roll,
    applications.ux.enrichers.potency,
  ];

  Object.assign(CONFIG.fontDefinitions, {
    "Draw Steel Glyphs": {
      editor: false,
      fonts: [
        { urls: [DS_CONST.systemPath("assets/fonts/DrawSteelGlyphs-Regular.otf")] },
      ],
    },
    "Draw Steel Book": {
      editor: true,
      fonts: [
        { urls: [DS_CONST.systemPath("assets/fonts/MCDM-Book.otf")] },
      ],
    },
  });

  // Register handlebars helpers. This is done after any replacement of ui/ux classes.
  helpers.registerHandlebars();
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

Hooks.once("setup", () => {
  applications.sidebar.apps.DrawSteelCompendiumTOC.applyToPacks();

  // Link up various rules & references automatically
  for (const status of CONFIG.statusEffects) {
    if (status.rule) ds.CONFIG.references[status.id] = status.rule;
  }

  // Common/expected structure for reference construction
  const referenceObjects = [
    "characteristics",
    "monsters.keywords",
    "monsters.organizations",
    "monsters.roles",
    "abilities.types",
    "abilities.distances",
    "abilities.targets",
    "abilities.categories",
    "equipment.categories",
    "equipment.armor",
    "equipment.weapon",
    "projects.types",
    "effectEnds",
  ];

  for (const path of referenceObjects) {
    const config = foundry.utils.getProperty(ds.CONFIG, path);
    for (const [key, { reference }] of Object.entries(config)) {
      if (reference) ds.CONFIG.references[reference.identifier ?? key] = reference.uuid;
    }
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  game.tooltip.observe();
  await data.migrations.migrateWorld();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item") {
      helpers.macros.createDocMacro(data, slot);
      return false;
    }
  });

  await ds.registry.initialize();

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
Hooks.on("hotReload", helpers.hotReload);
