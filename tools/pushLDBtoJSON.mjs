import {extractPack} from "@foundryvtt/foundryvtt-cli";
import {promises as fs} from "fs";
import path from "path";

const SYSTEM_ID = process.cwd();
const BASE_LDB_PATH = "packs";
const BASE_SRC_PATH = "src";

await extractPacks();

/**
 * Unpacks all compendium packs located in the basePath
 */
async function extractPacks() {
  const dirents = await fs.readdir(BASE_LDB_PATH, {withFileTypes: true, recursive: true});
  const packs = dirents.filter((dirent) => dirent.isDirectory());

  const folders = {};
  for (const pack of packs) {
    const packName = path.join(pack.path, pack.name);
    console.log("Unpacking " + packName);
    await extractAllFoldersFromPackFile(folders, packName);
    Object.values(folders).forEach(folder => buildAndAddPath(folders, folder));
    await unpackToPath(folders, packName);
  }
}

/**
 * Reads all folders inside a pack and adds it to a collection of folders
 * @param {ref} collection - Reference to the collection of folders
 * @param {string} packName - Path to the pack ldb folder
 */
async function extractAllFoldersFromPackFile(collection, packName) {
  await extractPack(
    `${SYSTEM_ID}/${packName}`,
    `${SYSTEM_ID}/${BASE_SRC_PATH}/${packName}`,
    {
      transformEntry: (entry) => {
        if (entry._key.startsWith("!folders")) {
          collection[entry._id] = {name: slugify(entry.name), parentFolder: entry.folder};
        }
        return false;
      }
    }
  );
}

/**
 * Adds a path to each folder in the collection
 * @param {ref} collection - Reference to the collection of folders
 * @param {object} folderEntry - An entry from the folders collection
 */
function buildAndAddPath(collection, folderEntry) {
  let parent = collection[folderEntry.parentFolder];
  folderEntry.path = folderEntry.name;
  while (parent) {
    folderEntry.path = path.join(parent.path, folderEntry.path);
    parent = collection[parent.parentFolder];
  }
}

/**
 * Unpacks all files and folder from the given packName path
 * Files are unpacked into their respective compendium folders
 * @param {ref} collection - Reference to the collection of folders
 * @param {string} packName - Path to the pack ldb folder
 */
async function unpackToPath(collection, packName) {
  await extractPack(
    `${SYSTEM_ID}/${packName}`,
    `${SYSTEM_ID}/${BASE_SRC_PATH}/${packName}`,
    {
      transformName: entry => {
        const filename = transformName(entry);
        if (entry._id in collection) {
          return path.join(collection[entry._id].path, filename);
        }
        const parent = collection[entry.folder];
        return path.join(parent?.path ?? "", filename);
      }
    }
  );
}

/**
 * Prefaces the document with its type
 * @param {object} doc - The document data
 */
function transformName(doc) {
  const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, "_");
  const type = doc._key.split("!")[1];
  const prefix = ["actors", "items"].includes(type) ? doc.type : type;

  return `${doc.name ? `${prefix}_${safeFileName}_${doc._id}` : doc._id}.json`;
}

/**
 * Standardize name format.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
  return name.toLowerCase().replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
}
