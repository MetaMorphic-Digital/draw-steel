import "./advancements/_types";
import "./power-roll-effects/_types";

import ModelCollection from "../../utils/model-collection.mjs";

import { ApplicationConfiguration } from "@client/applications/_types";
import { DialogV2Configuration, DialogV2WaitOptions } from "@client/applications/api/dialog.mjs";

export interface TypedPseudoDocumentCreateDialogOptions extends ApplicationConfiguration, DialogV2Configuration, DialogV2WaitOptions {}

declare module "./pseudo-document.mjs" {
  export default interface PseudoDocument {
    _id: string;
    name: string;
    img: string;
    collection: ModelCollection<this>
  }
}

declare module "./typed-pseudo-document.mjs" {
  export default interface TypedPseudoDocument {
    type: string;
  }
}
