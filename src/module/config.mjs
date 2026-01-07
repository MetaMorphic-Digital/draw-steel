import { systemID } from "./constants.mjs";
import { pseudoDocuments } from "./data/_module.mjs";
import { preLocalize } from "./helpers/localization.mjs";

/** @import { FormSelectOption } from "@client/applications/forms/fields.mjs" */

/**
 * @typedef Reference
 * @property {string} uuid A UUID pointer to a page of type `reference`.
 * @property {string} [identifier] An optional substitution for the key to construct the reference.
 */

/* -------------------------------------------------- */

/**
 * @typedef CharacteristicConfig
 * @property {string} label       Full name (e.g. "Might").
 * @property {string} hint        Short form in all caps (e.g. "M").
 * @property {string} rollKey     Key for `@` references in roll data.
 * @property {Reference} reference
 */

/**
 * The set of Characteristics used within the system.
 * These have special localization handling that checks for `DRAW_STEEL.Actor.characteristics`.
 * @remarks "none" is reserved for cases where we want an explicit non-option *and* default fallbacks
 * @type {Record<string, CharacteristicConfig>}
 */
export const characteristics = Object.seal({
  might: {
    label: "DRAW_STEEL.Actor.characteristics.might.full",
    hint: "DRAW_STEEL.Actor.characteristics.might.abbreviation",
    rollKey: "M",
    reference: {
      uuid: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.LedSCHkhclBNG67p",
    },
  },
  agility: {
    label: "DRAW_STEEL.Actor.characteristics.agility.full",
    hint: "DRAW_STEEL.Actor.characteristics.agility.abbreviation",
    rollKey: "A",
    reference: {
      uuid: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.DG2tkerUo16322AY",
    },
  },
  reason: {
    label: "DRAW_STEEL.Actor.characteristics.reason.full",
    hint: "DRAW_STEEL.Actor.characteristics.reason.abbreviation",
    rollKey: "R",
    reference: {
      uuid: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.rZDHwVr23OILE1XM",
    },
  },
  intuition: {
    label: "DRAW_STEEL.Actor.characteristics.intuition.full",
    hint: "DRAW_STEEL.Actor.characteristics.intuition.abbreviation",
    rollKey: "I",
    reference: {
      uuid: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.btHevmmefh3I1dV1",
    },
  },
  presence: {
    label: "DRAW_STEEL.Actor.characteristics.presence.full",
    hint: "DRAW_STEEL.Actor.characteristics.presence.abbreviation",
    rollKey: "P",
    reference: {
      uuid: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.z5fiYN750d7idtM0",
    },
  },
});
preLocalize("characteristics", { keys: ["label", "hint"] });

/* -------------------------------------------------- */

/**
 *
 * @type {Record<number, {label: string, levels: number[]}>}
 */
export const echelons = {
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
 * @type {Record<string, {label: string}>}
 */
export const sizes = {
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
export const speedOptions = ["teleport", "fly", "walk", "swim", "burrow", "climb"];

/* -------------------------------------------------- */

/**
 * Configuration information for damage types.
 * @type {Record<string, {label: string, color: foundry.utils.Color}>}
 */
export const damageTypes = {
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
export const healingTypes = {
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
 * @property {string} name            The i18n name of the condition. Localized as part of effect creation.
 * @property {string} img             An SVG representing the condition.
 * @property {string} rule            JournalEntryPage UUID Reference for the condition.
 * @property {boolean} [sheet=true]   Show on the actor sheet? An explicit false is needed to not show.
 * @property {boolean} [targeted]     Ask for a targeting prompt when this condition is applied.
 * @property {number} [maxSources]    How many sources can be valid for this condition?
 * @property {number} [defaultSpeed]  Used by slowed to infer the default speed to reduce to.
 * @property {Record<string, Set<string>>} [restrictions] Restrictions on ability usage imposed by this condition.
 *                                    The system currently supports `dsid` and `type` based restrictions.
 */

/**
 * Condition definitions provided by the system that are merged in during the `init` hook
 * Afterwards all references *should* use the core-provided CONFIG.statusEffects
 * The `_id` property is handled as part of the merging process.
 * @type {Record<string, DrawSteelCondition>}
 */
export const conditions = {
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
  surprised: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Surprised.name",
    img: "systems/draw-steel/assets/icons/surprised.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.tmlnHTZhUzy0atvH",
    sheet: false,
    restrictions: {
      type: new Set(["triggered", "freeTriggered"]),
    },
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
    sheet: true,
  },
};

/* -------------------------------------------------- */

/**
 * @typedef EffectEnd
 * @property {string} label
 * @property {string} abbreviation
 * @property {Reference} reference
 */

/**
 * Times when an effect can end.
 * @type {Record<string, {label: string, abbreviation: string}>}
 */
export const effectEnds = {
  turn: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Turn.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Turn.Abbr",
    reference: {
      uuid: "",
      identifier: "eot",
    },
  },
  save: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Save.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Save.Abbr",
    reference: {
      uuid: "",
      identifier: "saveEnds",
    },
  },
  encounter: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Encounter.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Encounter.Abbr",
  },
  respite: {
    label: "DRAW_STEEL.ActiveEffect.Ends.Respite.Label",
    abbreviation: "DRAW_STEEL.ActiveEffect.Ends.Respite.Abbr",
    reference: {
      uuid: "",
    },
  },
};
preLocalize("effectEnds", { keys: ["label", "abbreviation"] });

