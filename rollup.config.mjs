import path from "path";
import postcss from "rollup-plugin-postcss";
import postcssImport from "postcss-import";
import postcssValueParser from "postcss-value-parser";
import resolve from "@rollup/plugin-node-resolve";

/**
 * Absolute path to replace.
 * @type {string}
 */
const absolutePath = "/systems/draw-steel/";

/**
 * Replaces all absolute asset paths with relative ones to preserve compatibility with route prefixing.
 * @returns {object}
 */
function adjustCSSUrls() {
  return {
    postcssPlugin: "rewrite-system-urls",
    Declaration(decl) {
      const parsed = postcssValueParser(decl.value);

      parsed.walk(node => {
        if ((node.type === "function") && (node.value === "url")) {
          const urlNode = node.nodes[0];
          const url = urlNode?.value;
          if (!url?.startsWith(absolutePath)) return;
          urlNode.value = url.replace(absolutePath, "../");
        }
      });

      decl.value = parsed.toString();
    },
  };
}
adjustCSSUrls.postcss = true;

export default [{
  input: "./_main.mjs",
  output: {
    file: "./public/draw-steel.mjs",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    postcss({
      plugins: [
        postcssImport(),
        adjustCSSUrls(),
      ],
      extract: path.resolve("./public/css/draw-steel-system.css"),
    }),
  ],
}, {
  input: "./_css-elements.mjs",
  output: {
    file: "./public/css/_elements.mjs",
    format: "esm",
  },
  plugins: [
    resolve(),
    postcss({
      plugins: [
        postcssImport(),
        adjustCSSUrls(),
      ],
      extract: path.resolve("./public/css/draw-steel-elements.css"),
    }),
  ],
}, {
  input: "./_css-variables.mjs",
  output: {
    file: "./public/css/_variables.mjs",
    format: "esm",
  },
  plugins: [
    resolve(),
    postcss({
      plugins: [
        postcssImport(),
        adjustCSSUrls(),
      ],
      extract: path.resolve("./public/css/draw-steel-variables.css"),
    }),
  ],
}];
