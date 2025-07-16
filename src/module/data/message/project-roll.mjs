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
    schema.milestoneEvents = new fields.NumberField({ initial: 0 });
    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    const project = await fromUuid(this.uuid);
    const messageContent = html.querySelector(".message-content");

    const events = this.milestoneEvents;
    if (!events) return;
    const eventText = game.i18n.format("DRAW_STEEL.Item.project.Events.MilestoneReached", {
      name: project.name,
      events: this.milestoneEvents,
    });
    messageContent.insertAdjacentHTML("beforeend", `<div class="milestone-events">${eventText}<div>`);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    const length = this.parent.rolls.length;
    if (!length) return false;
    const lastRoll = this.parent.rolls[length - 1];
    if (lastRoll.isBreakthrough) {
      const button = ds.utils.constructHTMLButton({
        label: game.i18n.localize("DRAW_STEEL.Item.project.RollBreakThrough"),
        icon: "fa-solid fa-hammer",
        classes: ["roll-breakthrough"],
      });
      buttons.push(button);
    }
    return buttons;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);

    html.querySelector(".roll-breakthrough")?.addEventListener("click", async (event) => {
      const project = await fromUuid(this.uuid);
      if (!project) return;

      /** @type {ProjectRollPrompt} */
      const promptValue = await project.system.rollPrompt();
      if (!promptValue) return;
      const roll = promptValue.projectRoll;

      const updates = { system: {} };
      updates.rolls = [...this.parent.rolls, roll];
      const previousPoints = project.system.points;
      const updatedPoints = previousPoints + roll.total;
      await project.update({ "system.points": updatedPoints });
      const newEvents = project.system.milestoneEventsTriggered(previousPoints, updatedPoints);

      updates.system.milestoneEvents = this.milestoneEvents + newEvents;

      await this.parent.update(updates);
    });
  }
}
