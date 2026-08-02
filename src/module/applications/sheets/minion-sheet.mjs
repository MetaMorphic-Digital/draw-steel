import { AbilityModel, FeatureModel } from "../../data/item/_module.mjs";
import { systemID, systemPath } from "../../constants.mjs";
import DrawSteelNPCSheet from "./npc-sheet.mjs";

export default class DrawSteelMinionSheet extends DrawSteelNPCSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["minion"],
    actions: {
      toggleWithCaptainEffect: this.#toggleWithCaptainEffect,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/minion-sheet/header.hbs"),
    },
    body: {
      template: systemPath("templates/sheets/actor/minion-sheet/body.hbs"),
      templates: ["features/features.hbs", "stats/characteristics.hbs", "stats/combat.hbs", "stats/movement.hbs", "stats/immunities-weaknesses.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/${t}`)),
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  // static TABS = {};

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header": break;
      case "body":
        context.characteristics = this.actor.system._getCharacteristics(this.isEditMode);
        context.withCaptain = await this._getWithCaptainContext();
        context.combatTooltip = this._getCombatTooltip();
        context.movement = this.actor.system._getMovement(true);
        context.damageIW = this.actor.system._getImmunitiesWeaknesses();
        context.features = await this._prepareFeaturesContext();
        context.featureFields = FeatureModel.schema.fields;
        context.abilities = await this._prepareAbilitiesContext();
        if (context.abilities.villain?.abilities.length === 0) delete context.abilities.villain;
        context.abilityFields = AbilityModel.schema.fields;
        context.effects = await this._prepareActiveEffects();
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the context for the "With Captain" effect.
   * @returns {Promise<{description: string; exists: boolean; effectEnabled: boolean; effectId: string}>}
   */
  async _getWithCaptainContext() {
    const effect = this.actor.system.monster.withCaptainEffect;
    const isMinion = this.actor.system.monster.organization === "minion";
    return {
      description: await this.actor.system._getWithCaptainDescription(),
      effectEnabled: !effect?.disabled,
      effectId: effect?.id,
      exists: !!effect && isMinion,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the data structure for Active Effects which are currently embedded in the minion.
   */
  async _prepareActiveEffects() {
    const effects = [];
    for (const e of this.actor.effects) {
      const durationLabel = e.duration.expired ?
        _loc("DRAW_STEEL.ActiveEffect.Expired") :
        _loc(foundry.documents.ActiveEffect.EXPIRY_EVENTS[e.duration.expiry]) ?? e.duration.label;
      const effectContext = {
        durationLabel,
        id: e.id,
        uuid: e.uuid,
        name: e.name,
        img: e.img,
        sort: e.sort,
        parent: e.parent,
        sourceName: e.sourceName,
        disabled: e.disabled,
        expanded: false,
      };

      if (this._expandedDocumentDescriptions.has(e.uuid)) {
        effectContext.expanded = true;
        effectContext.enrichedDescription = await e.system.toEmbed({});
      }

      effects.push(effectContext);
    }

    return effects.sort((a, b) => a.sort - b.sort);
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Toggle the "With Captain" effect.
   * @this DrawSteelMinionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #toggleWithCaptainEffect(event, target) {
    const id = target.closest("[data-effect-id]").dataset.effectId;
    const effect = this.actor.effects.get(id);
    await effect.update({ disabled: !effect.disabled });
  }
}
