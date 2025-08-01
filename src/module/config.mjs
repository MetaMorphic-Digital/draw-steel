import { pseudoDocuments } from "./data/_module.mjs";
import { preLocalize } from "./helpers/localization.mjs";

/** @import { FormSelectOption } from "@client/applications/forms/fields.mjs" */
/** @import { DataField } from "@common/data/fields.mjs" */

export const DRAW_STEEL = {};

/* -------------------------------------------------- */

/**
 * The set of Characteristics used within the system.
 * These have special localization handling that checks for `DRAW_STEEL.Actor.characteristics`.
 * The `label` is the full name (e.g. Might).
 * The `hint` is the short form in all caps (e.g. M).
 * @remarks "none" is reserved for cases where we want an explicit non-option *and* default fallbacks
 * @type {Record<string, {label: string; hint: string; rollKey: string}>}
 */
DRAW_STEEL.characteristics = {
  might: {
    label: "DRAW_STEEL.Actor.characteristics.might.full",
    hint: "DRAW_STEEL.Actor.characteristics.might.abbreviation",
    rollKey: "M",
  },
  agility: {
    label: "DRAW_STEEL.Actor.characteristics.agility.full",
    hint: "DRAW_STEEL.Actor.characteristics.agility.abbreviation",
    rollKey: "A",
  },
  reason: {
    label: "DRAW_STEEL.Actor.characteristics.reason.full",
    hint: "DRAW_STEEL.Actor.characteristics.reason.abbreviation",
    rollKey: "R",
  },
  intuition: {
    label: "DRAW_STEEL.Actor.characteristics.intuition.full",
    hint: "DRAW_STEEL.Actor.characteristics.intuition.abbreviation",
    rollKey: "I",
  },
  presence: {
    label: "DRAW_STEEL.Actor.characteristics.presence.full",
    hint: "DRAW_STEEL.Actor.characteristics.presence.abbreviation",
    rollKey: "P",
  },
};
preLocalize("characteristics", { keys: ["label", "hint"] });

/* -------------------------------------------------- */

/**
 *
 * @type {Record<number, {label: string, levels: number[]}>}
 */
DRAW_STEEL.echelons = {
  1: {
    label: "DRAW_STEEL.ECHELON.1",
    threshold: -Infinity,
  },
  2: {
    label: "DRAW_STEEL.ECHELON.2",
    threshold: 4,
  },
  3: {
    label: "DRAW_STEEL.ECHELON.3",
    threshold: 7,
  },
  4: {
    label: "DRAW_STEEL.ECHELON.4",
    threshold: 10,
  },
};
preLocalize("echelons", { key: "label" });

/* -------------------------------------------------- */

/**
 * Valid letter modifiers for size 1 creatures.
 * @enum {{label: string}}
 */
DRAW_STEEL.sizes = {
  T: {
    label: "DRAW_STEEL.Actor.base.sizes.T",
  },
  S: {
    label: "DRAW_STEEL.Actor.base.sizes.S",
  },
  M: {
    label: "DRAW_STEEL.Actor.base.sizes.M",
  },
  L: {
    label: "DRAW_STEEL.Actor.base.sizes.L",
  },
};
preLocalize("sizes", { key: "label" });

/* -------------------------------------------------- */

/**
 * Keys in `CONFIG.Token.movement.actions` to include as valid movement tag options for the Actor sheet.
 * Order also functions as a priority list for DrawSteelTokenDocument#_inferMovementAction.
 * @type {string[]}
 */
DRAW_STEEL.speedOptions = ["teleport", "fly", "walk", "swim", "burrow", "climb"];

/* -------------------------------------------------- */

/**
 * Configuration information for damage types.
 * @type {Record<string, {label: string, color: foundry.utils.Color}>}
 */
DRAW_STEEL.damageTypes = {
  acid: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Acid",
    color: foundry.utils.Color.fromString("#14ff14"),
  },
  cold: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Cold",
    color: foundry.utils.Color.fromString("#14ffd0"),
  },
  corruption: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Corruption",
    color: foundry.utils.Color.fromString("#7b00a8"),
  },
  fire: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Fire",
    color: foundry.utils.Color.fromString("#ff870f"),
  },
  holy: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Holy",
    color: foundry.utils.Color.fromString("#ffed61"),
  },
  lightning: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Lightning",
    color: foundry.utils.Color.fromString("#ffff00"),
  },
  poison: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Poison",
    color: foundry.utils.Color.fromString("#008500"),
  },
  psychic: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Psychic",
    color: foundry.utils.Color.fromString("#d40cc3"),
  },
  sonic: {
    label: "DRAW_STEEL.DAMAGE_TYPE.Sonic",
    color: foundry.utils.Color.fromString("#999999"),
  },
};
preLocalize("damageTypes", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration information for healing types.
 * Keys correspond to keys in `system.stamina`.
 * This is included in ds.CONFIG not because the top level keys can be customized
 * but because the properties within the object can be customized.
 */
DRAW_STEEL.healingTypes = {
  value: {
    label: "DRAW_STEEL.HEALING_TYPE.Value",
  },
  temporary: {
    label: "DRAW_STEEL.HEALING_TYPE.Temporary",
  },
};
preLocalize("healingTypes", { key: "label" });

/* -------------------------------------------------- */

/**
 * @typedef DrawSteelCondition
 * @property {string} name
 * @property {string} img
 * @property {string} rule
 * @property {boolean} [targeted]
 * @property {number} [maxSources]
 * @property {number} [defaultSpeed]
 * @property {Record<string, Set<string>>} [restrictions]
 */

/**
 * Condition definitions provided by the system that are merged in during the `init` hook
 * Afterwards all references *should* use the core-provided CONFIG.statusEffects
 * The `_id` property is handled as part of the merging process.
 * @type {Record<string, DrawSteelCondition>}
 */
DRAW_STEEL.conditions = {
  bleeding: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Bleeding.name",
    img: "icons/svg/blood.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.YzgERGFhFphgpjKQ",
  },
  dazed: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Dazed.name",
    img: "icons/svg/daze.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.K2dZpCsAOU7xMpWb",
    restrictions: {
      type: new Set(["freeManeuver", "triggered", "freeTriggered"]),
    },
  },
  frightened: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Frightened.name",
    img: "icons/svg/terror.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.bXiI9vUF3tF78qXg",
    targeted: true,
    maxSources: 1,
  },
  grabbed: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Grabbed.name",
    img: "systems/draw-steel/assets/icons/hand-grabbing-fill.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.aWBP2vfXXM3fzuVn",
    targeted: true,
    restrictions: {
      dsid: new Set(["knockback"]),
    },
  },
  prone: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Prone.name",
    img: "icons/svg/falling.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.v11clsSMgoFZm3V8",
  },
  restrained: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Restrained.name",
    img: "icons/svg/net.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.6IfH6beu8LjK08Oj",
    restrictions: {
      dsid: new Set(["stand-up"]),
    },
  },
  slowed: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Slowed.name",
    img: "systems/draw-steel/assets/icons/snail.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.aFEwQG4OcYDNp8DL",
    defaultSpeed: 2,
  },
  taunted: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Taunted.name",
    img: "systems/draw-steel/assets/icons/flag-banner-fold-fill.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.9zseFmXdcSw8MuKh",
    targeted: true,
    maxSources: 1,
  },
  weakened: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Weakened.name",
    img: "icons/svg/downgrade.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.QZpLhRT6imKlqZ1n",
  },
};

