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
