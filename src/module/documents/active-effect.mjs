import {systemID} from "../constants.mjs";

export class DrawSteelActiveEffect extends ActiveEffect {
  /** @override */
  static async _fromStatusEffect(statusId, effectData, options) {
    const effect = await super._fromStatusEffect(statusId, effectData, options);
    const sourceData = {};

    if (effectData.rule) sourceData.description = `@Embed[${effectData.rule} inline]`;
    if (["frightened", "grabbed", "taunted"].includes(statusId)) this.targetedConditionPrompt(statusId, sourceData);
    
    effect.updateSource(sourceData);
    return effect;
  }

  /**
   * Modify the sourceData for the new effect with the changes to include the imposing actor's UUID in the appropriate flag.
   * @param {string} statusId 
   * @param {object} sourceData
   */
  static async targetedConditionPrompt(statusId, sourceData) {
    try {
      const title = game.i18n.format("DRAW_STEEL.Effect.TargetedConditionPrompt.Title", {
        condition: CONFIG.statusEffects.find(condition => condition.id === statusId)?.name ?? ""
      });
      let imposingActorId = await foundry.applications.api.DialogV2.prompt({
        window: {title},
        content: `
            ${game.i18n.localize("DRAW_STEEL.Effect.TargetedConditionPrompt.Prompt")}: 
            <input type=text name="actorId" value="${game.user.targets.first()?.actor?.uuid ?? ""}" />
          `,
        ok: {
          callback: (event, button, dialog) => dialog.querySelector("input").value
        },
        buttons: [{
          action: "select-target",
          label: "DRAW_STEEL.Effect.TargetedConditionPrompt.SelectFirstTarget",
          callback: (event, button, dialog) => game.user.targets.first()?.actor?.uuid ?? ""
        }]
      });
  
      if (foundry.utils.parseUuid(imposingActorId)) {
        sourceData.changes = [{
          key: `flags.${systemID}.${statusId}`,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: imposingActorId
        }];
      }
    } catch (error) {
      ui.notifications.warn("DRAW_STEEL.Effect.TargetedConditionPrompt.Warning", {localize: true});
    }
  }

  /**
   * Automatically deactivate effects with expired durations
   * @override
   * @type {Boolean}
   */
  get isSuppressed() {
    if (Number.isNumeric(this.duration.remaining)) {
      return this.duration.remaining <= 0;
    }
    return false;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActiveEffectData", this);
  }

  /** @import {ActiveEffectDuration, EffectDurationData} from "../data/effect/_types" */

  /**
   * Compute derived data related to active effect duration.
   * @returns {Omit<ActiveEffectDuration, keyof EffectDurationData>}
   * @protected
   * @override
   */
  _prepareDuration() {
    return this.system._prepareDuration ?? super._prepareDuration();
  }

  /**
   * Check if the effect's subtype has special handling, otherwise fallback to normal `duration` and `statuses` check
   * @override
   */
  get isTemporary() {
    return this.system._isTemporary ?? super.isTemporary;
  }
}
