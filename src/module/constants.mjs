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
 * Outcomes for a given result by difficulty.
 * @property {string} easy      The i18n string for the result of an easy test.
 * @property {string} medium    The i18n string for the result of a medium test.
 * @property {string} hard      The i18n string for the result of a hard test.
 */

/**
 * The outcomes of a test by result then difficulty.
 * @type {Record<string, TestOutcome>}
 */
export const testOutcomes = {
  tier1: {
    easy: "DRAW_STEEL.ROLL.Power.TestResult.SuccessConsequence",
    medium: "DRAW_STEEL.ROLL.Power.TestResult.Failure",
    hard: "DRAW_STEEL.ROLL.Power.TestResult.FailureConsequence",
  },
  tier2: {
    easy: "DRAW_STEEL.ROLL.Power.TestResult.Success",
    medium: "DRAW_STEEL.ROLL.Power.TestResult.SuccessConsequence",
    hard: "DRAW_STEEL.ROLL.Power.TestResult.Failure",
  },
  tier3: {
    easy: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
    medium: "DRAW_STEEL.ROLL.Power.TestResult.Success",
    hard: "DRAW_STEEL.ROLL.Power.TestResult.Success",
  },
  critical: {
    easy: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
    medium: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
    hard: "DRAW_STEEL.ROLL.Power.TestResult.SuccessReward",
  },
};
