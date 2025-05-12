import { pseudoDocuments } from "./data/_module.mjs";
import { preLocalize } from "./helpers/localization.mjs";

/** @import { FormSelectOption } from "@client/applications/forms/fields.mjs" */

export const DRAW_STEEL = {};

/**
 * The set of Characteristics used within the system.
 * These have special localization handling that checks for `DRAW_STEEL.Actor.characteristics`.
 * The `label` is the full name (e.g. Might).
 * The `hint` is the short form in all caps (e.g. M).
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

/**
 *
 * @type {Record<number, {label: string, levels: number[]}>}
 */
DRAW_STEEL.echelons = {
  1: {
    label: "DRAW_STEEL.Echelon.1",
    threshold: -Infinity,
  },
  2: {
    label: "DRAW_STEEL.Echelon.2",
    threshold: 4,
  },
  3: {
    label: "DRAW_STEEL.Echelon.3",
    threshold: 7,
  },
  4: {
    label: "DRAW_STEEL.Echelon.4",
    threshold: 10,
  },
};
preLocalize("echelons", { key: "label" });

/**
 * Valid letter modifiers for size 1 creatures
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

/**
 * Keys in `CONFIG.Token.movement.actions` to include as valid movement tag options for the Actor sheet.
 * Order also functions as a priority list for DrawSteelTokenDocument#_inferMovementAction
 * @type {string[]}
 */
DRAW_STEEL.speedOptions = ["teleport", "fly", "walk", "swim", "burrow", "climb"];

/**
 * Configuration information for damage types
 * @type {Record<string, {label: string}>}
 */
DRAW_STEEL.damageTypes = {
  acid: {
    label: "DRAW_STEEL.DamageTypes.Acid",
  },
  cold: {
    label: "DRAW_STEEL.DamageTypes.Cold",
  },
  corruption: {
    label: "DRAW_STEEL.DamageTypes.Corruption",
  },
  fire: {
    label: "DRAW_STEEL.DamageTypes.Fire",
  },
  holy: {
    label: "DRAW_STEEL.DamageTypes.Holy",
  },
  lightning: {
    label: "DRAW_STEEL.DamageTypes.Lightning",
  },
  poison: {
    label: "DRAW_STEEL.DamageTypes.Poison",
  },
  psychic: {
    label: "DRAW_STEEL.DamageTypes.Psychic",
  },
  sonic: {
    label: "DRAW_STEEL.DamageTypes.Sonic",
  },
};
preLocalize("damageTypes", { key: "label" });

/**
 * Condition definitions provided by the system that are merged in during the `init` hook
 * Afterwards all references *should* use the core-provided CONFIG.statusEffects
 * @type {Record<string, {
 *  img: string,
 *  name: string,
 *  rule: string,
 *  targeted? boolean,
 *  maxSources?: number,
 *  defaultSpeed?: number,
 *  restrictions?: Record<string, Set<string>>
 * }>}
 */
DRAW_STEEL.conditions = {
  bleeding: {
    name: "DRAW_STEEL.Effect.Conditions.Bleeding.name",
    img: "icons/svg/blood.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.YzgERGFhFphgpjKQ",
  },
  dazed: {
    name: "DRAW_STEEL.Effect.Conditions.Dazed.name",
    img: "icons/svg/daze.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.K2dZpCsAOU7xMpWb",
    restrictions: {
      type: new Set(["freeManeuver", "triggered", "freeTriggered"]),
    },
  },
  frightened: {
    name: "DRAW_STEEL.Effect.Conditions.Frightened.name",
    img: "icons/svg/terror.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.bXiI9vUF3tF78qXg",
    targeted: true,
    maxSources: 1,
  },
  grabbed: {
    name: "DRAW_STEEL.Effect.Conditions.Grabbed.name",
    img: "systems/draw-steel/assets/icons/hand-grabbing-fill.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.aWBP2vfXXM3fzuVn",
    targeted: true,
    restrictions: {
      dsid: new Set(["knockback"]),
    },
  },
  prone: {
    name: "DRAW_STEEL.Effect.Conditions.Prone.name",
    img: "icons/svg/falling.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.v11clsSMgoFZm3V8",
  },
  restrained: {
    name: "DRAW_STEEL.Effect.Conditions.Restrained.name",
    img: "icons/svg/net.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.6IfH6beu8LjK08Oj",
    restrictions: {
      dsid: new Set(["stand-up"]),
    },
  },
  slowed: {
    name: "DRAW_STEEL.Effect.Conditions.Slowed.name",
    img: "systems/draw-steel/assets/icons/snail.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.aFEwQG4OcYDNp8DL",
    defaultSpeed: 2,
  },
  taunted: {
    name: "DRAW_STEEL.Effect.Conditions.Taunted.name",
    img: "systems/draw-steel/assets/icons/flag-banner-fold-fill.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.9zseFmXdcSw8MuKh",
    targeted: true,
    maxSources: 1,
  },
  weakened: {
    name: "DRAW_STEEL.Effect.Conditions.Weakened.name",
    img: "icons/svg/downgrade.svg",
    rule: "Compendium.draw-steel.journals.JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.QZpLhRT6imKlqZ1n",
  },
};

