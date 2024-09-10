import * as fs from "fs";
import yaml from "js-yaml";
import path from "path";

console.log("Reforging Symlinks");

if (fs.existsSync("foundry-config.yaml")) {
  const fc = await fs.readFile("foundry-config.yaml");

  const foundryConfig = yaml.load(fc);

  const fileRoot = path.join(foundryConfig.installPath, "resources", "app");

  try {
    await fs.mkdir("foundry");
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

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
} else {
  console.log("Foundry config file did not exist.");
}