/* -------------------------------------------------- */

/**
 * Groups of skills; all skills are expected to have a group. Also used for perk types.
 * @type {Record<string, {label: string}>}
 */
const skillGroups = {
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
};

/**
 * List of all skills in Draw Steel.
 * @type {Record<string, {label: string, group: string}>}
 */
const skillList = {
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
};

/**
 * Configuration information for skills.
 */
export const skills = {
  groups: skillGroups,
  list: skillList,
  /**
   * A convenient helper to combine the skill list & groups for display.
   * @type {FormSelectOption[]}
   */
  get optgroups() {
    const config = ds.CONFIG.skills;
    return Object.entries(config.list).reduce((arr, [value, { label, group }]) => {
      arr.push({ label, group: config.groups[group].label, value });
      return arr;
    }, []);
  },
};
preLocalize("skills.groups", { key: "label" });
preLocalize("skills.list", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration information for languages.
 * @type {Record<string, {label: string}>}
 */
export const languages = {
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
export const negotiation = {
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
export const measurements = {
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

/* -------------------------------------------------- */

/**
 * Configuration information for heroes.
 */
export const hero = {
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
    // Knockback
    "Compendium.draw-steel.abilities.Item.emug9cXuwndDrWzu",
    // Melee Free Strike
    "Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6",
    // Ranged Free Strike
    "Compendium.draw-steel.abilities.Item.eqUobBcm81mqZVgJ",
    // Stand Up
    "Compendium.draw-steel.abilities.Item.XeUU0Blvi0fy0b2G",
    // Advance
    "Compendium.draw-steel.abilities.Item.ucR2C7lMvXrKIMZ7",
    // Disengage
    "Compendium.draw-steel.abilities.Item.vBlTvHRZ5JBXWYt6",
    // Ride
    "Compendium.draw-steel.abilities.Item.QXOkflcYF6DITJE3",
  ]),
  /**
   * XP advancement options for heroes.
   */
  xpTracks: {
    normal: {
      label: "DRAW_STEEL.Setting.XPAdvancement.NormalSpeed",
      track: [0, 16, 32, 48, 64, 80, 96, 112, 128, 144],
    },
    double: {
      label: "DRAW_STEEL.Setting.XPAdvancement.DoubleSpeed",
      track: [0, 8, 16, 24, 32, 40, 48, 56, 64, 72],
    },
    half: {
      label: "DRAW_STEEL.Setting.XPAdvancement.HalfSpeed",
      track: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288],
    },
  },
  /**
   * The chosen XP advancement option from the settings.
   * @type {number[]}
   */
  get xpTrack() {
    const xpSetting = game.settings.get(systemID, "xpAdvancement");
    // In case a module added track is removed.
    const fallbackTrack = ds.CONFIG.hero.xpTracks.normal?.track ?? Object.values(ds.CONFIG.hero.xpTracks)[0].track;

    return ds.CONFIG.hero.xpTracks[xpSetting]?.track ?? fallbackTrack;
  },
  /**
   * A deprecated version of {@linkcode ds.CONFIG.hero.xpTrack}.
   */
  get xp_track () {
    foundry.utils.logCompatibilityWarning("ds.CONFIG.hero.xp_track is deprecated. To get the currently configured "
      + "xp track use ds.CONFIG.hero.xpTrack instead. Setting an xp track "
      + "has moved to an object in ds.CONFIG.hero.xpTracks.", { since: "0.10.0", until: "0.12.0", once: true });
    return ds.CONFIG.hero.xpTrack;
  },
  /**
   * Ways to spend hero tokens.
   * @type {Record<string, {label: string, tokens: number, messageContent: string}>}
   */
  tokenSpends: {
    generic: {
      label: "DRAW_STEEL.Setting.HeroTokens.Generic.label",
      tokens: 1,
      messageContent: "DRAW_STEEL.Setting.HeroTokens.Generic.messageContent",
    },
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
 * @typedef MonsterKeyword
 * @property {string} label
 * @property {string} group
 * @property {Reference} [reference] An optional pointer to a UUID reference with a description of the keyword.
 */

/** @type {Record<string, MonsterKeyword>} */
const monsterKeywords = {
  abyssal: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Abyssal",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  accursed: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Accursed",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  animal: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Animal",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  beast: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Beast",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  construct: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Construct",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  dragon: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Dragon",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  elemental: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Elemental",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  fey: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Fey",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  giant: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Giant",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  horror: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Horror",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  humanoid: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Humanoid",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  infernal: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Infernal",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  plant: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Plant",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  soulless: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Soulless",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  swarm: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Swarm",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
  undead: {
    label: "DRAW_STEEL.Actor.npc.KEYWORDS.Undead",
    group: "DRAW_STEEL.Actor.npc.KeywordGroups.General",
    reference: {
      uuid: "",
    },
  },
};

/**
 * @typedef MonsterOrganization
 * @property {string} label
 * @property {Reference} reference
 */

/** @type {Record<string, MonsterOrganization>} */
const monsterOrganizations = {
  minion: {
    label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Minion",
    reference: {
      uuid: "",
    },
  },
  horde: {
    label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Horde",
    reference: {
      uuid: "",
    },
  },
  platoon: {
    label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Platoon",
    reference: {
      uuid: "",
    },
  },
  elite: {
    label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Elite",
    reference: {
      uuid: "",
    },
  },
  leader: {
    label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Leader",
    reference: {
      uuid: "",
    },
  },
  solo: {
    label: "DRAW_STEEL.Actor.npc.ORGANIZATIONS.Solo",
    reference: {
      uuid: "",
    },
  },
};

/**
 * @typedef MonsterRole
 * @property {string} label
 * @property {Reference} reference
 */

/** @type {Record<string, MonsterRole>} */
const monsterRoles = {
  ambusher: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Ambusher",
    reference: {
      uuid: "",
    },
  },
  artillery: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Artillery",
    reference: {
      uuid: "",
    },
  },
  brute: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Brute",
    reference: {
      uuid: "",
    },
  },
  controller: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Controller",
    reference: {
      uuid: "",
    },
  },
  defender: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Defender",
    reference: {
      uuid: "",
    },
  },
  harrier: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Harrier",
    reference: {
      uuid: "",
    },
  },
  hexer: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Hexer",
    reference: {
      uuid: "",
    },
  },
  mount: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Mount",
    reference: {
      uuid: "",
    },
  },
  support: {
    label: "DRAW_STEEL.Actor.npc.ROLES.Support",
    reference: {
      uuid: "",
    },
  },
};

