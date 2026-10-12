import DrawSteelSystemModel from "../system-model.mjs";

/**
 * @import DrawSteelActor from "../../documents/actor.mjs";
 * @import DrawSteelTokenDocument from "../../documents/token.mjs";
 */

const { HTMLField, SchemaField } = foundry.data.fields;

export default class PartyModel extends DrawSteelSystemModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "party",
    });
  }

  /* -------------------------------------------------- */

  /**
   * The Actor subtypes allowed as members of a party.
   * @type {Set<string>}
   */
  static ALLOWED_ACTOR_TYPES = new Set(["hero", "retainer", "companion"]);

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      members: new ds.data.fields.MembersField(),
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

    const update = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: false,
        },
      },
    }, data, { insertKeys: false, insertValues: false });

    this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    if (game.user.isActiveGM && !game.actors.party) game.actors.setParty(this.parent);
  }

  /* -------------------------------------------------- */

  /**
   * Is a given actor valid to be a member of a party?
   * @param {DrawSteelActor} actor
   * @returns {boolean}
   */
  static validMember(actor) {
    return (actor instanceof foundry.documents.Actor) && PartyModel.ALLOWED_ACTOR_TYPES.has(actor.type)
      && !actor.inCompendium && !actor.isToken;
  }

  /* -------------------------------------------------- */

  /**
   * Add members to the party.
   * @param {DrawSteelActor[]} [actors]    The actors to add.
   * @returns {Promise<DrawSteelActor>}    A promise that resolves to the updated party actor.
   */
  async addMembers(actors = []) {
    actors = new Set(actors.filter(this.constructor.validMember)).filter(actor => !this.members.has(actor.id));
    const ids = [...this.members.keys(), ...actors.map(a => a.id)];
    const update = Object.entries(this.toObject().members).reduce((acc, [id, src]) => {
      if (ids.includes(id)) acc[id] = src;
      return acc;
    }, {});
    ids.forEach(id => update[id] = {});
    await this.parent.update({ "system.members": _replace(update) });
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
    const members = this.members;
    actors.forEach(actor => {
      if (members.has(actor.id)) update[actor.id] = _del;
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
    if (!canvas?.scene) {
      const msg = _loc("DRAW_STEEL.Actor.party.NoScene");
      ui.notifications.error(msg, { console: false });
      throw new Error(msg);
    }

    const tokenPromises = this.members.map(m => m.actor.getTokenDocument({}, { parent: canvas.scene }));
    const createData = await Promise.all(tokenPromises);
    return canvas.tokens.placeTokens(createData.map(t => t.toObject()));
  }
}
