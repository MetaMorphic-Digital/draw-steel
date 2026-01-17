import BaseMessagePart from "./base-message-part.mjs";
import { systemID, systemPath } from "../../../constants.mjs";
import { DSRoll, ProjectRoll } from "../../../rolls/_module.mjs";

/** @import { ProjectRollPrompt } from  "../../../_types.js"*/

const { DocumentUUIDField, NumberField } = foundry.data.fields;

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
      projectUuid: new DocumentUUIDField({ nullable: false, type: "Item" }),
      events: new NumberField({ initial: 0 }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the project from the UUID. Can return null if the project no longer exists.
   * @returns {DrawSteelActiveEffect | null}
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

    if ((eventSetting !== "none") && this.events) {
      let eventText = "";
      if (eventSetting === "roll") eventText = game.i18n.localize("DRAW_STEEL.Item.project.Events.RollTriggered");
      else if (eventSetting === "milestone") eventText = game.i18n.format("DRAW_STEEL.Item.project.Events.MilestoneTriggered", { events: this.events });

      context.eventText = eventText;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Make the breakthrough roll.
   *
   * @this ProjectPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollBreakthrough(target, event) {
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
      updates.events = (this.events ?? 0) + newEvents;
    }

    await this.update(updates, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });
  }

  /* -------------------------------------------------- */

  /**
   * Roll to deteremine if a project event happens.
   *
   * @this ProjectPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollEvent(target, event) {
    const eventRoll = await new DSRoll("1d6", {}, {
      flavor: game.i18n.localize("DRAW_STEEL.Item.project.Events.RollForEvent"),
    });
    await eventRoll.evaluate();
    const events = eventRoll.total === 6 ? 1 : this.events;
    const rolls = this.rolls.concat(eventRoll);

    this.update({ rolls, events }, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });
  }
}
