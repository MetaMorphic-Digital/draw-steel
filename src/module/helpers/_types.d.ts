export interface RegistryEntry {
  /** The Key used for the entry. */
  key: string;
  /** Used as part of the key. */
  dsid: string;
  /** Name for easy display reference. */
  name: string;
  /** UUID for lookup/fetch purposes. */
  uuid: string;
  /** Heroic resource name for classes. */
  primary?: string;
  /** Class DSID for subclasses. */
  classLink?: string;
  /** Perk type for perks. */
  perkType?: string;
}
