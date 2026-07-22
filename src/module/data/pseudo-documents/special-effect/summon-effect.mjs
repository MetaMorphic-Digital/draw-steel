import BaseSpecialEffect from "./base-special-effect.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";
import { requiredInteger } from "../../helpers.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DrawSteelActor, DrawSteelTokenDocument} from "../../../documents/_module.mjs"
 */

const { DocumentUUIDField, SetField } = foundry.data.fields;

/**
 * A type of effect that performs a summon.
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
      pool: new SetField(new DocumentUUIDField({ type: "Actor", embedded: false })),
      count: new requiredInteger({ initial: 1, min: 1 }),
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

    if (this.pool.size > 1) {
      const actorOptions = this.pool.reduce((options, uuid) => {
        const idx = fromUuidSync(uuid);
        if (idx) options.push({
          label: idx.name,
          value: uuid,
        });
        return options;
      }, []);

      const fd = DSDialog.input({});

      if (!fd) return null;
      summonUuid = fd.uuid;
    }
    else summonUuid = this.pool.first();

    return this.parent.performSummon(summonUuid);
  }
}
