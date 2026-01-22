import BaseMessagePart from "./base-message-part.mjs";
import { systemID, systemPath } from "../../../constants.mjs";
import { DSRoll, ProjectRoll } from "../../../rolls/_module.mjs";
import ContentPart from "./content.mjs";
import DrawSteelItem from "../../../documents/item.mjs";

/** @import { ProjectRollPrompt } from  "../../../_types.js"*/

const { BooleanField, DocumentUUIDField } = foundry.data.fields;

/**
 * A part containing a Project roll and its subsequent breakthrough and event rolls.
 */
export default class ProjectPart extends BaseMessagePart {
  /**@inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    rollBreakthrough: this.#rollBreakthrough,
    rollEvent: this.#rollEvent,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "project";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/project.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      projectUuid: new DocumentUUIDField({
        embedded: true,
        nullable: false,
        type: "Item",
        validate: (uuid) => !uuid.startsWith("Compendium"),
        validationError: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.project.NoCompendiumActor"),
      }),
      event: new BooleanField(),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the project from the UUID. Can return null if the project no longer exists.
   * @returns {DrawSteelItem | null}
   */
  get project() {
    return fromUuidSync(this.projectUuid);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    context.ctx.buttons = [];
    const project = this.project;
    const eventSetting = game.settings.get(systemID, "projectEvents");

    const projectRolls = this.rolls.filter(roll => roll instanceof ProjectRoll);
    const lastProjectRoll = projectRolls.at(-1);

    if (project && lastProjectRoll?.isBreakthrough) {
      context.ctx.buttons.push(ds.utils.constructHTMLButton({
        dataset: {
          action: "rollBreakthrough",
        },
        classes: ["roll-breakthrough"],
        icon: "fa-solid fa-hammer",
        label: game.i18n.localize("DRAW_STEEL.Item.project.RollBreakThrough"),
      }));
    }

    const eventRoll = this.rolls.find(roll => roll.constructor.name === "DSRoll");
    if ((eventSetting === "roll") && !eventRoll && !this.events) {
      context.ctx.buttons.push(ds.utils.constructHTMLButton({
        dataset: {
          action: "rollEvent",
        },
        label: game.i18n.localize("DRAW_STEEL.Item.project.Events.RollForEvent"),
        icon: "fa-solid fa-dice-d6",
        classes: ["roll-event"],
      }));
    }

    return context;
  }

  /**
   * Update the message content with the new event text. If there's no ContentPart, create one.
   */
  async updateEventText() {
    const eventSetting = game.settings.get(systemID, "projectEvents");
    if ((eventSetting === "none") || !this.event) return;

    const eventPart = this.parent.parts.documentsByType.content[0];
    if (eventPart) return;

    const eventText = game.i18n.localize("DRAW_STEEL.Item.project.Events.EventTriggered");
    const updates = { content: eventText };

    const parts = { ...this.parent.parts };
    const contentPart = new ContentPart({ type: "content" });
    parts[contentPart._id] = contentPart;
    updates.system = { parts };

    await this.message.update(updates);
  }

  /* -------------------------------------------------- */

  /**
   * Handle the click action for rolling a project breakthrough using the {@linkcode rollBreakthrough} method.
   *
   * @this ProjectPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollBreakthrough(target, event) {
    this.rollBreakthrough();
  }

  /* -------------------------------------------------- */

  /**
   * Make the breakthrough roll, updating the project with the new points, and adding the roll to the project part.
   */
  async rollBreakthrough(target, event) {
    const project = this.project;
    if (!project) return;

    /** @type {ProjectRollPrompt} */
    const promptValue = await project.system.rollPrompt();
    if (!promptValue) return;
    const breakthroughRoll = promptValue.projectRoll;
    if (breakthroughRoll.isCritical) breakthroughRoll.options.flavor = game.i18n.localize("DRAW_STEEL.ROLL.Project.Breakthrough");

    const previousPoints = project.system.points;
    const updatedPoints = previousPoints + breakthroughRoll.total;
    await project.update({ "system.points": updatedPoints });

    const rolls = this.rolls.concat(breakthroughRoll);
    const updates = { rolls };

    const eventSetting = game.settings.get(systemID, "projectEvents");
    if (eventSetting === "milestone") {
      const newEvents = project.system.milestoneEventsOccured(previousPoints, updatedPoints);
      if (newEvents) updates.event = true;
    }

    await this.update(updates, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });

    if (updates.event) await this.updateEventText();
  }

  /* -------------------------------------------------- */

  /**
   * Handle the click action for rolling a project event using the {@linkcode rollEvent} method.
   *
   * @this ProjectPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollEvent(target, event) {
    this.rollEvent();
  }

  /* -------------------------------------------------- */

  /**
   * Roll to deteremine if a project event happens.
   */
  async rollEvent() {
    const eventRoll = await new DSRoll("1d6", {}, {
      flavor: game.i18n.localize("DRAW_STEEL.Item.project.Events.RollForEvent"),
    });
    await eventRoll.evaluate();
    const eventTriggered = eventRoll.total === 6;
    const rolls = this.rolls.concat(eventRoll);

    await this.update({ rolls, event: eventTriggered }, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });

    if (eventTriggered) await this.updateEventText();
  }
}
