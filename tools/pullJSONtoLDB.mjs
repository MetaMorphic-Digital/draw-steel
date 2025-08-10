import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";
import path from "path";
import Showdown from "showdown";

const SYSTEM_ID = process.cwd();
const yaml = false;
const folders = true;

// Options copied from foundry's constants.mjs
const converter = new Showdown.Converter({
  disableForced4SpacesIndentedSublists: true,
  noHeaderId: true,
  parseImgDimensions: true,
  strikethrough: true,
  tables: true,
  tablesHeaderId: true,
});

const packs = await fs.readdir("./src/packs");
for (const pack of packs) {
  if (pack === ".gitattributes") continue;
  console.log("Packing " + pack);
  await compilePack(
    `${SYSTEM_ID}/src/packs/${pack}`,
    `${SYSTEM_ID}/packs/${pack}`,
    { yaml, recursive: folders, transformEntry },
  );
}

/**
 * Add in wiki docs from `src/docs`.
 * @param {object} entry The entry data.
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
