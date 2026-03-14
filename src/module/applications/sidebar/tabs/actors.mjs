export default class DrawSteelActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
  /** @inheritdoc */
  _getEntryContextOptions() {
    const getActor = li => game.actors.get(li.dataset.entryId);

    const isV14 = game.release.generation >= 14;

    const options = [{
      label: "DRAW_STEEL.SIDEBAR.ACTORS.contextMenuAssignPrimaryParty",
      icon: "fa-solid fa-fw fa-medal",
      visible: target => {
        const actor = getActor(target);
        return game.user.isGM && (actor.type === "party") && (actor !== game.actors.party);
      },
      onClick: (event, target) => game.actors.setParty(getActor(target)),
      group: "system",
    }, {
      name: "DRAW_STEEL.SIDEBAR.ACTORS.contextMenuRemovePrimaryParty",
      icon: "fa-solid fa-fw fa-times",
      visible: target => game.user.isGM && (getActor(target) === game.actors.party),
      onClick: (event, target) => game.actors.unsetParty(),
      group: "system",
    }];

    return super._getEntryContextOptions().concat(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const party = game.actors.party;
    if (!party) return;
    const element = this.element.querySelector(`[data-entry-id="${party.id}"]`);
    if (element) element.classList.add("primary-party");
  }
}
