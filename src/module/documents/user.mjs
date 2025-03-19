/**
 * A document subclass adding system-specific behavior and registered in CONFIG.User.documentClass
 */
export default class DrawSteelUser extends foundry.documents.User {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareUserData", this);
  }
}