/**
 * Configuration information for monsters.
 */
export const monsters = {
  keywords: monsterKeywords,
  organizations: monsterOrganizations,
  roles: monsterRoles,
};
preLocalize("monsters.keywords", { keys: ["label", "group"] });
preLocalize("monsters.organizations", { key: "label" });
preLocalize("monsters.roles", { key: "label" });

/* -------------------------------------------------- */

/**
 * Keywords available for abilities. Used by both system and user-defined automation.
 * Groups are directly i18n strings, and exist for the purpose of denoting class-specific keywords.
 * @type {Record<string, {label: string, group?: string}>}
 */
const abilityKeywords = {
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
  performance: {
    label: "DRAW_STEEL.Item.ability.Keywords.Performance",
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
};

/**
 * @typedef AbilityType
 * @property {string} label
 * @property {boolean} [triggered]
 * @property {Reference} reference
 */

/**
 * Action types for abilities.
 * @type {Record<string, AbilityType>}
 */
const abilityTypes = {
  main: {
    label: "DRAW_STEEL.Item.ability.Type.Main",
    reference: {
      uuid: "",
      identifier: "mainAction",
    },
  },
  maneuver: {
    label: "DRAW_STEEL.Item.ability.Type.Maneuver",
    reference: {
      uuid: "",
    },
  },
  freeManeuver: {
    label: "DRAW_STEEL.Item.ability.Type.FreeManeuver",
    reference: {
      uuid: "",
    },
  },
  triggered: {
    label: "DRAW_STEEL.Item.ability.Type.Triggered",
    triggered: true,
    reference: {
      uuid: "",
      identifier: "triggeredAction",
    },
  },
  freeTriggered: {
    label: "DRAW_STEEL.Item.ability.Type.FreeTriggered",
    triggered: true,
    reference: {
      uuid: "",
      identifier: "freeTriggeredAction",
    },
  },
  move: {
    label: "DRAW_STEEL.Item.ability.Type.Move",
    reference: {
      uuid: "",
      identifier: "moveAction",
    },
  },
  none: {
    label: "DRAW_STEEL.Item.ability.Type.None",
    reference: {
      uuid: "",
      identifier: "noAction",
    },
  },
  villain: {
    label: "DRAW_STEEL.Item.ability.Type.Villain",
    reference: {
      uuid: "",
    },
  },
};

/**
 * @typedef AbilityCategory
 * @property {string} label
 * @property {Reference} [reference]
 */

/**
 * Ability category, e.g. "Villain Action".
 * @type {Record<string, {label: string}>}
 */
const abilityCategories = {
  heroic: {
    label: "DRAW_STEEL.Item.ability.Category.Heroic",
    reference: {
      uuid: "",
      identifier: "heroicAbility",
    },
  },
  freeStrike: {
    label: "DRAW_STEEL.Item.ability.Category.FreeStrike",
    reference: {
      uuid: "",
    },
  },
  signature: {
    label: "DRAW_STEEL.Item.ability.Category.Signature",
    reference: {
      uuid: "",
      identifier: "signatureAbility",
    },
  },
  villain: {
    label: "DRAW_STEEL.Item.ability.Category.Villain",
  },
};

/**
 * @typedef AbilityDistance
 * @property {string} label
 * @property {string} [primary]     Distance measurement label.
 * @property {string} [secondary]   Distance measurement label.
 * @property {string} [tertiary]    Distance measurement label.
 * @property {boolean} [area]       Does this count as an area measurment?
 * @property {string} embedLabel    Format string for the display in the ability embed.
 * @property {Reference} [reference]
 */

/**
 * Valid distances.
 * @type {Record<string, AbilityDistance>}
 */
const abilityDistances = {
  melee: {
    label: "DRAW_STEEL.Item.ability.Distance.Melee",
    primary: "DRAW_STEEL.Item.ability.Distance.Melee",
    embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Melee",
    reference: {
      uuid: "",
    },
  },
  ranged: {
    label: "DRAW_STEEL.Item.ability.Distance.Ranged",
    primary: "DRAW_STEEL.Item.ability.Distance.Ranged",
    embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Ranged",
    reference: {
      uuid: "",
    },
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
    reference: {
      uuid: "",
    },
  },
  burst: {
    label: "DRAW_STEEL.Item.ability.Distance.Burst",
    primary: "DRAW_STEEL.Item.ability.Distance.Burst",
    area: true,
    embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Burst",
    reference: {
      uuid: "",
    },
  },
  cube: {
    label: "DRAW_STEEL.Item.ability.Distance.Cube",
    primary: "DRAW_STEEL.Item.ability.Distance.Length",
    secondary: "DRAW_STEEL.Item.ability.Distance.Ranged",
    area: true,
    embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Cube",
    reference: {
      uuid: "",
    },
  },
  line: {
    label: "DRAW_STEEL.Item.ability.Distance.Line",
    primary: "DRAW_STEEL.Item.ability.Distance.Length",
    secondary: "DRAW_STEEL.Item.ability.Distance.Width",
    tertiary: "DRAW_STEEL.Item.ability.Distance.Ranged",
    area: true,
    embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Line",
    reference: {
      uuid: "",
    },
  },
  wall: {
    label: "DRAW_STEEL.Item.ability.Distance.Wall",
    primary: "DRAW_STEEL.Item.ability.Distance.Squares",
    secondary: "DRAW_STEEL.Item.ability.Distance.Ranged",
    area: true,
    embedLabel: "DRAW_STEEL.Item.ability.DistanceEmbed.Wall",
    reference: {
      uuid: "",
    },
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
};

/**
 * @typedef AbilityTarget
 * @property {string} label
 * @property {string} [all]       I18n key for an ability that targets everything within an area.
 * @property {string} embedLabel  Format string for display in the ability embed.
 * @property {Reference} [reference] An optional UUID with a description of the ability targets.
 */

/**
 * Valid targeting categories.
 * @type {Record<string, AbilityTarget>}
 */
const abilityTargets = {
  creature: {
    label: "DRAW_STEEL.Item.ability.Target.Creature",
    all: "DRAW_STEEL.Item.ability.Target.AllCreatures",
    embedLabel: "DRAW_STEEL.Item.ability.Target.CreatureEmbed",
    reference: {
      uuid: "",
    },
  },
  object: {
    label: "DRAW_STEEL.Item.ability.Target.Object",
    all: "DRAW_STEEL.Item.ability.Target.AllObjects",
    embedLabel: "DRAW_STEEL.Item.ability.Target.ObjectEmbed",
    reference: {
      uuid: "",
    },
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
    reference: {
      uuid: "",
    },
  },
  enemyObject: {
    label: "DRAW_STEEL.Item.ability.Target.EnemyObject",
    all: "DRAW_STEEL.Item.ability.Target.AllEnemyObject",
    embedLabel: "DRAW_STEEL.Item.ability.Target.EnemyObjectEmbed",
  },
  ally: {
    label: "DRAW_STEEL.Item.ability.Target.Ally",
    all: "DRAW_STEEL.Item.ability.Target.AllAllies",
    embedLabel: "DRAW_STEEL.Item.ability.Target.AllyEmbed",
    reference: {
      uuid: "",
    },
  },
  self: {
    label: "DRAW_STEEL.Item.ability.Target.Self",
    embedLabel: "DRAW_STEEL.Item.ability.Target.Self",
  },
  selfOrAlly: {
    label: "DRAW_STEEL.Item.ability.Target.SelfOrAlly",
    embedLabel: "DRAW_STEEL.Item.ability.Target.SelfOrAlly",
  },
  selfOrCreature: {
    label: "DRAW_STEEL.Item.ability.Target.SelfOrCreature",
    embedLabel: "DRAW_STEEL.Item.ability.Target.SelfOrCreature",
  },
  selfAlly: {
    label: "DRAW_STEEL.Item.ability.Target.SelfAlly",
    all: "DRAW_STEEL.Item.ability.Target.AllSelfAllies",
    embedLabel: "DRAW_STEEL.Item.ability.Target.SelfAllyEmbed",
  },
  special: {
    label: "DRAW_STEEL.Item.ability.Target.Special",
    embedLabel: "DRAW_STEEL.Item.ability.Target.Special",
  },
};

/**
 * @typedef ForcedMovement
 * @property {string} label
 * @property {string} vertical I18n key for the vertical version of this movement.
 * @property {Reference} reference
 */

/**
 * Forced movement categories.
 * @type {Record<string, ForcedMovement>}
 */
const abilityForcedMovement = {
  push: {
    label: "DRAW_STEEL.Item.ability.ForcedMovement.Push",
    vertical: "DRAW_STEEL.Item.ability.ForcedMovement.VerticalPush",
    reference: {
      uuid: "",
    },
  },
  pull: {
    label: "DRAW_STEEL.Item.ability.ForcedMovement.Pull",
    vertical: "DRAW_STEEL.Item.ability.ForcedMovement.VerticalPull",
    reference: {
      uuid: "",
    },
  },
  slide: {
    label: "DRAW_STEEL.Item.ability.ForcedMovement.Slide",
    vertical: "DRAW_STEEL.Item.ability.ForcedMovement.VerticalSlide",
    reference: {
      uuid: "",
    },
  },
};

/**
 * Configuration information for Ability items.
 */
export const abilities = {
  keywords: abilityKeywords,
  /**
   * A convenient helper to prepare the ability keyword list & groups for display.
   * @type {FormSelectOption[]}
   */
  get keywordOptions() {
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
  types: abilityTypes,
  categories: abilityCategories,
  distances: abilityDistances,
  targets: abilityTargets,
  forcedMovement: abilityForcedMovement,
};
preLocalize("abilities.keywords", { keys: ["label", "group"] });
preLocalize("abilities.types", { key: "label" });
preLocalize("abilities.categories", { key: "label" });
// Embed labels intentionally not pre-localized because they rely on `format` instead of `localize`
preLocalize("abilities.distances", { keys: ["label", "primary", "secondary", "tertiary"] });
preLocalize("abilities.targets", { keys: ["label", "all"] });
preLocalize("abilities.forcedMovement", { keys: ["label", "vertical"] });

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
export const PowerRollEffect = {
  damage: {
    label: "TYPES.PowerRollEffect.damage",
    defaultImage: "icons/svg/fire.svg",
    documentClass: pseudoDocuments.powerRollEffects.DamagePowerRollEffect,
  },
  applied: {
    label: "TYPES.PowerRollEffect.applied",
    defaultImage: "icons/svg/paralysis.svg",
    documentClass: pseudoDocuments.powerRollEffects.AppliedPowerRollEffect,
    properties: {
      stacking: {
        label: "DRAW_STEEL.POWER_ROLL_EFFECT.APPLIED.Properties.stacking",
      },
    },
  },
  forced: {
    label: "TYPES.PowerRollEffect.forced",
    defaultImage: "icons/svg/portal.svg",
    documentClass: pseudoDocuments.powerRollEffects.ForcedMovementPowerRollEffect,
    properties: {
      ignoresImmunity: {
        label: "DRAW_STEEL.POWER_ROLL_EFFECT.FORCED.Properties.IgnoresStability",
      },
      vertical: {
        label: "DRAW_STEEL.POWER_ROLL_EFFECT.FORCED.Properties.Vertical",
      },
    },
  },
  resource: {
    label: "TYPES.PowerRollEffect.resource",
    defaultImage: "icons/svg/lightning.svg",
    documentClass: pseudoDocuments.powerRollEffects.GainResourcePowerRollEffect,
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
export const Advancement = {
  characteristic: {
    label: "TYPES.Advancement.characteristic",
    defaultImage: "icons/svg/upgrade.svg",
    itemTypes: new Set(["class", "title"]),
    documentClass: pseudoDocuments.advancements.CharacteristicAdvancement,
  },
  itemGrant: {
    label: "TYPES.Advancement.itemGrant",
    defaultImage: "icons/svg/item-bag.svg",
    itemTypes: new Set(["ancestry", "ancestryTrait", "career", "class", "complication", "feature", "kit", "perk", "subclass", "title"]),
    documentClass: pseudoDocuments.advancements.ItemGrantAdvancement,
  },
  skill: {
    label: "TYPES.Advancement.skill",
    defaultImage: "icons/svg/hanging-sign.svg",
    itemTypes: new Set(["career", "ancestryTrait", "class", "complication", "culture", "feature", "subclass", "title"]),
    documentClass: pseudoDocuments.advancements.SkillAdvancement,
  },
  language: {
    label: "TYPES.Advancement.language",
    defaultImage: "icons/svg/village.svg",
    itemTypes: new Set(["career", "class", "complication", "culture", "feature", "subclass", "title"]),
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
export const culture = {
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
      skillChoices: new Set(["blacksmithing", "fletching", "climb", "endurance", "ride", "intimidate", "alertness", "track", "monsters", "strategy"]),
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
 * Keywords available to all treasure types.
 * @type {Record<string, {label: string}>}
 */
const treasureKeywords = {
  magic: {
    label: "DRAW_STEEL.Item.treasure.Keywords.Magic",
  },
  psionic: {
    label: "DRAW_STEEL.Item.treasure.Keywords.Psionic",
  },
};

/**
 * @typedef TreasureCategory
 * @property {string} label
 * @property {Reference} reference
 * @property {FormSelectOption[]} keywords
 */

/**
 * Core types of treasures.
 * @type {Record<string, TreasureCategory>}
 */
const treasureCategories = {
  consumable: {
    label: "DRAW_STEEL.Item.treasure.Categories.Consumable",
    reference: {
      uuid: "",
    },
    get keywords() {
      return Object.entries(ds.CONFIG.equipment.consumables)
        .map(([value, { label }]) => ({ label, value, group: ds.CONFIG.equipment.categories.consumable.label }));
    },
  },
  trinket: {
    label: "DRAW_STEEL.Item.treasure.Categories.Trinket",
    reference: {
      uuid: "",
    },
    get keywords() {
      return Object.entries(ds.CONFIG.equipment.other)
        .map(([value, { label }]) => ({ label, value, group: ds.CONFIG.equipment.categories.trinket.label }));
    },
  },
  leveled: {
    label: "DRAW_STEEL.Item.treasure.Categories.Leveled",
    reference: {
      uuid: "",
      identifier: "leveledTreasure",
    },
    get keywords() {
      return [];
    },
  },
  artifact: {
    label: "DRAW_STEEL.Item.treasure.Categories.Artifact",
    reference: {
      uuid: "",
    },
    get keywords() {
      return [];
    },
  },
};

/**
 * Used by Leveled Treasures and Artifacts.
 * @type {Record<string, {label: string}>}
 */
const equipmentKinds = {
  other: {
    label: "DRAW_STEEL.Item.treasure.Kinds.Other",
  },
  armor: {
    label: "DRAW_STEEL.Item.treasure.Kinds.Armor",
  },
  implement: {
    label: "DRAW_STEEL.Item.treasure.Kinds.Implement",
  },
  weapon: {
    label: "DRAW_STEEL.Item.treasure.Kinds.Weapon",
  },
};

/**
 * @typedef ArmorType
 * @property {string} label
 * @property {boolean} kitEquipment Is this an eligible choice for a kit's equipment.
 * @property {Reference} reference     A UUID with a description for the armor type.
 */

/**
 * Also used by kits.
 * @type {Record<string, ArmorType>}
 */
const armorTypes = {
  none: {
    label: "DRAW_STEEL.Item.treasure.Armor.None",
    kitEquipment: true,
    reference: {
      uuid: "",
      identifier: "noArmor",
    },
  },
  light: {
    label: "DRAW_STEEL.Item.treasure.Armor.Light",
    kitEquipment: true,
    reference: {
      uuid: "",
      identifier: "lightArmor",
    },
  },
  medium: {
    label: "DRAW_STEEL.Item.treasure.Armor.Medium",
    kitEquipment: true,
    reference: {
      uuid: "",
      identifier: "mediumArmor",
    },
  },
  heavy: {
    label: "DRAW_STEEL.Item.treasure.Armor.Heavy",
    kitEquipment: true,
    reference: {
      uuid: "",
      identifier: "heavyArmor",
    },
  },
  shield: {
    label: "DRAW_STEEL.Item.treasure.Armor.Shield",
    kitEquipment: false,
    reference: {
      uuid: "",
    },
  },
};

/**
 * @typedef WeaponType
 * @property {string} label
 * @property {Reference} reference
 */

/**
 * Also used by kits.
 * @type {Record<string, WeaponType>}
 */
const weaponTypes = {
  none: {
    label: "DRAW_STEEL.Item.treasure.Weapons.None",
    reference: {
      uuid: "",
      identifier: "noWeapon",
    },
  },
  bow: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Bow",
    reference: {
      uuid: "",
    },
  },
  ensnaring: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Ensnaring",
    reference: {
      uuid: "",
    },
  },
  heavy: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Heavy",
    reference: {
      uuid: "",
      identifier: "heavyWeapon",
    },
  },
  light: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Light",
    reference: {
      uuid: "",
      identifier: "lightWeapon",
    },
  },
  medium: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Medium",
    reference: {
      uuid: "",
      identifier: "mediumWeapon",
    },
  },
  polearm: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Polearm",
    reference: {
      uuid: "",
    },
  },
  unarmed: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Unarmed",
    reference: {
      uuid: "",
    },
  },
  whip: {
    label: "DRAW_STEEL.Item.treasure.Weapons.Whip",
    reference: {
      uuid: "",
    },
  },
};

/**
 * Implements are pieces of jewelry, orbs, staffs, tomes, wands, and other objects used by magic and psionic heroes to focus their power.
 * @type {Record<string, {label: string}>}
 */
const implementTypes = {
  implement: {
    label: "DRAW_STEEL.Item.treasure.Kinds.Implement",
  },
  orb: {
    label: "DRAW_STEEL.Item.treasure.Implements.Orb",
  },
  wand: {
    label: "DRAW_STEEL.Item.treasure.Implements.Wand",
  },
};

/**
 * Used by "Other Leveled Treasures" and trinkets.
 * @type {Record<string, {label: string}>}
 */
const otherTypes = {
  arms: {
    label: "DRAW_STEEL.Item.treasure.Other.Arms",
  },
  feet: {
    label: "DRAW_STEEL.Item.treasure.Other.Feet",
  },
  hands: {
    label: "DRAW_STEEL.Item.treasure.Other.Hands",
  },
  head: {
    label: "DRAW_STEEL.Item.treasure.Other.Head",
  },
  neck: {
    label: "DRAW_STEEL.Item.treasure.Other.Neck",
  },
  ring: {
    label: "DRAW_STEEL.Item.treasure.Other.Ring",
  },
  waist: {
    label: "DRAW_STEEL.Item.treasure.Other.Waist",
  },
};

/**
 * Valid keywords for consumables.
 * @type {Record<string, {label: string}>}
 */
const consumableTypes = {
  oil: {
    label: "DRAW_STEEL.Item.treasure.Consumable.Oil",
  },
  potion: {
    label: "DRAW_STEEL.Item.treasure.Consumable.Potion",
  },
  scroll: {
    label: "DRAW_STEEL.Item.treasure.Consumable.Scroll",
  },
};

/**
 * Configuration details for Treasure items
 * Also used by Kits.
 */
export const equipment = {
  keywords: treasureKeywords,
  categories: treasureCategories,
  kinds: equipmentKinds,
  armor: armorTypes,
  weapon: weaponTypes,
  implement: implementTypes,
  other: otherTypes,
  consumables: consumableTypes,
};
preLocalize("equipment.keywords", { key: "label" });
preLocalize("equipment.categories", { key: "label" });
preLocalize("equipment.kinds", { key: "label" });
preLocalize("equipment.armor", { key: "label" });
preLocalize("equipment.weapon", { key: "label" });
preLocalize("equipment.implement", { key: "label" });
preLocalize("equipment.other", { key: "label" });
preLocalize("equipment.consumables", { key: "label" });

/* -------------------------------------------------- */

/**
 * Configuration details for Feature items.
 */
export const features = { };

/* -------------------------------------------------- */

/**
 * Configuration details for perk items.
 */
export const perks = {
  /**
   * Types of perks in addition to the available skill groups.
   * Heroes pg 227, "Five of those [perk] types reflect the setup of the five skill groups.".
   * @type {Record<string, {label: string}>}
   */
  types: {
    supernatural: {
      label: "DRAW_STEEL.Item.perk.Types.Supernatural",
    },
  },
  /**
   * All perk type options.
   * @type {FormSelectOption[]}
   */
  get typeOptions() {
    const skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, entry]) => ({ value, label: entry.label }));
    return skillGroups.concat(Object.entries(ds.CONFIG.perks.types).map(([value, entry]) => ({ value, label: entry.label })));
  },
};
preLocalize("perks.types", { key: "label" });