/**
 * Times when an effect can end
 * @enum {{label: string, abbreviation: string}}
 */
DRAW_STEEL.effectEnds = {
  turn: {
    label: "DRAW_STEEL.Effect.Ends.Turn.Label",
    abbreviation: "DRAW_STEEL.Effect.Ends.Turn.Abbr",
  },
  save: {
    label: "DRAW_STEEL.Effect.Ends.Save.Label",
    abbreviation: "DRAW_STEEL.Effect.Ends.Save.Abbr",
  },
  encounter: {
    label: "DRAW_STEEL.Effect.Ends.Encounter.Label",
    abbreviation: "DRAW_STEEL.Effect.Ends.Encounter.Abbr",
  },
};
preLocalize("effectEnds", { keys: ["label", "abbreviation"] });

/**
 * Configuration information for skills
 * @type {{
 *  groups: Record<string, {label: string}>,
 *  list: Record<string, {label: string, group: string}>,
 *  optgroups: FormSelectOption[]
 * }}
 */
DRAW_STEEL.skills = {
  groups: {
    crafting: {
      label: "DRAW_STEEL.Skill.Group.Crafting",
    },
    exploration: {
      label: "DRAW_STEEL.Skill.Group.Exploration",
    },
    interpersonal: {
      label: "DRAW_STEEL.Skill.Group.Interpersonal",
    },
    intrigue: {
      label: "DRAW_STEEL.Skill.Group.Intrigue",
    },
    lore: {
      label: "DRAW_STEEL.Skill.Group.Lore",
    },
  },
  list: {
    alchemy: {
      label: "DRAW_STEEL.Skill.List.Alchemy",
      group: "crafting",
    },
    architecture: {
      label: "DRAW_STEEL.Skill.List.Architecture",
      group: "crafting",
    },
    blacksmithing: {
      label: "DRAW_STEEL.Skill.List.Blacksmithing",
      group: "crafting",
    },
    fletching: {
      label: "DRAW_STEEL.Skill.List.Fletching",
      group: "crafting",
    },
    forgery: {
      label: "DRAW_STEEL.Skill.List.Forgery",
      group: "crafting",
    },
    jewelry: {
      label: "DRAW_STEEL.Skill.List.Jewelry",
      group: "crafting",
    },
    mechanics: {
      label: "DRAW_STEEL.Skill.List.Mechanics",
      group: "crafting",
    },
    tailoring: {
      label: "DRAW_STEEL.Skill.List.Tailoring",
      group: "crafting",
    },
    climb: {
      label: "DRAW_STEEL.Skill.List.Climb",
      group: "exploration",
    },
    drive: {
      label: "DRAW_STEEL.Skill.List.Drive",
      group: "exploration",
    },
    endurance: {
      label: "DRAW_STEEL.Skill.List.Endurance",
      group: "exploration",
    },
    gymnastics: {
      label: "DRAW_STEEL.Skill.List.Gymnastics",
      group: "exploration",
    },
    heal: {
      label: "DRAW_STEEL.Skill.List.Heal",
      group: "exploration",
    },
    jump: {
      label: "DRAW_STEEL.Skill.List.Jump",
      group: "exploration",
    },
    lift: {
      label: "DRAW_STEEL.Skill.List.Lift",
      group: "exploration",
    },
    navigate: {
      label: "DRAW_STEEL.Skill.List.Navigate",
      group: "exploration",
    },
    ride: {
      label: "DRAW_STEEL.Skill.List.Ride",
      group: "exploration",
    },
    swim: {
      label: "DRAW_STEEL.Skill.List.Swim",
      group: "exploration",
    },
    brag: {
      label: "DRAW_STEEL.Skill.List.Brag",
      group: "interpersonal",
    },
    empathize: {
      label: "DRAW_STEEL.Skill.List.Empathize",
      group: "interpersonal",
    },
    flirt: {
      label: "DRAW_STEEL.Skill.List.Flirt",
      group: "interpersonal",
    },
    gamble: {
      label: "DRAW_STEEL.Skill.List.Gamble",
      group: "interpersonal",
    },
    handleAnimals: {
      label: "DRAW_STEEL.Skill.List.HandleAnimals",
      group: "interpersonal",
    },
    interrogate: {
      label: "DRAW_STEEL.Skill.List.Interrogate",
      group: "interpersonal",
    },
    intimidate: {
      label: "DRAW_STEEL.Skill.List.Intimidate",
      group: "interpersonal",
    },
    lead: {
      label: "DRAW_STEEL.Skill.List.Lead",
      group: "interpersonal",
    },
    lie: {
      label: "DRAW_STEEL.Skill.List.Lie",
      group: "interpersonal",
    },
    music: {
      label: "DRAW_STEEL.Skill.List.Music",
      group: "interpersonal",
    },
    perform: {
      label: "DRAW_STEEL.Skill.List.Perform",
      group: "interpersonal",
    },
    persuade: {
      label: "DRAW_STEEL.Skill.List.Persuade",
      group: "interpersonal",
    },
    readPerson: {
      label: "DRAW_STEEL.Skill.List.ReadPerson",
      group: "interpersonal",
    },
    alertness: {
      label: "DRAW_STEEL.Skill.List.Alertness",
      group: "intrigue",
    },
    concealObject: {
      label: "DRAW_STEEL.Skill.List.ConcealObject",
      group: "intrigue",
    },
    disguise: {
      label: "DRAW_STEEL.Skill.List.Disguise",
      group: "intrigue",
    },
    eavesdrop: {
      label: "DRAW_STEEL.Skill.List.Eavesdrop",
      group: "intrigue",
    },
    escapeArtist: {
      label: "DRAW_STEEL.Skill.List.EscapeArtist",
      group: "intrigue",
    },
    hide: {
      label: "DRAW_STEEL.Skill.List.Hide",
      group: "intrigue",
    },
    pickLock: {
      label: "DRAW_STEEL.Skill.List.PickLock",
      group: "intrigue",
    },
    pickPocket: {
      label: "DRAW_STEEL.Skill.List.PickPocket",
      group: "intrigue",
    },
    sabotage: {
      label: "DRAW_STEEL.Skill.List.Sabotage",
      group: "intrigue",
    },
    search: {
      label: "DRAW_STEEL.Skill.List.Search",
      group: "intrigue",
    },
    sneak: {
      label: "DRAW_STEEL.Skill.List.Sneak",
      group: "intrigue",
    },
    track: {
      label: "DRAW_STEEL.Skill.List.Track",
      group: "intrigue",
    },
    culture: {
      label: "DRAW_STEEL.Skill.List.Culture",
      group: "lore",
    },
    criminalUnderworld: {
      label: "DRAW_STEEL.Skill.List.CriminalUnderworld",
      group: "lore",
    },
    history: {
      label: "DRAW_STEEL.Skill.List.History",
      group: "lore",
    },
    magic: {
      label: "DRAW_STEEL.Skill.List.Magic",
      group: "lore",
    },
    monsters: {
      label: "DRAW_STEEL.Skill.List.Monsters",
      group: "lore",
    },
    nature: {
      label: "DRAW_STEEL.Skill.List.Nature",
      group: "lore",
    },
    psionics: {
      label: "DRAW_STEEL.Skill.List.Psionics",
      group: "lore",
    },
    religion: {
      label: "DRAW_STEEL.Skill.List.Religion",
      group: "lore",
    },
    rumors: {
      label: "DRAW_STEEL.Skill.List.Rumors",
      group: "lore",
    },
    society: {
      label: "DRAW_STEEL.Skill.List.Society",
      group: "lore",
    },
    timescape: {
      label: "DRAW_STEEL.Skill.List.Timescape",
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

/**
 * Configuration information for languages
 * @type {Record<string, {label: string}>}
 */
DRAW_STEEL.languages = {
  // ancestry languages
  anjali: {
    label: "DRAW_STEEL.Languages.Anjali",
  },
  axiomatic: {
    label: "DRAW_STEEL.Languages.Axiomatic",
  },
  caelian: {
    label: "DRAW_STEEL.Languages.Caelian",
  },
  filliaric: {
    label: "DRAW_STEEL.Languages.Filliaric",
  },
  highKuric: {
    label: "DRAW_STEEL.Languages.HighKuric",
  },
  hyrallic: {
    label: "DRAW_STEEL.Languages.Hyrallic",
  },
  illyvric: {
    label: "DRAW_STEEL.Languages.Illyvric",
  },
  kalliak: {
    label: "DRAW_STEEL.Languages.Kalliak",
  },
  kethaic: {
    label: "DRAW_STEEL.Languages.Kethaic",
  },
  khelt: {
    label: "DRAW_STEEL.Languages.Khelt",
  },
  khoursirian: {
    label: "DRAW_STEEL.Languages.Khoursirian",
  },
  lowKuric: {
    label: "DRAW_STEEL.Languages.LowKuric",
  },
  mindspeech: {
    label: "DRAW_STEEL.Languages.Mindspeech",
  },
  protoCtholl: {
    label: "DRAW_STEEL.Languages.ProtoCtholl",
  },
  szetch: {
    label: "DRAW_STEEL.Languages.Szetch",
  },
  theFirstLanguage: {
    label: "DRAW_STEEL.Languages.TheFirstLanguage",
  },
  tholl: {
    label: "DRAW_STEEL.Languages.Tholl",
  },
  urollialic: {
    label: "DRAW_STEEL.Languages.Urollialic",
  },
  variac: {
    label: "DRAW_STEEL.Languages.Variac",
  },
  vastariax: {
    label: "DRAW_STEEL.Languages.Vastariax",
  },
  vhoric: {
    label: "DRAW_STEEL.Languages.Vhoric",
  },
  voll: {
    label: "DRAW_STEEL.Languages.Voll",
  },
  yllyric: {
    label: "DRAW_STEEL.Languages.Yllyric",
  },
  zahariax: {
    label: "DRAW_STEEL.Languages.Zahariax",
  },
  zaliac: {
    label: "DRAW_STEEL.Languages.Zaliac",
  },
  // Human languages. Khoursirian already covered
  higaran: {
    label: "DRAW_STEEL.Languages.Higaran",
  },
  khemharic: {
    label: "DRAW_STEEL.Languages.Khemharic",
  },
  oaxuatl: {
    label: "DRAW_STEEL.Languages.Oaxuatl",
  },
  phaedran: {
    label: "DRAW_STEEL.Languages.Phaedran",
  },
  riojan: {
    label: "DRAW_STEEL.Languages.Riojan",
  },
  uvalic: {
    label: "DRAW_STEEL.Languages.Uvalic",
  },
  vaniric: {
    label: "DRAW_STEEL.Languages.Vaniric",
  },
  vasloria: {
    label: "DRAW_STEEL.Languages.Vasloria",
  },
  // Dead languages
  highRhyvian: {
    label: "DRAW_STEEL.Languages.HighRhyvian",
  },
  khamish: {
    label: "DRAW_STEEL.Languages.Khamish",
  },
  kheltivari: {
    label: "DRAW_STEEL.Languages.Kheltivari",
  },
  lowRhivian: {
    label: "DRAW_STEEL.Languages.LowRhivian",
  },
  oldVariac: {
    label: "DRAW_STEEL.Languages.OldVariac",
  },
  phorialtic: {
    label: "DRAW_STEEL.Languages.Phorialtic",
  },
  rallarian: {
    label: "DRAW_STEEL.Languages.Rallarian",
  },
  ullorvic: {
    label: "DRAW_STEEL.Languages.Ullorvic",
  },
};
preLocalize("languages", { key: "label" });

/** @import { AdvancementTypeConfiguration } from "./_types" */

/**
 * Advancement types that can be added to items.
 * @enum {AdvancementTypeConfiguration}
 */
DRAW_STEEL.advancementTypes = {

};

/**
 * Configuration information for negotiations
 */
DRAW_STEEL.negotiation = {
  /** @type {Record<string, {label: string}>} */
  motivations: {
    benevolence: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Benevolence",
    },
    discovery: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Discovery",
    },
    freedom: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Freedom",
    },
    greed: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Greed",
    },
    authority: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.HigherAuthority",
    },
    justice: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Justice",
    },
    legacy: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Legacy",
    },
    peace: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Peace",
    },
    power: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Power",
    },
    protection: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Protection",
    },
    revelry: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Revelry",
    },
    vengeance: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Vengeance",
    },
  },
};
preLocalize("negotiation.motivations", { key: "label" });

