export const DRAW_STEEL = {};

/**
 * The set of Characteristics used within the system.
 * The long form can be accessed under `DRAW_STEEL.Actor.base.FIELDS.characteristics.{}.value`
 * The `label` is the short form in all caps (e.g. MGT)
 * The `hint` is the full name (e.g. Might)
 * @type {Array<string>}
 */
DRAW_STEEL.characteristics = ["mgt", "agl", "rea", "inu", "prs"];

/**
 * @type {Record<string, {img: string, name: string}>}
 */
DRAW_STEEL.conditions = {
  // bleeding: {},
  dazed: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Dazed",
    img: ""
  },
  frightened: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Frightened",
    img: ""

  },
  grabbed: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Grabbed",
    img: ""
  },
  // prone: {},
  restrained: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Restrained",
    img: ""
  },
  slowed: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Slowed",
    img: ""
  },
  taunted: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Taunted",
    img: ""
  },
  weakened: {
    name: "DRAW_STEEL.ActiveEffect.Conditions.Weakened",
    img: ""
  }
};

// TODO: Skills

// TODO: Languages

/**
 * Configuration details for Cultures
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

/**
 * Configuration details for Kits
 * @type {Record<string,  Record<string, {label: string, equipment?: Set<string>}>>}
 */
DRAW_STEEL.kits = {
  types: {
    martial: {
      label: "DRAW_STEEL.Item.Kit.Types.Martial",
      equipment: new Set("armor", "weapon")
    },
    caster: {
      label: "DRAW_STEEL.Item.Kit.Types.Caster",
      equipment: new Set("armor", "implement")
    }
  },
  armor: {
    none: {
      label: "DRAW_STEEL.Item.Kit.Armor.None"
    },
    light: {
      label: "DRAW_STEEL.Item.Kit.Armor.Light"
    },
    medium: {
      label: "DRAW_STEEL.Item.Kit.Armor.Medium"
    },
    heavy: {
      label: "DRAW_STEEL.Item.Kit.Armor.Heavy"
    },
    shield: {
      label: "DRAW_STEEL.Item.Kit.Armor.Shield"
    }
  },
  weapon: {
    none: {
      label: "DRAW_STEEL.Item.Kit.Weapons.None"
    },
    bow: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Bow"
    },
    ensnaring: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Ensnaring"
    },
    heavy: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Heavy"
    },
    light: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Light"
    },
    medium: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Medium"
    },
    polearm: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Polearm"
    },
    unarmed: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Unarmed"
    },
    whip: {
      label: "DRAW_STEEL.Item.Kit.Weapons.Whip"
    }
  },
  implement: {
    bone: {
      label: "DRAW_STEEL.Item.Kit.Implements.Bone"
    },
    crystal: {
      label: "DRAW_STEEL.Item.Kit.Implements.Crystal"
    },
    glass: {
      label: "DRAW_STEEL.Item.Kit.Implements.Glass"
    },
    metal: {
      label: "DRAW_STEEL.Item.Kit.Implements.Metal"
    },
    stone: {
      label: "DRAW_STEEL.Item.Kit.Implements.Stone"
    },
    wood: {
      label: "DRAW_STEEL.Item.Kit.Implements.Wood"
    }
  }
};