/* -------------------------------------------------- */

/**
 * @typedef ProjectType
 * @property {string} label
 * @property {Reference} [reference]
 */

/** @type {Record<string, ProjectType>} */
const projectTypes = {
  crafting: {
    label: "DRAW_STEEL.Item.project.Types.Crafting",
    reference: {
      uuid: "",
    },
  },
  research: {
    label: "DRAW_STEEL.Item.project.Types.Research",
    reference: {
      uuid: "",
    },
  },
  other: {
    label: "DRAW_STEEL.Item.project.Types.Other",
    reference: {
      uuid: "",
    },
  },
};

/**
 * @typedef ProjectMilestone
 * @property {number} min
 * @property {number} max
 * @property {number} events
 */

/** @type {ProjectMilestone[]} */
const projectMilestones = [
  {
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
  },
];

/**
 * Configuration details for project items.
 */
export const projects = {
  types: projectTypes,
  milestones: projectMilestones,
};
preLocalize("projects.types", { key: "label" });

/* -------------------------------------------------- */

/**
 * @typedef SourceBook
 * @property {string} label   An i18n key for the label that will show in sheet headers.
 * @property {string} title   An i18n key for the longer title that will display in the Compendium Browser.
 */

/**
 * Source books provided in the data list for the Document Source Input.
 * @type {Record<string, SourceBook>}
 */
