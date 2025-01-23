/** @import {DrawSteelActor} from "../../documents/_module.mjs"; */

const fields = foundry.data.fields;

/**
 * Actor that represents a squad of minions
 */
export default class SquadModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Actor subtype
   */
  static metadata = Object.freeze({
    type: "squad"
  });

  /** @override */
  static defineSchema() {
    const schema = {};

    schema.stamina = new fields.SchemaField({
      value: new fields.NumberField({initial: 20, nullable: false, integer: true}),
      max: new fields.NumberField({initial: 20, nullable: false, integer: true}),
      temporary: new fields.NumberField({integer: true})
    });

    schema.biography = new fields.SchemaField(this.actorBiography());

    schema.captain = new fields.DocumentUUIDField({type: "Actor"});

    return schema;
  }

  /**
   * Helper function to fill in the `biography` property
   * @protected
   * @returns {Record<string, fields["DataField"]}
   */
  static actorBiography() {
    return {
      value: new fields.HTMLField(),
      gm: new fields.HTMLField()
    };
  }

  /**
   * Find all minions in the scene that have linked this squad
   * @return {Array<DrawSteelActor>}
   */
  get minions() {
    /** @type {Scene} */
    const scene = this.parent.isToken ? this.parent.parent.parent : canvas.scene;
    const tokens = scene.tokens.filter(t => (
      (t.actor.type === "npc") &&
      t.actor.system.isMinion &&
      (foundry.utils.getProperty(t.actor, "system.monster.squad") === this.parent.uuid)
    ));
    return tokens.map(t => t.actor);
  }
}
