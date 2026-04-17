/**
 * @import { DataFieldContext, TypedObjectFieldOptions } from "@common/data/_types.mjs";
 * @import Collection from "@common/utils/collection.mjs";
 * @import DrawSteelActor from "../../documents/actor.mjs";
 */

const { SchemaField, TypedObjectField } = foundry.data.fields;

/**
 * A subclass of TypedObjectField that initializes as a getter for party members.
 */
export default class MembersField extends TypedObjectField {
  /**
   * @param {TypedObjectFieldOptions} [options]
   * @param {DataFieldContext} [context]
   */
  constructor(options = {}, context = {}) {
    const validateKey = key => foundry.data.validators.isValidId(key);
    super(new SchemaField({}), { ...options, validateKey }, context);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    if (!value) return value;
    const object = super.initialize(value, model, options);
    return () => Object.entries(object).reduce((acc, [id, data]) => {
      const actor = game.actors.get(id);
      if (ds.data.Actor.PartyModel.validMember(actor)) acc.set(actor.id, { ...data, actor });
      return acc;
    }, new ds.utils.MembersCollection());
  }
}
