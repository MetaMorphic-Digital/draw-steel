import BaseSpecialEffect from "./base-special-effect.mjs";
import SummonChoiceAdvancement from "../advancements/summon-choice-advancement.mjs";

/**
 * @import SummonChoiceAdvancement from "../advancements/summon-choice-advancement.mjs";
 * @import { DrawSteelTokenDocument } from "../../../documents/_module.mjs";
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
        const matchingCombatant = combat.combatants.find(c => c.actorId === tokens.at(0).actorId);
        const group = matchingCombatant.group;
        const createData = tokens.map(t => ({ tokenId: t.id, sceneId: t.parent.id, actorId: t.actorId, group: group?.id }));
        await combat.createEmbeddedDocuments("Combatant", createData);
        // Do not currently handle squad creation or stamina adjustments
      }
    }

    return tokens;
  }
}
