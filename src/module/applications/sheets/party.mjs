import DrawSteelActorSheet from "./actor-sheet.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * An implementation of an actor sheet for Party actors.
 */
export default class DrawSteelPartySheet extends DrawSteelActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      placeMembers: DrawSteelPartySheet.#placeMembers,
      removeMember: DrawSteelPartySheet.#removeMember,
      showMember: DrawSteelPartySheet.#showMember,
    },
    classes: ["party"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/party/header.hbs"),
    },
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    members: {
      template: systemPath("templates/sheets/actor/party/members.hbs"),
      classes: ["tab"],
      scrollable: [".contents"],
    },
    details: {
      template: systemPath("templates/sheets/actor/party/details.hbs"),
      classes: ["tab"],
      scrollable: [".contents"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "members" },
        { id: "details" },
      ],
      initial: "members",
      labelPrefix: "DRAW_STEEL.Actor.party.TABS",
    },
  };

  /* -------------------------------------------------- */

  /**
   * External actors who re-render this application.
   * @type {Set<RyuutamaActor>}
   */
  #appActors = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.header = await this.#prepareHeader();
    context.members = await this.#prepareMembers();
    context.details = await this.#prepareDetails();

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare details context.
   * @returns {Promise<object>}
   */
  async #prepareDetails() {
    const value = this.document.system._source.description.value;
    const enriched = await enrichHTML(value, { relativeTo: this.document });
    return {
      isOwner: this.document.isOwner,
      description: { value, enriched },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare header context.
   * @returns {Promise<object>}
   */
  async #prepareHeader() {
    const members = this.document.system.members;
    return {
      canPlaceMembers: game.user.isGM && canvas?.ready && members.size,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare members context.
   * @returns {Promise<object[]>}
   */
  async #prepareMembers() {
    const members = [];
    for (const member of this.document.system.members) {
      const ctx = { ...member };
      const { recoveries, stamina } = member.actor.system;
      Object.assign(ctx, {
        recoveries, stamina,
        rootId: [this.id, member.actor.id].join("-"),
        canView: member.actor.testUserPermission(game.user, "OBSERVER"),
      });
      members.push(ctx);
    }
    return members;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    for (const { actor } of this.document.system.members) {
      actor.apps[this.id] = this;
      this.#appActors.add(actor);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onClose(options) {
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    return super._onClose(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropActor(event, actor) {
    await this.document.system.addMembers([actor]);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this DrawSteelPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static async #placeMembers(event, target) {
    if (!this.document.system.members.size) return;
    const isMaximized = this.rendered && !this.minimized;
    if (isMaximized) await this.minimize();
    await this.document.system.placeMembers();
    if (isMaximized) this.maximize();
  }

  /* -------------------------------------------------- */

  /**
   * @this DrawSteelPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #removeMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    this.document.system.removeMembers([actor]);
  }

  /* -------------------------------------------------- */

  /**
   * @this DrawSteelPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #showMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    actor.sheet.render({ force: true });
  }
}
