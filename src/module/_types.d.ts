import "./apps/_types";
import "./data/_types";
import "./documents/_types";

import Advancement from "./documents/advancement/advancement.mjs"

export interface AdvancementTypeConfiguration {
  /**
   * The advancement's document class.
   */
  dataModel: typeof Advancement;

  /**
   * What item types this advancement can be used with.
   */
  validItemTypes: Set<string>;

  /**
   * Should this advancement type be hidden in the selection dialog?
   */
  hidden?: boolean;
}
