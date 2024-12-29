import BaseMessageModel from "./base.mjs";

const fields = foundry.data.fields;

/**
 * Chat messages with message
 */
export default class AbilityUseModel extends BaseMessageModel {
  static metadata = Object.freeze({
    type: "abilityUse"
  });

  static defineSchema() {
    const schema = super.defineSchema();

    return schema;
  }
}
