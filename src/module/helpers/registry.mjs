import DrawSteelItem from "../documents/item.mjs";

/**
 * @import { RegistryEntry } from "./_types";
 */

/**
 * A registry of cached document info compiled across all compendiums.
 * Each collection is expected to be of a single document type & subtype.
 */
export default class DrawSteelRegistry {
  constructor() {
    Object.defineProperties(this, {
      class: { value: new DSRegistryCollection(), writable: false, configurable: false },
      subclass: { value: new DSRegistryCollection(), writable: false, configurable: false },
      perk: { value: new DSRegistryCollection(), writable: false, configurable: false },
      kit: { value: new DSRegistryCollection(), writable: false, configurable: false },
    });
  }

  /* -------------------------------------------------- */

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

      // Use "world" and "system" for world & system compendiums, elsewise the module ID
      const packageId = pack.metadata.packageType !== "module" ? pack.metadata.packageType : pack.metadata.packageName;

      for (const idx of indices) {
        const dsid = idx.system._dsid || DrawSteelItem.generateDSID(idx.name);

        const key = `${packageId}:${dsid}`;

        /** @type {RegistryEntry} */
        const registryEntry = {
          key,
          dsid,
          name: idx.name,
          uuid: idx.uuid,
        };

        switch (idx.type) {
          case "class":
            registryEntry.primary = idx.system.primary;
            this.class.set(key, registryEntry);
            break;
          case "subclass":
            registryEntry.classLink = idx.system.classLink;
            this.subclass.set(key, registryEntry);
            break;
          case "perk":
            registryEntry.perkType = idx.system.perkType;
            this.perk.set(key, registryEntry);
            break;
          case "kit":
            this.kit.set(key, registryEntry);
            break;
        }
      }
    }

    await this.loadConfigPages();
  }

  /* -------------------------------------------------- */

  /**
   * Called once in `ready` after migrations.
   */
  async loadConfigPages() {
    const journalPacks = game.packs.filter(p => p.documentName === "JournalEntry");

    for (const pack of journalPacks) {
      // Need to re-call `getIndex` for `pages` to be populated
      const indices = await pack.getIndex();

      const configJournals = indices.filter(idx => idx.pages?.some(p => p.type === "configuration"));

      if (!configJournals.length) continue;

      const docs = await pack.getDocuments({ _id__in: configJournals.map(idx => idx._id) });

      for (const je of docs) {
        for (const page of je.pages.documentsByType["configuration"]) {
          for (const lang of page.system.languages) {
            const key = lang.key ?? lang.label.slugify({ strict: true });
            if (!key) continue;
            else if (key in ds.CONFIG.languages) console.warn(`Collision detected, language ${key} from ${page.uuid} already exists`);
            else ds.CONFIG.languages[key] = { label: lang.label, source: page.uuid };
          }
          for (const mk of page.system.monsterKeywords) {
            const key = mk.key ?? mk.label.slugify({ strict: true });
            if (!key) continue;
            if (key in ds.CONFIG.monsters.keywords) console.warn(`Collision detected, monster keyword ${key} from ${page.uuid} already exists`);
            else {
              const entry = { label: mk.label, source: page.uuid, group: page.name };
              if (mk.reference) entry.reference = mk.reference;
              ds.CONFIG.monsters.keywords[key] = entry;
            }
          }
        }

      }
    }
  }

  /* -------------------------------------------------- */
  /*  Registries                                        */
  /* -------------------------------------------------- */

  /**
   * A registry of classes mapping DSID to registry entries.
   * @type {DSRegistryCollection}
   */
  class;

  /* -------------------------------------------------- */

  /**
   * A registry of subclasses mapping DSID to registry entries.
   * @type {DSRegistryCollection}
   */
  subclass;

  /* -------------------------------------------------- */

  /**
   * A registry of perks mapping DSID to registry entries.
   * @type {DSRegistryCollection}
   */
  perk;

  /* -------------------------------------------------- */

  /**
   * A registry of kits mapping DSID to registry entries.
   * @type {DSRegistryCollection}
   */
  kit;
}

/* -------------------------------------------------- */

/**
 * A collection subclass for the registries. The keys are expected to be the DSID of registry entries.
 * @extends {foundry.utils.Collection<string, RegistryEntry>}
 */
class DSRegistryCollection extends foundry.utils.Collection {}
