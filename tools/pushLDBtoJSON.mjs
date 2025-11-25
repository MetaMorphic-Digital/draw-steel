import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";
import path from "path";

const SYSTEM_ID = process.cwd();
const yaml = false;
const expandAdventures = false;
const folders = true;

const packs = await fs.readdir("./packs");
for (const pack of packs) {
  if (pack.startsWith(".")) continue;
  console.log("Unpacking " + pack);
  await extractPack(
    `${SYSTEM_ID}/packs/${pack}`,
    `${SYSTEM_ID}/src/packs/${pack}`,
    {
      yaml,
      transformName,
      transformEntry,
      expandAdventures,
      folders,
      clean: true,
      omitVolatile: true,
    },
  );
}

/**
 * @typedef TransformerContext
 * @property {object} [adventure]       Data on an adventure if document is stored within an adventure.
 * @property {object} [adventure.doc]   The entire adventure document.
 * @property {string} [adventure.path]  The path where the adventure will be extracted.
 * @property {string} [folder]          Folder path if this entry is in a folder and the folders option is enabled.
 * @property {string} [documentType]    The type of the Document being extracted.
 */

/**
 * Prefaces the document with its type.
 * @param {object} doc                  The document data.
 * @param {TransformerContext} context  Optional context information for the document being transformed.
 */
function transformName(doc, context) {
  const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, "_");

  const prefix = ["Actor", "Item"].includes(context.documentType) ? doc.type : context.documentType;
  let name = `${doc.name ? `${prefix}_${safeFileName}_${doc._id}` : doc._id}.${yaml ? "yml" : "json"}`;
  if (context.folder) name = path.join(context.folder, name);
  return name;
}

/**
 * Remove text content from wiki journal.
 * @param {object} entry The entry data.
 * @returns {Promise<false|void>}  Return boolean false to indicate that this entry should be discarded.
 */
async function transformEntry(entry) {
  // Reducing churn
  Object.assign(entry._stats, {
    modifiedTime: null,
    lastModifiedBy: null,
  });
  // Remove module flags
  for (const key of Object.keys(entry.flags)) if (!["core", "draw-steel"].includes(key)) delete entry.flags[key];

  // Fix ownership (folders don't have ownership)
  if (entry.ownership) entry.ownership = { default: 0 };

  // Update if we ever start including other document types, e.g. Adventures
  for (const embeddedCollection of ["items", "effects", "pages"]) {
    if (entry[embeddedCollection]) {
      for (const e of entry[embeddedCollection]) {
        Object.assign(e._stats, { modifiedTime: null, lastModifiedBy: null });
        if (e["effects"]) for (const grandchild of e["effects"]) Object.assign(grandchild._stats, { lastModifiedBy: null });
      }
    }
  }

  if (entry._key !== "!journal!2OWtCOMKRpGuBxrI") return;

  for (const jep of entry.pages) {
    const docsPath = path.join("src", "docs", jep.flags["draw-steel"].wikiPath);

    // re-route in-game asset links to wiki image links
    const mdContent = jep.text.markdown.replaceAll("systems/draw-steel/assets/docs", "https://github.com/MetaMorphic-Digital/draw-steel/blob/develop/assets/docs");

    await fs.writeFile(docsPath, mdContent, { encoding: "utf8" });
    jep.text = { format: 2 };
  }
}
