import { systemID, systemPath } from "../../../constants.mjs";
import BaseSpecialEffect from "./base-special-effect.mjs";
import { requiredInteger } from "../../helpers.mjs";

/**
 * @import { DrawSteelActor, DrawSteelTokenDocument} from "../../../documents/_module.mjs"
 */

const { DocumentUUIDField, SetField } = foundry.data.fields;

/**
 * A type of effect that performs a summon.
 */
export default class SummonSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "summon";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      pool: new SetField(new DocumentUUIDField({ type: "Actor", embedded: false })),
      count: new requiredInteger({ initial: 1, min: 1 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get detailsPartial() {
    return systemPath("templates/sheets/pseudo-documents/special-effect/summon.hbs");
  }

  /* -------------------------------------------------- */

  /**
   * Places summons.
   * @returns {Promise<DrawSteelTokenDocument[] | null>} Returns null if the user did not have permissions.
   */
  async performSummon() {
    if (!this.pool.size) return void ui.notifications.error("");
    // Token permissions handled by placeActor
    let uuid;

    if (this.pool.size > 1) {

      // TODO: Pick actor from pool

      if (!uuid) return null;
    }
    else uuid = this.pool.first();

    /** @type {DrawSteelActor} */
    const sourceActor = await fromUuid(uuid);

    if (!sourceActor) return void ui.notifications.error("");

    let worldActor = game.actors.find(a => (a._stats.compendiumSource === uuid) && (a.getFlag(systemID, "summonSource") === this.document.uuid));

    if (!worldActor) {
      // Ensure the user has permission to drop the actor and create a Token.
      if (!game.user.can("ACTOR_CREATE")) {
        ui.notifications.warn("DRAW_STEEL.Actor.Summoning.Errors.ACTOR_CREATE", { localize: true });
        return null;
      }

      worldActor = game.actors.importFromCompendium(sourceActor.pack, sourceActor.id, {
        "flags.draw-steel.summonSource": this.document.uuid,
      }, { keepId: true });
    }

    return canvas.tokens.placeActor(worldActor);
  }
}
