import "./placeables/tokens/_types";
import DrawSteelTokenDocument from "../documents/token.mjs";
import DrawSteelTokenLayer from "./layers/tokens.mjs";

declare module "@client/canvas/board.mjs" {
  export default interface Canvas {
    controls: foundry.canvas.layers.ControlsLayer;
    drawings: foundry.canvas.layers.DrawingsLayer;
    grid: foundry.canvas.layers.GridLayer;
    lighting: foundry.canvas.layers.LightingLayer;
    notes: foundry.canvas.layers.NotesLayer;
    regions: foundry.canvas.layers.RegionLayer;
    sounds: foundry.canvas.layers.SoundsLayer;
    tiles: foundry.canvas.layers.TilesLayer;
    tokens: DrawSteelTokenLayer;
    walls: foundry.canvas.layers.WallsLayer;
  }
}

declare module "@client/canvas/placeables/token.mjs" {
  export default interface Token {
    document: DrawSteelTokenDocument;
  }
}

/**
 * Configuration data for a map marker style. Options not included will fall back to the value set in `default` style.
 * Any additional styling options added will be passed into the custom marker class and be available for rendering.
 */
export interface MapLocationMarkerStyle {
  /** Map marker class used to render the icon. */
  icon: typeof PIXI.ICON;
  /** Color of the background inside the circle. */
  backgroundColor: number;
  /** Color of the border in normal state. */
  borderColor: number;
  /** Color of the border when hovering over the marker. */
  borderHoverColor: number;
  /** Font used for rendering the code on the marker. */
  fontFamily: string;
  /** Color of the shadow under the marker. */
  shadowColor: number;
  /** Color of the text on the marker. */
  textColor: number;
}
