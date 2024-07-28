export const DRAW_STEEL = {};

/**
 * The set of Characteristics used within the system.
 * The long form can be accessed under `DRAW_STEEL.Actor.base.FIELDS.characteristics.{}.value`
 * The `label` is the short form in all caps (e.g. MGT)
 * The `hint` is the full name (e.g. Might)
 * @type {Array<string>}
 */
DRAW_STEEL.characteristics = ["mgt", "agl", "rea", "inu", "prs"];

// TODO: Conditions
// Bleeding, Dazed, Frightened, Grabbed, Prone, Restrained, Slowed, Taunted, Weakened

// TODO: Skills

// TODO: Languages

/**
 * Configuration details for Cultures
 * @type {Record<string, Record<string, {label: string, skillOpts: Set<string>}>>}
 */
DRAW_STEEL.culture = {
  environments: {
    nomadic: {
      label: "",
      skillOpts: new Set()
    },
    rural: {
      label: "",
      skillOpts: new Set()
    },
    secluded: {
      label: "",
      skillOpts: new Set()
    },
    urban: {
      label: "",
      skillOpts: new Set()
    },
    wilderness: {
      label: "",
      skillOpts: new Set()
    }
  },
  organization: {
    anarchic: {
      label: "",
      skillOpts: new Set()
    },
    bureacratic: {
      label: "",
      skillOpts: new Set()
    },
    communal: {
      label: "",
      skillOpts: new Set()
    }
  },
  upbringing: {
    academic: {
      label: "",
      skillOpts: new Set()
    },
    creative: {
      label: "",
      skillOpts: new Set()
    },
    illegal: {
      label: "",
      skillOpts: new Set()
    },
    labor: {
      label: "",
      skillOpts: new Set()
    },
    martial: {
      label: "",
      skillOpts: new Set()
    },
    noble: {
      label: "",
      skillOpts: new Set()
    }
  }
};