/* -------------------------------------------------- */

/**
 * Times when an effect can end.
 * @enum {{label: string, abbreviation: string}}
 */
DRAW_STEEL.effectEnds = {
  turn: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Turn.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Turn.Abbr",
  },
  save: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Save.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Save.Abbr",
  },
  encounter: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Encounter.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Encounter.Abbr",
  },
  respite: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Respite.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Respite.Abbr",
  },
};
preLocalize("effectEnds", { keys: ["label", "abbreviation"] });

/* -------------------------------------------------- */

/**
 * Configuration information for skills.
 * @type {{
 *  groups: Record<string, {label: string}>,
 *  list: Record<string, {label: string, group: string}>,
 *  optgroups: FormSelectOption[]
 * }}
 */
DRAW_STEEL.skills = {
  groups: {
    crafting: {
      label: "DRAW_STEEL.SKILL.Group.Crafting",
    },
    exploration: {
      label: "DRAW_STEEL.SKILL.Group.Exploration",
    },
    interpersonal: {
      label: "DRAW_STEEL.SKILL.Group.Interpersonal",
    },
    intrigue: {
      label: "DRAW_STEEL.SKILL.Group.Intrigue",
    },
    lore: {
      label: "DRAW_STEEL.SKILL.Group.Lore",
    },
  },
  list: {
    alchemy: {
      label: "DRAW_STEEL.SKILL.List.Alchemy",
      group: "crafting",
    },
    architecture: {
      label: "DRAW_STEEL.SKILL.List.Architecture",
      group: "crafting",
    },
    blacksmithing: {
      label: "DRAW_STEEL.SKILL.List.Blacksmithing",
      group: "crafting",
    },
    carpentry: {
      label: "DRAW_STEEL.SKILL.List.Carpentry",
      group: "crafting",
    },
    cooking: {
      label: "DRAW_STEEL.SKILL.List.Cooking",
      group: "crafting",
    },
    fletching: {
      label: "DRAW_STEEL.SKILL.List.Fletching",
      group: "crafting",
    },
    forgery: {
      label: "DRAW_STEEL.SKILL.List.Forgery",
      group: "crafting",
    },
    jewelry: {
      label: "DRAW_STEEL.SKILL.List.Jewelry",
      group: "crafting",
    },
    mechanics: {
      label: "DRAW_STEEL.SKILL.List.Mechanics",
      group: "crafting",
    },
    tailoring: {
      label: "DRAW_STEEL.SKILL.List.Tailoring",
      group: "crafting",
    },
    climb: {
      label: "DRAW_STEEL.SKILL.List.Climb",
      group: "exploration",
    },
    drive: {
      label: "DRAW_STEEL.SKILL.List.Drive",
      group: "exploration",
    },
    endurance: {
      label: "DRAW_STEEL.SKILL.List.Endurance",
      group: "exploration",
    },
    gymnastics: {
      label: "DRAW_STEEL.SKILL.List.Gymnastics",
      group: "exploration",
    },
    heal: {
      label: "DRAW_STEEL.SKILL.List.Heal",
      group: "exploration",
    },
    jump: {
      label: "DRAW_STEEL.SKILL.List.Jump",
      group: "exploration",
    },
    lift: {
      label: "DRAW_STEEL.SKILL.List.Lift",
      group: "exploration",
    },
    navigate: {
      label: "DRAW_STEEL.SKILL.List.Navigate",
      group: "exploration",
    },
    ride: {
      label: "DRAW_STEEL.SKILL.List.Ride",
      group: "exploration",
    },
    swim: {
      label: "DRAW_STEEL.SKILL.List.Swim",
      group: "exploration",
    },
    brag: {
      label: "DRAW_STEEL.SKILL.List.Brag",
      group: "interpersonal",
    },
    empathize: {
      label: "DRAW_STEEL.SKILL.List.Empathize",
      group: "interpersonal",
    },
    flirt: {
      label: "DRAW_STEEL.SKILL.List.Flirt",
      group: "interpersonal",
    },
    gamble: {
      label: "DRAW_STEEL.SKILL.List.Gamble",
      group: "interpersonal",
    },
    handleAnimals: {
      label: "DRAW_STEEL.SKILL.List.HandleAnimals",
      group: "interpersonal",
    },
    interrogate: {
      label: "DRAW_STEEL.SKILL.List.Interrogate",
      group: "interpersonal",
    },
    intimidate: {
      label: "DRAW_STEEL.SKILL.List.Intimidate",
      group: "interpersonal",
    },
    lead: {
      label: "DRAW_STEEL.SKILL.List.Lead",
      group: "interpersonal",
    },
    lie: {
      label: "DRAW_STEEL.SKILL.List.Lie",
      group: "interpersonal",
    },
    music: {
      label: "DRAW_STEEL.SKILL.List.Music",
      group: "interpersonal",
    },
    perform: {
      label: "DRAW_STEEL.SKILL.List.Perform",
      group: "interpersonal",
    },
    persuade: {
      label: "DRAW_STEEL.SKILL.List.Persuade",
      group: "interpersonal",
    },
    readPerson: {
      label: "DRAW_STEEL.SKILL.List.ReadPerson",
      group: "interpersonal",
    },
    alertness: {
      label: "DRAW_STEEL.SKILL.List.Alertness",
      group: "intrigue",
    },
    concealObject: {
      label: "DRAW_STEEL.SKILL.List.ConcealObject",
      group: "intrigue",
    },
    disguise: {
      label: "DRAW_STEEL.SKILL.List.Disguise",
      group: "intrigue",
    },
    eavesdrop: {
      label: "DRAW_STEEL.SKILL.List.Eavesdrop",
      group: "intrigue",
    },
    escapeArtist: {
      label: "DRAW_STEEL.SKILL.List.EscapeArtist",
      group: "intrigue",
    },
    hide: {
      label: "DRAW_STEEL.SKILL.List.Hide",
      group: "intrigue",
    },
    pickLock: {
      label: "DRAW_STEEL.SKILL.List.PickLock",
      group: "intrigue",
    },
    pickPocket: {
      label: "DRAW_STEEL.SKILL.List.PickPocket",
      group: "intrigue",
    },
    sabotage: {
      label: "DRAW_STEEL.SKILL.List.Sabotage",
      group: "intrigue",
    },
    search: {
      label: "DRAW_STEEL.SKILL.List.Search",
      group: "intrigue",
    },
    sneak: {
      label: "DRAW_STEEL.SKILL.List.Sneak",
      group: "intrigue",
    },
    track: {
      label: "DRAW_STEEL.SKILL.List.Track",
      group: "intrigue",
    },
    culture: {
      label: "DRAW_STEEL.SKILL.List.Culture",
      group: "lore",
    },
    criminalUnderworld: {
      label: "DRAW_STEEL.SKILL.List.CriminalUnderworld",
      group: "lore",
    },
    history: {
      label: "DRAW_STEEL.SKILL.List.History",
      group: "lore",
    },
    magic: {
      label: "DRAW_STEEL.SKILL.List.Magic",
      group: "lore",
    },
    monsters: {
      label: "DRAW_STEEL.SKILL.List.Monsters",
      group: "lore",
    },
    nature: {
      label: "DRAW_STEEL.SKILL.List.Nature",
      group: "lore",
    },
    psionics: {
      label: "DRAW_STEEL.SKILL.List.Psionics",
      group: "lore",
    },
    religion: {
      label: "DRAW_STEEL.SKILL.List.Religion",
      group: "lore",
    },
    rumors: {
      label: "DRAW_STEEL.SKILL.List.Rumors",
      group: "lore",
    },
    society: {
      label: "DRAW_STEEL.SKILL.List.Society",
      group: "lore",
    },
    strategy: {
      label: "DRAW_STEEL.SKILL.List.Strategy",
      group: "lore",
    },
    timescape: {
      label: "DRAW_STEEL.SKILL.List.Timescape",
      group: "lore",
    },
  },
};
preLocalize("skills.groups", { key: "label" });
preLocalize("skills.list", { key: "label" });

