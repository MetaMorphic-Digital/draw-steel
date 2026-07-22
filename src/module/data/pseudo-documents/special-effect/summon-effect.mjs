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
    if (!this.pool.size) return void ui.notifications.error("");
    // Token permissions handled by placeActor
    let summonUuid;

    if (this.pool.size === 1) summonUuid = this.pool.first();
    else {
      const actorOptions = this.pool.reduce((options, uuid) => {
        const idx = fromUuidSync(uuid);
        if (idx) options.push({
          label: idx.name,
          value: uuid,
        });
        return options;
      }, []);

      const content = document.createElement("div");

      const uuidSelect = createFormGroup({
        label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.label",
        hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.hint",
        input: createSelectInput({
          name: "uuid",
          options: actorOptions,
        }),
        localize: true,
      });

      content.append(uuidSelect);

      const fd = DSDialog.input({
        content,
        window: {
          title: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.title",
          icon: "fa-solid fa-transporter-2",
        },
      });

      if (!fd) return null;
      summonUuid = fd.uuid;
    }

    return this.parent.performSummon(summonUuid);
  }
}
