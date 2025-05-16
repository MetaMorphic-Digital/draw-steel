import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";
import path from "path";
import Showdown from "showdown";

const SYSTEM_ID = process.cwd();

const BASE_SRC_PATH = "src/packs";
const BASE_DEST_PATH = "packs";

// Options copied from foundry's constants.mjs
const converter = new Showdown.Converter({
  disableForced4SpacesIndentedSublists: true,
  noHeaderId: true,
  parseImgDimensions: true,
  strikethrough: true,
  tables: true,
  tablesHeaderId: true,
});

await compilePacksRecursively();

/**
 * Compiles all packs in the given base path
 */
async function compilePacksRecursively() {
  const packs = (await fs.readdir(BASE_SRC_PATH, { withFileTypes: true })).filter(file => file.isDirectory());

  for (const pack of packs) {
    const srcPath = path.join(BASE_SRC_PATH, pack.name);
    const destPath = path.join(BASE_DEST_PATH, pack.name);
    console.log("Packing " + srcPath + " to " + destPath);
    await compilePack(
      `${SYSTEM_ID}/${srcPath}`,
      `${SYSTEM_ID}/${destPath}`,
      { recursive: true, log: true, transformEntry },
    );
  }
}

/**
 * Add in wiki docs from `src/docs`
 * @param {object} entry The entry data
 * @returns {Promise<false|void>}  Return boolean false to indicate that this entry should be discarded.
 */
async function transformEntry(entry) {
  if (entry._key !== "!journal!2OWtCOMKRpGuBxrI") return;

  for (const jep of entry.pages) {
    const docsPath = path.join("src", "docs", jep.flags["draw-steel"].wikiPath);
    const mdSource = await fs.readFile(docsPath, {
      encoding: "utf8",
    });
    const htmlContent = converter.makeHtml(mdSource);
    jep.text.markdown = mdSource;
    jep.text.content = htmlContent;
  }
}