Object.defineProperty(DRAW_STEEL.skills, "optgroups", {
  /** @type {FormSelectOption[]} */
  get: function() {
    const config = ds.CONFIG.skills;
    return Object.entries(config.list).reduce((arr, [value, { label, group }]) => {
      arr.push({ label, group: config.groups[group].label, value });
      return arr;
    }, []);
  },
});

/* -------------------------------------------------- */

/**
 * Configuration information for languages.
 * @type {Record<string, {label: string}>}
 */
DRAW_STEEL.languages = {
  // ancestry languages
  anjali: {
    label: "DRAW_STEEL.LANGUAGE.Anjali",
  },
  axiomatic: {
    label: "DRAW_STEEL.LANGUAGE.Axiomatic",
  },
  caelian: {
    label: "DRAW_STEEL.LANGUAGE.Caelian",
  },
  filliaric: {
    label: "DRAW_STEEL.LANGUAGE.Filliaric",
  },
  highKuric: {
    label: "DRAW_STEEL.LANGUAGE.HighKuric",
  },
  hyrallic: {
    label: "DRAW_STEEL.LANGUAGE.Hyrallic",
  },
  illyvric: {
    label: "DRAW_STEEL.LANGUAGE.Illyvric",
  },
  kalliak: {
    label: "DRAW_STEEL.LANGUAGE.Kalliak",
  },
  kethaic: {
    label: "DRAW_STEEL.LANGUAGE.Kethaic",
  },
  khelt: {
    label: "DRAW_STEEL.LANGUAGE.Khelt",
  },
  khoursirian: {
    label: "DRAW_STEEL.LANGUAGE.Khoursirian",
  },
  lowKuric: {
    label: "DRAW_STEEL.LANGUAGE.LowKuric",
  },
  mindspeech: {
    label: "DRAW_STEEL.LANGUAGE.Mindspeech",
  },
  protoCtholl: {
    label: "DRAW_STEEL.LANGUAGE.ProtoCtholl",
  },
  szetch: {
    label: "DRAW_STEEL.LANGUAGE.Szetch",
  },
  theFirstLanguage: {
    label: "DRAW_STEEL.LANGUAGE.TheFirstLanguage",
  },
  tholl: {
    label: "DRAW_STEEL.LANGUAGE.Tholl",
  },
  urollialic: {
    label: "DRAW_STEEL.LANGUAGE.Urollialic",
  },
  variac: {
    label: "DRAW_STEEL.LANGUAGE.Variac",
  },
  vastariax: {
    label: "DRAW_STEEL.LANGUAGE.Vastariax",
  },
  vhoric: {
    label: "DRAW_STEEL.LANGUAGE.Vhoric",
  },
  voll: {
    label: "DRAW_STEEL.LANGUAGE.Voll",
  },
  yllyric: {
    label: "DRAW_STEEL.LANGUAGE.Yllyric",
  },
  zahariax: {
    label: "DRAW_STEEL.LANGUAGE.Zahariax",
  },
  zaliac: {
    label: "DRAW_STEEL.LANGUAGE.Zaliac",
  },
  // Human languages. Khoursirian already covered
  higaran: {
    label: "DRAW_STEEL.LANGUAGE.Higaran",
  },
  khemharic: {
    label: "DRAW_STEEL.LANGUAGE.Khemharic",
  },
  oaxuatl: {
    label: "DRAW_STEEL.LANGUAGE.Oaxuatl",
  },
  phaedran: {
    label: "DRAW_STEEL.LANGUAGE.Phaedran",
  },
  riojan: {
    label: "DRAW_STEEL.LANGUAGE.Riojan",
  },
  uvalic: {
    label: "DRAW_STEEL.LANGUAGE.Uvalic",
  },
  vaniric: {
    label: "DRAW_STEEL.LANGUAGE.Vaniric",
  },
  vasloria: {
    label: "DRAW_STEEL.LANGUAGE.Vasloria",
  },
  // Dead languages
  highRhyvian: {
    label: "DRAW_STEEL.LANGUAGE.HighRhyvian",
  },
  khamish: {
    label: "DRAW_STEEL.LANGUAGE.Khamish",
  },
  kheltivari: {
    label: "DRAW_STEEL.LANGUAGE.Kheltivari",
  },
  lowRhivian: {
    label: "DRAW_STEEL.LANGUAGE.LowRhivian",
  },
  oldVariac: {
    label: "DRAW_STEEL.LANGUAGE.OldVariac",
  },
  phorialtic: {
    label: "DRAW_STEEL.LANGUAGE.Phorialtic",
  },
  rallarian: {
    label: "DRAW_STEEL.LANGUAGE.Rallarian",
  },
  ullorvic: {
    label: "DRAW_STEEL.LANGUAGE.Ullorvic",
  },
};
preLocalize("languages", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration information for negotiations.
 */
DRAW_STEEL.negotiation = {
  /** @type {Record<string, {label: string}>} */
  motivations: {
    benevolence: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Benevolence",
    },
    discovery: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Discovery",
    },
    freedom: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Freedom",
    },
    greed: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Greed",
    },
    authority: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.HigherAuthority",
    },
    justice: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Justice",
    },
    legacy: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Legacy",
    },
    peace: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Peace",
    },
    power: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Power",
    },
    protection: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Protection",
    },
    revelry: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Revelry",
    },
    vengeance: {
      label: "DRAW_STEEL.Actor.npc.Negotiation.Motivations.Vengeance",
    },
  },
};
preLocalize("negotiation.motivations", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration information for height and weight measurements.
 */
DRAW_STEEL.measurements = {
  /** @type {Record<string, { label: string; group: string }>} */
  height: {
    in: {
      label: "DRAW_STEEL.MEASUREMENT.Height.in",
      group: "imperial",
    },
    ft: {
      label: "DRAW_STEEL.MEASUREMENT.Height.ft",
      group: "imperial",
    },
    cm: {
      label: "DRAW_STEEL.MEASUREMENT.Height.cm",
      group: "metric",
    },
    m: {
      label: "DRAW_STEEL.MEASUREMENT.Height.m",
      group: "metric",
    },
  },
  /** @type {Record<string, { label: string; group: string }>} */
  weight: {
    lb: {
      label: "DRAW_STEEL.MEASUREMENT.Weight.lbs",
      group: "imperial",
    },
    kg: {
      label: "DRAW_STEEL.MEASUREMENT.Weight.kg",
      group: "metric",
    },
  },
  /** @type {Record<string, { label: string }>} */
  groups: {
    imperial: {
      label: "DRAW_STEEL.MEASUREMENT.Groups.imperial",
    },
    metric: {
      label: "DRAW_STEEL.MEASUREMENT.Groups.metric",
    },
  },
};
preLocalize("measurements.height", { keys: ["label"] });
preLocalize("measurements.weight", { keys: ["label"] });
preLocalize("measurements.groups", { keys: ["label"] });

/**
 * Configuration information for heroes.
 */
DRAW_STEEL.hero = {
  /** Items added to new heroes in _preCreate. */
  defaultItems: new Set([
    // Aid Attack
    "Compendium.draw-steel.abilities.Item.Xb3S5N1fZyICD58D",
    // Catch Breath
    "Compendium.draw-steel.abilities.Item.nYPJN8Ce2dX9H09K",
    // Charge
    "Compendium.draw-steel.abilities.Item.wNqJWJbgAbnJBqZf",
    // Defend
    "Compendium.draw-steel.abilities.Item.fjtY7RKBGWx2u5tK",
    // Escape Grab
    "Compendium.draw-steel.abilities.Item.iD1SlB15GXJFALya",
    // Grab
    "Compendium.draw-steel.abilities.Item.oxaISpgVoCfo6fmt",
    // Heal
    "Compendium.draw-steel.abilities.Item.2qWHDVB7SBS9anLB",
    // Hide
    "Compendium.draw-steel.abilities.Item.JykB1rELpGBeAVe6",
    // Knockback
    "Compendium.draw-steel.abilities.Item.emug9cXuwndDrWzu",
    // Melee Free Strike
    "Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6",
    // Ranged Free Strike
    "Compendium.draw-steel.abilities.Item.eqUobBcm81mqZVgJ",
    // Search for Hidden Creatures
    "Compendium.draw-steel.abilities.Item.zQ83mlzlRtflpD3w",
    // Stand Up
    "Compendium.draw-steel.abilities.Item.XeUU0Blvi0fy0b2G",
  ]),
  /**
   * XP progression for heroes.
   * @type {number[]}
   */
  xp_track: [0, 16, 32, 48, 64, 80, 96, 112, 128, 144],
  /**
   * Ways to spend hero tokens.
   * @type {Record<string, {label: string, tokens: number, messageContent: string}>}
   */
  tokenSpends: {
    gainSurges: {
      label: "DRAW_STEEL.Setting.HeroTokens.GainSurges.label",
      tokens: 1,
      messageContent: "DRAW_STEEL.Setting.HeroTokens.GainSurges.messageContent",
    },
    succeedSave: {
      label: "DRAW_STEEL.Setting.HeroTokens.SucceedSave.label",
      tokens: 1,
      messageContent: "DRAW_STEEL.Setting.HeroTokens.SucceedSave.messageContent",
    },
    improveTest: {
      label: "DRAW_STEEL.Setting.HeroTokens.ImproveTest.label",
      tokens: 1,
      messageContent: "DRAW_STEEL.Setting.HeroTokens.ImproveTest.messageContent",
    },
    regainStamina: {
      label: "DRAW_STEEL.Setting.HeroTokens.RegainStamina.label",
      tokens: 2,
      messageContent: "DRAW_STEEL.Setting.HeroTokens.RegainStamina.messageContent",
    },
  },
};
preLocalize("hero.tokenSpends", { keys: ["label", "messageContent"], sort: true });

/* -------------------------------------------------- */

/**
 * Configuration information for monsters.
 */
DRAW_STEEL.monsters = {
  /** @type {Record<string, {label: string, group: string}>} */
  keywords: {
    abyssal: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Abyssal",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    accursed: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Accursed",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    animal: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Animal",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    beast: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Beast",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    construct: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Construct",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    dragon: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Dragon",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    elemental: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Elemental",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    fey: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Fey",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    giant: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Giant",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    horror: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Horror",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    humanoid: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Humanoid",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    infernal: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Infernal",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    plant: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Plant",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    swarm: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Swarm",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
    undead: {
      label: "DRAW_STEEL.Actor.npc.KEYWORDS.Undead",
      group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    },
  },
  /** @type {Record<string, {label: string}>} */
  roles: {
    ambusher: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Ambusher",
    },
    artillery: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Artillery",
    },
    brute: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Brute",
    },
    controller: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Controller",
    },
    defender: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Defender",
    },
    harrier: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Harrier",
    },
    hexer: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Hexer",
    },
    mount: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Mount",
    },
    support: {
      label: "DRAW_STEEL.Actor.npc.ROLES.Support",
    },
  },
  /** @type {Record<string, {label: string}>} */
  organizations: {
    minion: {
      label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Minion",
    },
    horde: {
      label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Horde",
    },
    platoon: {
      label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Platoon",
    },
    elite: {
      label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Elite",
    },
    leader: {
      label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Leader",
    },
    solo: {
      label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Solo",
    },
  },
};
preLocalize("monsters.keywords", { keys: ["label", "group"] });
preLocalize("monsters.roles", { key: "label" });
preLocalize("monsters.organizations", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration information for Ability items.
 */
DRAW_STEEL.abilities = {
  /** @type {Record<string, {label: string, group?: string}>} */
  keywords: {
    animal: {
      label: "DRAW_STEEL.Item.ability.Keywords.Animal",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Fury",
    },
    animapathy: {
      label: "DRAW_STEEL.Item.ability.Keywords.Animapathy",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    area: {
      label: "DRAW_STEEL.Item.ability.Keywords.Area",
    },
    charge: {
      label: "DRAW_STEEL.Item.ability.Keywords.Charge",
    },
    chronopathy: {
      label: "DRAW_STEEL.Item.ability.Keywords.Chronopathy",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    cryokinesis: {
      label: "DRAW_STEEL.Item.ability.Keywords.Cryokinesis",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    earth: {
      label: "DRAW_STEEL.Item.ability.Keywords.Earth",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Elementalist",
    },
    fire: {
      label: "DRAW_STEEL.Item.ability.Keywords.Fire",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Elementalist",
    },
    green: {
      label: "DRAW_STEEL.Item.ability.Keywords.Green",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Elementalist",
    },
    magic: {
      label: "DRAW_STEEL.Item.ability.Keywords.Magic",
    },
    melee: {
      label: "DRAW_STEEL.Item.ability.Keywords.Melee",
    },
    metamorphosis: {
      label: "DRAW_STEEL.Item.ability.Keywords.Metamorphosis",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    psionic: {
      label: "DRAW_STEEL.Item.ability.Keywords.Psionic",
    },
    pyrokinesis: {
      label: "DRAW_STEEL.Item.ability.Keywords.Pyrokinesis",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    ranged: {
      label: "DRAW_STEEL.Item.ability.Keywords.Ranged",
    },
    resopathy: {
      label: "DRAW_STEEL.Item.ability.Keywords.Resopathy",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    rot: {
      label: "DRAW_STEEL.Item.ability.Keywords.Rot",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Elementalist",
    },
    routine: {
      label: "DRAW_STEEL.Item.ability.Keywords.Routine",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Troubador",
    },
    strike: {
      label: "DRAW_STEEL.Item.ability.Keywords.Strike",
    },
    telekinesis: {
      label: "DRAW_STEEL.Item.ability.Keywords.Telekinesis",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    telepathy: {
      label: "DRAW_STEEL.Item.ability.Keywords.Telepathy",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Talent",
    },
    void: {
      label: "DRAW_STEEL.Item.ability.Keywords.Void",
      group: "DRAW_STEEL.Item.ability.KeywordGroups.Elementalist",
    },
    weapon: {
      label: "DRAW_STEEL.Item.ability.Keywords.Weapon",
    },
  },
  /**
   * Action types.
   * @type {Record<string, {label: string, triggered?: boolean}>}
   */
  types: {
    main: {
      label: "DRAW_STEEL.Item.ability.Type.Main",
    },
    maneuver: {
      label: "DRAW_STEEL.Item.ability.Type.Maneuver",
    },
    freeManeuver: {
      label: "DRAW_STEEL.Item.ability.Type.FreeManeuver",
    },
    triggered: {
      label: "DRAW_STEEL.Item.ability.Type.Triggered",
      triggered: true,
    },
    freeTriggered: {
      label: "DRAW_STEEL.Item.ability.Type.FreeTriggered",
      triggered: true,
    },
    villain: {
      label: "DRAW_STEEL.Item.ability.Type.Villain",
    },
  },
  /**
   * Ability category, e.g. "Villain Action".
   * @type {Record<string, {label: string}>}
   */
  categories: {
    heroic: {
      label: "DRAW_STEEL.Item.ability.Category.Heroic",
    },
    freeStrike: {
      label: "DRAW_STEEL.Item.ability.Category.FreeStrike",
    },
    signature: {
      label: "DRAW_STEEL.Item.ability.Category.Signature",
    },
    villain: {
      label: "DRAW_STEEL.Item.ability.Category.Villain",
    },
  },
  /**
   * Valid distances in Draw Steel
   * `primary` and `secondary`, if present represent additional measures/dimensions that are valid for this type
   * The string values are the labels for those properties.
   * @type {Record<string, {label: string; primary?: string; secondary?: string; tertiary?: string; area?: boolean; embedLabel: string}>}
   */
  distances: {
    melee: {
      label: "DRAW_STEEL.Item.ability.Distance.Melee",
      primary: "DRAW_STEEL.Item.ability.Distance.Melee",
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Melee",
    },
    ranged: {
      label: "DRAW_STEEL.Item.ability.Distance.Ranged",
      primary: "DRAW_STEEL.Item.ability.Distance.Ranged",
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Ranged",
    },
    meleeRanged: {
      label: "DRAW_STEEL.Item.ability.Distance.MeleeRanged",
      primary: "DRAW_STEEL.Item.ability.Distance.Melee",
      secondary: "DRAW_STEEL.Item.ability.Distance.Ranged",
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.MeleeRanged",
    },
    aura: {
      label: "DRAW_STEEL.Item.ability.Distance.Aura",
      primary: "DRAW_STEEL.Item.ability.Distance.Aura",
      area: true,
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Aura",
    },
    burst: {
      label: "DRAW_STEEL.Item.ability.Distance.Burst",
      primary: "DRAW_STEEL.Item.ability.Distance.Burst",
      area: true,
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Burst",
    },
    cube: {
      label: "DRAW_STEEL.Item.ability.Distance.Cube",
      primary: "DRAW_STEEL.Item.ability.Distance.Length",
      secondary: "DRAW_STEEL.Item.ability.Distance.Ranged",
      area: true,
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Cube",
    },
    line: {
      label: "DRAW_STEEL.Item.ability.Distance.Line",
      primary: "DRAW_STEEL.Item.ability.Distance.Length",
      secondary: "DRAW_STEEL.Item.ability.Distance.Width",
      tertiary: "DRAW_STEEL.Item.ability.Distance.Ranged",
      area: true,
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Line",
    },
    wall: {
      label: "DRAW_STEEL.Item.ability.Distance.Wall",
      primary: "DRAW_STEEL.Item.ability.Distance.Squares",
      secondary: "DRAW_STEEL.Item.ability.Distance.Ranged",
      area: true,
      embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Wall",
    },
    special: {
      label: "DRAW_STEEL.Item.ability.Distance.Special",
      area: true,
      embedLabel: "DRAW_STEEL.Item.ability.Distance.Special",
    },
    self: {
      label: "DRAW_STEEL.Item.ability.Distance.Self",
      embedLabel: "DRAW_STEEL.Item.ability.Distance.Self",
    },
  },
  /** @type {Record<string, {label: string; all?: string; embedLabel: string}>} */
  targets: {
    creature: {
      label: "DRAW_STEEL.Item.ability.Target.Creature",
      all: "DRAW_STEEL.Item.ability.Target.AllCreatures",
      embedLabel: "DRAW_STEEL.Item.ability.Target.CreatureEmbed",
    },
    object: {
      label: "DRAW_STEEL.Item.ability.Target.Object",
      all: "DRAW_STEEL.Item.ability.Target.AllObjects",
      embedLabel: "DRAW_STEEL.Item.ability.Target.ObjectEmbed",
    },
    creatureObject: {
      label: "DRAW_STEEL.Item.ability.Target.CreatureObject",
      all: "DRAW_STEEL.Item.ability.Target.AllCreatureObject",
      embedLabel: "DRAW_STEEL.Item.ability.Target.CreatureObjectEmbed",
    },
    enemy: {
      label: "DRAW_STEEL.Item.ability.Target.Enemy",
      all: "DRAW_STEEL.Item.ability.Target.AllEnemies",
      embedLabel: "DRAW_STEEL.Item.ability.Target.EnemyEmbed",
    },
    ally: {
      label: "DRAW_STEEL.Item.ability.Target.Ally",
      all: "DRAW_STEEL.Item.ability.Target.AllAllies",
      embedLabel: "DRAW_STEEL.Item.ability.Target.AllyEmbed",
    },
    self: {
      label: "DRAW_STEEL.Item.ability.Target.Self",
      embedLabel: "DRAW_STEEL.Item.ability.Target.Self",
    },
    special: {
      label: "DRAW_STEEL.Item.ability.Target.Special",
      embedLabel: "DRAW_STEEL.Item.ability.Target.Special",
    },
  },
  forcedMovement: {
    push: {
      label: "DRAW_STEEL.Item.ability.ForcedMovement.Push",
      vertical: "DRAW_STEEL.Item.ability.ForcedMovement.VerticalPush",
    },
    pull: {
      label: "DRAW_STEEL.Item.ability.ForcedMovement.Pull",
      vertical: "DRAW_STEEL.Item.ability.ForcedMovement.VerticalPull",
    },
    slide: {
      label: "DRAW_STEEL.Item.ability.ForcedMovement.Slide",
      vertical: "DRAW_STEEL.Item.ability.ForcedMovement.VerticalSlide",
    },
  },
};
preLocalize("abilities.keywords", { keys: ["label", "group"] });
preLocalize("abilities.types", { key: "label" });
preLocalize("abilities.categories", { key: "label" });
// Embed labels intentionally not pre-localized because they rely on `format` instead of `localize`
preLocalize("abilities.distances", { keys: ["label", "primary", "secondary", "tertiary"] });
preLocalize("abilities.targets", { keys: ["label", "all"] });
preLocalize("abilities.forcedMovement", { keys: ["label", "vertical"] });

Object.defineProperty(DRAW_STEEL.abilities.keywords, "optgroups", {
  /** @type {FormSelectOption[]} */
  get: function() {
    const sortedKeywords = Object.entries(ds.CONFIG.abilities.keywords).sort(([keyA, valueA], [keyB, valueB]) => {
      // When no group, sort between their keys
      if ((valueA.group === undefined) && (valueB.group === undefined)) return keyA.localeCompare(keyB);

      // When or the other, but not both have a group, the one without a group comes first
      if ((valueA.group === undefined) && (valueB.group !== undefined)) return -1;
      if ((valueA.group !== undefined) && (valueB.group === undefined)) return 1;

      // When they both have a group and they are equal, sort between their keys
      if (valueA.group === valueB.group) return keyA.localeCompare(keyB);

      // When they both have a group and are not equal, sort between their groups
      return valueA.group.localeCompare(valueB.group);
    });
    return sortedKeywords.reduce((arr, [value, { label, group }]) => {
      arr.push({ label, group, value });
      return arr;
    }, []);
  },
});

/* -------------------------------------------------- */

/**
 * @typedef PowerRollEffectProperty
 * @property {string} label
 */

/**
 * @typedef PowerRollEffectType
 * @property {string} label                                                         Human-readable label.
 * @property {string} defaultImage                                                  The default image for PowerRollEffects of this type.
 * @property {pseudoDocuments.powerRollEffects.BasePowerRollEffect} documentClass   The pseudo-document class.
 * @property {Record<string, PowerRollEffectProperty>} [properties]
 */

/**
 * Valid types for the PowerRollEffect pseudo-document.
 * @type {Record<string, PowerRollEffectType>}
 */
DRAW_STEEL.PowerRollEffect = {
  damage: {
    label: "TYPES.PowerRollEffect.damage",
    defaultImage: "icons/svg/fire.svg",
    documentClass: pseudoDocuments.powerRollEffects.DamagePowerRollEffect,
    properties: {
      ignoresImmunity: {
        label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.DAMAGE.Properties.IgnoresImmunity",
      },
    },
  },
  applied: {
    label: "TYPES.PowerRollEffect.applied",
    defaultImage: "icons/svg/paralysis.svg",
    documentClass: pseudoDocuments.powerRollEffects.AppliedPowerRollEffect,
    properties: {
      stacking: {
        label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.APPLIED.Properties.stacking",
      },
    },
  },
  forced: {
    label: "TYPES.PowerRollEffect.forced",
    defaultImage: "icons/svg/portal.svg",
    documentClass: pseudoDocuments.powerRollEffects.ForcedMovementPowerRollEffect,
    properties: {
      ignoresImmunity: {
        label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FORCED.Properties.IgnoresStability",
      },
      vertical: {
        label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FORCED.Properties.Vertical",
      },
    },
  },
  other: {
    label: "TYPES.PowerRollEffect.other",
    defaultImage: "icons/svg/sun.svg",
    documentClass: pseudoDocuments.powerRollEffects.OtherPowerRollEffect,
  },
};
preLocalize("PowerRollEffect", { key: "label" });

/* -------------------------------------------------- */

/**
 * @typedef AdvancementType
 * @property {string} label                                                 Human-readable label.
 * @property {string} defaultImage                                          Default image used by documents of this type.
 * @property {Set<string>} itemTypes                                        Item types that can hold this advancement type.
 * @property {pseudoDocuments.advancements.BaseAdvancement} documentClass   The pseudo-document class.
 */

/** @type {Record<string, AdvancementType>} */
DRAW_STEEL.Advancement = {
  itemGrant: {
    label: "TYPES.Advancement.itemGrant",
    defaultImage: "icons/svg/item-bag.svg",
    itemTypes: new Set(["ancestry", "career", "class", "complication", "feature", "kit", "subclass"]),
    documentClass: pseudoDocuments.advancements.ItemGrantAdvancement,
  },
  skill: {
    label: "TYPES.Advancement.skill",
    defaultImage: "icons/svg/hanging-sign.svg",
    itemTypes: new Set(["career", "class", "complication", "culture", "feature", "subclass"]),
    documentClass: pseudoDocuments.advancements.SkillAdvancement,
  },
  language: {
    label: "TYPES.Advancement.language",
    defaultImage: "icons/svg/village.svg",
    itemTypes: new Set(["career", "class", "complication", "culture", "feature", "subclass"]),
    documentClass: pseudoDocuments.advancements.LanguageAdvancement,
  },
};
preLocalize("Advancement", { key: "label" });

/* -------------------------------------------------- */

/**
 * @typedef CultureAspect
 * @property {string} label         Human-readable label.
 * @property {string} skillGroups   A set of skill groups this aspect gives access to.
 * @property {Set<string>} skillChoices  A set of skills this aspect gives access to.
 * @property {Set<string>} group         An entry in culture.groups
 * TODO: Description as a uuid reference.
 */

/**
 * Configuration details for Culture items.
 */
DRAW_STEEL.culture = {
  /**  @type {Record<string, CultureAspect>} */
  aspects: {
    nomadic: {
      label: "DRAW_STEEL.Item.culture.Environment.Nomadic",
      skillGroups: new Set(["exploration", "interpersonal"]),
      skillChoices: new Set(),
      group: "environment",
    },
    rural: {
      label: "DRAW_STEEL.Item.culture.Environment.Rural",
      skillGroups: new Set(["crafting", "lore"]),
      skillChoices: new Set(),
      group: "environment",
    },
    secluded: {
      label: "DRAW_STEEL.Item.culture.Environment.Secluded",
      skillGroups: new Set(["interpersonal", "lore"]),
      skillChoices: new Set(),
      group: "environment",
    },
    urban: {
      label: "DRAW_STEEL.Item.culture.Environment.Urban",
      skillGroups: new Set(["interpersonal", "intrigue"]),
      skillChoices: new Set(),
      group: "environment",
    },
    wilderness: {
      label: "DRAW_STEEL.Item.culture.Environment.Wilderness",
      skillGroups: new Set(["crafting", "exploration"]),
      skillChoices: new Set(),
      group: "environment",
    },
    bureaucratic: {
      label: "DRAW_STEEL.Item.culture.Organization.Bureaucratic",
      skillGroups: new Set(["interpersonal", "intrigue"]),
      skillChoices: new Set(),
      group: "organization",
    },
    communal: {
      label: "DRAW_STEEL.Item.culture.Organization.Communal",
      skillGroups: new Set(["crafting", "exploration"]),
      skillChoices: new Set(),
      group: "organization",
    },
    academic: {
      label: "DRAW_STEEL.Item.culture.Upbringing.Academic",
      skillGroups: new Set(["lore"]),
      skillChoices: new Set(),
      group: "upbringing",
    },
    creative: {
      label: "DRAW_STEEL.Item.culture.Upbringing.Creative",
      skillGroups: new Set(["crafting"]),
      skillChoices: new Set(["music", "perform"]),
      group: "upbringing",
    },
    lawless: {
      label: "DRAW_STEEL.Item.culture.Upbringing.Lawless",
      skillGroups: new Set(["intrigue"]),
      skillChoices: new Set(),
      group: "upbringing",
    },
    labor: {
      label: "DRAW_STEEL.Item.culture.Upbringing.Labor",
      skillGroups: new Set(["exploration"]),
      skillChoices: new Set(["blacksmithing", "handleAnimals"]),
      group: "upbringing",
    },
    martial: {
      label: "DRAW_STEEL.Item.culture.Upbringing.Martial",
      skillGroups: new Set(),
      skillChoices: new Set([ "blacksmithing", "fletching", "climb", "endurance", "ride", "intimidate", "alertness", "track", "monsters", "strategy"]),
      group: "upbringing",
    },
    noble: {
      label: "DRAW_STEEL.Item.culture.Upbringing.Noble",
      skillGroups: new Set(["interpersonal"]),
      skillChoices: new Set(),
      group: "upbringing",
    },
  },
  /** @type {Record<string, { label: string }>} */
  group: {
    environment: {
      label: "DRAW_STEEL.Item.culture.Environment.label",
    },
    organization: {
      label: "DRAW_STEEL.Item.culture.Organization.label",
    },
    upbringing: {
      label: "DRAW_STEEL.Item.culture.Upbringing.label",
    },
  },
};
preLocalize("culture.aspects", { key: "label" });
preLocalize("culture.group", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration details for Kit items.
 * @type {Record<string,  Record<string, {label: string}>>}
 */
DRAW_STEEL.kits = {};
// preLocalize("kits.types", {key: "label"});

/* -------------------------------------------------- */

/**
 * @typedef EquipmentCategory
 * @property {string} label
 * @property {FormSelectOption[]} keywords
 */

/**
 * Configuration details for Equipment items
 * Also used by Kits.
 */
DRAW_STEEL.equipment = {
  /** @type {Record<string, EquipmentCategory>} */
  categories: {
    consumable: {
      label: "DRAW_STEEL.Item.equipment.Categories.Consumable",
      get keywords() {
        return [];
      },
    },
    trinket: {
      label: "DRAW_STEEL.Item.equipment.Categories.Trinket",
      get keywords() {
        return [];
      },
    },
    leveled: {
      label: "DRAW_STEEL.Item.equipment.Categories.Leveled",
      get keywords() {
        return [];
      },
    },
    artifact: {
      label: "DRAW_STEEL.Item.equipment.Categories.Artifact",
      get keywords() {
        return [];
      },
    },
  },
  /** @type {Record<string, {label: string}>} */
  kinds: {
    other: {
      label: "DRAW_STEEL.Item.equipment.Kinds.Other",
    },
    armor: {
      label: "DRAW_STEEL.Item.equipment.Kinds.Armor",
    },
    implement: {
      label: "DRAW_STEEL.Item.equipment.Kinds.Implement",
    },
    weapon: {
      label: "DRAW_STEEL.Item.equipment.Kinds.Weapon",
    },
  },
  /** @type {Record<string, {label: string, kitEquipment: boolean}>} */
  armor: {
    none: {
      label: "DRAW_STEEL.Item.equipment.Armor.None",
      kitEquipment: true,
    },
    light: {
      label: "DRAW_STEEL.Item.equipment.Armor.Light",
      kitEquipment: true,
    },
    medium: {
      label: "DRAW_STEEL.Item.equipment.Armor.Medium",
      kitEquipment: true,
    },
    heavy: {
      label: "DRAW_STEEL.Item.equipment.Armor.Heavy",
      kitEquipment: true,
    },
    shield: {
      label: "DRAW_STEEL.Item.equipment.Armor.Shield",
      kitEquipment: false,
    },
  },
  /** @type {Record<string, {label: string}>} */
  weapon: {
    none: {
      label: "DRAW_STEEL.Item.equipment.Weapons.None",
    },
    bow: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Bow",
    },
    ensnaring: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Ensnaring",
    },
    heavy: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Heavy",
    },
    light: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Light",
    },
    medium: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Medium",
    },
    polearm: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Polearm",
    },
    unarmed: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Unarmed",
    },
    whip: {
      label: "DRAW_STEEL.Item.equipment.Weapons.Whip",
    },
  },
  /** @type {Record<string, {label: string}>} */
  implement: {
    bone: {
      label: "DRAW_STEEL.Item.equipment.Implements.Bone",
    },
    crystal: {
      label: "DRAW_STEEL.Item.equipment.Implements.Crystal",
    },
    glass: {
      label: "DRAW_STEEL.Item.equipment.Implements.Glass",
    },
    metal: {
      label: "DRAW_STEEL.Item.equipment.Implements.Metal",
    },
    stone: {
      label: "DRAW_STEEL.Item.equipment.Implements.Stone",
    },
    wood: {
      label: "DRAW_STEEL.Item.equipment.Implements.Wood",
    },
  },
  /** @type {Record<string, {label: string}>} */
  other: {
    feet: {
      label: "DRAW_STEEL.Item.equipment.Other.Feet",
    },
    hands: {
      label: "DRAW_STEEL.Item.equipment.Other.Hands",
    },
    neck: {
      label: "DRAW_STEEL.Item.equipment.Other.Neck",
    },
    ring: {
      label: "DRAW_STEEL.Item.equipment.Other.Ring",
    },
  },
};
preLocalize("equipment.categories", { key: "label" });
preLocalize("equipment.kinds", { key: "label" });
preLocalize("equipment.armor", { key: "label" });
preLocalize("equipment.weapon", { key: "label" });
preLocalize("equipment.implement", { key: "label" });
preLocalize("equipment.other", { key: "label" });

/* -------------------------------------------------- */

DRAW_STEEL.features = {
  /** @type {Record<string, {label: string, subtypes?: Record<string, {label: string}>}>} */
  types: {
    perk: {
      label: "DRAW_STEEL.Item.feature.Types.Perk.Label",
      subtypes: {
        crafting: {
          label: "DRAW_STEEL.Item.feature.Types.Perk.Crafting",
        },
        exploration: {
          label: "DRAW_STEEL.Item.feature.Types.Perk.Exploration",
        },
        interpersonal: {
          label: "DRAW_STEEL.Item.feature.Types.Perk.Interpersonal",
        },
        intrigue: {
          label: "DRAW_STEEL.Item.feature.Types.Perk.Intrigue",
        },
        lore: {
          label: "DRAW_STEEL.Item.feature.Types.Perk.Lore",
        },
        supernatural: {
          label: "DRAW_STEEL.Item.feature.Types.Perk.Supernatural",
        },
      },
    },
    title: {
      label: "DRAW_STEEL.Item.feature.Types.Title.Label",
      subtypes: {
        1: {
          label: "DRAW_STEEL.ECHELON.1",
        },
        2: {
          label: "DRAW_STEEL.ECHELON.2",
        },
        3: {
          label: "DRAW_STEEL.ECHELON.3",
        },
        4: {
          label: "DRAW_STEEL.ECHELON.4",
        },
      },
    },
  },
};
preLocalize("features.types", { key: "label" });
preLocalize("features.types.perk.subtypes", { key: "label" });
preLocalize("features.types.title.subtypes", { key: "label" });

/* -------------------------------------------------- */

DRAW_STEEL.projects = {
  types: {
    crafting: {
      label: "DRAW_STEEL.Item.project.Types.Crafting",
    },
    research: {
      label: "DRAW_STEEL.Item.project.Types.Research",
    },
    other: {
      label: "DRAW_STEEL.Item.project.Types.Other",
    },
  },
  milestones: [{
    min: 0,
    max: 30,
    events: 0,
  },
  {
    min: 31,
    max: 200,
    events: 1,
  },
  {
    min: 201,
    max: 999,
    events: 2,
  },
  {
    min: 1000,
    max: Infinity,
    events: 3,
  }],
};
preLocalize("projects.types", { key: "label" });