const sourceBooks = {
  Heroes: {
    label: "DRAW_STEEL.SOURCE.Books.Heroes.Label",
    title: "DRAW_STEEL.SOURCE.Books.Heroes.Title",
  },
  Monsters: {
    label: "DRAW_STEEL.SOURCE.Books.Monsters.Label",
    title: "DRAW_STEEL.SOURCE.Books.Monsters.Title",
  },
};

/**
 * @typedef ContentLicense
 * @property {string} [label] An i18n key pointing to longer version of the name of the license.
 */

/**
 * Licenses for Draw Steel content.
 * The keys are human readable in the sources panel.
 * @type {Record<string, ContentLicense>}
 */
const sourceLicenses = {
  "Draw Steel Creator License": {
    label: "DRAW_STEEL.SOURCE.Licenses.DSCL",
  },
};

export const sourceInfo = {
  books: sourceBooks,
  licenses: sourceLicenses,
};
preLocalize("sourceInfo.books", { keys: ["label", "title"] });
preLocalize("sourceInfo.licenses", { keys: ["label"] });

/* -------------------------------------------------- */

/**
 * Record of journal entry pages of type `reference` that help display tooltips
 * throughout the system.
 * @type {Record<string, string>}
 */
export const references = {
  ability: "",
  abilityRoll: "",
  adjacent: "",
  ancestry: "",
  areaOfEffect: "",
  argument: "",
  artisan: "",
  background: "",
  bane: "",
  bonus: "",
  breakthrough: "",
  burrow: "",
  capital: "",
  career: "",
  characteristic: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.wbCPqatk0kRgrZpy",
  ceiling: "",
  class: "",
  climb: "",
  combatRound: "",
  complication: "",
  concealment: "",
  condition: "",
  consequence: "",
  cover: "",
  crawl: "",
  criticalHit: "",
  culture: "",
  damage: "",
  damageImmunity: "",
  damageWeakness: "",
  damagingTerrain: "",
  difficultTerrain: "",
  director: "",
  distance: "",
  doubleBane: "",
  doubleEdge: "",
  downtimeProject: "",
  echelon: "",
  edge: "",
  enhancement: "",
  experience: "",
  falling: "",
  flanking: "",
  fly: "",
  forcedMovement: "",
  follower: "",
  god: "",
  ground: "",
  groupTest: "",
  guide: "",
  hero: "",
  heroTokens: "",
  heroicResource: "",
  highGround: "",
  hover: "",
  implement: "",
  interest: "",
  itemPrerequisite: "",
  jump: "",
  kit: "",
  level: "",
  lineOfEffect: "",
  malice: "",
  manifold: "",
  montageTest: "",
  motivation: "",
  mountedCombat: "",
  movement: "",
  mundane: "",
  natural19or20: "",
  naturalRoll: "",
  negotiation: "",
  npc: "",
  objective: "",
  opportunityAttack: "",
  opposedPowerRoll: "",
  orden: "",
  patience: "",
  penalty: "",
  perk: "",
  pitfall: "",
  potency: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.TDEeoUAJRUSBkByN",
  powerRoll: "Compendium.draw-steel.journals.JournalEntry.f8eNK5Pte4CSdex0.JournalEntryPage.tpLzfZEnAg3WAc8J",
  projectEvent: "",
  projectGoal: "",
  projectPoints: "",
  projectRoll: "",
  projectSource: "",
  reactiveTest: "",
  recoveries: "",
  recoveryValue: "",
  renown: "",
  respiteActivity: "",
  retainer: "",
  reward: "",
  rolledDamage: "",
  sage: "",
  saint: "",
  savingThrow: "",
  shift: "",
  side: "",
  size: "",
  skill: "",
  space: "",
  speed: "",
  square: "",
  stability: "",
  stamina: "",
  strained: "",
  strike: "",
  subclass: "",
  suffocating: "",
  supernatural: "",
  surge: "",
  swim: "",
  target: "",
  teleport: "",
  temporaryStamina: "",
  test: "",
  tierOutcome: "",
  tier1: "",
  tier2: "",
  tier3: "",
  title: "",
  timescape: "",
  treasure: "",
  turn: "",
  unattendedObject: "",
  underwaterCombat: "",
  untypedDamage: "",
  vasloria: "",
  vertical: "",
  victories: "",
  walk: "",
  wealth: "",
  winded: "",
};
