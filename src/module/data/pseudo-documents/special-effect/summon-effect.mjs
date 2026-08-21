import BaseSpecialEffect from "./base-special-effect.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";
import { requiredInteger } from "../../helpers.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DrawSteelTokenDocument } from "../../../documents/_module.mjs"
 */

const { DocumentUUIDField, SchemaField, SetField } = foundry.data.fields;
const { createSelectInput, createFormGroup } = foundry.applications.fields;

/**
 * A type of effect that summons from a fixed list of options.
 */
export default class SummonSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "summon";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      summoning: new SchemaField({
        pool: new SetField(new DocumentUUIDField({ type: "Actor", embedded: false })),
        count: requiredInteger({ initial: 1, min: 1 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get detailsPartial() {
    return systemPath("templates/sheets/pseudo-documents/special-effect/summon.hbs");
  }

  /* -------------------------------------------------- */

  /**
   * Places summons.
   * @returns {Promise<DrawSteelTokenDocument[] | null>} Returns null if the user did not have permissions.
   */
  async performSummon() {
    const summonOptions = this.summoning.pool.map(uuid => fromUuidSync(uuid)).filter(_ => _);

    if (!summonOptions.size) return void ui.notifications.error("DRAW_STEEL.Actor.Summoning.Errors.NO_OPTIONS", { localize: true });
    // Token permissions handled by placeActor
    let summonUuid;

    if (summonOptions.size === 1) summonUuid = summonOptions.first().uuid;
    else {
      const content = document.createElement("div");

      const uuidSelect = createFormGroup({
        label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.label",
        hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.hint",
        input: createSelectInput({
          name: "uuid",
          options: summonOptions.map(idx => ({ label: idx.name, value: idx.uuid })),
        }),
        localize: true,
      });

      content.append(uuidSelect);

      const fd = await DSDialog.input({
        content,
        window: {
          title: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.title",
          icon: "fa-solid fa-transporter-2",
        },
      });

      if (!fd) return null;
      summonUuid = fd.uuid;
    }

    return this.parent.performSummon(summonUuid, { count: this.summoning.count });
  }
}
