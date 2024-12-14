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

Hooks.once("init", function () {
  CONFIG.DRAW_STEEL = DRAW_STEEL;
  game.system.socketHandler = new helpers.DrawSteelSocketHandler();

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
    label: "DRAW_STEEL.SheetLabels.Actor"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(DS_CONST.systemID, applications.DrawSteelItemSheet, {
    makeDefault: true,
    label: "DRAW_STEEL.SheetLabels.Item"
  });

  CONFIG.Dice.rolls = Object.values(helpers.rolls);
});

/**
 * Perform one-time pre-localization and sorting of some configuration objects
 */
Hooks.once("i18nInit", () => helpers.utils.performPreLocalization(CONFIG.DRAW_STEEL));

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => helpers.macros.createDocMacro(data, slot));
  Hooks.callAll("ds.ready");
  console.log(DS_CONST.ASCII);
});
