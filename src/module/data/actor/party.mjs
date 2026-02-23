/**
 * @import DrawSteelActor from "../../documents/actor.mjs";
 * @import DrawSteelTokenDocument from "../../documents/token.mjs";
 */

const { HTMLField, SchemaField, TypedObjectField } = foundry.data.fields;

export default class PartyModel extends foundry.abstract.TypeDataModel {
  /** @type {*} */
  static get metadata() {
    return {
      type: "party",
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      members: new TypedObjectField(
        new SchemaField({}),
        { validateKey: key => foundry.data.validators.isValidId(key) },
      ),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat([
    "DRAW_STEEL.Actor.party",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = {};
    if (!foundry.utils.hasProperty(data, "prototypeToken.actorLink"))
      foundry.utils.setProperty(update, "prototypeToken.actorLink", true);

    if (!foundry.utils.hasProperty(data, "prototypeToken.sight.enabled"))
      foundry.utils.setProperty(update, "prototypeToken.sight.enabled", false);

    if (!foundry.utils.hasProperty(data, "prototypeToken.disposition"))
      foundry.utils.setProperty(update, "prototypeToken.disposition", CONST.TOKEN_DISPOSITIONS.FRIENDLY);

    if (!foundry.utils.isEmpty(update)) this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    Object.defineProperty(this, "members", {
      enumerable: true,
      get() {
        return Object.entries(this._source.members).reduce((acc, [id, data]) => {
          const actor = game.actors.get(id);
          if (this.validMember(actor)) acc.set(actor.id, { ...data, actor });
          return acc;
        }, new foundry.utils.Collection());
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Is a given actor valid to be a member of this party?
   * @param {DrawSteelActor} actor
   * @returns {boolean}
   */
  validMember(actor) {
    return (actor instanceof foundry.documents.Actor) && ["hero"].includes(actor.type)
      && !actor.inCompendium && !actor.isToken;
  }

  /* -------------------------------------------------- */

  /**
   * Add members to the party.
   * @param {DrawSteelActor[]} [actors]    The actors to add.
   * @returns {Promise<DrawSteelActor>}    A promise that resolves to the updated party actor.
   */
  async addMembers(actors = []) {
    actors = new Set(actors.filter(this.validMember)).filter(actor => !this.members.has(actor.id));
    const ids = [...this.members.keys(), ...actors.map(a => a.id)];
    const update = Object.entries(this.toObject().members).reduce((acc, [id, src]) => {
      if (ids.includes(id)) acc[id] = src;
      return acc;
    }, {});
    ids.forEach(id => update[id] = {});
    await this.parent.update({ "system.==members": update });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Remove members from the party.
   * @param {DrawSteelActor[]} [actors]    The actors to remove.
   * @returns {Promise<DrawSteelActor>}    A promise that resolves to the updated party actor.
   */
  async removeMembers(actors = []) {
    const update = {};
    actors.forEach(actor => {
      if (this.validMember(actor) && this.members.has(actor.id)) update[`-=${actor.id}`] = null;
    });
    await this.parent.update({ "system.members": update });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Place down the members of this party.
   * @returns {Promise<DrawSteelTokenDocument[]>}    A promise that resolves to the created tokens.
   */
  async placeMembers() {
    const config = { tokens: this.members.map(m => m.actor.prototypeToken) };
    const data = await ds.canvas.placeables.tokens.TokenPlacement.place(config);
    return ds.canvas.placeables.tokens.TokenPlacement.createTokens(data);
  }
}
