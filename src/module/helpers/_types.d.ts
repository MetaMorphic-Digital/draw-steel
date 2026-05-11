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
  /** Abilities for a class or subclass. */
  abilities?: Readonly<AbilityRegistryEntry>;
}

// Abilities are organized by resource cost and *not* by level
// This is because the Elementalist shows that if the second set of options is *not* organized by subclass, then you can pick from a prior level
// The strict hierarchy is only based on ability cost and class or subclass affiliation

export interface AbilityRegistryEntry {
  /** The Key used for the entry. */
  key: string;
  /** Abilities without a heroic resource cost are signature abilities. */
  signature: Set<string>;
  /** 3 cost abilities are usually available at levels 1 and 2. */
  heroic3: Set<string>;
  /** 5 cost abilities are usually available at levels 1 and 3. */
  heroic5: Set<string>;
  /** 7 cost abilities are usually available at levels 5 and 6. */
  heroic7: Set<string>;
  /** 9 cost abilities are usually available at levels 8 and 9. */
  heroic9: Set<string>;
  /** 11 cost abilities are usually available at level 10. */
  heroic11: Set<string>;
}
