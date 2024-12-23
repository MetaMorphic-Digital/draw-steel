import {preLocalize} from "./helpers/utils.mjs";

/** @import {FormSelectOption} from "../../foundry/client-esm/applications/forms/fields.mjs" */

export const DRAW_STEEL = {};

/**
 * The set of Characteristics used within the system.
 * The long form can be accessed under `DRAW_STEEL.Actor.base.FIELDS.characteristics.{}.value`.
 * The `label` is the short form in all caps (e.g. MGT).
 * The `hint` is the full name (e.g. Might).
 * @type {Array<string>}
 */
DRAW_STEEL.characteristics = ["mgt", "agl", "rea", "inu", "prs"];

/**
 *
 * @type {Record<number, {label: string, levels: number[]}>}
 */
DRAW_STEEL.echelons = {
  1: {
    label: "DRAW_STEEL.Echelon.1",
    threshold: -Infinity
  },
  2: {
    label: "DRAW_STEEL.Echelon.2",
    threshold: 4
  },
  3: {
    label: "DRAW_STEEL.Echelon.3",
    threshold: 7
  },
  4: {
    label: "DRAW_STEEL.Echelon.4",
    threshold: 10
  }
};
preLocalize("echelons", {key: "label"});

/**
 * Valid letter modifiers for size 1 creatures
 * @enum {{label: string}}
 */
DRAW_STEEL.sizes = {
  T: {
    label: "DRAW_STEEL.Actor.base.sizes.T"
  },
  S: {
    label: "DRAW_STEEL.Actor.base.sizes.S"
  },
  M: {
    label: "DRAW_STEEL.Actor.base.sizes.M"
  },
  L: {
    label: "DRAW_STEEL.Actor.base.sizes.L"
  }
};
preLocalize("sizes", {key: "label"});

/**
 * Configuration information for damage types
 * @type {Record<string, {label: string}>}
 */
DRAW_STEEL.damageTypes = {
  acid: {
    label: "DRAW_STEEL.DamageTypes.Acid"
  },
  cold: {
    label: "DRAW_STEEL.DamageTypes.Cold"
  },
  corruption: {
    label: "DRAW_STEEL.DamageTypes.Corruption"
  },
  fire: {
    label: "DRAW_STEEL.DamageTypes.Fire"
  },
  holy: {
    label: "DRAW_STEEL.DamageTypes.Holy"
  },
  lightning: {
    label: "DRAW_STEEL.DamageTypes.Lightning"
  },
  poison: {
    label: "DRAW_STEEL.DamageTypes.Poison"
  },
  psychic: {
    label: "DRAW_STEEL.DamageTypes.Psychic"
  },
  sonic: {
    label: "DRAW_STEEL.DamageTypes.Sonic"
  }
};
preLocalize("damageTypes", {key: "label"});

/**
 * @type {Record<string, {img: string, name: string}>}
 */
DRAW_STEEL.conditions = {
  bleeding: {
    name: "DRAW_STEEL.Effect.Conditions.Bleeding.name",
    img: "icons/svg/blood.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.YzgERGFhFphgpjKQ"
  },
  dazed: {
    name: "DRAW_STEEL.Effect.Conditions.Dazed.name",
    img: "icons/svg/daze.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.K2dZpCsAOU7xMpWb"
  },
  frightened: {
    name: "DRAW_STEEL.Effect.Conditions.Frightened.name",
    img: "icons/svg/terror.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.bXiI9vUF3tF78qXg"
  },
  grabbed: {
    name: "DRAW_STEEL.Effect.Conditions.Grabbed.name",
    img: "systems/draw-steel/assets/icons/hand-grabbing-fill.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.aWBP2vfXXM3fzuVn"
  },
  prone: {
    name: "DRAW_STEEL.Effect.Conditions.Prone.name",
    img: "icons/svg/falling.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.v11clsSMgoFZm3V8"
  },
  restrained: {
    name: "DRAW_STEEL.Effect.Conditions.Restrained.name",
    img: "icons/svg/net.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.6IfH6beu8LjK08Oj"
  },
  slowed: {
    name: "DRAW_STEEL.Effect.Conditions.Slowed.name",
    img: "systems/draw-steel/assets/icons/snail.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.aFEwQG4OcYDNp8DL"
  },
  taunted: {
    name: "DRAW_STEEL.Effect.Conditions.Taunted.name",
    img: "systems/draw-steel/assets/icons/flag-banner-fold-fill.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.9zseFmXdcSw8MuKh"
  },
  weakened: {
    name: "DRAW_STEEL.Effect.Conditions.Weakened.name",
    img: "icons/svg/downgrade.svg",
    rule: "JournalEntry.hDhdILCi65wpBgPZ.JournalEntryPage.QZpLhRT6imKlqZ1n"
  }
};

