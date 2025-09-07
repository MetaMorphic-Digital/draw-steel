import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";
import path from "path";

const SYSTEM_ID = process.cwd();
const yaml = false;
const expandAdventures = false;
const folders = true;

const packs = await fs.readdir("./packs");
for (const pack of packs) {
  if ((pack === ".gitattributes") || (pack === ".DS_Store")) continue;
  console.log("Unpacking " + pack);
  const directory = `./src/packs/${pack}`;
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
    },
  );
}
/**
 * Prefaces the document with its type.
 * @param {object} doc - The document data.
 */
function transformName(doc, context) {
  const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, "_");
  // If we add adventures and enable "expand adventures" it will need handling
  const type = doc._key?.split("!")[1];

  const prefix = ["actors", "items"].includes(type) ? doc.type : type;
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
  // Remove module flags
  for (const key of Object.keys(entry.flags)) if (!["core", "draw-steel"].includes(key)) delete entry.flags[key];

  // Fix ownership (folders don't have ownership)
  if (entry.ownership) entry.ownership = { default: 0 };

  // Update if we ever start including other document types, e.g. Adventures
  if (entry._key !== "!journal!2OWtCOMKRpGuBxrI") return;

  for (const jep of entry.pages) {
    const docsPath = path.join("src", "docs", jep.flags["draw-steel"].wikiPath);
    await fs.writeFile(docsPath, jep.text.markdown, { encoding: "utf8" });
    jep.text = { format: 2 };
  }
}
