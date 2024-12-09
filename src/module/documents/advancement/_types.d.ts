/**
 * Information on how an advancement type is configured.
 */
export declare interface AdvancementMetadata {
  dataModels: object;
  /** Data model used for validating configuration data. */
  configuration: typeof foundry.abstract.DataModel;

  /** Data model used for validating value data. */
  value: typeof foundry.abstract.DataModel;

  /** Number used to determine default sorting order of advancement items. */
  order: number;

  /** Icon used for this advancement type if no user icon is specified. */
  icon: string;

  /** Icon used when selecting this advancement type during advancement creation. */
  typeIcon: string;

  /** Title to be displayed if no user title is specified. */
  title: string;

  /** Description of this type shown in the advancement selection dialog. */
  hint: string;

  /**
   * Can this advancement affect more than one level? If this is set to true,
   * the level selection control in the configuration window is hidden and the
   * advancement should provide its own implementation of `Advancement#levels`
   * and potentially its own level configuration interface.
   */
  multiLevel: boolean;

  apps: {
    /**
     * Subclass of AdvancementConfig that allows for editing of this advancement type.
     */
    config: typeof foundry.applications.api.ApplicationV2;

    /**
     * Subclass of AdvancementFlow that is displayed while fulfilling this advancement.
     */
    flow: typeof foundry.applications.api.ApplicationV2
  }
}
