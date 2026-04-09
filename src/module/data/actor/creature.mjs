import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseActorModel from "./base-actor.mjs";
import CharacteristicsField from "../fields/characteristics-field.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import PowerRoll from "../../rolls/power.mjs";

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

    schema.biography.extendFields({
      languages: new fields.SetField(setOptions()),
    });

    schema.characteristics = new CharacteristicsField();

    schema.potency = new fields.SchemaField({
      bonuses: requiredInteger({ min: null }),
      weak: requiredInteger({ min: null }),
      average: requiredInteger({ min: null }),
      strong: requiredInteger({ min: null }),
    }, { persisted: false });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const highestCharacteristic = Math.max(0, ...Object.values(this.characteristics).map(c => c.value));

    this.potency.weak += highestCharacteristic - 2 + this.potency.bonuses;
    this.potency.average += highestCharacteristic - 1 + this.potency.bonuses;
    this.potency.strong += highestCharacteristic + this.potency.bonuses;

    // Creature token sizes can be strongly determined from actor size
    this.parent.tokenActiveEffectChanges.initial.push(
      ...["width", "height", "depth"].map(key => ({
        key, phase: "initial", priority: 5, type: "override", value: this.combat.size.value,
      })),
    );
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  modifyRollData(rollData) {
    super.modifyRollData(rollData);

    rollData.chr = -5;
    for (const [key, obj] of Object.entries(this.characteristics)) {
      const rollKey = ds.CONFIG.characteristics[key].rollKey;
      rollData[rollKey] = obj.value;

      if (obj.value > rollData.chr) rollData.chr = obj.value;
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
        window: { title: _loc("DRAW_STEEL.ROLL.Power.ChooseType.Title") },
        content: _loc("DRAW_STEEL.ROLL.Power.ChooseType.Content"),
        buttons,
        rejectClose: true,
      });
    }

    const chr = this.characteristics[characteristic];

    options.edges = (options.edges ?? 0) + chr.edges;
    options.banes = (options.banes ?? 0) + chr.banes;

    const skills = this.skills?.value ?? null;
    const skillModifiers = this.skills?.modifiers ?? null;

    const evaluation = "evaluate";
    const baseFormula = chr.dice.number > 2 ? `${chr.dice.number}d10${chr.dice.mode}2` : "2d10";
    const formula = `${baseFormula} + @${ds.CONFIG.characteristics[characteristic].rollKey}`;
    const data = this.parent.getRollData();
    const modifiers = {
      edges: options.edges,
      banes: options.banes,
      bonuses: options.bonuses,
    };

    const doc = await fromUuid(options.resultSource);

    const promptValue = await PowerRoll.prompt({
      type,
      evaluation,
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
    const { messageMode, rolls, baseRoll } = promptValue;

    const testConfig = ds.CONST.testOutcomes[options.difficulty];

    const flavor = _loc("DRAW_STEEL.ROLL.Power.TestDifficulty.label", {
      difficulty: _loc(testConfig?.label) ?? "",
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

    DrawSteelChatMessage.applyMode(messageData, messageMode);
    return DrawSteelChatMessage.create(messageData);
  }

}
