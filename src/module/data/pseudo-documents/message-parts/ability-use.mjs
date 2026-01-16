import { systemPath } from "../../../constants.mjs";
import BaseMessagePart from "./base-message-part.mjs";

const { DocumentUUIDField } = foundry.data.fields;

/**
 * A part that displays the main text of the ability.
 */
export default class AbilityUsePart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "abilityUse";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/ability-use.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      abilityUuid: new DocumentUUIDField({ nullable: false, type: "Item" }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the ability from the UUID. Can return null if the effect no longer exists.
   * @type {Omit<DrawSteelItem, "system"> & { system: AbilityData } | null}
   */
  get ability() {
    return fromUuidSync(this.abilityUuid);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    const item = this.ability;

    if (item) {
      const embedConfig = {
        tier1: false,
        tier2: false,
        tier3: false,
      };
      context.ctx.embed = await item.toEmbed(embedConfig);
    }
    else {
      context.ctx.embed = document.createElement("p");
      context.ctx.embed.innerText = game.i18n.localize("DRAW_STEEL.Item.ability.EmbedFail");
    }
  }
}
