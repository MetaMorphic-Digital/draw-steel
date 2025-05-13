import "./power-roll-effects/_types"

import { ApplicationConfiguration } from "@client/applications/_types";
import { DialogV2Configuration, DialogV2WaitOptions } from "@client/applications/api/dialog.mjs";

export interface TypedPseudoDocumentCreateDialogOptions extends ApplicationConfiguration, DialogV2Configuration, DialogV2WaitOptions {}

declare module "./pseudo-document.mjs" {
  export default interface PseudoDocument {
    _id: string;
  }
}

declare module "./typed-pseudo-document.mjs" {
  export default interface TypedPseudoDocument {
    type: string;
  }
}
