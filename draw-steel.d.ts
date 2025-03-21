import Game from "@client/game.mjs";
import "./src/module/_types";
import Application from "@client/appv1/api/application-v1.mjs";
import ApplicationV2 from "@client/applications/api/application.mjs";
import SceneControls from "@client/applications/ui/scene-controls.mjs";
import Hotbar from "@client/applications/ui/hotbar.mjs";
import MainMenu from "@client/applications/ui/main-menu.mjs";
import SceneNavigation from "@client/applications/ui/scene-navigation.mjs";
import Notifications from "@client/applications/ui/notifications.mjs";
import GamePause from "@client/applications/ui/game-pause.mjs";
import Players from "@client/applications/ui/players.mjs";
import Sidebar from "@client/applications/sidebar/sidebar.mjs";
import createConfig from "@client/config.mjs";

// Foundry's use of `Object.assign(globalThis) means many globally available objects are not read as such
// This declare global hopefully fixes that
declare global {
  readonly const game: Game;

  readonly const ui: {
    activeWindow: Application|ApplicationV2,
    controls: SceneControls,
    hotbar: Hotbar,
    menu: MainMenu,
    nav: SceneNavigation,
    notifications: Notifications,
    pause: GamePause,
    players: Players,
    sidebar: Sidebar,
    windows: Record<string, Application>
    // it's possible we want to expand this to all actually-used options in CONFIG.ui
  }

  // not a real extension of course but simplest way for this to work with the intellisense.
  /**
   * A simple event framework used throughout Foundry Virtual Tabletop.
   * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
   * This class manages the registration and execution of hooked callback functions.
   */
  class Hooks extends foundry.helpers.Hooks {}
  const fromUuid = foundry.utils.fromUuid;
  const fromUuidSync = foundry.utils.fromUuidSync;
}
