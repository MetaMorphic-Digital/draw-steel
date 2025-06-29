import { systemPath } from "../../../constants.mjs";
import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

/**
 * @import BasePowerRollEffect from "../../../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";
 */

/**
 * A sheet representing power roll effects.
 * @extends PseudoDocumentSheet<BasePowerRollEffect>
 */
export default class PowerRollEffectSheet extends PseudoDocumentSheet {
  static DEFAULT_OPTIONS = {
    actions: {
      deleteAppliedEffectEntry: this.#deleteAppliedEffectEntry,
      editAppliedEffect: this.#editAppliedEffect,
    },
  };

  /** @inheritdoc */
  static TABS = {
    ...super.TABS,
    tiers: {
      tabs: [{ id: "tier1" }, { id: "tier2" }, { id: "tier3" } ],
      initial: "tier1",
      labelPrefix: "DRAW_STEEL.PSEUDO.SHEET.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    identity: {
      template: systemPath("templates/sheets/pseudo-documents/power-roll-effect-sheet/identity.hbs"),
      classes: ["tab"],
    },
    details: {
      template: systemPath("templates/sheets/pseudo-documents/power-roll-effect-sheet/details.hbs"),
      templates: [
        "templates/generic/tab-navigation.hbs",
        systemPath("templates/sheets/pseudo-documents/power-roll-effect-sheet/details-tiers.hbs"),
      ],
      classes: ["tab"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {
      tabs: this._prepareTabs("primary"),
      tabTiers: this._prepareTabs("tiers"),
      pseudo: this.pseudoDocument,
      document: this.document,
      fields: {
        name: {
          field: this.pseudoDocument.schema.getField("name"),
          src: this.pseudoDocument._source.name,
          name: "name",
          placeholder: this.pseudoDocument.typeLabel,
        },
        tier1: {},
        tier2: {},
        tier3: {},
      },
    };

    await context.pseudo._tierRenderingContext?.(context);

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.pseudoDocument.onRender(this.element);
  }

  /* -------------------------------------------------- */

  /**
   * Delete an entry in `applied.effects`
   * @this PowerRollEffectSheet
   * @param {PointerEvent} event
   * @param {HTMLButtonElement} target
   */
  static async #deleteAppliedEffectEntry(event, target) {
    const fieldset = target.closest("fieldset");
    const path = fieldset.dataset.path;
    const effectId = fieldset.dataset.effectId;
    this.pseudoDocument.update({ [`${path}.-=${effectId}`]: null });
  }

  /* -------------------------------------------------- */

  /**
   * Open the ActiveEffectConfig for an entry in `applied.effects`
   * @this PowerRollEffectSheet
   * @param {PointerEvent} event
   * @param {HTMLButtonElement} target
   */
  static async #editAppliedEffect(event, target) {
    const fieldset = target.closest("fieldset");
    const effectId = fieldset.dataset.effectId;
    this.pseudoDocument.item.effects.get(effectId).sheet.render(true);
  }
}
