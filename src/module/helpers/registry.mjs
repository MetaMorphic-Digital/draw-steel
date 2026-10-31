import DrawSteelItem from "../documents/item.mjs";

/**
 * @import { AbilityRegistryEntry, RegistryEntry } from "./_types";
 */

/**
 * A registry of cached document info compiled across all compendiums.
 * Each collection is expected to be of a single document type & subtype.
 */
export default class DrawSteelRegistry {
  constructor() {
    Object.defineProperties(this, {
      abilities: { value: new foundry.utils.Collection(), writable: false, configurable: false },
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

    const registryTypes = new Set(["ability", "class", "subclass", "perk", "kit"]);

    for (const pack of itemPacks) {
      const indices = pack.index.filter(idx => registryTypes.has(idx.type));

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
          case "ability":
            if (idx.system.prerequisites?.dsid?.length) this.#registerAbility(idx, registryEntry);
            break;
          case "class":
            registryEntry.primary = idx.system.primary;
            Object.defineProperties(registryEntry, {
              abilities: {
                get: () => this.abilities.get(dsid),
              },
              subclasses: {
                get: () => this.subclass.filter(e => e.classLink === dsid),
              },
            });
            this.class.set(key, registryEntry);
            break;
          case "subclass":
            registryEntry.classLink = idx.system.classLink;
            Object.defineProperty(registryEntry, "abilities", {
              get: () => this.abilities.get(dsid),
            });
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
   * Handle registering an ability. Only register abilities that have associated classes or subclasses.
   * @param {object} index
   */
  #registerAbility(index) {
    // This will be length 1 for all known classes and subclasses
    for (const dsid of index.system.prerequisites.dsid) {
      let entry = this.abilities.get(dsid);
      if (!entry) {
        entry = {
          key: dsid,
          signature: new Set(),
          heroic3: new Set(),
          heroic5: new Set(),
          heroic7: new Set(),
          heroic9: new Set(),
          heroic11: new Set(),
        };
        this.abilities.set(dsid, entry);
      }
      if (index.system.resource) entry[`heroic${index.system.resource}`]?.add(index.uuid);
      else if (index.system.category === "signature") entry.signature.add(index.uuid);
      // abilities without a resource cost or signature category don't need to be registered
    }
  }

  /**
   * Called once in `ready` after migrations.
   */
  async loadConfigPages() {
    const journalPacks = game.packs.filter(p => p.documentName === "JournalEntry");

    for (const pack of journalPacks) {
      const configJournals = pack.index.filter(idx => idx.pages?.some(p => p.type === "configuration"));

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
   * @type {DSAbilityRegistry}
   */
  abilities;

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

  /* -------------------------------------------------- */
  /*  Methods                                           */
  /* -------------------------------------------------- */

  /**
   * Fetch all entry info for a given class.
   * @param {string} dsid
   * @returns {{ entry: RegistryEntry, subclasses: RegistryEntry[] }}
   */
  getClassInfo(dsid) {
    const entry = this.class.filter(e => e.dsid === dsid);
    const subclasses = this.subclass.filter(e => e.classLink === dsid);

    return { entry, subclasses };
  }
}

/* -------------------------------------------------- */

/**
 * A collection subclass for the registries. The keys are expected to be the DSID of registry entries.
 * @extends {foundry.utils.Collection<string, RegistryEntry>}
 */
class DSRegistryCollection extends foundry.utils.Collection {}

/**
 * A collection subclass for the registries. The keys are expected to be the DSID of registry entries.
 * @extends {foundry.utils.Collection<string, AbilityRegistryEntry>}
 */
class DSAbilityRegistry extends foundry.utils.Collection {}