/**
 * Configuration information for heros
 */
DRAW_STEEL.hero = {
  /**
   * XP progression for heroes
   * @type {number[]}
   */
  xp_track: [0, 16, 32, 48, 64, 80, 96, 112, 128, 144],
  /**
   * Ways to spend hero tokens
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

/**
 * Configuration information for monsters
 */
DRAW_STEEL.monsters = {
  /** @type {Record<string, {label: string, group: string}>} */
  keywords: {
    abyssal: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Abyssal",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    accursed: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Accursed",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    animal: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Animal",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    beast: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Beast",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    construct: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Construct",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    dragon: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Dragon",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    elemental: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Elemental",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    fey: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Fey",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    giant: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Giant",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    horror: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Horror",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    humanoid: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Humanoid",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    infernal: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Infernal",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    plant: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Plant",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    swarm: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Swarm",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
    undead: {
      label: "DRAW_STEEL.Actor.NPC.KEYWORDS.Undead",
      group: "DRAW_STEEL.Actor.NPC.KeywordGroups.General",
    },
  },
  /** @type {Record<string, {label: string}>} */
  roles: {
    ambusher: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Ambusher",
    },
    artillery: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Artillery",
    },
    brute: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Brute",
    },
    controller: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Controller",
    },
    defender: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Defender",
    },
    harrier: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Harrier",
    },
    hexer: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Hexer",
    },
    mount: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Mount",
    },
    support: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Support",
    },
  },
  /** @type {Record<string, {label: string}>} */
  organizations: {
    minion: {
      label: "DRAW_STEEL.Actor.NPC.ORGANIZATIONS.Minion",
    },
    band: {
      label: "DRAW_STEEL.Actor.NPC.ORGANIZATIONS.Band",
    },
    platoon: {
      label: "DRAW_STEEL.Actor.NPC.ORGANIZATIONS.Platoon",
    },
    troop: {
      label: "DRAW_STEEL.Actor.NPC.ORGANIZATIONS.Troop",
    },
    leader: {
      label: "DRAW_STEEL.Actor.NPC.ORGANIZATIONS.Leader",
    },
    solo: {
      label: "DRAW_STEEL.Actor.NPC.ORGANIZATIONS.Solo",
    },
  },
};
preLocalize("monsters.keywords", { keys: ["label", "group"] });
preLocalize("monsters.roles", { key: "label" });
preLocalize("monsters.organizations", { key: "label" });

