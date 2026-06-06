import path from "node:path"

import { includeIgnoreFile } from "@eslint/compat"
import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import { configs, plugins, rules } from "eslint-config-airbnb-extended"
import { rules as prettierConfigRules } from "eslint-config-prettier"
import prettierPlugin from "eslint-plugin-prettier"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"

const gitignorePath = path.resolve(".", ".gitignore")

const jsConfig = defineConfig([
    // ESLint recommended config
    {
        name: "js/config",
        ...js.configs.recommended,
    },
    // Stylistic plugin
    plugins.stylistic,
    // Import X plugin
    plugins.importX,
    // Airbnb base recommended config
    ...configs.base.recommended,
    // Strict import rules
    rules.base.importsStrict,
])

const reactConfig = defineConfig([
    // React plugin
    plugins.react,
    // React hooks plugin
    plugins.reactHooks,
    // React JSX A11y plugin
    plugins.reactA11y,
    // Airbnb React recommended config
    ...configs.react.recommended,
    // Strict React rules
    rules.react.strict,
])

const typescriptConfig = defineConfig([
    // TypeScript ESLint plugin
    plugins.typescriptEslint,
    // Airbnb base TypeScript config
    ...configs.base.typescript,
    // Strict TypeScript rules
    rules.typescript.typescriptEslintStrict,
    // Airbnb React TypeScript config
    ...configs.react.typescript,
])

const prettierConfig = defineConfig([
    // Prettier plugin
    {
        name: "prettier/plugin/config",
        plugins: {
            prettier: prettierPlugin,
        },
    },
    // Prettier config
    {
        name: "prettier/config",
        rules: {
            ...prettierConfigRules,
            "prettier/prettier": "error",
        },
    },
])

export default defineConfig([
    globalIgnores(["dist"]),
    // Ignore files and folders listed in .gitignore
    includeIgnoreFile(gitignorePath),
    // JavaScript config
    ...jsConfig,
    // React config
    ...reactConfig,
    // TypeScript config
    ...typescriptConfig,
    // Prettier config
    ...prettierConfig,
    // Project-specific overrides
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            "react-refresh": reactRefresh,
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "react/require-default-props": "off",
            "react/prop-types": "off",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            "import-x/extensions": "off",
            "react/function-component-definition": "off",
            "react/jsx-fragments": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "import-x/order": ["error", { "newlines-between": "ignore" }],
            "linebreak-style": ["error", "unix"],
            "@typescript-eslint/no-explicit-any": "error",
            camelcase: "error",
            "eol-last": "error",
        },
    },
])
