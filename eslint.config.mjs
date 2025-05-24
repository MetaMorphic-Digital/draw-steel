import { defineConfig, globalIgnores } from "eslint/config";
import htmlEslint from "@html-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import parser from "@html-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["foundry/**/*"]), {
    extends: compat.extends("eslint:recommended"),

    plugins: {
        "@html-eslint": htmlEslint,
        '@stylistic': stylistic
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        ecmaVersion: "latest",
        sourceType: "module",
    },

    rules: {
        "no-undef": "off",
        "no-unused-vars": 0,

        "@stylistic/indent": ["error", 2, {
            SwitchCase: 1,
        }],

        "@stylistic/quotes": ["error", "double"],
        "@stylistic/semi": ["error", "always"],
        "@stylistic/quote-props": ["error", "as-needed"],
        "@stylistic/array-bracket-newline": ["error", "consistent"],
        "@stylistic/key-spacing": "error",
        "@stylistic/comma-dangle": ["error", "always-multiline"],
        "@stylistic/space-in-parens": ["error", "never"],
        "@stylistic/space-infix-ops": 2,
        "@stylistic/keyword-spacing": 2,
        "@stylistic/semi-spacing": 2,
        "@stylistic/no-multi-spaces": 2,
        "@stylistic/no-extra-semi": 2,
        "@stylistic/no-whitespace-before-property": 2,
        "@stylistic/space-unary-ops": 2,

        "@stylistic/no-multiple-empty-lines": ["error", {
            max: 1,
            maxEOF: 0,
        }],

        "@stylistic/object-curly-spacing": ["error", "always"],
        "@stylistic/comma-spacing": ["error"],
        "@stylistic/space-before-blocks": 2,
        "@stylistic/arrow-spacing": 2,
        "@stylistic/eol-last": ["error", "always"],

        "@stylistic/no-mixed-operators": ["error", {
            allowSamePrecedence: true,

            groups: [[
                "==",
                "!=",
                "===",
                "!==",
                ">",
                ">=",
                "<",
                "<=",
                "&&",
                "||",
                "in",
                "instanceof",
            ]],
        }],

        "@html-eslint/attrs-newline": ["off", {
            closeStyle: "sameline",
            ifAttrsMoreThan: 9,
        }],

        "@html-eslint/indent": ["error", 2],
    },
}, {
    files: ["**/*.hbs", "**/*.html"],
    extends: compat.extends("plugin:@html-eslint/recommended"),

    languageOptions: {
        parser: parser,
    },
}]);
