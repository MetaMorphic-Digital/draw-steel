import css from "rollup-plugin-import-css";

/**
 * Replaces all absolute asset paths with relative ones to preserve compatibility with route prefixing.
 * @param {string} code
 * @returns {string}
 */
function replaceAbsolutePaths(code) {
  return code.replaceAll("/systems/draw-steel/", "../");
}

export default [{
  input: "./draw-steel.mjs",
  output: {
    file: "./public/draw-steel.mjs",
    format: "esm",
    sourcemap: true,
  },
}, {
  input: "./src/styles/system/_system.mjs",
  output: {
    file: "./public/css/draw-steel-system.mjs",
    format: "esm",
    assetFileNames: "draw-steel-system.css",
  },
  plugins: [css({
    transform: replaceAbsolutePaths,
  })],
}, {
  input: "./src/styles/variables/_variables.mjs",
  output: {
    file: "./public/css/draw-steel-variables.mjs",
    format: "esm",
    assetFileNames: "draw-steel-variables.css",
  },
  plugins: [css({
    transform: replaceAbsolutePaths,
  })],
}, {
  input: "./src/styles/elements/_elements.mjs",
  output: {
    file: "./public/css/draw-steel-elements.mjs",
    format: "esm",
    assetFileNames: "draw-steel-elements.css",
  },
  plugins: [css({
    transform: replaceAbsolutePaths,
  })],
}];
