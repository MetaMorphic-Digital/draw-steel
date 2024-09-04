import "./data/_types";
import "./documents/_types";
import {DRAW_STEEL as _DS} from "./config.mjs"

declare global {
  namespace CONFIG {
    type DRAW_STEEL = typeof _DS;
    const DRAW_STEEL: typeof _DS;
  }
}
