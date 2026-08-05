import type { StringFieldOptions } from "@common/data/_types.mjs";

export interface FormulaFieldOptions extends StringFieldOptions {
  /**
   * Is this formula not allowed to have dice values?
   * @defaultValue `false`
   */
  deterministic?: boolean;
}

declare module "./formula-field.mjs" {
  export default interface FormulaField extends FormulaFieldOptions {
    options: FormulaFieldOptions;
  }
}

export interface LocalDocumentFieldOptions extends StringFieldOptions {
  /**
   * Read the value as a string instead of a model?
   * @defaultValue `false`
   */
 idOnly?: boolean;

 /**
  * The document subtype referenced by this field.
  * @defaultValue `null`
  */
  subtype?: string;
}

declare module "./local-document-field.mjs" {
  export default interface LocalDocumentField extends LocalDocumentFieldOptions {
    options: LocalDocumentFieldOptions;
  }
}
