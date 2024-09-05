import "./actor/_types";
import "./effect/_types";
import "./item/_types";

export type BarAttribute = {
  value: number,
  max: number
}

declare module "./helpers.mjs" {
  export interface SizeModel {
    value: number;
    letter: string | null;
  }
}
