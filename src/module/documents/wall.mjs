/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Wall.documentClass
 */
export default class DrawSteelWallDocument extends foundry.documents.WallDocument {
  /**
   * Does this wall block lines of effects?
   * @type {boolean}
   */
  get blocksLineOfEffect() {
    return this.getFlag("draw-steel", "blocksLineOfEffect") ?? true;
  }
}
