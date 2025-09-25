import DamageRoll from "../../rolls/damage.mjs";

/** @import { DrawSteelActor, DrawSteelTokenDocument } from "../../documents/_module.mjs"; */

/**
 * A base class for message subtype-specific behavior and data.
 */
export default class BaseMessageModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this ChatMessage subtype.
   */
  static get metadata() {
    return {
      type: "base",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      targets: new fields.SetField(
        new fields.DocumentUUIDField({ nullable: false }),
        { initial: () => Array.from(game.user.targets.map(t => t.document.uuid)) },
      ),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Retrieves the set of tokens targeted by this message.
   * @returns {Set<DrawSteelTokenDocument>}
   */
  get targetTokens() {
    return this.targets.map(uuid => fromUuidSync(uuid)).filter(_ => _);
  }

  /* -------------------------------------------------- */

  /**
   * Retrieves the set of actors targeted by this message.
   * The size of the set may be different from the targets if multiple copies of a linked token are on the scene.
   * @returns {Set<DrawSteelActor>}
   */
  get targetActors() {
    return ds.utils.tokensToActors(Array.from(this.targetTokens));
  }

  /* -------------------------------------------------- */

  /**
   * Perform subtype-specific alterations to the final chat message html
   * Called by the renderChatMessageHTML hook.
   * @param {HTMLLIElement} html The pending HTML.
   */
  async alterMessageHTML(html) {
    const footerButtons = await this._constructFooterButtons();
    if (footerButtons.length) {
      const footer = document.createElement("footer");
      footer.append(...footerButtons);
      html.insertAdjacentElement("beforeend", footer);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Build an array of buttons to insert into the footer of the document.
   * @returns {Promise<HTMLButtonElement[]>}
   * @protected
   */
  async _constructFooterButtons() {
    return [...this._constructDamageFooterButtons()];
  }

  /* -------------------------------------------------- */

  /**
   * Create an array of damage buttons based on each {@linkcode DamageRoll} in this message's rolls.
   * @returns {HTMLButtonElement[]}
   * @protected
   */
  _constructDamageFooterButtons() {
    /** @type {HTMLButtonElement[]} */
    const buttons = [];
    for (let i = 0; i < this.parent.rolls.length; i++) {
      const roll = this.parent.rolls[i];
      if (roll instanceof DamageRoll) buttons.push(roll.toRollButton(i));
    }

    return buttons;
  }

  /* -------------------------------------------------- */

  /**
   * Add event listeners. Guaranteed to run after all alterations in {@linkcode alterMessageHTML}
   * Called by the renderChatMessageHTML hook.
   * @param {HTMLLIElement} html The pending HTML.
   */
  addListeners(html) {
    const damageButtons = html.querySelectorAll(".apply-damage");
    for (const damageButton of damageButtons) damageButton.addEventListener("click", (event) => DamageRoll.applyDamageCallback(event));
  }

  /* -------------------------------------------------- */

  /**
   * From a DamageRoll, allow modificiation of the damage type and formula, and application of any surges.
   * Create a new chat message with the new DamageRoll.
   * @param {DamageRoll} roll The damage roll to use as a base for modification.
   */
  async _modifyDamage(roll) {
    const fd = await this.#damageModificationDialog(roll);
    if (!fd) return;

    let rollData = {};
    if (this.parent.type === "abilityUse") {
      const ability = await fromUuid(this.uuid);
      rollData = ability.getRollData();
    }

    fd.damageSurges = Number(fd.damageSurges);
    if (fd.damageSurges && rollData.characteristics) {
      const highestCharacteristic = Math.max(0, ...Object.values(rollData.characteristics).map(c => c.value));
      fd.formula = `${fd.formula} + (${fd.damageSurges}*${highestCharacteristic})`;
    }
    // TODO: Automatically update actor surges?

    if ((fd.formula === String(roll.total)) && (fd.damageType === roll.type)) return void ui.notifications.warn("DRAW_STEEL.ROLL.Damage.ModificationDialog.NoModification", { localize: true });

    const newRoll = await new DamageRoll(fd.formula, rollData, { type: fd.damageType, ignoredImmunities: roll.ignoredImmunities });
    newRoll.toMessage();
  }

  /* -------------------------------------------------- */

  /**
   * Prompt a dialog for modifying the damage roll.
   * @param {DamageRoll} roll The initital roll to modify
   * @returns {object}
   */
  async #damageModificationDialog(roll) {
    const content = document.createElement("div");

    const formulaInput = foundry.applications.fields.createTextInput({ name: "formula", value: roll.total });
    const formulaGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.ROLL.Damage.ModificationDialog.DamageFormula.Label",
      input: formulaInput,
      localize: true,
    });
    content.append(formulaGroup);

    if (!roll.isHeal) {
      const damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label }));
      const damageSelection = foundry.applications.fields.createSelectInput({
        name: "damageType",
        blank: "",
        options: damageTypes,
        value: roll.type,
      });
      const damageSelectionGroup = foundry.applications.fields.createFormGroup({
        label: "DRAW_STEEL.ROLL.Damage.ModificationDialog.DamageType.Label",
        input: damageSelection,
        localize: true,
      });
      content.append(damageSelectionGroup);
    }

    // TODO: Limit selection to number of surges the actor has?
    // Only show surges when origin actor is a hero.
    const surgeOptions = [0, 1, 2, 3].map(option => ({ value: option, label: option }));
    const damageSurgeSelection = foundry.applications.fields.createSelectInput({
      name: "damageSurges",
      options: surgeOptions,
      value: 0,
    });
    const damageSurgeGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.ROLL.Damage.ModificationDialog.DamageSurges.Label",
      input: damageSurgeSelection,
      localize: true,
    });
    content.append(damageSurgeGroup);

    return ds.applications.api.DSDialog.input({
      window: {
        title: roll.isHeal ? "DRAW_STEEL.ROLL.Damage.ModificationDialog.Title.Heal" : "DRAW_STEEL.ROLL.Damage.ModificationDialog.Title.Damage",
        icon: "fa-solid fa-burst",
      },
      content,
      ok: {
        label: "DRAW_STEEL.ROLL.Damage.ModificationDialog.Apply",
      },
    });
  }
}
