import { systemPath } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "culture",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/culture.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Culture"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    const aspectSchema = (aspect) => ({
      aspect: new fields.StringField({required: true}),
      skillOptions: new fields.SetField(new fields.StringField({blank: false, required: true})),
      skill: new fields.StringField({required: true})
    });

    schema.language = new fields.StringField({required: true});
    schema.environment = new fields.SchemaField(aspectSchema("environment"));
    schema.organization = new fields.SchemaField(aspectSchema("organization"));
    schema.upbringing = new fields.SchemaField(aspectSchema("upbringing"));

    return schema;
  }

  getSheetContext(context) {
    context.environment = {
      aspectOptions: Object.entries(ds.CONFIG.culture.environments).map(([value, option]) => ({value, label: option.label})),
      skillOptions: ds.CONFIG.skills.optgroups.filter(skill => this.environment.skillOptions.has(skill.value))
    }
    context.organization = {
      aspectOptions: Object.entries(ds.CONFIG.culture.organization).map(([value, option]) => ({value, label: option.label})),
      skillOptions: ds.CONFIG.skills.optgroups.filter(skill => this.organization.skillOptions.has(skill.value))
    }
    context.upbringing = {
      aspectOptions: Object.entries(ds.CONFIG.culture.upbringing).map(([value, option]) => ({value, label: option.label})),
      skillOptions: ds.CONFIG.skills.optgroups.filter(skill => this.upbringing.skillOptions.has(skill.value))
    }
  }
}