/**
 * Configuration information for Ability items
 */
DRAW_STEEL.abilities = {
  /** @type {Record<string, {label: string, group?: string}>} */
  keywords: {
    animal: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Animal",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Fury",
    },
    animapathy: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Animapathy",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    area: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Area",
    },
    charge: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Charge",
    },
    chronopathy: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Chronopathy",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    cryokinesis: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Cryokinesis",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    earth: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Earth",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Elementalist",
    },
    fire: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Fire",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Elementalist",
    },
    green: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Green",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Elementalist",
    },
    magic: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Magic",
    },
    melee: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Melee",
    },
    metamorphosis: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Metamorphosis",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    psionic: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Psionic",
    },
    pyrokinesis: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Pyrokinesis",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    ranged: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Ranged",
    },
    resopathy: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Resopathy",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    rot: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Rot",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Elementalist",
    },
    routine: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Routine",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Troubador",
    },
    strike: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Strike",
    },
    telekinesis: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Telekinesis",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    telepathy: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Telepathy",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Talent",
    },
    void: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Void",
      group: "DRAW_STEEL.Item.Ability.KeywordGroups.Elementalist",
    },
    weapon: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Weapon",
    },
  },
  /**
   * Action types
   * @type {Record<string, {label: string, triggered?: boolean}>}
   */
  types: {
    action: {
      label: "DRAW_STEEL.Item.Ability.Type.Action",
    },
    maneuver: {
      label: "DRAW_STEEL.Item.Ability.Type.Maneuver",
    },
    freeManeuver: {
      label: "DRAW_STEEL.Item.Ability.Type.FreeManeuver",
    },
    triggered: {
      label: "DRAW_STEEL.Item.Ability.Type.Triggered",
      triggered: true,
    },
    freeTriggered: {
      label: "DRAW_STEEL.Item.Ability.Type.FreeTriggered",
      triggered: true,
    },
    villain: {
      label: "DRAW_STEEL.Item.Ability.Type.Villain",
    },
  },
  /**
   * Ability category, e.g. "Villain Action"
   * @type {Record<string, {label: string}>}
   */
  categories: {
    heroic: {
      label: "DRAW_STEEL.Item.Ability.Category.Heroic",
    },
    freeStrike: {
      label: "DRAW_STEEL.Item.Ability.Category.FreeStrike",
    },
    signature: {
      label: "DRAW_STEEL.Item.Ability.Category.Signature",
    },
    villain: {
      label: "DRAW_STEEL.Item.Ability.Category.Villain",
    },
  },
  /**
   * Valid distances in Draw Steel
   * `primary` and `secondary`, if present represent additional measures/dimensions that are valid for this type
   * The string values are the labels for those properties
   * @type {Record<string, {label: string; primary?: string; secondary?: string; tertiary?: string; area?: boolean; embedLabel: string}>}
   */
  distances: {
    melee: {
      label: "DRAW_STEEL.Item.Ability.Distance.Melee",
      primary: "DRAW_STEEL.Item.Ability.Distance.Melee",
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Melee",
    },
    ranged: {
      label: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      primary: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Ranged",
    },
    meleeRanged: {
      label: "DRAW_STEEL.Item.Ability.Distance.MeleeRanged",
      primary: "DRAW_STEEL.Item.Ability.Distance.Melee",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.MeleeRanged",
    },
    aura: {
      label: "DRAW_STEEL.Item.Ability.Distance.Aura",
      primary: "DRAW_STEEL.Item.Ability.Distance.Aura",
      area: true,
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Aura",
    },
    burst: {
      label: "DRAW_STEEL.Item.Ability.Distance.Burst",
      primary: "DRAW_STEEL.Item.Ability.Distance.Burst",
      area: true,
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Burst",
    },
    cube: {
      label: "DRAW_STEEL.Item.Ability.Distance.Cube",
      primary: "DRAW_STEEL.Item.Ability.Distance.Length",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      area: true,
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Cube",
    },
    line: {
      label: "DRAW_STEEL.Item.Ability.Distance.Line",
      primary: "DRAW_STEEL.Item.Ability.Distance.Length",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Width",
      tertiary: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      area: true,
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Line",
    },
    wall: {
      label: "DRAW_STEEL.Item.Ability.Distance.Wall",
      primary: "DRAW_STEEL.Item.Ability.Distance.Squares",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      area: true,
      embedLabel: "DRAW_STEEL.Item.Ability.DistanceEmbed.Wall",
    },
    special: {
      label: "DRAW_STEEL.Item.Ability.Distance.Special",
      area: true,
      embedLabel: "DRAW_STEEL.Item.Ability.Distance.Special",
    },
    self: {
      label: "DRAW_STEEL.Item.Ability.Distance.Self",
      embedLabel: "DRAW_STEEL.Item.Ability.Distance.Self",
    },
  },
  /** @type {Record<string, {label: string; all?: string; embedLabel: string}>} */
  targets: {
    creature: {
      label: "DRAW_STEEL.Item.Ability.Target.Creature",
      all: "DRAW_STEEL.Item.Ability.Target.AllCreatures",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.CreatureEmbed",
    },
    object: {
      label: "DRAW_STEEL.Item.Ability.Target.Object",
      all: "DRAW_STEEL.Item.Ability.Target.AllObjects",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.ObjectEmbed",
    },
    creatureObject: {
      label: "DRAW_STEEL.Item.Ability.Target.CreatureObject",
      all: "DRAW_STEEL.Item.Ability.Target.AllCreatureObject",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.CreatureObjectEmbed",
    },
    enemy: {
      label: "DRAW_STEEL.Item.Ability.Target.Enemy",
      all: "DRAW_STEEL.Item.Ability.Target.AllEnemies",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.EnemyEmbed",
    },
    ally: {
      label: "DRAW_STEEL.Item.Ability.Target.Ally",
      all: "DRAW_STEEL.Item.Ability.Target.AllAllies",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.AllyEmbed",
    },
    self: {
      label: "DRAW_STEEL.Item.Ability.Target.Self",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.Self",
    },
    special: {
      label: "DRAW_STEEL.Item.Ability.Target.Special",
      embedLabel: "DRAW_STEEL.Item.Ability.Target.Special",
    },
  },
  forcedMovement: {
    push: {
      label: "DRAW_STEEL.Item.Ability.ForcedMovement.Push",
    },
    pull: {
      label: "DRAW_STEEL.Item.Ability.ForcedMovement.Pull",
    },
    slide: {
      label: "DRAW_STEEL.Item.Ability.ForcedMovement.Slide",
    },
  },
};
preLocalize("abilities.keywords", { keys: ["label", "group"] });
preLocalize("abilities.types", { key: "label" });
preLocalize("abilities.categories", { key: "label" });
// Embed labels intentionally not pre-localized because they rely on `format` instead of `localize`
preLocalize("abilities.distances", { keys: ["label", "primary", "secondary", "tertiary"] });
preLocalize("abilities.targets", { keys: ["label", "all"] });
preLocalize("abilities.forcedMovement", { key: "label" });

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

