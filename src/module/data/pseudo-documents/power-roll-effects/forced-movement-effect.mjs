import FormulaField from "../../fields/formula-field.mjs";
import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

/** @import { ForcedMovementSchema } from "./_types" */

const { SetField, StringField } = foundry.data.fields;

/**
 * For abilities that inflict forced movement.
 */
export default class ForcedMovementPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      forced: this.duplicateTierSchema(() => ({
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.display.hintForced",
          initial: "{{forced}}",
        }),
        movement: new SetField(
          setOptions(),
          { initial: ["push"], label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.movement.label" },
        ),
        distance: new FormulaField({ deterministic: true, initial: "1", label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.distance.label" }),
        properties: new SetField(setOptions(), { label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.properties.label" }),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "forced";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      /** @type {ForcedMovementSchema} */
      const tierValue = this.forced[`tier${n}`];
      tierValue.potency.value ||= this.schema.getField(["forced", `tier${n}`, "potency", "value"]).getInitialValue({});
      if (n > 1) {
        /** @type {ForcedMovementSchema} */
        const prevTier = this.forced[`tier${n - 1}`];
        if (prevTier.display) tierValue.display ||= prevTier.display;
        if (prevTier.potency.characteristic) tierValue.potency.characteristic ||= prevTier.potency.characteristic;
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context, options) {
    await super._tierRenderingContext(context, options);

    for (const n of [1, 2, 3]) {
      const path = `forced.tier${n}`;
      Object.assign(context.fields[`tier${n}`].forced, {
        display: {
          field: this.schema.getField(`${path}.display`),
          value: this.forced[`tier${n}`].display,
          src: this._source.forced[`tier${n}`].display,
          placeholder: n > 1 ? this.forced[`tier${n - 1}`].display : "",
          name: `${path}.display`,
        },
        movement: {
          field: this.schema.getField(`${path}.movement`),
          value: this.forced[`tier${n}`].movement,
          src: this._source.forced[`tier${n}`].movement,
          name: `${path}.movement`,
        },
        distance: {
          field: this.schema.getField(`${path}.distance`),
          value: this.forced[`tier${n}`].distance,
          src: this._source.forced[`tier${n}`].distance,
          name: `${path}.distance`,
        },
        properties: {
          field: this.schema.getField(`${path}.properties`),
          value: this.forced[`tier${n}`].properties,
          src: this._source.forced[`tier${n}`].properties,
          name: `${path}.properties`,
        },
      });

      context.fields.movement = Object.entries(ds.CONFIG.abilities.forcedMovement).map(([value, { label }]) => ({ value, label }));
      context.fields.properties = Object.entries(ds.CONFIG.PowerRollEffect.forced.properties).map(([value, { label }]) => ({ value, label }));
    }
  }

  /* -------------------------------------------------- */

  /**
   * Collects the bonuses for forced movement effects.
   * Searches the actor's ability bonuses for keys "forced.[movementType]".
   * 
   * @returns {Object} An object mapping movement types to their bonus values.
   */
  #collectForcedMovementBonuses() {
    let bonuses = {};
    const abilityBonuses = this.actor?.system._abilityBonuses || {};

    const prefix = "forced.";
    for (const bonus of abilityBonuses) {
      if (!bonus.key.startsWith(prefix)) continue;
      if (!bonus.filters.keywords.isSubsetOf(this.parent?.keywords)) continue;

      const key = bonus.key.substring(prefix.length);
      // Bonus change objects are stored as strings, convert to Number
      bonuses[key] = Number(bonus.value);
    }

    return bonuses;
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const bonuses = this.#collectForcedMovementBonuses();

    const tierValue = this.forced[`tier${tier}`];
    const isVertical = tierValue.properties.has("vertical");
    const baseDistance = this.actor
      ? ds.utils.evaluateFormula(tierValue.distance, this.item.getRollData(), { contextName: this.uuid })
      : tierValue.distance;

    // Group movement types by their final distance value (base + bonus)
    const distanceGroups = [...tierValue.movement].reduce((groups, movementType) => {
      const bonus = bonuses[movementType] || 0;
      const finalDistance = Number(baseDistance) + bonus;

      if (!groups.has(finalDistance)) {
        groups.set(finalDistance, []);
      }
      groups.get(finalDistance).push(movementType);

      return groups;
    }, new Map());

    // Format the output
    const formatter = game.i18n.getListFormatter({ type: "disjunction" });
    let distanceString;
    
    if (distanceGroups.size === 1) {
      // All movement types have the same distance, so group them together
      const [distance, types] = [...distanceGroups.entries()][0];
      const movementLabels = types.map(v => {
        const config = ds.CONFIG.abilities.forcedMovement[v];
        return isVertical ? config.vertical : config.label;
      });
      distanceString = game.i18n.format("DRAW_STEEL.Item.ability.ForcedMovement.Display", {
        movement: formatter.format(movementLabels),
        distance: distance,
      });
    } else {
      // Different distances for different types, list each separately
      const formattedParts = [];
      for (const [distance, types] of distanceGroups) {
        for (const movementType of types) {
          const config = ds.CONFIG.abilities.forcedMovement[movementType];
          const label = isVertical ? config.vertical : config.label;
          formattedParts.push(game.i18n.format("DRAW_STEEL.Item.ability.ForcedMovement.Display", {
            movement: label,
            distance: distance,
          }));
        }
      }
      distanceString = formatter.format(formattedParts);
    }
    
    const potencyString = this.toPotencyHTML(tier);
    const escapedDisplay = Handlebars.escapeExpression(tierValue.display);
    const finalText = escapedDisplay.replaceAll("{{potency}}", potencyString);
    return finalText.replaceAll("{{forced}}", distanceString);
  }
}
