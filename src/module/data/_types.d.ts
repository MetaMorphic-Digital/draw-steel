import { DataFieldContext, StringFieldOptions } from "../../../foundry/common/data/fields.mjs";
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

  interface FormulaFieldOptions extends StringFieldOptions {
    /**
     * Is this formula not allowed to have dice values?
     * @defaultValue `false`
     */
    deterministic?: boolean;
  }

  export interface FormulaField {
    override options: FormulaFieldOptions;
  }
}
