/**
 * A custom combat tracker that supports Draw Steel's flexible initiative system
 * TODO: Refactor in v13 for the AppV2 based combat tracker
 */
export class DrawSteelCombatTracker extends CombatTracker {
  async getData(options = {}) {
    const data = await super.getData(options);

    const {dispositionColors} = CONFIG.Canvas;

    return data;
  }
}
