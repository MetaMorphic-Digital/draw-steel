import BaseSpecialEffect from "./base-special-effect.mjs";
import SummonChoiceAdvancement from "../advancements/summon-choice-advancement.mjs";

/**
 * @import SummonChoiceAdvancement from "../advancements/summon-choice-advancement.mjs";
 * @import { DrawSteelTokenDocument } from "../../../documents/_module.mjs";
 * @import { DatabaseWriteOperation } from "@common/abstract/_types.mjs";
 */

/**
 * A type of effect that summons from a fixed list of options.
 */
export default class PortfolioSummonSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "portfolioSummon";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  constructButtons() {
    return [ds.utils.constructHTMLButton({
      label: _loc("DRAW_STEEL.ChatMessage.PARTS.abilityUse.performSummon"),
      icon: "fa-solid fa-transporter-2",
      dataset: {
        specialEffectId: this.id,
        action: "performSummon",
      },
    })];
  }

  /* -------------------------------------------------- */

  /**
   * Places summons.
   * @returns {Promise<DrawSteelTokenDocument[] | null>} Returns null if the user did not have permissions.
   */
  async performSummon() {
    const hero = this.document.actor;

    const summonInfo = await SummonChoiceAdvancement.getSummonInfo(hero, this.document.dsid);

    if (!summonInfo) return;

    const tokens = await this.parent.performSummon(summonInfo.uuid, { count: summonInfo.count, effects: summonInfo.effects });

    if (tokens?.length) {
      await hero.modifyTokenAttribute("hero.primary.value", -summonInfo.cost, true);

      const combat = game.combat;
      if (combat) {
        /** @type {DatabaseWriteOperation} */
        const createOperation = { action: "create", ds: { }, documentName: "Combatant", parent: combat };
        const operation = [createOperation];
        const group = combat.combatants.find(c => c.actorId === tokens.at(0).actorId)?.group;

        // defer group creation
        const baseActor = tokens.at(0).baseActor;
        if (baseActor.isMinion) {
          if (group) {
            const staminaValue = group.system.staminaValue + tokens.length * baseActor.system.stamina.max;

            operation.push({
              action: "update",
              documentName: "CombatantGroup",
              updates: [{ _id: group.id, system: { staminaValue } }],
              parent: combat,
            });
          }
          else if (summonInfo.count > 1) {
            createOperation.ds.createGroup = true;
          }
        }

        createOperation.data = tokens.map(t => ({ tokenId: t.id, sceneId: t.parent.id, actorId: t.actorId, group: group?.id }));
        await foundry.documents.modifyBatch(operation);
      }
    }

    return tokens;
  }
}
