import type {StringFieldOptions} from "../../../../foundry/common/data/fields.mjs";

export interface FormulaFieldOptions extends StringFieldOptions {
  /**
   * Is this formula not allowed to have dice values?
   * @defaultValue `false`
   */
  deterministic?: boolean;
}

declare module "./formula-field.mjs" {
  export interface FormulaField {
    override options: FormulaFieldOptions;

    /** Is this formula not allowed to have dice values? */
    deterministic: boolean;
  }
}
