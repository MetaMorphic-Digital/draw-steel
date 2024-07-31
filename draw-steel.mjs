import * as documents from "./src/module/documents/_module.mjs";
import * as applications from "./src/module/apps/_module.mjs";
import * as helpers from "./src/module/helpers/_module.mjs";
import * as data from "./src/module/data/_module.mjs";
import {DRAW_STEEL} from "./src/module/config.mjs";

globalThis.ds = {
  documents,
  applications,
  helpers,
  data
};

/** Special global access */
globalThis.PowerRoll = helpers.rolls.PowerRoll;

Hooks.once("init", function () {
  CONFIG.DRAW_STEEL = DRAW_STEEL;
  game.system.socketHandler = new helpers.DrawSteelSocketHandler();

  // Assign document classes
  for (const docCls of Object.values(documents)) {
    CONFIG[docCls.documentName].documentClass = docCls;
  }

  // Assign data models
  for (const [doc, models] of Object.entries(data)) {
    if (!CONST.ALL_DOCUMENT_TYPES.includes(doc)) continue;
    for (const modelCls of Object.values(models)) {
      if (!modelCls.metadata?.type) continue;
      CONFIG[doc].dataModels[modelCls.metadata.type] = modelCls;
    }
  }

  // Status Effect Transfer
  for (const [id, value] of Object.entries(DRAW_STEEL.conditions)) {
    CONFIG.statusEffects.push({id, ...value});
  }

  // Necessary until foundry makes this default behavior in v13
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("draw-steel", applications.DrawSteelActorSheet, {
    makeDefault: true,
    label: "DRAW_STEEL.SheetLabels.Actor"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("draw-steel", applications.DrawSteelItemSheet, {
    makeDefault: true,
    label: "DRAW_STEEL.SheetLabels.Item"
  });

  CONFIG.Dice.rolls = Object.values(helpers.rolls);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => helpers.macros.createDocMacro(data, slot));
});
