import {promises as fs} from "fs";
import yaml from "js-yaml";
import path from "path";

console.log("Reforging Symlinks");

const fc = await fs.readFile("foundry-config.yaml");

const foundryConfig = yaml.load(fc);

const fileRoot = path.join(foundryConfig.installPath, "resources", "app");

// Javascript files
for (const p of ["client", "client-esm", "common"]) {
  try {
    await fs.symlink(path.join(fileRoot, p), path.join("foundry", p));
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
}

// Language files
try {
  await fs.symlink(path.join(fileRoot, "public", "lang"), path.join("foundry", "lang"));
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}