/**
 * Valid types for the PowerRollEffect pseudo-document
 * @type {Record<string, { label: string; documentClass: pseudoDocuments.powerRollEffects.BasePowerRollEffect }>}
 */
DRAW_STEEL.PowerRollEffect = {
  damage: {
    label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.TYPES.damage",
    documentClass: pseudoDocuments.powerRollEffects.DamagePowerRollEffect,
  },
};
preLocalize("PowerRollEffect", { key: "label" });

/**
 * Configuration details for Culture items
 * @type {Record<string, Record<string, {label: string, skillOpts: Set<string>}>>}
 */
DRAW_STEEL.culture = {
  environments: {
    nomadic: {
      label: "DRAW_STEEL.Item.Culture.Environments.Nomadic",
      skillOpts: new Set(),
    },
    rural: {
      label: "DRAW_STEEL.Item.Culture.Environments.Rural",
      skillOpts: new Set(),
    },
    secluded: {
      label: "DRAW_STEEL.Item.Culture.Environments.Secluded",
      skillOpts: new Set(),
    },
    urban: {
      label: "DRAW_STEEL.Item.Culture.Environments.Urban",
      skillOpts: new Set(),
    },
    wilderness: {
      label: "DRAW_STEEL.Item.Culture.Environments.Wilderness",
      skillOpts: new Set(),
    },
  },
  organization: {
    anarchic: {
      label: "DRAW_STEEL.Item.Culture.Organization.Anarchic",
      skillOpts: new Set(),
    },
    bureaucratic: {
      label: "DRAW_STEEL.Item.Culture.Organization.Bureaucratic",
      skillOpts: new Set(),
    },
    communal: {
      label: "DRAW_STEEL.Item.Culture.Organization.Communal",
      skillOpts: new Set(),
    },
  },
  upbringing: {
    academic: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Academic",
      skillOpts: new Set(),
    },
    creative: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Creative",
      skillOpts: new Set(),
    },
    illegal: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Illegal",
      skillOpts: new Set(),
    },
    labor: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Labor",
      skillOpts: new Set(),
    },
    martial: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Martial",
      skillOpts: new Set(),
    },
    noble: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Noble",
      skillOpts: new Set(),
    },
  },
};
preLocalize("culture.environments", { key: "label" });
preLocalize("culture.organization", { key: "label" });
preLocalize("culture.upbringing", { key: "label" });