/**
 * Times when an effect can end
 * @enum {{label: string, abbreviation: string}}
 */
DRAW_STEEL.effectEnds = {
  turn: {
    label: "DRAW_STEEL.Effect.Ends.Turn.Label",
    abbreviation: "DRAW_STEEL.Effect.Ends.Turn.Abbr"
  },
  save: {
    label: "DRAW_STEEL.Effect.Ends.Save.Label",
    abbreviation: "DRAW_STEEL.Effect.Ends.Save.Abbr"
  },
  encounter: {
    label: "DRAW_STEEL.Effect.Ends.Encounter.Label",
    abbreviation: "DRAW_STEEL.Effect.Ends.Encounter.Abbr"
  }
};
preLocalize("effectEnds", {keys: ["label", "abbreviation"]});

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
      label: "DRAW_STEEL.Skill.Group.Crafting"
    },
    exploration: {
      label: "DRAW_STEEL.Skill.Group.Exploration"
    },
    interpersonal: {
      label: "DRAW_STEEL.Skill.Group.Interpersonal"
    },
    intrigue: {
      label: "DRAW_STEEL.Skill.Group.Intrigue"
    },
    lore: {
      label: "DRAW_STEEL.Skill.Group.Lore"
    }
  },
  list: {
    alchemy: {
      label: "DRAW_STEEL.Skill.List.Alchemy",
      group: "crafting"
    },
    architecture: {
      label: "DRAW_STEEL.Skill.List.Architecture",
      group: "crafting"
    },
    blacskmithing: {
      label: "DRAW_STEEL.Skill.List.Blacksmithing",
      group: "crafting"
    },
    fletching: {
      label: "DRAW_STEEL.Skill.List.Fletching",
      group: "crafting"
    },
    forgery: {
      label: "DRAW_STEEL.Skill.List.Forgery",
      group: "crafting"
    },
    jewelry: {
      label: "DRAW_STEEL.Skill.List.Jewelry",
      group: "crafting"
    },
    mechanics: {
      label: "DRAW_STEEL.Skill.List.Mechanics",
      group: "crafting"
    },
    tailoring: {
      label: "DRAW_STEEL.Skill.List.Tailoring",
      group: "crafting"
    },
    climb: {
      label: "DRAW_STEEL.Skill.List.Climb",
      group: "exploration"
    },
    drive: {
      label: "DRAW_STEEL.Skill.List.Drive",
      group: "exploration"
    },
    endurance: {
      label: "DRAW_STEEL.Skill.List.Endurance",
      group: "exploration"
    },
    gymnastics: {
      label: "DRAW_STEEL.Skill.List.Gymnastics",
      group: "exploration"
    },
    heal: {
      label: "DRAW_STEEL.Skill.List.Heal",
      group: "exploration"
    },
    jump: {
      label: "DRAW_STEEL.Skill.List.Jump",
      group: "exploration"
    },
    lift: {
      label: "DRAW_STEEL.Skill.List.Lift",
      group: "exploration"
    },
    navigate: {
      label: "DRAW_STEEL.Skill.List.Navigate",
      group: "exploration"
    },
    ride: {
      label: "DRAW_STEEL.Skill.List.Ride",
      group: "exploration"
    },
    swim: {
      label: "DRAW_STEEL.Skill.List.Swim",
      group: "exploration"
    },
    brag: {
      label: "DRAW_STEEL.Skill.List.Brag",
      group: "interpersonal"
    },
    empathize: {
      label: "DRAW_STEEL.Skill.List.Empathize",
      group: "interpersonal"
    },
    flirt: {
      label: "DRAW_STEEL.Skill.List.Flirt",
      group: "interpersonal"
    },
    gamble: {
      label: "DRAW_STEEL.Skill.List.Gamble",
      group: "interpersonal"
    },
    handleAnimals: {
      label: "DRAW_STEEL.Skill.List.HandleAnimals",
      group: "interpersonal"
    },
    interrogate: {
      label: "DRAW_STEEL.Skill.List.Interrogate",
      group: "interpersonal"
    },
    intimidate: {
      label: "DRAW_STEEL.Skill.List.Intimidate",
      group: "interpersonal"
    },
    lead: {
      label: "DRAW_STEEL.Skill.List.Lead",
      group: "interpersonal"
    },
    lie: {
      label: "DRAW_STEEL.Skill.List.Lie",
      group: "interpersonal"
    },
    music: {
      label: "DRAW_STEEL.Skill.List.Music",
      group: "interpersonal"
    },
    perform: {
      label: "DRAW_STEEL.Skill.List.Perform",
      group: "interpersonal"
    },
    persuade: {
      label: "DRAW_STEEL.Skill.List.Persuade",
      group: "interpersonal"
    },
    readPerson: {
      label: "DRAW_STEEL.Skill.List.ReadPerson",
      group: "interpersonal"
    },
    alertness: {
      label: "DRAW_STEEL.Skill.List.Alertness",
      group: "intrigue"
    },
    concealObject: {
      label: "DRAW_STEEL.Skill.List.ConcealObject",
      group: "intrigue"
    },
    disguise: {
      label: "DRAW_STEEL.Skill.List.Disguise",
      group: "intrigue"
    },
    eavesdrop: {
      label: "DRAW_STEEL.Skill.List.Eavesdrop",
      group: "intrigue"
    },
    escapeArtist: {
      label: "DRAW_STEEL.Skill.List.EscapeArtist",
      group: "intrigue"
    },
    hide: {
      label: "DRAW_STEEL.Skill.List.Hide",
      group: "intrigue"
    },
    pickLock: {
      label: "DRAW_STEEL.Skill.List.PickLock",
      group: "intrigue"
    },
    pickPocket: {
      label: "DRAW_STEEL.Skill.List.PickPocket",
      group: "intrigue"
    },
    sabotage: {
      label: "DRAW_STEEL.Skill.List.Sabotage",
      group: "intrigue"
    },
    search: {
      label: "DRAW_STEEL.Skill.List.Search",
      group: "intrigue"
    },
    sneak: {
      label: "DRAW_STEEL.Skill.List.Sneak",
      group: "intrigue"
    },
    track: {
      label: "DRAW_STEEL.Skill.List.Track",
      group: "intrigue"
    },
    culture: {
      label: "DRAW_STEEL.Skill.List.Culture",
      group: "lore"
    },
    criminalUnderworld: {
      label: "DRAW_STEEL.Skill.List.CriminalUnderworld",
      group: "lore"
    },
    history: {
      label: "DRAW_STEEL.Skill.List.History",
      group: "lore"
    },
    magic: {
      label: "DRAW_STEEL.Skill.List.Magic",
      group: "lore"
    },
    monsters: {
      label: "DRAW_STEEL.Skill.List.Monsters",
      group: "lore"
    },
    nature: {
      label: "DRAW_STEEL.Skill.List.Nature",
      group: "lore"
    },
    psionics: {
      label: "DRAW_STEEL.Skill.List.Psionics",
      group: "lore"
    },
    religion: {
      label: "DRAW_STEEL.Skill.List.Religion",
      group: "lore"
    },
    rumors: {
      label: "DRAW_STEEL.Skill.List.Rumors",
      group: "lore"
    },
    society: {
      label: "DRAW_STEEL.Skill.List.Society",
      group: "lore"
    },
    timescape: {
      label: "DRAW_STEEL.Skill.List.Timescape",
      group: "lore"
    }
  }
};
preLocalize("skills.groups", {key: "label"});
preLocalize("skills.list", {key: "label"});

