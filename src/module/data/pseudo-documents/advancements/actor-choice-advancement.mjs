import ActorChoiceConfigurationDialog from "../../../applications/apps/advancement/actor-choice-configuration-dialog.mjs";
import AdvancementLeaf from "../../../utils/advancement/leaf.mjs";
import BaseAdvancement from "./base-advancement.mjs";

/**
 * @import { ActorChoice } from "./_types";
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 */

const { StringField } = foundry.data.fields;

/**
 * An advancement that selects other actors.
 * @abstract
 */
export default class ActorChoiceAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      dsid: new StringField(),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT.ACTOR_CHOICE");

  /* -------------------------------------------------- */

  /**
   * Getter to indicate that this is an actor choice advancement.
   * @type {boolean}
   */
  get isActorChoice() {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Options available for this specific Actor Choice advancement, with values corresponding to actor UUIDs.
   * @type {ActorChoice[]}
   * @abstract
   */
  get actorOptions() {
    throw new Error("An Actor Choice Advancement must implement `get actorOptions`.");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    if (this.chooseN === null) return false;
    if (this.chooseN < this.actorOptions.length) return true;
    return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async createLeaves(node) {
    const promises = [];
    for (const { uuid } of this.actorOptions) {
      // TODO: Optimize DB calls
      /** @type {DrawSteelActor} */
      const actor = await fromUuid(uuid);
      if (!actor) continue;
      node.choices[actor.uuid] = new AdvancementLeaf(node, actor.uuid, actor.toAnchor().outerHTML, { actor });
    }
    return Promise.allSettled(promises);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    const chosen = node
      ? Object.entries(node.selected).reduce((arr, [k, v]) => arr.concat(v ? k : []), [])
      : this.document.isEmbedded
        ? foundry.utils.getProperty(this.document, path) ?? []
        : [];

    const selection = await ActorChoiceConfigurationDialog.create({ advancement: this, chosen });

    if (!selection) return null;

    const promises = [];

    if (node) {
      node.selected = selection.choices.reduce((selected, uuid) => {
        selected[uuid] = true;
        return selected;
      }, {});
    }

    await Promise.allSettled(promises);

    return { [path]: selection.choices };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async reconfigure() {
    await super.reconfigure();

    const configuration = await this.configureAdvancement();
    if (configuration) await this.document.update(configuration);
  }
}
