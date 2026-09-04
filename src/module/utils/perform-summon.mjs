import DrawSteelActiveEffect from "../documents/active-effect.mjs";

/**
 * @import { PerformSummonOptions } from "../_types";
 */

/**
 * Places summons.
 * @param {string} uuid                  The UUID of the actor to summon. If this points to a compendium actor a copy will be imported.
 * @param {ClientDocument} summonSource  A document that can be checked against to prevent duplicate imports and provide roll data for effect replacement.
 * @param {PerformSummonOptions} options
 * @returns {Promise<DrawSteelTokenDocument[] | null>} Returns null if the user did not have permissions.
 */
export default async function performSummon(uuid, summonSource, { count = 1, effects = [] } = {}) {
  /** @type {DrawSteelActor} */
  const sourceActor = await fromUuid(uuid);

  if (!sourceActor) return void ui.notifications.error("DRAW_STEEL.Actor.Summoning.Errors.ACTOR_CREATE", { localize: true });

  // TODO: Rework into registry or other service to improve performance with large actor collections
  let worldActor = sourceActor.pack
    ? game.actors.find(a => (a._stats.compendiumSource === uuid) && (a.getFlag(ds.CONST.systemID, "summonSource") === summonSource.uuid))
    : sourceActor;

  if (!worldActor) {
    // Ensure the user has permission to drop the actor and create a Token.
    if (!game.user.can("ACTOR_CREATE")) {
      ui.notifications.warn("DRAW_STEEL.Actor.Summoning.Errors.ACTOR_CREATE", { localize: true });
      return null;
    }

    worldActor = await game.actors.importFromCompendium(game.packs.get(sourceActor.pack), sourceActor.id, {
      "flags.draw-steel.summonSource": summonSource.uuid,
    }, { keepId: true });
  }

  const actorUpdates = { effects: [] };

  const replacementData = summonSource.getRollData?.() ?? {};

  for (const e of effects) {
    const data = game.items.fromCompendium(e, { keepId: true, clearFolder: true });
    for (const change of data.system.changes) {
      if (typeof change.value !== "string") continue;
      change.value = DrawSteelActiveEffect._replaceDataRefs(change.value, replacementData);
    }
    actorUpdates.effects.push(data);
  }

  return canvas.tokens.placeActor(worldActor, { count, actorUpdates });
}
