export default class DrawSteelActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
  /** @inheritdoc */
  _getEntryContextOptions() {
    const getActor = li => game.actors.get(li.dataset.entryId);

    const isV14 = game.release.generation >= 14;

    const options = [{
      name: "DRAW_STEEL.SIDEBAR.ACTORS.contextMenuAssignPrimaryParty",
      icon: "fa-solid fa-fw fa-medal",
      condition: (li) => {
        const actor = getActor(li);
        return game.user.isGM && (actor.type === "party") && (actor !== game.actors.party);
      },
      visible: target => {
        const actor = getActor(target);
        return game.user.isGM && (actor.type === "party") && (actor !== game.actors.party);
      },
      callback: (li) => game.actors.setParty(getActor(li)),
      onClick: (event, target) => game.actors.setParty(getActor(target)),
      group: "system",
    }, {
      name: "DRAW_STEEL.SIDEBAR.ACTORS.contextMenuRemovePrimaryParty",
      icon: "fa-solid fa-fw fa-times",
      condition: (li) => game.user.isGM && (getActor(li) === game.actors.party),
      visible: target => game.user.isGM && (getActor(target) === game.actors.party),
      callback: (li) => game.actors.unsetParty(),
      onClick: (event, target) => game.actors.unsetParty(),
      group: "system",
    }];

    options.forEach(option => {
      if (isV14) {
        delete option.condition;
        delete option.callback;
        option.label = option.name;
        delete option.name;
      } else {
        delete option.visible;
        delete option.onClick;
        option.icon = `<i class="${option.icon}"></i>`;
      }
    });

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
