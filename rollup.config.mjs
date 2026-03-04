import path from "path";
import postcss from "rollup-plugin-postcss";
import postcssImport from "postcss-import";
import postcssUrl from "postcss-url";
import resolve from "@rollup/plugin-node-resolve";

/**
 * Replaces all absolute asset paths with relative ones to preserve compatibility with route prefixing.
 * @type {postcssUrl.CustomTransformFunction}
 */
function replaceAbsolutePaths(asset) {
  if (!asset.url) return asset.url;
  const absolutePath = "/systems/draw-steel/";
  if (asset.url.startsWith(absolutePath)) {
    return asset.url.slice(absolutePath.length);
  } else {
    console.warn("URL THAT ISN'T IN PACKAGE REPOSITORY:", asset.url);
  }
  return asset.url;
}

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
        postcssUrl({ url: replaceAbsolutePaths }),
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
        postcssUrl({ url: replaceAbsolutePaths }),
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
        postcssUrl({ url: replaceAbsolutePaths }),
      ],
      extract: path.resolve("./public/css/draw-steel-variables.css"),
    }),
  ],
}];