Object.defineProperty(DRAW_STEEL.skills, "optgroups", {
  /** @type {FormSelectOption[]} */
  get: function() {
    const config = ds.CONFIG.skills;
    return Object.entries(config.list).reduce((arr, [value, {label, group}]) => {
      arr.push({label, group: config.groups[group].label, value});
      return arr;
    }, []);
  }
});

// TODO: Languages

/** @import {AdvancementTypeConfiguration} from "./_types" */

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
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Benevolence"
    },
    discovery: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Discovery"
    },
    freedom: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Freedom"
    },
    greed: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Greed"
    },
    authority: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.HigherAuthority"
    },
    justice: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Justice"
    },
    legacy: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Legacy"
    },
    peace: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Peace"
    },
    power: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Power"
    },
    protection: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Protection"
    },
    revelry: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Revelry"
    },
    vengeance: {
      label: "DRAW_STEEL.Actor.NPC.Negotiation.Motivations.Vengeance"
    }
  }
};
preLocalize("negotation.motivations", {key: "label"});

/**
 * Configuration information for heros
 */
DRAW_STEEL.hero = {
  xp_track: [0, 10, 25, 40, 55, 70, 85, 100, 115, 130]
};

/**
 * Configuration information for monsters
 */
DRAW_STEEL.monsters = {
  /** @type {Record<string, {label: string}>} */
  roles: {
    ambusher: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Ambusher"
    },
    artillery: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Artillery"
    },
    boss: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Boss"
    },
    brute: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Brute"
    },
    controller: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Controller"
    },
    defender: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Defender"
    },
    harrier: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Harrier"
    },
    hexer: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Hexer"
    },
    support: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Support"
    },
    mount: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Mount"
    },
    solo: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Solo"
    }
  },
  /** @type {Record<string, {label: string}>} */
  subroles: {
    minion: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Minion"
    },
    captain: {
      label: "DRAW_STEEL.Actor.NPC.ROLES.Captain"
    }
  }
};
preLocalize("monsters.roles", {key: "label"});
preLocalize("monsters.subroles", {key: "label"});

