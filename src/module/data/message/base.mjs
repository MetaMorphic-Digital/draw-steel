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
   * Take a given damage roll and apply the given modifications.
   * @param {DamageRoll} roll The damage roll to modify.
   * @param {object} modifications The modification options to apply.
   * @param {string} [modifications.additionalFormula] Additional formula components to append to the roll.
   * @param {number} [modifications.surges] How many surges to apply to the roll.
   * @param {string} [modifications.damageType] The damage type to use for the modified roll.
   * @returns {DamageRoll}
   */
  async modifyDamageRoll(roll, { additionalFormula = "", surges = 0, damageType }) {
    let rollData = this.parent.speakerActor?.getRollData() ?? {};

    // If this is an abilityUse message, the ability roll data should be retrieved.
    if (this.parent.type === "abilityUse") {
      const ability = await fromUuid(this.uuid);
      rollData = ability.getRollData();
    }

    let formula = roll.formula;
    if (additionalFormula) formula = `${formula} + ${additionalFormula}`;

    // Surges are based on highest characteristic, so we can't apply surge damage when there's no characteristics.
    if (surges && rollData.characteristics) {
      const highestCharacteristic = Math.max(0, ...Object.values(rollData.characteristics).map(c => c.value));
      formula = `${formula} + (${surges}*${highestCharacteristic})`;
    }

    const type = damageType ?? roll.type;

    const newRoll = new DamageRoll(formula, rollData, { type, ignoredImmunities: roll.ignoredImmunities });
    await newRoll.evaluate();

    return newRoll;
  }

  /**
   * Consume a resource on the speaker actor.
   * Currently, only surges are accounted for.
   * @param {string} resourceName What resource to consume.
   * @param {number} value The new resource value.
   * @returns {DrawSteelActor | false}
   */
  async consumeResource(resourceName, value) {
    if (!this.parent.speakerActor) return false;

    if (resourceName === "surges") return this.parent.speakerActor.update({ "system.hero.surges": value });

    return false;
  }
}
