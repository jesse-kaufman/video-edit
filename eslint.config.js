/** @file Config for eslint. */
/* eslint-disable no-magic-numbers */
import pluginJs from "@eslint/js"
import jest from "eslint-plugin-jest"
import jsdoc from "eslint-plugin-jsdoc"
import importPlugin from "eslint-plugin-import"
import globals from "globals"

const config = [
  { ignores: ["**/node_modules/*", "**/public/js/*"] },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
  },
  {
    plugins: {
      jsdoc,
      jest,
    },
  },
  jsdoc.configs["flat/recommended"],
  pluginJs.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      ...jest.configs.recommended.rules,
      "array-callback-return": "error",
      "arrow-body-style": [
        "warn",
        "as-needed",
        { requireReturnForObjectLiteral: true },
      ],
      camelcase: ["warn", { ignoreImports: true }],
      "capitalized-comments": [
        "warn",
        "always",
        {
          ignoreConsecutiveComments: true,
          ignoreInlineComments: true,
        },
      ],
      semi: ["error", "never"],
      complexity: ["warn", { max: 8 }],
      curly: ["error", "multi-line", "consistent"],
      "default-case-last": "error",
      "default-param-last": "error",
      "dot-notation": "error",
      "multiline-comment-style": ["error", "starred-block"],
      eqeqeq: ["error", "smart"],
      "func-names": ["error", "as-needed"],
      "func-style": [
        "error",
        "declaration",
        {
          allowArrowFunctions: true,
          overrides: { namedExports: "expression" },
        },
      ],
      "grouped-accessor-pairs": "error",
      "guard-for-in": "error",
      "init-declarations": ["error", "always"],
      "max-depth": "error",
      "max-nested-callbacks": ["error", 3],
      "max-lines": [
        "error",
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-params": ["error", 5],
      "max-statements": ["warn", 20],
      "max-lines-per-function": ["warn", { max: 40, skipBlankLines: true }],
      "new-cap": "error",
      "no-await-in-loop": "error",
      "no-duplicate-imports": "error",
      "no-empty-function": "warn",
      "no-else-return": "error",
      "no-extra-label": "error",
      "no-inner-declarations": "error",
      "no-implicit-coercion": "error",
      "no-invalid-this": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "error",
      "no-loop-func": "error",
      "no-magic-numbers": [
        "warn",
        { ignoreArrayIndexes: true, ignore: [0, 1], enforceConst: true },
      ],
      "no-multi-assign": "error",
      "no-multi-str": "error",
      "no-negated-condition": "warn",
      "no-nested-ternary": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-object-constructor": "error",
      "no-param-reassign": "error",
      "no-return-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-shadow": "warn",
      "no-template-curly-in-string": "error",
      "no-undef-init": "error",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-unreachable-loop": "error",
      "no-unused-expressions": "warn",
      "no-use-before-define": [
        "warn",
        {
          allowNamedExports: true,
          classes: true,
          functions: false,
          variables: true,
        },
      ],
      "no-useless-constructor": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-useless-concat": "error",
      "no-var": "error",
      "no-void": "error",
      "operator-assignment": ["error", "always"],
      "object-shorthand": [
        "error",
        "always",
        {
          avoidQuotes: true,
          avoidExplicitReturnArrows: true,
        },
      ],
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-destructuring": [
        "error",
        {
          object: true,
        },
      ],
      "prefer-numeric-literals": "error",
      "prefer-object-spread": "error",
      "prefer-rest-params": "error",
      "prefer-template": "error",
      "prefer-spread": "error",
      "require-atomic-updates": "warn",
      "sort-vars": "error",
      "valid-typeof": "error",
      "vars-on-top": "error",
      "require-await": "error",
      quotes: [
        "error",
        "double",
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      "import/order": "warn",

      "jsdoc/check-param-names": ["error", { enableFixer: true }],
      "jsdoc/require-description": "error",
      "jsdoc/require-hyphen-before-param-description": "warn",
      "jsdoc/require-description-complete-sentence": "warn",
      "jsdoc/check-line-alignment": "error",
      "jsdoc/check-syntax": "error",
      "jsdoc/check-values": "warn",
      "jsdoc/informative-docs": "warn",
      "jsdoc/no-undefined-types": "error",
      "jsdoc/require-file-overview": "error",
      "jsdoc/sort-tags": [
        "error" | "warn",
        {
          tagSequence: [
            { tags: ["since", "access"] },
            { tags: ["class", "augments", "mixes"] },
            { tags: ["alias", "memberof"] },
            { tags: ["see", "link", "global"] },
            { tags: ["fires", "listens"] },
            { tags: ["param"] },
            { tags: ["yields"] },
            { tags: ["returns"] },
          ],
        },
      ],
      "eol-last": ["error", "always"],
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true, // Only report exports
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
          contexts: [
            "ArrowFunctionExpression",
            "ClassDeclaration",
            "ClassExpression",
            "ClassProperty",
            "FunctionDeclaration", // Function
            "FunctionExpression",
            "MethodDefinition",
            "TSDeclareFunction", // Function without body
            "TSEnumDeclaration",
            "TSInterfaceDeclaration",
            "TSModuleDeclaration", // Namespace
            "TSTypeAliasDeclaration",
            "VariableDeclaration",
          ],
        },
      ],
    },
  },
]

export default config
