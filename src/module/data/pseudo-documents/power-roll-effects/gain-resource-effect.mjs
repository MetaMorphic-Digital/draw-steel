import BasePowerRollEffect from "./base-power-roll-effect.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 */

const { NumberField, StringField } = foundry.data.fields;

/**
 * For abilities that generate resources.
 */
export default class GainResourcePowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      resource: this.duplicateTierSchema((n) => ({
        amount: new NumberField({ initial: n, label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.resource.amount.label" }),
        type: new StringField({ initial: "surge", label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.resource.type.label" }),
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.display.label",
        }),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "resource";
  }

  /* -------------------------------------------------- */

  /** @type {Record<string, {label: string, plural: string}>} */
  static get resourceTypes() {
    return {
      surge: {
        label: "DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.Surge",
        plural: "DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.Surges",
      },
      heroic: {
        label: "DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.HeroicResource",
        plural: "DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.HeroicResources",
      },
      epic: {
        label: "DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.EpicResource",
        plural: "DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.EpicResources",
      },
    };
  }

  /* -------------------------------------------------- */

  /** The i18n plural rules to apply.
   * @type {Intl.PluralRules | null} */
  static pluralRules = null;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      const tier = this.resource[`tier${n}`];
      if (tier.display || !tier.amount || !tier.type) continue;
      this.resource[`tier${n}`].display = this.#defaultDisplayText(n);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to get the localization key for either singular or plural resources.
   * @param {1|2|3} n     The tier.
   * @returns {string}    The default value.
   */
  #getResourceKey(n) {
    this.constructor.pluralRules ||= new Intl.PluralRules(game.i18n.lang, { type: "cardinal" });

    const tierAmount = this.resource[`tier${n}`].amount;
    const resourceType = this.resource[`tier${n}`].type;
    const labelKey = this.constructor.pluralRules.select(tierAmount) === "one" ? "label" : "plural";

    return this.constructor.resourceTypes[resourceType][labelKey];
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to derive default display text used for both derived data
   * and for placeholders when rendering.
   * @param {1|2|3} n     The tier.
   * @returns {string}    The default value.
   */
  #defaultDisplayText(n) {
    return game.i18n.format("DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.DefaultDisplay", {
      amount: this.resource[`tier${n}`].amount ?? 0,
      resource: game.i18n.localize(this.#getResourceKey(n)),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context, options) {
    await super._tierRenderingContext(context, options);

    for (const n of [1, 2, 3]) {
      const path = `resource.tier${n}`;
      Object.assign(context.fields[`tier${n}`].resource, {
        display: {
          field: this.schema.getField(`${path}.display`),
          value: this.resource[`tier${n}`].display,
          src: this._source.resource[`tier${n}`].display,
          name: `${path}.display`,
          placeholder: this.#defaultDisplayText(n),
        },
        amount: {
          field: this.schema.getField(`${path}.amount`),
          value: this.resource[`tier${n}`].amount,
          src: this._source.resource[`tier${n}`].amount,
          name: `${path}.amount`,
        },
        type: {
          field: this.schema.getField(`${path}.type`),
          value: this.resource[`tier${n}`].type,
          src: this._source.resource[`tier${n}`].type,
          name: `${path}.type`,
          options: Object.entries(this.constructor.resourceTypes).map(([value, { label }]) => ({ value, label })),
        },
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    // Sanitize any HTML that may be in the base display string
    return Handlebars.escapeExpression(this.resource[`tier${tier}`].display);
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {1 | 2 | 3} tier
   */
  constructButtons(tier) {
    const { amount, type } = this.resource[`tier${tier}`];
    if (!amount || !type) return [];

    const resource = game.i18n.localize(this.#getResourceKey(tier));
    const label = game.i18n.format("DRAW_STEEL.POWER_ROLL_EFFECT.RESOURCE.ButtonText", { amount, resource });
    const button = ds.utils.constructHTMLButton({
      label,
      icon: "fa-solid fa-bolt",
      classes: ["gain-resource"],
      dataset: {
        action: "gainResource",
        uuid: this.uuid,
      },
    });

    return [button];
  }

  /* -------------------------------------------------- */

  /**
   * Give a hero some resources.
   * @param {string} tierKey
   * @param {object} [options={}]
   * @param {Iterable<DrawSteelActor>} [options.targets] Defaults to all selected hero actors.
   */
  async applyGain(tierKey, options = {}) {
    options.targets ??= ds.utils.tokensToActors().filter((a) => a.type === "hero");
    if (Array.from(options.targets ?? []).some(a => !a.isOwner)) {
      throw new Error(`${game.user.name} is not an owner of all the actors`);
    }

    const { amount, type } = this.resource[tierKey];

    let path;
    switch (type) {
      case "surge":
        path = "hero.surges";
        break;
      case "heroic":
        path = "hero.primary.value";
        break;
      case "epic":
        path = "hero.epic.value";
        break;
    }

    if (!path) return;

    for (const actor of options.targets) {
      await actor.modifyTokenAttribute(path, amount, true, false);
    }
  }
}
