import * as documents from "./src/module/documents/_module.mjs";
import * as applications from "./src/module/apps/_module.mjs";
import * as helpers from "./src/module/helpers/_module.mjs";
import * as data from "./src/module/data/_module.mjs";
import {DRAW_STEEL} from "./src/module/config.mjs";
import * as DS_CONST from "./src/module/constants.mjs";

globalThis.ds = {
  documents,
  applications,
  helpers,
  data,
  CONST: DS_CONST,
  CONFIG: DRAW_STEEL
};

/** Special global access */
globalThis.PowerRoll = helpers.rolls.PowerRoll;
globalThis.ProjectRoll = helpers.rolls.ProjectRoll;
globalThis.SavingThrowRoll = helpers.rolls.SavingThrowRoll;

Hooks.once("init", function () {
  CONFIG.DRAW_STEEL = DRAW_STEEL;
  game.system.socketHandler = new helpers.DrawSteelSocketHandler();
  helpers.DrawSteelSettingsHandler.registerSettings();

  // Assign document classes
  for (const docCls of Object.values(documents)) {
    if (!foundry.utils.isSubclass(docCls, foundry.abstract.Document)) continue;
    CONFIG[docCls.documentName].documentClass = docCls;
  }

  const templates = [];

  // Assign data models & setup templates
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;
    for (const modelCls of Object.values(models)) {
      if (modelCls.metadata?.type) CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
      if (modelCls.metadata?.detailsPartial) templates.push(...modelCls.metadata.detailsPartial);
    }
  }

  loadTemplates(templates);

  //Remove Status Effects Not Available in DrawSteel
  const toRemove = ["bleeding", "bless", "burrow", "corrode", "curse", "degen", "disease", "upgrade", "fireShield", "fear", "holyShield", "hover", "coldShield", "magicShield", "paralysis", "poison", "prone", "regen", "restrain", "shock", "silence", "stun", "unconscious", "downgrade"];
  CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !toRemove.includes(effect.id));
  // Status Effect Transfer
  for (const [id, value] of Object.entries(DRAW_STEEL.conditions)) {
    CONFIG.statusEffects.push({id, ...value});
  }

  // Necessary until foundry makes this default behavior in v13
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(DS_CONST.systemID, applications.DrawSteelActorSheet, {
    makeDefault: true,
    label: "DRAW_STEEL.Sheet.Labels.Actor"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(DS_CONST.systemID, applications.DrawSteelItemSheet, {
    makeDefault: true,
    label: "DRAW_STEEL.Sheet.Labels.Item"
  });

  // Register dice rolls
  CONFIG.Dice.rolls = Object.values(helpers.rolls);
});

/**
 * Perform one-time pre-localization and sorting of some configuration objects
 */
Hooks.once("i18nInit", () => {
  helpers.utils.performPreLocalization(CONFIG.DRAW_STEEL);
  // These fields are not auto-localized due to having a different location in en.json
  for (const model of Object.values(CONFIG.Actor.dataModels)) {
    /** @type {InstanceType<foundry["data"]["fields"]["SchemaField"]>} */
    const characteristicSchema = model.schema.getField("characteristics");
    if (!characteristicSchema) continue;
    for (const [characteristic, {label, hint}] of Object.entries(ds.CONFIG.characteristics)) {
      const field = characteristicSchema.getField(`${characteristic}.value`);
      if (!field) continue;
      field.label = label;
      field.hint = hint;
    }
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => helpers.macros.createDocMacro(data, slot));
  Hooks.callAll("ds.ready");
  console.log(DS_CONST.ASCII);
});

/**
 * Render hooks
 */
Hooks.on("renderActiveEffectConfig", applications.hooks.renderActiveEffectConfig);
Hooks.on("renderCombatantConfig", applications.hooks.renderCombatantConfig);
Hooks.on("renderCombatTracker", applications.hooks.renderCombatTracker);
Hooks.on("getCombatTrackerEntryContext", applications.hooks.getCombatTrackerEntryContext);
