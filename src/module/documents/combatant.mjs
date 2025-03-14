
export class DrawSteelCombatant extends Combatant {
  /**
   * The disposition for this combatant. In priority,
   * 1. Manually specified for this combatant
   * 2. Token disposition
   * 3. Prototype Token disposition for the associated actor
   * 4. -2
   * @returns {number}
   */
  get disposition() {
    const disposition =
      this.system.disposition ??
      this.token?.disposition ??
      this.actor?.prototypeToken.disposition ??
      -2;
    if ((disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) && this.hasPlayerOwner) return 2;
    return disposition;
  }

  /** @inheritdoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (("initiative" in changes) && (changes.initiative < this.initiative)) await this.actor?.system._onStartTurn(this);
  }

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatantData", this);
  }
}
