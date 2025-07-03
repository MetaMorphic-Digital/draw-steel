/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Combatant.documentClass
 */
export default class DrawSteelCombatant extends foundry.documents.Combatant {
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (("initiative" in changes) && (changes.initiative < this.initiative)) await this.actor?.system._onStartTurn(this);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if ("group" in changed) {
      for (const group of this.combat.groups) {
        group.system.refreshSquad();
      }
      this.refreshCombatant();
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    this.group?.system.refreshSquad();
    this.refreshCombatant();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatantData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Re-implements group prep to remove initiative override
   * @inheritdoc
   */
  _prepareGroup() {
    super._prepareGroup();
    this.initiative = this._source.initiative;
    if (typeof this.group === "string") this.group = null;
  }

  /* -------------------------------------------------- */

  /**
   * Refreshes the combatants token resources bar and actor stats tab
   * Needed when the squad stamina changes or the combatant is added or removed from a squad to ensure correct stamina value and inputs are used
   */
  refreshCombatant() {
    this.token?.object?.renderFlags.set({ refreshBars: true });
    // refresh any rendered sheets but only if the current user has permission to have it rendered anyways
    if (this.actor?.sheet.isVisible) this.actor.sheet.render({ parts: ["stats"] });
  }
}