/**
 * Configuration details for Kit items
 * @type {Record<string,  Record<string, {label: string}>>}
 */
DRAW_STEEL.kits = {};
// preLocalize("kits.types", {key: "label"});

/**
 * Configuration details for Equipment items
 * Also used by Kits
 */
DRAW_STEEL.equipment = {
  /** @type {Record<string, {label: string, readonly keywords: FormSelectOption[]}>} */
  categories: {
    consumable: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Consumable",
      get keywords() {
        return [];
      },
    },
    trinket: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Trinket",
      get keywords() {
        return [];
      },
    },
    leveled: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Leveled",
      get keywords() {
        return [];
      },
    },
    artifact: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Artifact",
      get keywords() {
        return [];
      },
    },
  },
  /** @type {Record<string, {label: string}>} */
  kinds: {
    other: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Other",
    },
    armor: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Armor",
    },
    implement: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Implement",
    },
    weapon: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Weapon",
    },
  },
  /** @type {Record<string, {label: string, kitEquipment: boolean}>} */
  armor: {
    none: {
      label: "DRAW_STEEL.Item.Equipment.Armor.None",
      kitEquipment: true,
    },
    light: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Light",
      kitEquipment: true,
    },
    medium: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Medium",
      kitEquipment: true,
    },
    heavy: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Heavy",
      kitEquipment: true,
    },
    shield: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Shield",
      kitEquipment: false,
    },
  },
  /** @type {Record<string, {label: string}>} */
  weapon: {
    none: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.None",
    },
    bow: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Bow",
    },
    ensnaring: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Ensnaring",
    },
    heavy: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Heavy",
    },
    light: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Light",
    },
    medium: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Medium",
    },
    polearm: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Polearm",
    },
    unarmed: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Unarmed",
    },
    whip: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Whip",
    },
  },
  /** @type {Record<string, {label: string}>} */
  implement: {
    bone: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Bone",
    },
    crystal: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Crystal",
    },
    glass: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Glass",
    },
    metal: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Metal",
    },
    stone: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Stone",
    },
    wood: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Wood",
    },
  },
  /** @type {Record<string, {label: string}>} */
  other: {
    feet: {
      label: "DRAW_STEEL.Item.Equipment.Other.Feet",
    },
    hands: {
      label: "DRAW_STEEL.Item.Equipment.Other.Hands",
    },
    neck: {
      label: "DRAW_STEEL.Item.Equipment.Other.Neck",
    },
    ring: {
      label: "DRAW_STEEL.Item.Equipment.Other.Ring",
    },
  },
};
preLocalize("equipment.categories", { key: "label" });
preLocalize("equipment.kinds", { key: "label" });
preLocalize("equipment.armor", { key: "label" });
preLocalize("equipment.weapon", { key: "label" });
preLocalize("equipment.implement", { key: "label" });
preLocalize("equipment.other", { key: "label" });

