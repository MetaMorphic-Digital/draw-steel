import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

const { StringField } = foundry.data.fields;

export default class ActorAvatarInput extends DocumentInput {
  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/actor-avatar-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.Actor.base.AvatarInput.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const flags = this.document.getFlag(ds.CONST.systemID, "avatarProperties") ?? {};
    Object.assign(context, {
      objectFit: {
        field: new StringField({ label: game.i18n.localize("DRAW_STEEL.Actor.base.AvatarInput.objectFit.label") }),
        value: flags.objectFit,
        name: "flags.draw-steel.avatarProperties.objectFit",
        options: [
          { value: "", label: game.i18n.localize("DRAW_STEEL.Actor.base.AvatarInput.objectFit.optionDefault") },
          { value: "contain" },
          { value: "cover" },
          { value: "fill" },
          { value: "scale-down" },
        ],
      },
      objectPosition: {
        field: new StringField({ label: game.i18n.localize("DRAW_STEEL.Actor.base.AvatarInput.objectPosition.label") }),
        value: flags.objectPosition,
        name: "flags.draw-steel.avatarProperties.objectPosition",
      },
    });

    return context;
  }
}
