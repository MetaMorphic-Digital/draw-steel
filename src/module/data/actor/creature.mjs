import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import PowerRoll from "../../rolls/power.mjs";
import BaseActorModel from "./base-actor.mjs";

const fields = foundry.data.fields;

/**
 * Living and unliving beings, including constructs and undead.
 */
export default class CreatureModel extends BaseActorModel {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.creature");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    const characteristic = { initial: 0, integer: true, nullable: false };

    schema.characteristics = new fields.SchemaField(
      Object.entries(ds.CONFIG.characteristics).reduce((obj, [chc, { label, hint }]) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField({ ...characteristic, label, hint }),
        });
        return obj;
      }, {}),
    );

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.potency = {
      bonuses: 0,
      weak: 0,
      average: 0,
      strong: 0,
    };

    Object.values(this.characteristics).forEach((chr) => {
      Object.assign(chr, {
        edges: 0,
        banes: 0,
      });
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const highestCharacteristic = Math.max(0, ...Object.values(this.characteristics).map(c => c.value));

    this.potency.weak += highestCharacteristic - 2 + this.potency.bonuses;
    this.potency.average += highestCharacteristic - 1 + this.potency.bonuses;
    this.potency.strong += highestCharacteristic + this.potency.bonuses;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    for (const [key, obj] of Object.entries(this.characteristics)) {
      const rollKey = ds.CONFIG.characteristics[key].rollKey;
      rollData[rollKey] = obj.value;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Perform a power roll using a characteristic.
   * @param {string} characteristic   The characteristic to roll.
   * @param {object} [options]        Options to modify the characteristic roll.
   * @param {Array<"test" | "ability">} [options.types] Valid roll types for the characteristic.
   * @param {number} [options.edges]                    Base edges for the roll.
   * @param {number} [options.banes]                    Base banes for the roll.
   * @param {number} [options.bonuses]                  Base bonuses for the roll.
   * @param {"easy" | "medium" | "hard"} [options.difficulty] Test difficulty.
   * @param {string} [options.resultSource]             A UUID pointing to an ability or power roll result page.
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async rollCharacteristic(characteristic, options = {}) {
    const types = options.types ?? ["test"];

    let type = types[0];

    if (types.length > 1) {
      const buttons = types.reduce((b, action) => {
        const { label, icon } = PowerRoll.TYPES[action];
        b.push({ label, icon, action });
        return b;
      }, []);
      type = await ds.applications.api.DSDialog.wait({
        window: { title: game.i18n.localize("DRAW_STEEL.ROLL.Power.ChooseType.Title") },
        content: game.i18n.localize("DRAW_STEEL.ROLL.Power.ChooseType.Content"),
        buttons,
        rejectClose: true,
      });
    }

    options.edges = (options.edges ?? 0) + this.characteristics[characteristic].edges;
    options.banes = (options.banes ?? 0) + this.characteristics[characteristic].banes;

    const skills = this.hero?.skills ?? null;
    const skillModifiers = this.hero?.skillModifiers ?? null;

    const formula = `2d10 + @${ds.CONFIG.characteristics[characteristic].rollKey}`;
    const data = this.parent.getRollData();
    const modifiers = {
      edges: options.edges,
      banes: options.banes,
      bonuses: options.bonuses,
    };

    const doc = await fromUuid(options.resultSource);

    // evaluation was previously set to "evaluate", provided to the prompt and never used again. 
    // Instead evaluation is now set to either the provided value or "message" if no value was
    // provided. The prompt receives a hard-coded "evaluate" as before. When evaluation is set
    // to "message", then the roll will be returned as a message, otherwise just as a roll.
    const evaluation = options.evaluation ?? "message";
    const promptValue = await PowerRoll.prompt({
      type,
      evaluation: "evaluate",
      formula,
      data,
      modifiers,
      actor: this.parent,
      characteristic,
      skills,
      skillModifiers,
      flavor: doc?.name,
    });

    if (!promptValue) return null;
    const { rollMode, rolls, baseRoll } = promptValue;

    if (evaluation == "message")
    {
      const testConfig = ds.CONST.testOutcomes[options.difficulty];

      const flavor = game.i18n.format("DRAW_STEEL.ROLL.Power.TestDifficulty.label", {
        difficulty: game.i18n.localize(testConfig?.label) ?? "",
        characteristic: ds.CONFIG.characteristics[characteristic].label,
      });

      const messageData = {
        type: "standard",
        speaker: DrawSteelChatMessage.getSpeaker({ actor: this.parent }),
        title: flavor,
        rolls: [baseRoll],
        system: {
          parts: [],
        },
        sound: CONFIG.sounds.dice,
        flags: { core: { canPopout: true } },
      };

      const testPart = { type: "test", flavor, rolls };

      if (doc) testPart.resultSource = options.resultSource;

      messageData.system.parts.push(testPart);

      DrawSteelChatMessage.applyRollMode(messageData, rollMode);
      return DrawSteelChatMessage.create(messageData);
    }

    return rolls;
  }

}
