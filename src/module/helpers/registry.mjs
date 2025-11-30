/**
 * @import { RegistryEntry } from "./_types";
 */

/**
 * A registry of cached document info compiled across all compendiums.
 * Each collection is expected to be of a a single document type & subtype.
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

    for (const pack of itemPacks) {
      // Fancy performant fetch
      const docs = await pack.getDocuments({ type__in: ["class", "subclass", "perk", "kit"] });

      for (const item of docs) {
        const dsid = item.dsid;
        /** @type {RegistryEntry} */
        const registryEntry = {
          dsid,
          name: item.name,
          uuid: item.uuid,
        };
        switch (item.type) {
          case "class":
            registryEntry.primary = item.system.primary;
            if (this.class.has(item.dsid)) {
              console.warn(`Replacing ${item.type} registry entry for ${dsid}`);
            }
            this.class.set(dsid, registryEntry);
            break;
          case "subclass":
            registryEntry.classLink = item.system.classLink;
            if (this.subclass.has(item.dsid)) {
              console.warn(`Replacing ${item.type} registry entry for ${dsid}`);
            }
            this.subclass.set(dsid, registryEntry);
            break;
          case "perk":
            registryEntry.perkType = item.system.perkType;
            if (this.perk.has(item.dsid)) {
              console.warn(`Replacing ${item.type} registry entry for ${dsid}`);
            }
            this.perk.set(dsid, registryEntry);
            break;
          case "kit":
            this.kit.set(dsid, registryEntry);
            if (this.kit.has(item.dsid)) {
              console.warn(`Replacing ${item.type} registry entry for ${dsid}`);
            }
            break;
        }
      }
    }
  }

  /* -------------------------------------------------- */
  /*  Registries                                        */
  /* -------------------------------------------------- */

  class = new DSRegistryCollection();

  /* -------------------------------------------------- */

  subclass = new DSRegistryCollection();

  /* -------------------------------------------------- */

  perk = new DSRegistryCollection();

  /* -------------------------------------------------- */

  kit = new DSRegistryCollection();
}

/* -------------------------------------------------- */

/**
 * A collection subclass for the registries. The keys are expected to be the DSID of registry entries.
 * @extends {foundry.utils.Collection<string, RegistryEntry>}
 */
class DSRegistryCollection extends foundry.utils.Collection {}
