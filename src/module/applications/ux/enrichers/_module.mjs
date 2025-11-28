/** @import { TextEditorEnricherConfig } from "@client/config.mjs" */

/**
 * Each enricher file's exports is expected to match {@linkcode TextEditorEnricherConfig}
 * so it can be directly thrown in the `CONFIG.TextEditor.enrichers` array.
 */

export * as applyEffect from "./apply-effect.mjs";
export * as lookup from "./lookup.mjs";
export * as reference from "./reference.mjs";
export * as roll from "./roll.mjs";
