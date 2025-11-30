export interface RegistryEntry {
  /** Also used as the key for each entry */
  dsid: string;
  /** Name for easy display reference */
  name: string;
  /** UUID for lookup/fetch purposes */
  uuid: string;
  /** Heroic resource name for classes */
  primary?: string;
  /** Class DSID for subclasses */
  classLink?: string;
  /** Perk type for perks */
  perkType?: string;
}
