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