/**
 * Configuration information for Ability items
 */
DRAW_STEEL.abilities = {
  /** @type {Record<string, {label: string, damage?: boolean}>} */
  keywords: {
    area: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Area"
    },
    attack: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Attack"
    },
    charge: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Charge"
    },
    magic: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Magic",
      damage: true
    },
    melee: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Melee"
    },
    psionic: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Psionic",
      damage: true
    },
    ranged: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Ranged"
    },
    weapon: {
      label: "DRAW_STEEL.Item.Ability.Keywords.Weapon",
      damage: true
    }
  },
  /**
   * Action types
   * @type {Record<string, {label: string}>}
   */
  types: {
    action: {
      label: "DRAW_STEEL.Item.Ability.Type.Action"
    },
    maneuver: {
      label: "DRAW_STEEL.Item.Ability.Type.Maneuver"
    }
  },
  /**
   * Valid distances in Draw Steel
   * `primary` and `secondary`, if present represent additional measures/dimensions that are valid for this type
   * The string values are the labels for those properties
   * @type {Record<string, {label: string, primary?: string, secondary?: string, area?: boolean}>}
   */
  distances: {
    melee: {
      label: "DRAW_STEEL.Item.Ability.Distance.Melee",
      primary: "DRAW_STEEL.Item.Ability.Distance.Melee"
    },
    ranged: {
      label: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      primary: "DRAW_STEEL.Item.Ability.Distance.Ranged"
    },
    meleeRanged: {
      label: "DRAW_STEEL.Item.Ability.Distance.MeleeRanged",
      primary: "DRAW_STEEL.Item.Ability.Distance.Melee",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Ranged"
    },
    aura: {
      label: "DRAW_STEEL.Item.Ability.Distance.Aura",
      primary: "DRAW_STEEL.Item.Ability.Distance.Aura",
      area: true
    },
    burst: {
      label: "DRAW_STEEL.Item.Ability.Distance.Burst",
      primary: "DRAW_STEEL.Item.Ability.Distance.Burst",
      area: true
    },
    cube: {
      label: "DRAW_STEEL.Item.Ability.Distance.Cube",
      primary: "DRAW_STEEL.Item.Ability.Distance.Length",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Ranged",
      area: true
    },
    line: {
      label: "DRAW_STEEL.Item.Ability.Distance.Line",
      primary: "DRAW_STEEL.Item.Ability.Distance.Length",
      secondary: "DRAW_STEEL.Item.Ability.Distance.Width",
      area: true
    },
    wall: {
      label: "DRAW_STEEL.Item.Ability.Distance.Wall",
      primary: "DRAW_STEEL.Item.Ability.Distance.Squares",
      area: true
    },
    special: {
      label: "DRAW_STEEL.Item.Ability.Distance.Special",
      area: true
    },
    self: {
      label: "DRAW_STEEL.Item.Ability.Distance.Self"
    }
  },
  /** @type {Record<string, {label: string, all?: string}>} */
  targets: {
    creature: {
      label: "DRAW_STEEL.Item.Ability.Target.Creature",
      all: "DRAW_STEEL.Item.Ability.Target.AllCreatures"
    },
    object: {
      label: "DRAW_STEEL.Item.Ability.Target.Object",
      all: "DRAW_STEEL.Item.Ability.Target.AllObjects"
    },
    creatureObject: {
      label: "DRAW_STEEL.Item.Ability.Target.CreatureObject",
      all: "DRAW_STEEL.Item.Ability.Target.AllCreatureObject"
    },
    enemy: {
      label: "DRAW_STEEL.Item.Ability.Target.Enemy",
      all: "DRAW_STEEL.Item.Ability.Target.AllEnemies"
    },
    ally: {
      label: "DRAW_STEEL.Item.Ability.Target.Ally",
      all: "DRAW_STEEL.Item.Ability.Target.AllAllies"
    },
    self: {
      label: "DRAW_STEEL.Item.Ability.Target.Self"
    }
  },
  forcedMovement: {
    push: {
      label: "DRAW_STEEL.Item.Ability.ForcedMovement.Push"
    },
    pull: {
      label: "DRAW_STEEL.Item.Ability.ForcedMovement.Pull"
    },
    slide: {
      label: "DRAW_STEEL.Item.Ability.ForcedMovement.Slide"
    }
  }
};
preLocalize("abilities.keywords", {key: "label"});
preLocalize("abilities.types", {key: "label"});
preLocalize("abilities.distances", {keys: ["label", "primary", "secondary"]});
preLocalize("abilities.targets", {keys: ["label", "all"]});
preLocalize("abilities.forcedMovement", {key: "label"});

