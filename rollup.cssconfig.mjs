import css from "rollup-plugin-import-css";

export default [{
  input: "./src/styles/system/_system.mjs",
  output: {
    file: "./css/draw-steel-system.mjs",
    format: "esm",
    assetFileNames: "draw-steel-system.[ext]",

  },
  plugins: [css()],
  watch: {
    include: "src/styles/system/**",
  },
}, {
  input: "./src/styles/variables/_variables.mjs",
  output: {
    file: "./css/draw-steel-variables.mjs",
    format: "esm",
    assetFileNames: "draw-steel-variables.css",
  },
  plugins: [css()],
  watch: {
    include: "src/styles/variables/**",
  },
}, {
  input: "./src/styles/elements/_elements.mjs",
  output: {
    file: "./css/draw-steel-elements.mjs",
    format: "esm",
    assetFileNames: "draw-steel-elements.css",
  },
  plugins: [css()],
  watch: {
    include: "src/styles/elements/**",
  },
}];
