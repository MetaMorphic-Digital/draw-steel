
/**
 * A base class for message subtype-specific behavior and data
 */
export default class BaseMessageModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this ChatMessage subtype
   */
  static metadata = Object.freeze({
    type: "base"
  });

  static defineSchema() {
    return {};
  }
}
