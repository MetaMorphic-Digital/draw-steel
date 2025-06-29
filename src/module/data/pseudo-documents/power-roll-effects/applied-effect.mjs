import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

/**
 * @import { AppliedEffectSchema } from "./_types"
 * @import { DataField } from "@common/data/fields.mjs";
 * @import { FormGroupConfig, FormInputConfig } from "@common/data/_types.mjs"
 */

const { SchemaField, SetField, StringField, TypedObjectField } = foundry.data.fields;

/**
 * For abilities that apply an ActiveEffect
 */
export default class AppliedPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    const config = ds.CONFIG;

    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      applied: this.duplicateTierSchema(() => ({
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.hint",
        }),
        effects: new TypedObjectField(new SchemaField({
          condition: new StringField({
            required: true,
            choices: ds.CONST.potencyConditions,
            initial: "always",
            label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.effects.condition.label",
          }),
          end: new StringField({
            choices: config.effectEnds,
            blank: true,
            label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.effects.end.label",
          }),
          properties: new SetField(setOptions(), {
            label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.effects.properties.label",
          }),
        })),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "applied";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      /** @type {AppliedEffectSchema} */
      const tierValue = this.applied[`tier${n}`];
      tierValue.potency.value ||= this.schema.getField(["applied", `tier${n}`, "potency", "value"]).getInitialValue({});
      if (n > 1) {
        /** @type {AppliedEffectSchema} */
        const prevTier = this.applied[`tier${n - 1}`];
        if (prevTier.display) tierValue.display ||= prevTier.display;
        if (prevTier.potency.characteristic) tierValue.potency.characteristic ||= prevTier.potency.characteristic;
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context) {
    await super._tierRenderingContext(context);

    for (const n of [1, 2, 3]) {
      const path = `applied.tier${n}`;
      Object.assign(context.fields[`tier${n}`].applied, {
        effectOptions: this.item.effects.filter(e => !e.transfer).map(e => ({ value: e.id, label: e.name })),
        display: {
          field: this.schema.getField(`${path}.display`),
          value: this.applied[`tier${n}`].display,
          src: this._source.applied[`tier${n}`].display,
          placeholder: n > 1 ? this.applied[`tier${n - 1}`].display : "",
          name: `${path}.display`,
        },
        effects: {
          field: this.schema.getField(`${path}.effects`),
          value: this.applied[`tier${n}`].effects,
          src: this._source.applied[`tier${n}`].effects,
          widget: this.#effectWidget.bind(this),
          name: `${path}.effects`,
        },
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   *
   * @param {DataField} field
   * @param {FormGroupConfig} groupConfig
   * @param {FormInputConfig<AppliedEffectSchema["effects"]>} inputConfig
   * @returns {HTMLFieldSetElement}
   */
  #effectWidget(field, groupConfig, inputConfig) {
    const widget = document.createElement("fieldset");
    widget.insertAdjacentHTML("afterbegin", `<legend>${game.i18n.localize("DRAW_STEEL.Effect.Applied")}</legend>`);

    // Unconventional select so creating by hand
    const effectSelect = document.createElement("select");
    effectSelect.insertAdjacentHTML("afterbegin", "<option></option>");

    // Nontraditional select so not using normal `name` attribute
    effectSelect.dataset["name"] = inputConfig.name;

    const customGroup = document.createElement("optgroup");
    customGroup.label = game.i18n.localize("DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.APPLIED.CustomEffects");
    effectSelect.insertAdjacentElement("beforeend", customGroup);
    for (const e of this.item.effects) {
      if (e.transfer) continue;
      const o = document.createElement("option");
      o.value = e.id;
      o.innerText = e.name;
      if (e.id in inputConfig.value) o.disabled = true;
      customGroup.insertAdjacentElement("beforeend", o);
    }

    const statusGroup = document.createElement("optgroup");
    statusGroup.label = game.i18n.localize("DRAW_STEEL.Effect.StatusConditions");
    effectSelect.insertAdjacentElement("beforeend", statusGroup);
    for (const s of CONFIG.statusEffects) {
      if (!s._id || (s.hud === false)) continue;
      const o = document.createElement("option");
      o.value = s._id;
      o.innerText = s.name || s.label;
      if (s._id in inputConfig.value) o.disabled = true;
      statusGroup.insertAdjacentElement("beforeend", o);
    }

    const addEffect = foundry.applications.fields.createFormGroup({
      input: effectSelect,
      label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.APPLIED.AddEffect",
      localize: true,
    });

    widget.insertAdjacentElement("afterbegin", addEffect);

    for (const [key, srcValue] of Object.entries(inputConfig.value)) {
      // Check if it's a custom effect, then find the status, and finally assume it's a deleted effect or status from inactive module
      const effect = this.item.effects.get(key) || CONFIG.statusEffects.find(s => s._id === key) || { name: key, img: "" };

      const deleteButton = ds.utils.constructHTMLButton({
        classes: ["icon", "fa-solid", "fa-trash"],
        dataset: {
          action: "deleteAppliedEffectEntry",
        },
      });

      const editButton = ds.utils.constructHTMLButton({
        classes: ["icon", "fa-solid", "fa-edit"],
        dataset: {
          action: "editAppliedEffect",
        },
      });

      const legendButtons = deleteButton.outerHTML + (effect.documentName === "ActiveEffect" ? editButton.outerHTML : "");

      const effectFieldset = document.createElement("fieldset");
      effectFieldset.insertAdjacentHTML("afterbegin", `<legend>${effect.name}${legendButtons}</legend>`);
      effectFieldset.dataset["effectId"] = key;
      effectFieldset.dataset["path"] = inputConfig.name;

      const conditionGroup = this.schema.getField(`${inputConfig.name}.element.condition`)
        .toFormGroup({ localize: true }, { value: srcValue.condition, localize: true });
      const endGroup = this.schema.getField(`${inputConfig.name}.element.end`)
        .toFormGroup({ localize: true }, { value: srcValue.end });

      const propertyOptions = Object.entries(ds.CONFIG.PowerRollEffect.applied.properties).map(([value, { label }]) => ({ label, value }));

      const propertyGroup = this.schema.getField(`${inputConfig.name}.element.properties`)
        .toFormGroup({ localize: true }, { value: srcValue.properties, options: propertyOptions, localize: true });

      effectFieldset.append(conditionGroup, endGroup, propertyGroup);

      widget.insertAdjacentElement("beforeend", effectFieldset);
    }
    return widget;
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {HTMLElement} html
   */
  async onRender(html) {
    for (const addEffectSelect of html.querySelectorAll("select[data-name]")) {
      addEffectSelect.addEventListener("change", (ev) => {
        this.update({ [addEffectSelect.dataset.name]: {
          [addEffectSelect.value]: { condition: "always" },
        } });
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const potencyString = this.toPotencyText(tier);
    return this.applied[`tier${tier}`].display.replaceAll("{{potency}}", potencyString);
  }
}
