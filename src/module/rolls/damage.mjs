import {DSRoll} from "./base.mjs";

/**
 * Contains damage-specific info like damage types
 */
export class DamageRoll extends DSRoll {
  /**
   * The damage type
   * @type {keyof typeof ds["CONFIG"]["damageTypes"]}
   */
  get type() {
    return this.options.type ?? "";
  }

  /**
   * Damage immunities to ignore
   * @type {Array<keyof typeof ds["CONFIG"]["damageTypes"]>}
   */
  get ignoredImmunities() {
    return this.options.ignoredImmunities ?? [];
  }
}
