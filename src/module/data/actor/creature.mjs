import BaseActorModel from "./base-actor.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import PowerRoll from "../../rolls/power.mjs";
import PowerRollDialog from "../../applications/apps/power-roll-dialog.mjs";
import { setOptions } from "../helpers.mjs";

/**
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import { DatabaseCreateOperation } from "@common/abstract/_types.mjs";
 * @import { PowerRollModifiers } from "../../_types";
 */

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
  static _actorBiography() {
    const bio = super._actorBiography();

    bio.languages = new fields.SetField(setOptions());

    return bio;
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
        dice: {
          mode: "kh",
          number: 2,
          faces: 10,
        },
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
   * @param {object} [config]        Options to modify the characteristic roll.
   * @param {number} [config.edges]                     Base edges for the roll.
   * @param {number} [config.banes]                     Base banes for the roll.
   * @param {number} [config.bonuses]                   Base bonuses for the roll.
   * @param {"easy" | "medium" | "hard"} [config.difficulty] Test difficulty.
   * @param {string} [config.resultSource]              A UUID pointing to an ability or power roll result page.
   * @param {ApplicationConfiguration} [dialogOptions]  Options to be forwarded to the roll dialog.
   * @param {DatabaseCreateOperation} messageOptions    Options to be forwarded to the final created chat message.
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async rollCharacteristic(characteristic, config = {}, dialogOptions = {}, messageOptions = {}) {
    const chr = this.characteristics[characteristic];

    const testConfig = ds.CONST.testOutcomes[config.difficulty];
    const baseFormula = chr.dice.number > 2 ? `${chr.dice.number}d10${chr.dice.mode}2` : "2d10";
    const formula = `${baseFormula} + @${ds.CONFIG.characteristics[characteristic].rollKey}`;
    const rollData = this.parent.getRollData();
    const modifiers = {
      edges: (config.edges ?? 0) + chr.edges,
      banes: (config.banes ?? 0) + chr.banes,
      bonuses: config.bonuses,
    };

    const flavor = _loc("DRAW_STEEL.ROLL.Power.TestDifficulty.label", {
      difficulty: _loc(testConfig?.label) ?? "",
      characteristic: ds.CONFIG.characteristics[characteristic].label,
    }).trim();

    this.#applyStatusModifiers(modifiers, { characteristic });

    const dialogConfig = foundry.utils.mergeObject({
      context: {
        modifiers,
        formula: PowerRoll.replaceFormulaData(formula, rollData, { missing: "0" }),
        skills: this.skills?.value ?? null,
        skillModifiers: this.skills?.modifiers ?? null,
      },
      window: {
        title: flavor,
      },
    }, dialogOptions);

    const fd = await PowerRollDialog.create(dialogConfig);

    if (!fd) return;

    const [rollOptions] = fd.rolls;

    rollOptions.skill = fd.skill;

    rollOptions.flavor = fd.skill ? `${flavor} — ${ds.CONFIG.skills.list[fd.skill]?.label ?? fd.skill}` : flavor;

    const roll = new PowerRoll(formula, rollData, rollOptions);
    await roll.evaluate();

    const testPartId = "test".padEnd(16, "0");

    const messageData = foundry.utils.mergeObject({
      type: "standard",
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.parent }),
      title: flavor,
      rolls: [roll],
      system: {
        parts: {
          [testPartId]: {
            flavor,
            _id: testPartId,
            type: "test",
            rolls: [roll],
            resultSource: config.resultSource,
          },
        },
      },
      sound: CONFIG.sounds.dice,
      flags: { core: { canPopout: true } },
    }, messageOptions.data ?? {});

    delete messageOptions.data;

    DrawSteelChatMessage.applyMode(messageData, fd.messageMode);
    return DrawSteelChatMessage.create(messageData, messageOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Adjust the modifiers object for a test based on the actor's statuses.
   * @param {PowerRollModifiers} modifiers
   * @param {object} [options={}]
   * @param {string} [options.characteristic]
   */
  #applyStatusModifiers(modifiers, options = {}) {
    if (this.parent.statuses.has("weakened")) modifiers.banes += 1;

    // Restrained condition - might and agility tests take a bane
    if (this.parent.statuses.has("restrained") && ["might", "agility"].includes(options.characteristic)) modifiers.banes += 1;
  }
}
