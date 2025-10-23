import { systemPath } from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

export default class SubclassModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "subclass",
      invalidActorTypes: ["npc"],
      detailsPartial: [systemPath("templates/sheets/item/partials/subclass.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.subclass");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.classLink = new fields.StringField({
      required: true,
      validate: string => string === string.slugify({ strict: true }),
      validationError: game.i18n.localize("DRAW_STEEL.SOURCE.InvalidDSID"),
    });

    return schema;
  }
}
