import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseItemModel from "./base-item.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * @import { DrawSteelChatMessage, DrawSteelItem } from "../../documents/_module.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import { DatabaseCreateOperation } from "@common/abstract/_types.mjs";
 */

const fields = foundry.data.fields;

/**
 * An NPC dedicated to helping a Hero. Many of the actions of a follower are controlled by a player.
 * Sages and Artisans are implemented as items because they are primarily associated with a hero and do not need to be represented on the canvas.
 */
export default class FollowerModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "follower",
      packOnly: false,
      invalidActorTypes: ["npc", "object"],
      detailsPartial: [systemPath("templates/sheets/item/partials/follower.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.follower");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.type = new fields.StringField({ required: true, choices: ds.CONST.followerTypes, initial: "artisan" });

    const characteristic = { initial: 0, integer: true, nullable: false };

    schema.characteristics = new fields.SchemaField(
      Object.entries(ds.CONFIG.characteristics).reduce((obj, [chc, { label, hint }]) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField({ ...characteristic, label, hint }),
          edges: requiredInteger({ min: null, persisted: false }),
          banes: requiredInteger({ min: null, persisted: false }),
          dice: new fields.SchemaField({
            mode: new fields.StringField({ choices: "kh" }),
            number: requiredInteger({ initial: 2 }),
            faces: requiredInteger({ initial: 10 }),
          }, { persisted: false }),
        });
        return obj;
      }, {}),
    );

    schema.skills = new fields.SchemaField({
      value: new fields.SetField(setOptions()),
    });

    schema.languages = new fields.SchemaField({
      value: new fields.SetField(setOptions()),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.followerType = _loc(ds.CONST.followerTypes[this.type].label);

    const formatter = game.i18n.getListFormatter({ type: "unit" });

    const skillList = this.skills.value.reduce((skills, skill) => {
      skill = ds.CONFIG.skills.list[skill]?.label;
      if (skill) skills.push(skill);
      return skills;
    }, []).sort((a, b) => a.localeCompare(b, game.i18n.lang));

    this.skills.list = formatter.format(skillList);

    const languageList = this.languages.value.reduce((languages, lang) => {
      lang = ds.CONFIG.languages[lang]?.label;
      if (lang) languages.push(lang);
      return languages;
    }, []).sort((a, b) => a.localeCompare(b, game.i18n.lang));

    this.languages.list = formatter.format(languageList);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG,
      enrichedDescription: await enrichHTML(this.description.value, { ...options, relativeTo: this.parent }),
    };
    await this.getSheetContext(context);

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", "follower");
    if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const followerBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/follower.hbs"), context);
    embed.insertAdjacentHTML("beforeend", followerBody);
    return embed;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    await super.getSheetContext(context);

    const useInitialized = context.isPlay ?? true;

    const data = useInitialized ? this : this._source;
    context.characteristics = Object.keys(ds.CONFIG.characteristics).reduce((obj, chc) => {
      const value = foundry.utils.getProperty(data, `characteristics.${chc}.value`);
      obj[chc] = {
        field: this.schema.getField(["characteristics", chc, "value"]),
        value: useInitialized ? (value ?? 0) : (value || null),
      };
      return obj;
    }, {});

    const skillOptions = ds.CONFIG.skills.optgroups;

    for (const skill of this.skills.value) {
      if (!(skill in ds.CONFIG.skills.list)) skillOptions.push({ value: skill });
    }

    context.skills = {
      list: this.skills.list,
      options: skillOptions,
    };

    const languageOptions = Object.entries(ds.CONFIG.languages).map(([value, { label }]) => ({ value, label }));

    for (const language of this.languages.value) {
      if (!(language in ds.CONFIG.languages)) languageOptions.push({ value: language });
    }

    context.languages = {
      list: this.languages.list,
      options: languageOptions,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    const chars = Object.entries(this.characteristics).map(([k, v]) => {
      const rollKey = ds.CONFIG.characteristics[k].rollKey;
      rollData.item[rollKey] = v.value;
      return v.value;
    });
    rollData.item.chr = Math.max(...chars);
  }

  /* -------------------------------------------------- */

  /**
   * Perform a characteristic roll to assist a project.
   * @param {object} config
   * @param {DrawSteelItem} [config.project] A specific project to roll for.
   * @param {ApplicationConfiguration} [dialogOptions={}] Options to be forwarded to the roll dialog.
   * @param {DatabaseCreateOperation} [messageOptions]    Options to be forwarded to the final created chat message.
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async roll(config = {}, dialogOptions = {}, messageOptions = {}) {
    if (!this.actor) throw new Error("Only followers with a hero can perform a roll");

    if (!config.project) {
      const projectOptions = this.actor.itemTypes.project.map(p => ({
        value: p.id,
        label: p.name,
        group: ds.CONFIG.projects.types[p.system.type]?.label,
      }));

      if (!projectOptions.length) {
        ui.notifications.error("DRAW_STEEL.Item.follower.ProjectChoice.NoProjects", { localize: true });
        return;
      }

      const content = document.createElement("div");

      const { createFormGroup, createSelectInput } = foundry.applications.fields;

      const projectInput = createFormGroup({
        label: "TYPES.Item.project",
        input: createSelectInput({
          name: "project",
          options: projectOptions,
        }),
        localize: true,
      });

      content.append(projectInput);

      const fd = await ds.applications.api.DSDialog.input({
        content,
        window: {
          title: _loc("DRAW_STEEL.Item.follower.ProjectChoice.Title", { name: this.parent.name }),
          icon: "fa-solid fa-diagram-project",
        },
      });

      if (!fd) return;

      config.project = this.actor.items.get(fd.project);
    }

    return config.project.system.roll({ follower: this.parent }, dialogOptions, messageOptions);
  }
}