/**
 * Configuration details for Culture items
 * @type {Record<string, Record<string, {label: string, skillOpts: Set<string>}>>}
 */
DRAW_STEEL.culture = {
  environments: {
    nomadic: {
      label: "DRAW_STEEL.Item.Culture.Environments.Nomadic",
      skillOpts: new Set()
    },
    rural: {
      label: "DRAW_STEEL.Item.Culture.Environments.Rural",
      skillOpts: new Set()
    },
    secluded: {
      label: "DRAW_STEEL.Item.Culture.Environments.Secluded",
      skillOpts: new Set()
    },
    urban: {
      label: "DRAW_STEEL.Item.Culture.Environments.Urban",
      skillOpts: new Set()
    },
    wilderness: {
      label: "DRAW_STEEL.Item.Culture.Environments.Wilderness",
      skillOpts: new Set()
    }
  },
  organization: {
    anarchic: {
      label: "DRAW_STEEL.Item.Culture.Organization.Anarchic",
      skillOpts: new Set()
    },
    bureaucratic: {
      label: "DRAW_STEEL.Item.Culture.Organization.Bureaucratic",
      skillOpts: new Set()
    },
    communal: {
      label: "DRAW_STEEL.Item.Culture.Organization.Communal",
      skillOpts: new Set()
    }
  },
  upbringing: {
    academic: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Academic",
      skillOpts: new Set()
    },
    creative: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Creative",
      skillOpts: new Set()
    },
    illegal: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Illegal",
      skillOpts: new Set()
    },
    labor: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Labor",
      skillOpts: new Set()
    },
    martial: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Martial",
      skillOpts: new Set()
    },
    noble: {
      label: "DRAW_STEEL.Item.Culture.Upbringing.Noble",
      skillOpts: new Set()
    }
  }
};
preLocalize("culture.environments", {key: "label"});
preLocalize("culture.organization", {key: "label"});
preLocalize("culture.upbringing", {key: "label"});

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
      }
    },
    trinket: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Trinket",
      get keywords() {
        return [];
      }
    },
    leveled: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Leveled",
      get keywords() {
        return [];
      }
    },
    artifact: {
      label: "DRAW_STEEL.Item.Equipment.Categories.Artifact",
      get keywords() {
        return [];
      }
    }
  },
  /** @type {Record<string, {label: string}>} */
  kinds: {
    other: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Other"
    },
    armor: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Armor"
    },
    implement: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Implement"
    },
    weapon: {
      label: "DRAW_STEEL.Item.Equipment.Kinds.Weapon"
    }
  },
  /** @type {Record<string, {label: string, kitEquipment: boolean}>} */
  armor: {
    none: {
      label: "DRAW_STEEL.Item.Equipment.Armor.None",
      kitEquipment: true
    },
    light: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Light",
      kitEquipment: true
    },
    medium: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Medium",
      kitEquipment: true
    },
    heavy: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Heavy",
      kitEquipment: true
    },
    shield: {
      label: "DRAW_STEEL.Item.Equipment.Armor.Shield",
      kitEquipment: false
    }
  },
  /** @type {Record<string, {label: string}>} */
  weapon: {
    none: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.None"
    },
    bow: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Bow"
    },
    ensnaring: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Ensnaring"
    },
    heavy: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Heavy"
    },
    light: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Light"
    },
    medium: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Medium"
    },
    polearm: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Polearm"
    },
    unarmed: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Unarmed"
    },
    whip: {
      label: "DRAW_STEEL.Item.Equipment.Weapons.Whip"
    }
  },
  /** @type {Record<string, {label: string}>} */
  implement: {
    bone: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Bone"
    },
    crystal: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Crystal"
    },
    glass: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Glass"
    },
    metal: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Metal"
    },
    stone: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Stone"
    },
    wood: {
      label: "DRAW_STEEL.Item.Equipment.Implements.Wood"
    }
  },
  /** @type {Record<string, {label: string}>} */
  other: {
    feet: {
      label: "DRAW_STEEL.Item.Equipment.Other.Feet"
    },
    hands: {
      label: "DRAW_STEEL.Item.Equipment.Other.Hands"
    },
    neck: {
      label: "DRAW_STEEL.Item.Equipment.Other.Neck"
    },
    ring: {
      label: "DRAW_STEEL.Item.Equipment.Other.Ring"
    }
  }
};
preLocalize("equipment.categories", {key: "label"});
preLocalize("equipment.kinds", {key: "label"});
preLocalize("equipment.armor", {key: "label"});
preLocalize("equipment.weapon", {key: "label"});
preLocalize("equipment.implement", {key: "label"});
preLocalize("equipment.other", {key: "label"});

DRAW_STEEL.features = {
  /** @type {Record<string, {label: string, subtypes?: Record<string, string>}>} */
  types: {
    perk: {
      label: "DRAW_STEEL.Item.Feature.Types.Perk"
    },
    title: {
      label: "DRAW_STEEL.Item.Feature.Types.Title"
    }
  }
};
preLocalize("features.types", {key: "label"});
