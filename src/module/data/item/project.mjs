import {systemPath} from "../../constants.mjs";
import FormulaField from "../fields/formula-field.mjs";
import {setOptions} from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

const fields = foundry.data.fields;

/**
 * Projects are activities (crafting, research, or other) characters can accomplish during downtime.
 */
export default class ProjectModel extends BaseItemModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "project",
    detailsPartial: [systemPath("templates/item/partials/project.hbs")]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Project"
  ];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.prerequisites = new fields.StringField();
    schema.projectSource = new fields.StringField();
    schema.rollCharacteristic = new fields.SetField(setOptions());
    schema.goal = new fields.NumberField({integer: true, positive: true});
    schema.progress = new fields.NumberField({integer: true});
    schema.yield = new fields.SchemaField({
      item: new fields.DocumentUUIDField(),
      amount: new FormulaField({initial: "1"}),
      display: new fields.StringField()
    });

    return schema;
  }

  /** @override */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // If creating with item UUID, transfer the item project data to the project item
    const itemUUID = data.system?.yield?.item;
    const yieldItem = await fromUuid(itemUUID);
    if (yieldItem?.type === "equipment") {
      const {prerequisites, rollCharacteristic, goal, source} = yieldItem.system.project;
      this.updateSource({
        prerequisites,
        rollCharacteristic,
        goal,
        projectSource: source,
        yield: {
          item: itemUUID,
          display: yieldItem.system.project.yield
        }
      });
      const name = game.i18n.format("DRAW_STEEL.Item.Project.CraftItemName", {name: yieldItem.name});
      this.parent.updateSource({name});
    }
  }

  /**
   * @override
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG
    };
    this.getSheetContext(context);

    const embed = document.createElement("div");
    embed.classList.add("project");
    embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const projectBody = await renderTemplate(systemPath("templates/item/embeds/project.hbs"), context);
    embed.insertAdjacentHTML("beforeend", projectBody);
    return embed;
  }

  /** @override */
  async getSheetContext(context) {
    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, {label}]) => ({value, label}));

    const characteristicFormatter = game.i18n.getListFormatter({type: "disjunction"});
    const characteristicList = Array.from(this.rollCharacteristic).map(c => ds.CONFIG.characteristics[c]?.label ?? c);
    context.formattedCharacteristics = characteristicFormatter.format(characteristicList);

    if (this.yield.item) context.itemLink = await TextEditor.enrichHTML(`@UUID[${this.yield.item}]`);
  }
}
