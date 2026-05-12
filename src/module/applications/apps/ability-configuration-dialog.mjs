import PowerRoll from "../../rolls/power.mjs";
import PowerRollDialog from "./power-roll-dialog.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * @import AbilityModel from "../../data/item/ability.mjs";
 * @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 * @import DrawSteelToken  from "../../canvas/placeables/token.mjs"
 */

/**
 * A dialog for managing ability usage. Not all abilities make power rolls, and not all abilities need other configuration.
 */
export default class AbilityConfigurationDialog extends PowerRollDialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ability-configuration-dialog"],
    actions: {
      panToken: this.#panToken,
      placeTemplate: this.#placeTemplate,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    roll: {
      template: systemPath("templates/apps/ability-configuration-dialog/roll.hbs"),
    },
    ability: {
      template: systemPath("templates/apps/ability-configuration-dialog/ability.hbs"),
    },
    footer: super.PARTS.footer,
  };

  /* -------------------------------------------------- */

  /**
   * The currently highlighted token.
   * @type {DrawSteelToken | null}
   */
  #highlightedToken = null;

  /* -------------------------------------------------- */

  /**
   * Hook reference for adding or removing tokens from the context.
   * @type {number}
   */
  #targetHook = Hooks.on("targetToken", (user, token, targeted) => {
    if ((user !== game.user) || !this.options.context.targets) return;

    if (targeted) {
      for (const targetData of foundry.utils.iterateValues(this.options.context.targets)) {
        if (targetData.uuid === token.actor.uuid) return;
      }

      this.options.context.targets[token.id] = {
        actor: token.actor,
        token: token.document,
        tokenUuid: token.document.uuid,
        uuid: token.actor.uuid,
        modifiers: this.item.system.getTargetModifiers(token),
      };
    }
    else delete this.options.context.targets[token.id];

    // Re-render to update the target list and modifiers.
    this.render();
  });

  /* -------------------------------------------------- */

  /**
   * The ability item.
   * @type {Omit<DrawSteelItem, "system"> & { system: AbilityModel }}
   */
  get item() {
    return this.options.ability;
  }

  /* -------------------------------------------------- */

  /**
   * The actor using the ability (required; parentless abilities cannot be used).
   * @type {DrawSteelActor}
   */
  get actor() {
    return this.item.parent;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    const initializedOptions = super._initializeApplicationOptions(options);

    // Two column layout if there's rolls
    if (initializedOptions.ability.system.power.roll.enabled) {
      initializedOptions.position.width = 700;
      initializedOptions.classes.push("two-column");
    }

    return initializedOptions;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    return Object.assign(await super._prepareContext(options), {
      rootId: this.id,
      ability: this.item,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "roll":
        context.targets ??= {};
        this._prepareTargets(context);
        break;
      case "ability":
        this._prepareAbilityContext(context);
        break;
      case "footer":
        if (!this.item.system.power.roll.enabled) context.buttonLabel = _loc("DRAW_STEEL.Item.ability.ConfigureUse.UseButton");
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare targets by adding the actor and combinging modifiers.
   * @param {object} context The context from _prepareContext.
   */
  _prepareTargets(context) {
    for (const target of Object.values(context.targets)) {
      target.actor ??= fromUuidSync(target.uuid);
      target.token ??= fromUuidSync(target.tokenUuid);

      target.combinedModifiers = {
        edges: Math.clamp(target.modifiers.edges + context.modifiers.edges, 0, PowerRoll.MAX_EDGE),
        banes: Math.clamp(target.modifiers.banes + context.modifiers.banes, 0, PowerRoll.MAX_BANE),
        bonuses: target.modifiers.bonuses + context.modifiers.bonuses,
      };
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the ability context.
   * @param {object} context
   */
  _prepareAbilityContext(context) {
    // Find the first instance of multiple damage types and create the options to provide a select
    context.damageOptions = null;
    for (const tier of PowerRoll.TIER_NAMES) {

      const effect = this.item.system.power.effects.documentsByType.damage.find(e => e.damage[tier].types.size > 1);
      if (!effect) continue;

      context.damageOptions = Object.entries(ds.CONFIG.damageTypes)
        .filter(([type]) => effect.damage[tier].types.has(type))
        .map(([type, { label }]) => ({ value: type, label }));
      break;
    }

    context.resource.show = this.item.system.resource;

    // Heroic resource/malice spend
    if (this.item.system.spend.value || this.item.system.spend.text) {
      context.resource.show = true;
      const coreResource = this.actor.system.coreResource;

      const max = foundry.utils.getProperty(coreResource.target, coreResource.path) - coreResource.minimum;
      if (max) context.spendConfig = {
        max,
        slider: !this.item.system.spend.value,
        value: this.item.system.spend.value || "",
        name: coreResource.name,
      };
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Add event listeners to trigger target token hovering.
    this.element.addEventListener("pointermove", event => {
      if (!canvas.ready) return;

      const tokenUuid = event.target.closest(".target.group[data-token-uuid]")?.dataset.tokenUuid;
      const token = fromUuidSync(tokenUuid)?.object;
      if (token && token._canHover(game.user, event) && token.visible) {
        token._onHoverIn(event, { hoverOutOthers: true });
        this.#highlightedToken = token;
      } else {
        this.#highlightedToken?._onHoverOut(event);
        this.#highlightedToken = null;
      }
    });

  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _refreshInputs(formData) {
    super._refreshInputs(formData);

    if (this.options.context.targets) {
      this.options.context.targets = foundry.utils.mergeObject(this.options.context.targets, formData.targets, {
        overwrite: true, recursive: true,
      });
    }

    if ("resource" in formData) this.options.context.resource.value = formData.resource;
    if ("spend" in formData) this.options.context.spend = formData.spend;
    if (formData["damage-selection"]) this.options.context.damage = formData["damage-selection"];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    const config = super._processFormData(event, form, formData);

    const fd = foundry.utils.expandObject(formData.object);

    const targets = Object.values(this.options.context.targets ?? {});
    if (targets?.length) config.rolls = targets.map(target => ({ ...target.combinedModifiers, target: target.uuid }));

    if (fd["damage-selection"]) config.damage = fd["damage-selection"];
    if ("resource" in fd) config.resource = fd.resource;
    if ("spend" in fd) config.spend = fd.spend;

    Hooks.off("targetToken", this.#targetHook);

    return config;
  }

  /* -------------------------------------------------- */

  /**
   * Pan to a token on the canvas.
   * @this AbilityConfigurationDialog
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #panToken(event, target) {
    const { tokenUuid } = target.closest("[data-token-uuid]").dataset;
    const token = fromUuidSync(tokenUuid);
    await canvas.animatePan({ x: token.x, y: token.y });
  }

  /* -------------------------------------------------- */

  /**
   * Place a template on the canvas and select all tokens inside.
   * @this AbilityConfigurationDialog
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #placeTemplate(event, target) {
    this.item.system.placeTemplate({ setTargets: "acquire" });
  }
}
