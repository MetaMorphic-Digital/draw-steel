export const systemID = "draw-steel";

/* -------------------------------------------------- */

/**
 * Translates repository paths to Foundry Data paths.
 * @param {string} path - A path relative to the root of this repository.
 * @returns {string} The path relative to the Foundry data folder.
 */
export const systemPath = (path) => `systems/${systemID}/${path}`;

/* -------------------------------------------------- */

export const ASCII = `
______                      _____ _            _
|  _  \\                    /  ___| |          | |
| | | |_ __ __ ___      __ \\ \`--.| |_ ___  ___| |
| | | | '__/ _\` \\ \\ /\\ / /  \`--. \\ __/ _ \\/ _ \\ |
| |/ /| | | (_| |\\ V  V /  /\\__/ / ||  __/  __/ |
|___/ |_|  \\__,_| \\_/\\_/   \\____/ \\__\\___|\\___|_|
`;

/* -------------------------------------------------- */

export const initiativeModes = Object.freeze({
  /** Players and Enemies alternate. */
  default: "DRAW_STEEL.Combat.Initiative.Modes.Default",
  /** Traditional "roll a die and go in roll order". */
  alternative: "DRAW_STEEL.Combat.Initiative.Modes.Alternative",
});

/* -------------------------------------------------- */

export const projectEventOptions = Object.freeze({
  none: "None",
  /** Roll a d6 during the project roll. */
  roll: "DRAW_STEEL.Setting.ProjectEvents.Roll",
  /** Triggers based on the milestones set in {@linkcode ds.CONFIG.projects.milestones}. */
  milestone: "DRAW_STEEL.Setting.ProjectEvents.Milestone",
});

/* -------------------------------------------------- */

/**
 * Effects that apply based on stamina value.
 * @type {Record<string, {img: string, name: string, threshold: string | number}>}
 */
export const staminaEffects = Object.freeze({
  dying: {
    name: "DRAW_STEEL.ActiveEffect.StaminaEffects.Dying",
    hud: false,
    img: "icons/svg/stoned.svg",
    threshold: 0,
  },
  winded: {
    name: "DRAW_STEEL.ActiveEffect.StaminaEffects.Winded",
    hud: false,
    img: "icons/svg/windmill.svg",
    threshold: "system.stamina.winded",
  },
});

/* -------------------------------------------------- */

/**
 * Potency end options for {@linkcode ds.data.pseudoDocuments.powerRollEffects.AppliedPowerRollEffect | AppliedPowerRollEffect}.
 */
export const potencyConditions = Object.freeze({
  always: {
    label: "DRAW_STEEL.POWER_ROLL_EFFECT.APPLIED.CONDITIONS.always",
  },
  failure: {
    label: "DRAW_STEEL.POWER_ROLL_EFFECT.APPLIED.CONDITIONS.failure",
  },
  success: {
    label: "DRAW_STEEL.POWER_ROLL_EFFECT.APPLIED.CONDITIONS.success",
  },
});

/* -------------------------------------------------- */

/**
 * @typedef TestOutcome
 * Outcomes for a given difficulty by power roll result.
 * @property {string} label     The i18n string for the test difficulty.
 * @property {string} tier1     The i18n string for the tier 1 result of a test.
 * @property {string} tier2     The i18n string for the tier 2 result of a test.
 * @property {string} tier3     The i18n string for the tier 3 result of a test.
 * @property {string} critical  The i18n string for the critical result of a test.
 */

/**
 * The outcomes of a test by difficulty then result.
 * @type {Record<string, TestOutcome>}
 */
export const testOutcomes = {
  easy: {
    label: "DRAW_STEEL.ROLL.Power.TestDifficulty.easy",
    tier1: "DRAW_STEEL.ROLL.Power.TestResult.SuccessConsequence",
    tier2: "DRAW_STEEL.ROLL.Power.TestResult.Success",
    tier3: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
    critical: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
  },
  medium: {
    label: "DRAW_STEEL.ROLL.Power.TestDifficulty.medium",
    tier1: "DRAW_STEEL.ROLL.Power.TestResult.Failure",
    tier2: "DRAW_STEEL.ROLL.Power.TestResult.SuccessConsequence",
    tier3: "DRAW_STEEL.ROLL.Power.TestResult.Success",
    critical: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
  },
  hard: {
    label: "DRAW_STEEL.ROLL.Power.TestDifficulty.hard",
    tier1: "DRAW_STEEL.ROLL.Power.TestResult.FailureConsequence",
    tier2: "DRAW_STEEL.ROLL.Power.TestResult.Failure",
    tier3: "DRAW_STEEL.ROLL.Power.TestResult.Success",
    critical: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
  },
};

/* -------------------------------------------------- */

/**
 * Potency strengths and their related glyphs.
 * @type {Record<string, { glyph: string }}
 */
export const potencyStrengths = Object.freeze({
  weak: {
    glyph: "w",
  },
  average: {
    glyph: "v",
  },
  strong: {
    glyph: "s",
  },
});