DRAW_STEEL.features = {
  /** @type {Record<string, {label: string, subtypes?: Record<string, {label: string}>}>} */
  types: {
    perk: {
      label: "DRAW_STEEL.Item.Feature.Types.Perk.Label",
      subtypes: {
        crafting: {
          label: "DRAW_STEEL.Item.Feature.Types.Perk.Crafting",
        },
        exploration: {
          label: "DRAW_STEEL.Item.Feature.Types.Perk.Exploration",
        },
        interpersonal: {
          label: "DRAW_STEEL.Item.Feature.Types.Perk.Interpersonal",
        },
        intrigue: {
          label: "DRAW_STEEL.Item.Feature.Types.Perk.Intrigue",
        },
        lore: {
          label: "DRAW_STEEL.Item.Feature.Types.Perk.Lore",
        },
        supernatural: {
          label: "DRAW_STEEL.Item.Feature.Types.Perk.Supernatural",
        },
      },
    },
    title: {
      label: "DRAW_STEEL.Item.Feature.Types.Title.Label",
      subtypes: {
        1: {
          label: "DRAW_STEEL.Echelon.1",
        },
        2: {
          label: "DRAW_STEEL.Echelon.2",
        },
        3: {
          label: "DRAW_STEEL.Echelon.3",
        },
        4: {
          label: "DRAW_STEEL.Echelon.4",
        },
      },
    },
  },
};
preLocalize("features.types", { key: "label" });
preLocalize("features.types.perk.subtypes", { key: "label" });
preLocalize("features.types.title.subtypes", { key: "label" });

DRAW_STEEL.projects = {
  types: {
    crafting: {
      label: "DRAW_STEEL.Item.Project.Types.Crafting",
    },
    research: {
      label: "DRAW_STEEL.Item.Project.Types.Research",
    },
    other: {
      label: "DRAW_STEEL.Item.Project.Types.Other",
    },
  },
};
preLocalize("projects.types", { key: "label" });
