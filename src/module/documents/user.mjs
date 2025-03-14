export class DrawSteelUser extends User {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareUserData", this);
  }
}
