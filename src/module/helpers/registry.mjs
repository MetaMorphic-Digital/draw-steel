/**
 * @import { RegistryEntry } from "./_types";
 */

/**
 * A registry of cached document info compiled across all compendiums.
 * Each collection is expected to be of a single document type & subtype.
 */
export default class DrawSteelRegistry {
  /**
   * Called once in `ready` after migrations.
   */
  async initialize() {
    const itemPacks = game.packs.filter(p => p.documentName === "Item").sort((a, b) => {
      // always work through system compendiums first
      const typeMap = {
        system: 0,
        module: 1,
        world: 2,
      };

      return typeMap[a.metadata.packageType] - typeMap[b.metadata.packageType];
    });

    const registryTypes = new Set(["class", "subclass", "perk", "kit"]);

    for (const pack of itemPacks) {
      // Need to re-call `getIndex` for `system._dsid` to be populated
      const docs = await pack.getIndex();

      const indices = docs.filter(idx => registryTypes.has(idx.type));

      for (const idx of indices) {
        const dsid = idx.system._dsid ?? idx.name.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3").slugify({ strict: true });
        /** @type {RegistryEntry} */
        const registryEntry = {
          dsid,
          name: idx.name,
          uuid: idx.uuid,
        };
        switch (idx.type) {
          case "class":
            registryEntry.primary = idx.system.primary;
            if (this.class.has(dsid)) {
              console.warn(`Replacing ${idx.type} registry entry for ${dsid}`);
            }
            this.class.set(dsid, registryEntry);
            break;
          case "subclass":
            registryEntry.classLink = idx.system.classLink;
            if (this.subclass.has(dsid)) {
              console.warn(`Replacing ${idx.type} registry entry for ${dsid}`);
            }
            this.subclass.set(dsid, registryEntry);
            break;
          case "perk":
            registryEntry.perkType = idx.system.perkType;
            if (this.perk.has(dsid)) {
              console.warn(`Replacing ${idx.type} registry entry for ${dsid}`);
            }
            this.perk.set(dsid, registryEntry);
            break;
          case "kit":
            if (this.kit.has(dsid)) {
              console.warn(`Replacing ${idx.type} registry entry for ${dsid}`);
            }
            this.kit.set(dsid, registryEntry);
            break;
        }
      }
    }
  }

  /* -------------------------------------------------- */
  /*  Registries                                        */
  /* -------------------------------------------------- */

  #class = new DSRegistryCollection();

  /**
   * A registry of classes mapping DSID to registry entries.
   */
  get class() {
    return this.#class;
  }

  /* -------------------------------------------------- */

  #subclass = new DSRegistryCollection();

  /**
   * A registry of subclasses mapping DSID to registry entries.
   */
  get subclass() {
    return this.#subclass;
  }

  /* -------------------------------------------------- */

  #perk = new DSRegistryCollection();

  /**
   * A registry of perks mapping DSID to registry entries.
   */
  get perk() {
    return this.#perk;
  }

  /* -------------------------------------------------- */

  #kit = new DSRegistryCollection();

  /**
   * A registry of kits mapping DSID to registry entries.
   */
  get kit() {
    return this.#kit;
  }
}

/* -------------------------------------------------- */

/**
 * A collection subclass for the registries. The keys are expected to be the DSID of registry entries.
 * @extends {foundry.utils.Collection<string, RegistryEntry>}
 */
class DSRegistryCollection extends foundry.utils.Collection {}
