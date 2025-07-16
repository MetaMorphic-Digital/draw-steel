import { systemID } from "../../constants.mjs";
import { DSRoll, ProjectRoll } from "../../rolls/_module.mjs";
import BaseMessageModel from "./base.mjs";

/** @import { ProjectRollPrompt } from  "../../_types.js"*/

const fields = foundry.data.fields;

export default class ProjectRollModel extends BaseMessageModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      type: "projectRoll",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    // All project roll messages MUST have a uuid pointing to the relevant document
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });
    schema.events = new fields.NumberField({ initial: 0 });
    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    if (game.settings.get(systemID, "projectEvents") === "none") return;

    const project = await fromUuid(this.uuid);
    const messageContent = html.querySelector(".message-content");

    const events = this.events;
    if (!events) return;
    const eventText = game.i18n.format("DRAW_STEEL.Item.project.Events.EventsTriggered", {
      name: project.name,
      events: this.events,
    });
    messageContent.insertAdjacentHTML("beforeend", `<div class="milestone-events">${eventText}<div>`);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    const eventRoll = this.parent.rolls.find(roll => roll.constructor.name === "DSRoll");
    if ((game.settings.get(systemID, "projectEvents") === "roll") && !eventRoll) {
      const eventButton = ds.utils.constructHTMLButton({
        label: game.i18n.localize("DRAW_STEEL.Item.project.Events.RollForEvent"),
        icon: "fa-solid fa-dice-d6",
        classes: ["roll-event"],
      });
      buttons.push(eventButton);
    }

    const projectRolls = this.parent.rolls.filter(roll => roll instanceof ProjectRoll);
    if (!projectRolls.length) return buttons;
    const lastProjectRoll = projectRolls.at(-1);
    if (lastProjectRoll.isBreakthrough) {
      const breakthroughButton = ds.utils.constructHTMLButton({
        label: game.i18n.localize("DRAW_STEEL.Item.project.RollBreakThrough"),
        icon: "fa-solid fa-hammer",
        classes: ["roll-breakthrough"],
      });
      buttons.push(breakthroughButton);
    }
    return buttons;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);

    html.querySelector(".roll-event")?.addEventListener("click", async (event) => {
      const eventRoll = await new DSRoll("1d6", {}, {
        flavor: game.i18n.localize("DRAW_STEEL.Item.project.Events.RollForEvent"),
      });
      await eventRoll.evaluate();
      const updates = {};
      if (eventRoll.total === 6) updates["system.events"] = 1;
      updates.rolls = [...this.parent.rolls, eventRoll];

      this.parent.update(updates);
    });

    html.querySelector(".roll-breakthrough")?.addEventListener("click", async (event) => {
      const project = await fromUuid(this.uuid);
      if (!project) return;

      /** @type {ProjectRollPrompt} */
      const promptValue = await project.system.rollPrompt();
      if (!promptValue) return;
      const roll = promptValue.projectRoll;

      const updates = {};
      updates.rolls = [...this.parent.rolls, roll];
      const previousPoints = project.system.points;
      const updatedPoints = previousPoints + roll.total;
      await project.update({ "system.points": updatedPoints });
      const newEvents = project.system.milestoneEventsTriggered(previousPoints, updatedPoints);

      updates["system.events"] = this.events + newEvents;

      await this.parent.update(updates);
    });
  }
}
