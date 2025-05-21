/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Wall.documentClass
 */
export default class DrawSteelWallDocument extends foundry.documents.WallDocument {
  get blocksLineOfEffect() {
    return this.getFlag("draw-steel", "blocksLineOfEffect") ?? true;
  }
}
