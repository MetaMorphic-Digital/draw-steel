import css from "rollup-plugin-import-css";

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
    file: "./css/draw-steel-system.mjs",
    format: "esm",
    assetFileNames: "draw-steel-system.css",
  },
  plugins: [css()],
}, {
  input: "./src/styles/variables/_variables.mjs",
  output: {
    file: "./css/draw-steel-variables.mjs",
    format: "esm",
    assetFileNames: "draw-steel-variables.css",
  },
  plugins: [css()],
}, {
  input: "./src/styles/elements/_elements.mjs",
  output: {
    file: "./css/draw-steel-elements.mjs",
    format: "esm",
    assetFileNames: "draw-steel-elements.css",
  },
  plugins: [css()],
}];
