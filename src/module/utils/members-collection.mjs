/**
 * Simplistic extension of Collection to allow splitting contents by type.
 * @extends {foundry.utils.Collection<string, { actor: DrawSteelActor }>}
 */
export default class MembersCollection extends foundry.utils.Collection {
  /**
   * Cached members by type.
   * @type {Record<string, DrawSteelActor[]>|void}
   */
  #documentsByType;

  /* -------------------------------------------------- */

  /**
   * The members by type.
   * @type {Record<string, DrawSteelActor[]>}
   */
  get documentsByType() {
    if (!this.#documentsByType) {
      this.#documentsByType = Object.groupBy(this, m => m.actor.type);
      ds.data.Actor.PartyModel.ALLOWED_ACTOR_TYPES.forEach(key => this.#documentsByType[key] ??= []);
    }
    return this.#documentsByType;
  }
}
